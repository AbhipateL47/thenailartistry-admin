import { AdminProduct } from "@/features/products/hooks/useAdminProducts";

// Calculate stock for display (sum of all variants)
export const getProductStock = (product: AdminProduct): number => {
  if (!product.variants || product.variants.length === 0) return 0;
  return product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
};

// Get product status
export const getProductStatus = (product: AdminProduct): string => {
  if (product.deletedAt) return "Draft";
  return "Active";
};

// Get primary price (first variant or 0)
export const getProductPrice = (product: AdminProduct): number => {
  if (!product.variants || product.variants.length === 0) return 0;
  return product.variants[0]?.price || 0;
};

// Get primary SKU (first variant)
export const getProductSKU = (product: AdminProduct): string => {
  if (!product.variants || product.variants.length === 0) return "N/A";
  return product.variants[0]?.sku || "N/A";
};

// Format last modified date
export const formatLastModified = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

// Get stock status
export const getStockStatus = (stock: number) => {
  if (stock === 0) return { label: "Out of Stock", color: "destructive" as const, width: 0 };
  if (stock < 20) return { label: `${stock} Low Stock`, color: "warning" as const, width: (stock / 20) * 100 };
  return { label: `${stock} in stock`, color: "success" as const, width: 100 };
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number = 30): string => {
  if (!text) return "—";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

