import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCreateProduct, getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";
import { useImageUpload, UploadedImage } from "@/shared/hooks/useImageUpload";
import { ImageUpload as ImageUploadComponent } from "@/features/products/components/ImageUpload";
import { toast } from "@/shared/utils/toast";
import { useAdminProductAttributes, ProductAttribute } from "@/features/products/hooks/useAdminProductAttributes";

export default function AddProduct() {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isOnSale, setIsOnSale] = useState(false);
  const [salePercent, setSalePercent] = useState("");
  const [error, setError] = useState("");

  // Product attributes state - stores selected values per attribute slug
  // Format: { [attributeSlug]: selectedValue[] } - allows multiple values per attribute
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});

  // Fetch product attributes
  const { data: productAttributes = [], isLoading: isLoadingAttributes } = useAdminProductAttributes(true);

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
  const { uploadImages: uploadImagesFn, deleteImages: deleteImagesFn, uploadProgress, isUploading } = useImageUpload();

  // Wrapper to sync uploaded images
  const handleImageUpload = async (files: File[]) => {
    const newImages = await uploadImagesFn(files);
    setUploadedImages(prev => [...prev, ...newImages]);
    return newImages;
  };

  // Handle image removal - delete from Cloudinary if publicId exists
  const handleImageRemove = async (index: number) => {
    const imageToRemove = uploadedImages[index];
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    
    // Reset primary image if it was removed
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }

    // Delete from Cloudinary if publicId exists
    if (imageToRemove?.publicId) {
      try {
        await deleteImagesFn([imageToRemove.publicId]);
      } catch (error) {
        console.error('Failed to delete image from Cloudinary:', error);
        // Continue even if deletion fails
      }
    }
  };

  const createMutation = useCreateProduct();
  const isLoading = createMutation.isPending || isUploading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!title.trim() || !name.trim()) {
      setError("Title and name are required");
      return;
    }

    const priceNum = price ? Number(price) : 0;
    if (price && (isNaN(priceNum) || priceNum < 0)) {
      setError("Price must be a valid positive number");
      return;
    }
    // Round to 2 decimal places to avoid floating-point precision issues
    const roundedPrice = priceNum ? Math.round(priceNum * 100) / 100 : 0;

    const mrpNum = mrp ? Number(mrp) : undefined;
    if (mrp && (isNaN(mrpNum!) || mrpNum! < 0)) {
      setError("MRP must be a valid positive number");
      return;
    }
    const roundedMrp = mrpNum ? Math.round(mrpNum * 100) / 100 : undefined;

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

    // Parse tags (comma-separated)
    const tagsArray = tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // Get primary image and gallery
    // Primary image is stored as URL string (use 1080p resolution or original)
    const primaryImage = uploadedImages[primaryImageIndex]?.resolutions['1080p'] || uploadedImages[primaryImageIndex]?.original || "";
    // Gallery is stored as array of URL strings (use 1080p resolution or original)
    const gallery = uploadedImages
      .filter((_, index) => index !== primaryImageIndex)
      .map(img => img.resolutions['1080p'] || img.original);

    try {
      const productData = {
        title: title.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        shortDescription: shortDescription.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        status: status,
        primaryImage: primaryImage || undefined,
        gallery: gallery.length > 0 ? gallery : undefined,
        isFeatured,
        isOnSale,
        salePercent: salePercentNum,
        variants: price || stock || sku || mrp ? [{
          price: roundedPrice,
          mrp: roundedMrp,
          stock: stockNum || 0,
          sku: sku.trim() || undefined,
          // Store selected attribute values in variants[].attributes
          // Format: { [attributeSlug]: selectedValue }
          attributes: Object.keys(selectedAttributes).length > 0 ? selectedAttributes : undefined,
        }] : undefined,
      };

      await createMutation.mutateAsync(productData);
      toast.success('Product created successfully');
      navigate('/products');
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/products')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <nav className="text-sm text-muted-foreground mb-2">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span>Products</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">Add Product</span>
          </nav>
          <h1 className="text-3xl font-semibold">Add Product</h1>
          <p className="text-muted-foreground mt-1">
            Create a new product for your store
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2, tag3 (comma-separated)"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple tags with commas
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price <span className="text-destructive">*</span></Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mrp">MRP</Label>
                <Input
                  id="mrp"
                  type="number"
                  step="0.01"
                  min="0"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
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

            {/* Status Radio Buttons */}
            <div className="space-y-2">
              <Label>Status</Label>
              <RadioGroup value={status} onValueChange={(value) => setStatus(value as "active" | "inactive")}>
                <RadioGroupItem value="active" label="Active" />
                <RadioGroupItem value="inactive" label="Inactive" />
              </RadioGroup>
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
                <Label htmlFor="salePercent">Discount Percentage (%)</Label>
                <Input
                  id="salePercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={salePercent}
                  onChange={(e) => setSalePercent(e.target.value)}
                  placeholder="0"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Product Attributes */}
            {!isLoadingAttributes && productAttributes.length > 0 && (
              <div className="space-y-4">
                <Label>Product Attributes</Label>
                <p className="text-xs text-muted-foreground mb-4">
                  Select attribute values for this product. You can select multiple values per attribute. These will be used for filtering on the frontend.
                </p>
                <div className="space-y-6">
                  {productAttributes.map((attribute: ProductAttribute) => {
                    const selectedValues = selectedAttributes[attribute.slug] || [];
                    return (
                      <div key={attribute._id} className="space-y-3">
                        <Label className="text-base font-medium">
                          {attribute.name}
                        </Label>
                        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
                          {attribute.values.map((value) => {
                            const isChecked = selectedValues.includes(value);
                            return (
                              <div key={value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`attr-${attribute.slug}-${value}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    setSelectedAttributes((prev) => {
                                      const currentValues = prev[attribute.slug] || [];
                                      if (checked) {
                                        // Add value if not already present
                                        return {
                                          ...prev,
                                          [attribute.slug]: [...currentValues, value],
                                        };
                                      } else {
                                        // Remove value
                                        const updatedValues = currentValues.filter((v) => v !== value);
                                        if (updatedValues.length === 0) {
                                          // Remove attribute key if no values left
                                          const { [attribute.slug]: _, ...rest } = prev;
                                          return rest;
                                        }
                                        return {
                                          ...prev,
                                          [attribute.slug]: updatedValues,
                                        };
                                      }
                                    });
                                  }}
                                  disabled={isLoading}
                                />
                                <Label
                                  htmlFor={`attr-${attribute.slug}-${value}`}
                                  className="cursor-pointer text-sm font-normal"
                                >
                                  {value}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Images</Label>
              <ImageUploadComponent
                uploadedImages={uploadedImages}
                onImagesChange={setUploadedImages}
                onImageRemove={handleImageRemove}
                primaryImageIndex={primaryImageIndex}
                onPrimaryImageChange={setPrimaryImageIndex}
                uploadImages={handleImageUpload}
                uploadProgress={uploadProgress}
                isUploading={isUploading}
                maxImages={10}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/products')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
