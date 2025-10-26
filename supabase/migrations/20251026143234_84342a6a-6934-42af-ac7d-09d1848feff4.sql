-- Adicionar campos de foto e valor aos produtos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Adicionar campo de nota fiscal às trocas
ALTER TABLE public.exchanges
ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- Criar bucket para notas fiscais
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para notas fiscais
CREATE POLICY "Usuários podem ver suas próprias notas fiscais"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ))
);

CREATE POLICY "Usuários podem fazer upload de suas notas fiscais"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem deletar suas próprias notas fiscais"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'invoices' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
