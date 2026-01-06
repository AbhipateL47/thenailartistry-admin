import { AdminProduct } from "@/features/products/hooks/useAdminProducts";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Star, Tag, Copy, Check, Eye } from "lucide-react";
import { formatCurrency } from "@/shared/utils/currency";
import { toast } from "@/shared/utils/toast";
import { useState } from "react";
import {
  getProductStock,
  getStockStatus,
  getProductStatus,
  getProductPrice,
  truncateText,
} from "@/features/products/utils/product-table.utils";

interface ProductTableRowProps {
  product: AdminProduct;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onView?: (product: AdminProduct) => void;
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onToggleFeatured: (product: AdminProduct) => void;
  onToggleOnSale: (product: AdminProduct) => void;
  onToggleStatus?: (product: AdminProduct) => void;
}

export function ProductTableRow({
  product,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onToggleFeatured,
  onToggleOnSale,
  onToggleStatus,
}: ProductTableRowProps) {
  const stock = getProductStock(product);
  const stockStatus = getStockStatus(stock);
  const status = getProductStatus(product);
  const price = getProductPrice(product);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.productCode) {
      try {
        await navigator.clipboard.writeText(product.productCode);
        setCopied(true);
        toast.success("Product code copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error("Failed to copy product code");
      }
    }
  };

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-4 text-center">
        <div className="flex justify-center">
          <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-center">
        {product.productCode ? (
          <button
            onClick={handleCopyCode}
            className="font-mono hover:text-primary cursor-pointer flex items-center gap-1.5 transition-colors justify-center mx-auto"
            title="Click to copy"
          >
            {product.productCode}
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="font-mono">N/A</span>
        )}
      </td>
      <td className="px-4 py-4 text-sm text-center">
        <div className="font-medium" title={product.name || product.title}>
          {truncateText(product.name || product.title || "—", 30)}
        </div>
      </td>
      <td className="px-4 py-4 text-sm font-medium text-center">{formatCurrency(price)}</td>
      <td className="px-4 py-4 text-center">
        <div className="space-y-1 flex flex-col items-center">
          <div className="text-sm">{stockStatus.label}</div>
          {stock > 0 && (
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  stockStatus.color === "success"
                    ? "bg-[#22c55e]"
                    : "bg-[#f59e0b]"
                }`}
                style={{ width: `${stockStatus.width}%` }}
              />
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        {onToggleStatus ? (
          <label className="flex items-center gap-2 cursor-pointer justify-center">
            <input
              type="checkbox"
              checked={status === "Active"}
              onChange={() => onToggleStatus(product)}
              className="sr-only"
            />
            <div
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                status === "Active" ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  status === "Active" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {status === "Active" ? "Active" : "Inactive"}
            </span>
          </label>
        ) : (
          <div className="flex justify-center">
            <Badge
              variant={
                status === "Active"
                  ? "success"
                  : status === "Draft"
                  ? "muted"
                  : "default"
              }
            >
              {status}
            </Badge>
          </div>
        )}
      </td>
      <td className="px-4 py-4 text-center">
        <div className="flex gap-2 items-center justify-center">
          <button
            onClick={() => onToggleFeatured(product)}
            className={`p-1.5 rounded transition-colors ${
              product.isFeatured
                ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                : "text-muted-foreground hover:text-yellow-500 hover:bg-muted"
            }`}
            title={product.isFeatured ? "Remove from featured" : "Mark as featured"}
          >
            <Star className={`h-4 w-4 ${product.isFeatured ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={() => onToggleOnSale(product)}
            className={`p-1.5 rounded transition-colors ${
              product.isOnSale
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-primary hover:bg-muted"
            }`}
            title={product.isOnSale ? "Remove from sale" : "Mark as on sale"}
          >
            <Tag className="h-4 w-4" />
          </button>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <div className="flex gap-2 justify-center">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(product)}
              className="h-8 w-8 p-0"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(product)}
            className="h-8 w-8 p-0"
            title="Edit product"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(product)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="Delete product"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

