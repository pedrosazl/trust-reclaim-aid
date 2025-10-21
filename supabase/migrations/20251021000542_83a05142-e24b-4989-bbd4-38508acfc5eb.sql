-- Create enum for product units
CREATE TYPE public.product_unit AS ENUM ('kg', 'un', 'l', 'cx', 'pc');

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit product_unit NOT NULL DEFAULT 'un',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create exchange_products junction table (products in exchanges)
CREATE TABLE public.exchange_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id UUID REFERENCES public.exchanges(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(exchange_id, product_id)
);

-- Create user_presence table for online tracking
CREATE TABLE public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT true NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_updated_at TIMESTAMP WITH TIME ZONE,
  device_info JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update products"
  ON public.products FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Exchange products policies
CREATE POLICY "Users can view exchange products"
  ON public.exchange_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exchanges
      WHERE exchanges.id = exchange_products.exchange_id
      AND (exchanges.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can add products to own exchanges"
  ON public.exchange_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exchanges
      WHERE exchanges.id = exchange_products.exchange_id
      AND exchanges.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products in own exchanges"
  ON public.exchange_products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exchanges
      WHERE exchanges.id = exchange_products.exchange_id
      AND exchanges.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products from own exchanges"
  ON public.exchange_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exchanges
      WHERE exchanges.id = exchange_products.exchange_id
      AND exchanges.user_id = auth.uid()
    )
  );

-- User presence policies
CREATE POLICY "Users can view all presence"
  ON public.user_presence FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own presence"
  ON public.user_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence status"
  ON public.user_presence FOR UPDATE
  USING (auth.uid() = user_id);

-- Audit logs policies
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log audit
CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_user_name TEXT;
  v_audit_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT email, raw_user_meta_data->>'full_name'
    INTO v_user_email, v_user_name
    FROM auth.users
    WHERE id = v_user_id;
  END IF;
  
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    user_name,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  )
  VALUES (
    v_user_id,
    v_user_email,
    v_user_name,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- Create trigger function for products audit
CREATE OR REPLACE FUNCTION public.audit_products()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit(
      'CREATE',
      'product',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit(
      'UPDATE',
      'product',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit(
      'DELETE',
      'product',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger function for exchanges audit
CREATE OR REPLACE FUNCTION public.audit_exchanges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit(
      'CREATE',
      'exchange',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit(
      'UPDATE',
      'exchange',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit(
      'DELETE',
      'exchange',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create audit triggers
CREATE TRIGGER products_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_products();

CREATE TRIGGER exchanges_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.exchanges
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_exchanges();

-- Enable realtime for user_presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;