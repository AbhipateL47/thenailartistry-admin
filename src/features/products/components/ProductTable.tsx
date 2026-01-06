import { AdminProduct } from "@/features/products/hooks/useAdminProducts";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductTableRow } from "@/features/products/components/ProductTableRow";
import { ProductPagination } from "@/features/products/components/ProductPagination";

interface ProductTableProps {
  products: AdminProduct[];
  selectedProducts: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onSelectAll: (checked: boolean) => void;
  onSelectProduct: (productId: string, checked: boolean) => void;
  onPageChange: (page: number) => void;
  onView?: (product: AdminProduct) => void;
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onToggleFeatured: (product: AdminProduct) => void;
  onToggleOnSale: (product: AdminProduct) => void;
  onToggleStatus?: (product: AdminProduct) => void;
}

export function ProductTable({
  products,
  selectedProducts,
  pagination,
  onSelectAll,
  onSelectProduct,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onToggleFeatured,
  onToggleOnSale,
  onToggleStatus,
}: ProductTableProps) {
  const allSelected = selectedProducts.length === products.length && products.length > 0;

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No products found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-hidden">
        <div className="overflow-x-auto -mx-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-center">
                  <div className="flex justify-center">
                    <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  PRODUCT CODE
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  PRODUCT NAME
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  PRICE
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  STOCK LEVEL
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  STATUS
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  {/* FEATURED / ON SALE */}
                  FLAGS
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <ProductTableRow
                  key={product._id}
                  product={product}
                  isSelected={selectedProducts.includes(product._id)}
                  onSelect={(checked) => onSelectProduct(product._id, checked)}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleFeatured={onToggleFeatured}
                  onToggleOnSale={onToggleOnSale}
                  onToggleStatus={onToggleStatus}
                />
              ))}
            </tbody>
          </table>
        </div>

        <ProductPagination
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          pages={pagination.pages}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}

