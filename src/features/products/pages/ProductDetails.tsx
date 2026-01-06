import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAdminProductByCode } from "@/features/products/hooks/useAdminProductMutations";
import { formatCurrency } from "@/shared/utils/currency";
import { CardSkeleton } from "@/shared/components/skeletons/CardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetails() {
  const { productCode } = useParams<{ productCode: string }>();
  const navigate = useNavigate();
  const normalizedProductCode = productCode?.toUpperCase() || '';
  
  const { data: product, isLoading, isError, error } = useAdminProductByCode(normalizedProductCode);

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/products')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-semibold">Product Not Found</h1>
            <p className="text-muted-foreground mt-1">
              The product you're looking for doesn't exist.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-destructive">
              {error instanceof Error ? error.message : 'Failed to load product'}
            </p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => navigate('/products')}
            >
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <nav className="text-sm text-muted-foreground mb-2">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span>Products</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">Product Details</span>
          </nav>
          <h1 className="text-3xl font-semibold">Product Details</h1>
          <p className="text-muted-foreground mt-1">
            {product?.productCode || normalizedProductCode}
          </p>
        </div>
      </div>

      {isLoading ? (
        <>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Skeleton className="h-64 w-full" />
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : product ? (
        <>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Image */}
                <div className="space-y-4">
                  {product.primaryImage ? (
                    <div className="aspect-square w-full max-w-md border border-border rounded-lg overflow-hidden bg-muted">
                      <img
                        src={product.primaryImage}
                        alt={product.name || product.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/400";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-square w-full max-w-md border border-border rounded-lg bg-muted flex items-center justify-center">
                      <p className="text-muted-foreground">No image available</p>
                    </div>
                  )}
                  
                  {/* Gallery Images */}
                  {product.gallery && product.gallery.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {product.gallery.slice(0, 4).map((img, index) => (
                        <div key={index} className="aspect-square border border-border rounded overflow-hidden bg-muted">
                          <img
                            src={img}
                            alt={`${product.name} - Gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/100";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Product Code</p>
                    <p className="font-mono font-medium">{product.productCode}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium text-lg">{product.name || product.title}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Title</p>
                    <p className="font-medium">{product.title}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Slug</p>
                    <p className="font-mono text-sm">{product.slug}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={product.deletedAt ? "destructive" : "success"}>
                      {product.deletedAt ? "Deleted" : "Active"}
                    </Badge>
                  </div>

                  <div className="flex gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Featured</p>
                      <Badge variant={product.isFeatured ? "default" : "muted"}>
                        {product.isFeatured ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">On Sale</p>
                      <Badge variant={product.isOnSale ? "default" : "muted"}>
                        {product.isOnSale ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.ratingAvg?.toFixed(1) || "N/A"}</span>
                      <span className="text-sm text-muted-foreground">
                        ({product.ratingCount || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {(product.description || product.shortDescription) && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {product.shortDescription && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Short Description</p>
                      <p className="text-sm">{product.shortDescription}</p>
                    </div>
                  )}
                  {product.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Full Description</p>
                      <div 
                        className="text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variants & Pricing */}
          {product.variants && product.variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Variants & Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">SKU</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Price</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">MRP</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant, index) => (
                        <tr key={variant.sku || index} className="border-b border-border hover:bg-muted/30">
                          <td className="px-4 py-4 text-sm font-mono">{variant.sku || "N/A"}</td>
                          <td className="px-4 py-4 text-sm font-medium">{formatCurrency(variant.price)}</td>
                          <td className="px-4 py-4 text-sm text-muted-foreground line-through">
                            {formatCurrency(variant.mrp)}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <Badge variant={variant.stock > 0 ? "success" : "destructive"}>
                              {variant.stock}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-medium">{new Date(product.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Updated At</p>
                  <p className="font-medium">{new Date(product.updatedAt).toLocaleString()}</p>
                </div>
                {product.deletedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Deleted At</p>
                    <p className="font-medium text-destructive">
                      {new Date(product.deletedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {product.tags && product.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={() => navigate(`/products/edit/${product.productCode}`)}>
              Edit Product
            </Button>
            <Button variant="outline" onClick={() => navigate('/products')}>
              Back to Products
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

