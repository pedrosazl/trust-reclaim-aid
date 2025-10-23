-- Add SKU and financial tracking fields to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add financial tracking to exchanges
ALTER TABLE public.exchanges
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_fee NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_loss NUMERIC(10, 2) GENERATED ALWAYS AS (shipping_cost + processing_fee) STORED;

-- Add detailed status tracking to exchange_products
ALTER TABLE public.exchange_products
ADD COLUMN IF NOT EXISTS product_condition TEXT CHECK (product_condition IN ('reusable', 'damaged', 'expired', 'analyzing')) DEFAULT 'analyzing',
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS product_status TEXT CHECK (product_status IN ('pending', 'returned_to_stock', 'discarded', 'analyzing')) DEFAULT 'analyzing',
ADD COLUMN IF NOT EXISTS analyzed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_exchange_products_condition ON public.exchange_products(product_condition);
CREATE INDEX IF NOT EXISTS idx_exchange_products_status ON public.exchange_products(product_status);

-- Function to calculate total product loss for an exchange
CREATE OR REPLACE FUNCTION public.calculate_exchange_product_loss(exchange_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_product_loss NUMERIC;
BEGIN
  SELECT COALESCE(SUM(ep.quantity * ep.unit_price), 0)
  INTO total_product_loss
  FROM public.exchange_products ep
  WHERE ep.exchange_id = exchange_id_param;
  
  RETURN total_product_loss;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- View for financial dashboard
CREATE OR REPLACE VIEW public.exchange_financial_summary AS
SELECT 
  e.id,
  e.created_at,
  e.status,
  e.shipping_cost,
  e.processing_fee,
  e.total_loss,
  public.calculate_exchange_product_loss(e.id) as product_value_loss,
  (e.total_loss + public.calculate_exchange_product_loss(e.id)) as total_financial_loss,
  u.email as user_email
FROM public.exchanges e
LEFT JOIN auth.users u ON e.user_id = u.id;

-- Grant access to the view
GRANT SELECT ON public.exchange_financial_summary TO authenticated;