-- Fix 1: Restrict user_presence SELECT policy to own data only
DROP POLICY IF EXISTS "Users can view all presence" ON public.user_presence;

CREATE POLICY "Users can view own presence"
ON public.user_presence
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all presence"
ON public.user_presence
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Remove permissive audit_logs INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Audit logs should only be inserted via triggers and the log_audit() function
-- No direct INSERT policy needed

-- Fix 3: Add validation function and trigger for exchanges
CREATE OR REPLACE FUNCTION public.validate_exchange()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate CNPJ format (Brazilian company ID)
  IF NEW.cnpj !~ '^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$' THEN
    RAISE EXCEPTION 'Invalid CNPJ format. Expected: XX.XXX.XXX/XXXX-XX';
  END IF;
  
  -- Trim and validate reason
  NEW.reason := trim(NEW.reason);
  
  IF char_length(NEW.reason) < 1 THEN
    RAISE EXCEPTION 'Reason cannot be empty';
  END IF;
  
  IF char_length(NEW.reason) > 1000 THEN
    RAISE EXCEPTION 'Reason must be less than 1000 characters';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER validate_exchange_before_insert
BEFORE INSERT OR UPDATE ON public.exchanges
FOR EACH ROW
EXECUTE FUNCTION public.validate_exchange();

-- Fix 4: Add validation function and trigger for products
CREATE OR REPLACE FUNCTION public.validate_product()
RETURNS TRIGGER AS $$
BEGIN
  -- Trim and validate name
  NEW.name := trim(NEW.name);
  
  IF char_length(NEW.name) < 1 THEN
    RAISE EXCEPTION 'Product name cannot be empty';
  END IF;
  
  IF char_length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Product name must be less than 200 characters';
  END IF;
  
  -- Validate description if provided
  IF NEW.description IS NOT NULL THEN
    NEW.description := trim(NEW.description);
    
    IF char_length(NEW.description) > 2000 THEN
      RAISE EXCEPTION 'Description must be less than 2000 characters';
    END IF;
  END IF;
  
  -- Validate quantity is not negative
  IF NEW.quantity < 0 THEN
    RAISE EXCEPTION 'Quantity cannot be negative';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER validate_product_before_insert
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.validate_product();

-- Fix 5: Make storage bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'exchange-files';