import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, Camera, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

const cnpjSchema = z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
  message: "CNPJ inválido. Use o formato: 00.000.000/0000-00",
});

export const ExchangeForm = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(false);
  const [cnpj, setCnpj] = useState("");
  const [reason, setReason] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Array<{ productId: string; quantity: number }>>([]);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Erro ao carregar produtos");
      return;
    }

    setProducts(data || []);
  };

  const addProductLine = () => {
    setSelectedProducts([...selectedProducts, { productId: "", quantity: 0 }]);
  };

  const removeProductLine = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateProductLine = (index: number, field: "productId" | "quantity", value: string | number) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedProducts(updated);
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return value;
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setCnpj(formatted);
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("exchange-files")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Erro ao fazer upload do arquivo");
      return null;
    }

    const { data } = supabase.storage
      .from("exchange-files")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const saveToLocalStorage = () => {
    const pendingExchange = {
      cnpj,
      reason,
      signatureFile: signatureFile?.name,
      imageFile: imageFile?.name,
      timestamp: Date.now(),
    };

    const pending = JSON.parse(localStorage.getItem("pendingExchanges") || "[]");
    pending.push(pendingExchange);
    localStorage.setItem("pendingExchanges", JSON.stringify(pending));
    
    // Store files in IndexedDB or similar for offline support
    toast.info("Solicitação salva localmente. Será sincronizada quando houver conexão.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate CNPJ
      const cnpjValidation = cnpjSchema.safeParse(cnpj);
      if (!cnpjValidation.success) {
        toast.error(cnpjValidation.error.errors[0].message);
        setLoading(false);
        return;
      }

      if (!reason.trim()) {
        toast.error("Por favor, informe o motivo da troca/devolução");
        setLoading(false);
        return;
      }

      // Check if online
      if (!navigator.onLine) {
        saveToLocalStorage();
        setLoading(false);
        return;
      }

      let signatureUrl = null;
      let imageUrl = null;

      // Upload signature if provided
      if (signatureFile) {
        signatureUrl = await uploadFile(signatureFile, "signatures");
        if (!signatureUrl) {
          setLoading(false);
          return;
        }
      }

      // Upload image if provided
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, "images");
        if (!imageUrl) {
          setLoading(false);
          return;
        }
      }

      // Validate products
      const validProducts = selectedProducts.filter(p => p.productId && p.quantity > 0);
      if (validProducts.length === 0) {
        toast.error("Por favor, adicione pelo menos um produto");
        setLoading(false);
        return;
      }

      // Insert exchange record
      const { data: exchangeData, error: exchangeError } = await supabase
        .from("exchanges")
        .insert({
          user_id: userId,
          cnpj: cnpj.trim(),
          reason: reason.trim(),
          signature_url: signatureUrl,
          image_url: imageUrl,
          synced: true,
        })
        .select()
        .single();

      if (exchangeError || !exchangeData) {
        toast.error("Erro ao registrar troca/devolução");
        return;
      }

      // Insert exchange products
      const exchangeProducts = validProducts.map(p => ({
        exchange_id: exchangeData.id,
        product_id: p.productId,
        quantity: p.quantity,
      }));

      const { error: productsError } = await supabase
        .from("exchange_products")
        .insert(exchangeProducts);

      if (productsError) {
        toast.error("Erro ao vincular produtos");
        return;
      }

      toast.success("Solicitação de troca/devolução registrada com sucesso!");
      
      // Reset form
      setCnpj("");
      setReason("");
      setSignatureFile(null);
      setImageFile(null);
      setSelectedProducts([]);
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Erro ao processar requisição");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-elevated">
      <CardHeader>
        <CardTitle>Nova Troca/Devolução</CardTitle>
        <CardDescription>
          Preencha os dados para solicitar uma troca ou devolução
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChange={handleCNPJChange}
              maxLength={18}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Troca/Devolução *</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo da troca ou devolução..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={loading}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/1000 caracteres
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Produtos *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProductLine}
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
            </div>
            
            {selectedProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
              </p>
            )}

            <div className="space-y-3">
              {selectedProducts.map((item, index) => {
                const selectedProduct = products.find(p => p.id === item.productId);
                return (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Produto</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => updateProductLine(index, "productId", value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-32 space-y-2">
                      <Label className="text-xs">
                        Quantidade {selectedProduct && `(${selectedProduct.unit})`}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step={selectedProduct?.unit === "kg" ? "0.001" : "1"}
                        value={item.quantity || ""}
                        onChange={(e) => updateProductLine(index, "quantity", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        disabled={loading}
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProductLine(index)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assinatura Digital ou Imagem</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={loading}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {signatureFile ? "Assinatura Selecionada" : "Upload Assinatura"}
                </Button>
                {signatureFile && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {signatureFile.name}
                  </p>
                )}
              </div>

              <div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={loading}
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {imageFile ? "Foto Selecionada" : "Tirar Foto"}
                </Button>
                {imageFile && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {imageFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Enviar Solicitação"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
