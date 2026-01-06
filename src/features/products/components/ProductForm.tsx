import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateProduct, useUpdateProduct, getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";
import { AdminProduct } from "@/features/products/hooks/useAdminProducts";
import { Loader2 } from "lucide-react";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: AdminProduct | null;
}

export function ProductForm({ isOpen, onClose, product }: ProductFormProps) {
  const isEditing = !!product;
  
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isOnSale, setIsOnSale] = useState(false);
  const [salePercent, setSalePercent] = useState("");
  const [primaryImage, setPrimaryImage] = useState("");
  const [error, setError] = useState("");

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setTitle(product.title || "");
        setName(product.name || "");
        setDescription(product.description || "");
        setShortDescription(product.shortDescription || "");
        setPrice(product.variants?.[0]?.price?.toString() || "");
        setStock(product.variants?.[0]?.stock?.toString() || "");
        setSku(product.variants?.[0]?.sku || "");
        setIsFeatured(product.isFeatured || false);
        setIsOnSale(product.isOnSale || false);
        setSalePercent(product.salePercent?.toString() || "");
        setPrimaryImage(product.primaryImage || "");
      } else {
        // Reset for new product
        setTitle("");
        setName("");
        setDescription("");
        setShortDescription("");
        setPrice("");
        setStock("");
        setSku("");
        setIsFeatured(false);
        setIsOnSale(false);
        setSalePercent("");
        setPrimaryImage("");
      }
      setError("");
    }
  }, [isOpen, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!title.trim() || !name.trim()) {
      setError("Title and name are required");
      return;
    }

    const priceNum = parseFloat(price);
    if (price && (isNaN(priceNum) || priceNum < 0)) {
      setError("Price must be a valid positive number");
      return;
    }

    const stockNum = stock ? parseInt(stock) : 0;
    if (stock && (isNaN(stockNum) || stockNum < 0)) {
      setError("Stock must be a valid positive number");
      return;
    }

    const salePercentNum = salePercent ? parseFloat(salePercent) : undefined;
    if (salePercent && (isNaN(salePercentNum!) || salePercentNum! < 0 || salePercentNum! > 100)) {
      setError("Sale percent must be between 0 and 100");
      return;
    }

    try {
      const productData = {
        title: title.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        shortDescription: shortDescription.trim() || undefined,
        primaryImage: primaryImage.trim() || undefined,
        isFeatured,
        isOnSale,
        salePercent: salePercentNum,
        variants: price || stock || sku ? [{
          price: priceNum || 0,
          stock: stockNum || 0,
          sku: sku.trim() || undefined,
        }] : undefined,
      };

      if (isEditing && product) {
        await updateMutation.mutateAsync({ productId: product._id, data: productData });
      } else {
        await createMutation.mutateAsync(productData);
      }

      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update product information" : "Create a new product"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product title"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief description"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Full product description"
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU code"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryImage">Primary Image URL</Label>
            <Input
              id="primaryImage"
              type="url"
              value={primaryImage}
              onChange={(e) => setPrimaryImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="isFeatured" className="cursor-pointer">
                Featured
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isOnSale"
                checked={isOnSale}
                onCheckedChange={(checked) => setIsOnSale(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="isOnSale" className="cursor-pointer">
                On Sale
              </Label>
            </div>
          </div>

          {isOnSale && (
            <div className="space-y-2">
              <Label htmlFor="salePercent">Sale Percent (%)</Label>
              <Input
                id="salePercent"
                type="number"
                min="0"
                max="100"
                step="1"
                value={salePercent}
                onChange={(e) => setSalePercent(e.target.value)}
                placeholder="0"
                disabled={isLoading}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

