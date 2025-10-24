-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('alert', 'status_change', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can create notifications for any user
CREATE POLICY "Admins can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(read) WHERE read = false;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function to notify user on exchange status change
CREATE OR REPLACE FUNCTION public.notify_exchange_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_status_text TEXT;
BEGIN
  -- Only notify on status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_status_text := CASE NEW.status
      WHEN 'pending' THEN 'Em Análise'
      WHEN 'approved' THEN 'Aprovada'
      WHEN 'rejected' THEN 'Rejeitada'
      ELSE NEW.status::TEXT
    END;
    
    PERFORM public.create_notification(
      NEW.user_id,
      'status_change',
      'Status da Solicitação Atualizado',
      'Sua solicitação de troca foi ' || v_status_text || '.',
      'exchange',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for exchange status changes
CREATE TRIGGER trigger_notify_exchange_status
  AFTER UPDATE ON public.exchanges
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_exchange_status_change();

-- Function to check for products with high return rates
CREATE OR REPLACE FUNCTION public.check_high_return_products()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_product RECORD;
  v_admin_id UUID;
  v_return_count INTEGER;
BEGIN
  -- Get first admin user
  SELECT user_id INTO v_admin_id
  FROM public.user_roles
  WHERE role = 'admin'::app_role
  LIMIT 1;
  
  IF v_admin_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Check products returned more than 5 times in last 30 days
  FOR v_product IN
    SELECT 
      p.id,
      p.name,
      COUNT(DISTINCT ep.exchange_id) as return_count
    FROM public.products p
    INNER JOIN public.exchange_products ep ON ep.product_id = p.id
    INNER JOIN public.exchanges e ON e.id = ep.exchange_id
    WHERE e.created_at >= now() - INTERVAL '30 days'
    GROUP BY p.id, p.name
    HAVING COUNT(DISTINCT ep.exchange_id) >= 5
  LOOP
    -- Check if notification already exists for this product in last 24h
    SELECT COUNT(*) INTO v_return_count
    FROM public.notifications
    WHERE entity_type = 'product'
      AND entity_id = v_product.id
      AND type = 'alert'
      AND created_at >= now() - INTERVAL '24 hours';
    
    -- Only create if no recent notification
    IF v_return_count = 0 THEN
      PERFORM public.create_notification(
        v_admin_id,
        'alert',
        'Alerta: Produto com Muitas Devoluções',
        'O produto "' || v_product.name || '" teve ' || v_product.return_count || ' devoluções nos últimos 30 dias.',
        'product',
        v_product.id
      );
    END IF;
  END LOOP;
END;
$$;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;