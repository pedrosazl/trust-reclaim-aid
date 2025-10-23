-- Drop the problematic view
DROP VIEW IF EXISTS public.exchange_financial_summary;

-- Create a secure view using profiles instead of auth.users
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
  p.email as user_email
FROM public.exchanges e
LEFT JOIN public.profiles p ON e.user_id = p.id;

-- Enable RLS on the view
ALTER VIEW public.exchange_financial_summary SET (security_invoker = true);

-- Grant access to the view
GRANT SELECT ON public.exchange_financial_summary TO authenticated;