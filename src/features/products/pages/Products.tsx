import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, Trash2, Star, Tag, Copy, RotateCcw, Download, AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import { DataTableColumn, DataTableFilter, DataTableAction } from "@/shared/components/DataTable/types";
import { DataTable } from "@/shared/components/DataTable/DataTable";
import { useAdminProducts, AdminProduct } from "@/features/products/hooks/useAdminProducts";
import { useUpdateProductStatus, useUpdateProduct, getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";
import { formatCurrency } from "@/shared/utils/currency";
import { toast } from "@/shared/utils/toast";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeleteResource } from "@/shared/hooks/useDeleteResource";
import apiClient from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  getProductStock,
  getStockStatus,
  getProductStatus,
  getProductPrice,
  truncateText,
} from "@/features/products/utils/product-table.utils";
import { ExportProductsModal } from "@/features/products/components/ExportProductsModal";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

export default function Products() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteProducts, setBulkDeleteProducts] = useState<AdminProduct[]>([]);
  const [restoringProductId, setRestoringProductId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [salePercentDialogOpen, setSalePercentDialogOpen] = useState(false);
  const [salePercentProduct, setSalePercentProduct] = useState<AdminProduct | null>(null);
  // const [salePercentValue, setSalePercentValue] = useState<string>("");
  const [bulkSalePercentDialogOpen, setBulkSalePercentDialogOpen] = useState(false);
  // const [bulkSaleProducts, setBulkSaleProducts] = useState<AdminProduct[]>([]);
  // const [bulkSalePercentValue, setBulkSalePercentValue] = useState<string>("");
  const statusMutation = useUpdateProductStatus();
  const updateProductMutation = useUpdateProduct();
  const { singleDelete: deleteProduct, bulkDelete: bulkDeleteProductsMutation } = useDeleteResource({
    resource: "products",
    invalidateKeys: [["admin", "products"]],
    idField: "productIds",
  });

  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [saleProduct, setSaleProduct] = useState<AdminProduct | null>(null);

  const [saleEnabled, setSaleEnabled] = useState(false);
  const [salePercentValue, setSalePercentValue] = useState("");

  const openSaleDialog = (product: AdminProduct) => {
    setSaleProduct(product);
    setSaleEnabled(product.isOnSale);
    setSalePercentValue(product.salePercent ? String(product.salePercent) : "");
    setSaleDialogOpen(true);
  };

  const [bulkSaleDialogOpen, setBulkSaleDialogOpen] = useState(false);
  const [bulkSaleProducts, setBulkSaleProducts] = useState<AdminProduct[]>([]);

  const [bulkSaleMode, setBulkSaleMode] = useState<"enable" | "disable">("enable");
  const [bulkSalePercentValue, setBulkSalePercentValue] = useState("");

  const openBulkSaleDialog = (products: AdminProduct[]) => {
    setBulkSaleProducts(products);
    setBulkSaleMode("enable");
    setBulkSalePercentValue("");
    setBulkSaleDialogOpen(true);
  };

  // Restore product handler
  const handleRestoreProduct = async (productId: string) => {
    setRestoringProductId(productId);
    try {
      const response = await apiClient.post(`/v1/admin/products/${productId}/restore`);
      if (response.data.success) {
        toast.success("Product restored successfully");
        queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setRestoringProductId(null);
    }
  };

  // Handle confirm sale percent for single product
  const handleConfirmSalePercent = async () => {
    if (!salePercentProduct || !salePercentValue) return;
    const percent = parseInt(salePercentValue);
    if (percent < 1 || percent > 90) return;

    try {
      await statusMutation.mutateAsync({
        productId: salePercentProduct._id,
        data: { isOnSale: true, salePercent: percent },
      });
      toast.success(`Product marked as on sale with ${percent}% discount`);
      setSalePercentDialogOpen(false);
      setSalePercentProduct(null);
      setSalePercentValue("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Handle confirm sale percent for bulk products
  const handleConfirmBulkSalePercent = async () => {
    if (bulkSaleProducts.length === 0 || !bulkSalePercentValue) return;
    const percent = parseInt(bulkSalePercentValue);
    if (percent < 1 || percent > 90) return;

    const alreadyOnSale = bulkSaleProducts.filter((p) => p.isOnSale === true);
    const notOnSale = bulkSaleProducts.filter((p) => p.isOnSale !== true);

    try {
      // Split into two groups and update separately
      if (alreadyOnSale.length > 0) {
        // Turn off sale for products already on sale
        const onSaleIds = alreadyOnSale.map((p) => p._id);
        await apiClient.post("/v1/admin/products/bulk/toggle-on-sale", {
          productIds: onSaleIds,
          isOnSale: false,
          salePercent: 0,
        });
      }

      if (notOnSale.length > 0) {
        // Turn on sale with entered percentage for products not on sale
        const notOnSaleIds = notOnSale.map((p) => p._id);
        await apiClient.post("/v1/admin/products/bulk/toggle-on-sale", {
          productIds: notOnSaleIds,
          isOnSale: true,
          salePercent: percent,
        });
      }

      toast.success(
        `Updated sale status for ${bulkSaleProducts.length} product(s)${alreadyOnSale.length > 0 && notOnSale.length > 0
          ? ` (${alreadyOnSale.length} removed, ${notOnSale.length} set to ${percent}%)`
          : ""
        }`
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      setBulkSalePercentDialogOpen(false);
      setBulkSaleProducts([]);
      setBulkSalePercentValue("");
    } catch (err: any) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  // Define columns
  const columns: DataTableColumn<AdminProduct>[] = [
    {
      key: "productCode",
      header: "PRODUCT CODE",
      align: "center",
      cell: (product) => {
        const handleCopy = async () => {
          if (product.productCode) {
            try {
              await navigator.clipboard.writeText(product.productCode);
              toast.success("Product code copied to clipboard");
            } catch (err) {
              toast.error("Failed to copy product code");
            }
          }
        };

        return product.productCode ? (
          <button
            onClick={handleCopy}
            className="font-mono hover:text-primary cursor-pointer flex items-center gap-1.5 transition-colors justify-center mx-auto"
            title="Click to copy"
          >
            {product.productCode}
            <Copy className="h-3 w-3 text-muted-foreground" />
          </button>
        ) : (
          <span className="font-mono">N/A</span>
        );
      },
    },
    {
      key: "name",
      header: "PRODUCT NAME",
      align: "center",
      sortable: true,
      cell: (product) => (
        <div
          className="font-medium cursor-pointer hover:underline"
          title={product.name || product.title}
          onClick={() => {
            if (!product.productCode) {
              console.error("Product does not have a productCode");
              return;
            }
            navigate(`/products/view/${product.productCode}`);
          }}
        >
          {truncateText(product.name || product.title || "—", 30)}
        </div>
      ),
    },
    {
      key: "price",
      header: "PRICE",
      align: "center",
      sortable: true,
      cell: (product) => (
        <span className="font-medium">{formatCurrency(getProductPrice(product))}</span>
      ),
    },
    {
      key: "stock",
      header: "STOCK LEVEL",
      align: "center",
      cell: (product) => {
        const stock = getProductStock(product);
        const stockStatus = getStockStatus(stock);
        return (
          <div className="space-y-1 flex flex-col items-center">
            <div className="text-sm">{stockStatus.label}</div>
            {stock > 0 && (
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${stockStatus.color === "success" ? "bg-[#22c55e]" : "bg-[#f59e0b]"
                    }`}
                  style={{ width: `${stockStatus.width}%` }}
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "STATUS",
      align: "center",
      cell: (product) => {
        const status = getProductStatus(product);
        return (
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
        );
      },
    },
    {
      key: "flags",
      header: "FLAGS",
      align: "center",
      cell: (product) => {
        const handleToggleFeatured = async () => {
          try {
            await statusMutation.mutateAsync({
              productId: product._id,
              data: { isFeatured: !product.isFeatured },
            });
            toast.success(
              product.isFeatured
                ? "Product removed from featured"
                : "Product marked as featured"
            );
          } catch (err) {
            toast.error(getErrorMessage(err));
          }
        };

        const handleToggleOnSale = async () => {
          // If product is already on sale, disable it immediately
          if (product.isOnSale) {
            try {
              await statusMutation.mutateAsync({
                productId: product._id,
                data: { isOnSale: false, salePercent: 0 },
              });
              toast.success("Product removed from sale");
            } catch (err) {
              toast.error(getErrorMessage(err));
            }
          } else {
            // If product is not on sale, show dialog to enter sale percentage
            setSalePercentProduct(product);
            setSalePercentValue("");
            setSalePercentDialogOpen(true);
          }
        };

        return (
          <div className="flex gap-2 items-center justify-center">
            <button
              onClick={handleToggleFeatured}
              className={`p-1.5 rounded transition-colors ${product.isFeatured
                ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                : "text-muted-foreground hover:text-yellow-500 hover:bg-muted"
                }`}
              title={product.isFeatured ? "Remove from featured" : "Mark as featured"}
            >
              <Star className={`h-4 w-4 ${product.isFeatured ? "fill-current" : ""}`} />
            </button>
            <button
              // onClick={handleToggleOnSale}
              onClick={() => openSaleDialog(product)}
              className={`p-1.5 rounded transition-colors ${product.isOnSale
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-primary hover:bg-muted"
                }`}
              title={product.isOnSale ? "Remove from sale" : "Mark as on sale"}
            >
              <Tag className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  // Define filters
  const filters: DataTableFilter[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "All", value: "all" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
      defaultValue: "all",
    },
    {
      key: "flagFilter",
      label: "Flags",
      type: "select",
      options: [
        { label: "All", value: "all" },
        { label: "Featured / On Sale", value: "featured-and-onsale" },
        { label: "Featured / not On Sale", value: "featured-not-onsale" },
        { label: "not Featured / On Sale", value: "not-featured-onsale" },
        { label: "not Featured / not On Sale", value: "not-featured-not-onsale" },
      ],
      defaultValue: "all",
    },
    {
      key: "deletedFilter",
      label: "Deleted Products",
      type: "select",
      options: [
        { label: "Active Only", value: "active" },
        { label: "All", value: "all" },
        { label: "Deleted Only", value: "deleted" },
      ],
      defaultValue: "active",
    },
  ];

  // Define actions - conditional based on deleted filter
  const getActions = (): DataTableAction<AdminProduct>[] => {
    // Check if we're in deleted-only mode (will be determined by filter value)
    // For now, return actions that will be filtered by deletedOnlyMode prop
    return [
      {
        label: "Restore",
        icon: RotateCcw,
        onClick: async (product) => {
          await handleRestoreProduct(product._id);
        },
        variant: "outline",
        visible: (product) => {
          // Show restore only in deleted-only mode
          return !!product.deletedAt;
        },
      },
      {
        label: "View",
        icon: Eye,
        onClick: (product) => {
          if (!product.productCode) {
            console.error("Product does not have a productCode");
            return;
          }
          navigate(`/products/view/${product.productCode}`);
        },
        variant: "ghost",
        visible: (product) => !product.deletedAt,
      },
      {
        label: "Edit",
        icon: Edit,
        onClick: (product) => {
          if (!product.productCode) {
            console.error("Product does not have a productCode");
            return;
          }
          navigate(`/products/edit/${product.productCode}`);
        },
        variant: "ghost",
        visible: (product) => !product.deletedAt,
      },
      {
        label: "Delete",
        icon: Trash2,
        onClick: (product) => {
          setDeletingProduct(product);
          setDeleteDialogOpen(true);
        },
        variant: "ghost",
        visible: (product) => !product.deletedAt,
      },
    ];
  };

  const actions = getActions();

  // Store current filter state for export
  const [currentFilterState, setCurrentFilterState] = useState<{
    filters?: Record<string, any>;
    search?: string;
    sort?: { key: string; order: "asc" | "desc" };
  }>({});

  // Use ref to track latest params without causing re-renders
  const latestParamsRef = useRef<any>(null);

  // Custom fetcher that maps filter values to API params
  const useProductsFetcher = (params: any) => {
    const apiParams: any = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && { search: params.search }),
      ...(params.sort && params.sort.key && { sort: params.sort.key, order: params.sort.order }),
      ...(params.status && params.status !== "all" && { status: params.status }),
      ...(params.flagFilter === "featured-and-onsale" && {
        isFeatured: true,
        isOnSale: true,
      }),
      ...(params.flagFilter === "featured-not-onsale" && {
        isFeatured: true,
        isOnSale: false,
      }),
      ...(params.flagFilter === "not-featured-onsale" && {
        isFeatured: false,
        isOnSale: true,
      }),
      ...(params.flagFilter === "not-featured-not-onsale" && {
        isFeatured: false,
        isOnSale: false,
      }),
      ...(params.deletedFilter === "all" && { includeDeleted: "true" as const }),
      ...(params.deletedFilter === "deleted" && { includeDeleted: "only" as const }),
    };

    // Store params in ref (doesn't trigger re-render)
    latestParamsRef.current = {
      filters: apiParams,
      search: params.search,
      sort: params.sort || { key: "createdAt", order: "desc" },
    };

    const result = useAdminProducts(apiParams);
    return {
      data: result.data,
      isLoading: result.isLoading,
      isError: result.isError,
      error: result.error,
    };
  };

  // Update state after render using useEffect
  useEffect(() => {
    if (latestParamsRef.current) {
      setCurrentFilterState(latestParamsRef.current);
    }
  });

  // Compute bulk actions based on deleted-only mode
  const bulkActions = useMemo(() => {
    // Check if we're in deleted-only mode by checking the latest params
    const isDeletedOnly = latestParamsRef.current?.filters?.includeDeleted === "only";

    if (isDeletedOnly) {
      // In deleted-only mode: show restore and permanent delete
      return [
        {
          label: "Restore",
          icon: RotateCcw,
          onClick: async (products) => {
            if (!window.confirm(`Are you sure you want to restore ${products.length} product(s)?`)) {
              return;
            }
            const productIds = products.map((p) => p._id);
            try {
              await apiClient.post("/v1/admin/products/bulk/restore", {
                productIds,
              });
              toast.success(`Restored ${products.length} product(s) successfully`);
              queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
            } catch (err: any) {
              toast.error(getErrorMessage(err));
              throw err;
            }
          },
          variant: "outline" as const,
          minSelected: 1,
        },
        {
          label: "Permanent Delete",
          icon: AlertTriangle,
          onClick: async (products) => {
            if (!window.confirm(`WARNING: Are you sure you want to PERMANENTLY delete ${products.length} product(s)? This action CANNOT be undone!`)) {
              return;
            }
            const productIds = products.map((p) => p._id);
            try {
              await apiClient.post("/v1/admin/products/bulk/permanent-delete", {
                productIds,
              });
              toast.success(`Permanently deleted ${products.length} product(s)`);
              queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
            } catch (err: any) {
              toast.error(getErrorMessage(err));
              throw err;
            }
          },
          variant: "destructive" as const,
          minSelected: 1,
        },
      ];
    } else {
      // Normal mode: show regular bulk actions
      return [
        {
          label: "Delete",
          icon: Trash2,
          onClick: (products) => {
            setBulkDeleteProducts(products);
            setBulkDeleteDialogOpen(true);
          },
          variant: "destructive" as const,
          minSelected: 1,
        },
        {
          label: "Toggle Featured",
          icon: Star,
          onClick: async (products) => {
            const productIds = products.map((p) => p._id);
            try {
              await apiClient.post("/v1/admin/products/bulk/toggle-featured", {
                productIds,
              });
              toast.success(`Toggled featured status for ${products.length} product(s)`);
              queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
            } catch (err: any) {
              toast.error(getErrorMessage(err));
              throw err;
            }
          },
          minSelected: 1,
        },
        {
          label: "Toggle On Sale",
          icon: Tag,
          onClick: (products) => {
            // Open bulk sale dialog
            openBulkSaleDialog(products);
          },
          minSelected: 1,
        },
        {
          label: "Activate",
          icon: Star,
          onClick: async (products) => {
            const productIds = products.map((p) => p._id);
            try {
              await apiClient.post("/v1/admin/products/bulk/update-status", {
                productIds,
                status: "active",
              });
              toast.success(`Activated ${products.length} product(s)`);
              queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
            } catch (err: any) {
              toast.error(getErrorMessage(err));
              throw err;
            }
          },
          minSelected: 1,
        },
        {
          label: "Deactivate",
          icon: Star,
          onClick: async (products) => {
            const productIds = products.map((p) => p._id);
            try {
              await apiClient.post("/v1/admin/products/bulk/update-status", {
                productIds,
                status: "inactive",
              });
              toast.success(`Deactivated ${products.length} product(s)`);
              queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
            } catch (err: any) {
              toast.error(getErrorMessage(err));
              throw err;
            }
          },
          minSelected: 1,
        },
      ];
    }
  }, [currentFilterState, queryClient]);

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
        <div>
          <nav className="text-sm text-muted-foreground mb-2">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">Products</span>
          </nav>
          <h1 className="text-3xl font-semibold">Product Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage inventory, prices, and product visibility across your store.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsExportModalOpen(true)}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            className="gap-2 bg-primary hover:bg-primary-hover"
            onClick={() => navigate("/products/add")}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        fetcher={useProductsFetcher}
        columns={columns}
        filters={filters}
        defaultSort={{ key: "createdAt", order: "desc" }}
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        rowActions={actions}
        selectable={true}
        getRowKey={(product) => product._id}
        urlSync={false}
        bulkActions={bulkActions}
      />

      {/* Single Delete Confirmation Dialog */}
      {deletingProduct && (
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setDeletingProduct(null);
          }}
          resourceName="product"
          entityLabel={deletingProduct.name || deletingProduct.title || "Product"}
          onConfirm={async () => {
            await deleteProduct(deletingProduct._id);
          }}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteProducts.length > 0 && (
        <DeleteConfirmDialog
          isOpen={bulkDeleteDialogOpen}
          onClose={() => {
            setBulkDeleteDialogOpen(false);
            setBulkDeleteProducts([]);
          }}
          resourceName="product"
          entityLabel={`${bulkDeleteProducts.length} product(s)`}
          entityCount={bulkDeleteProducts.length}
          isBulk={true}
          onConfirm={async () => {
            const productIds = bulkDeleteProducts.map((p) => p._id);
            await bulkDeleteProductsMutation(productIds);
          }}
        />
      )}

      {/* Export Modal */}
      <ExportProductsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentFilters={currentFilterState.filters}
        currentSearch={currentFilterState.search}
        currentSort={currentFilterState.sort}
      />

      {/* Single Product Sale Percent Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Manage Sale</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Enable Sale */}
            <div className="flex items-center justify-between">
              <Label htmlFor="enableSale">Enable Sale</Label>
              <Switch
                id="enableSale"
                checked={saleEnabled}
                onCheckedChange={(checked) => {
                  setSaleEnabled(checked);
                  if (!checked) setSalePercentValue("");
                }}
              />
            </div>

            {/* Sale Percent */}
            <div className="space-y-2">
              <Label htmlFor="salePercent">Sale Percentage (1–90%)</Label>
              <Input
                id="salePercent"
                type="number"
                min={1}
                max={90}
                disabled={!saleEnabled}
                value={salePercentValue}
                onChange={(e) => setSalePercentValue(e.target.value)}
                placeholder={saleEnabled ? "Enter percentage" : "Enable sale first"}
              />
            </div>

            {/* Helper text */}
            <p className="text-sm text-muted-foreground">
              {saleEnabled && salePercentValue
                ? `This product will be sold at ${salePercentValue}% discount.`
                : "Sale is disabled for this product."}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSaleDialogOpen(false);
                setSaleProduct(null);
                setSalePercentValue("");
              }}
            >
              Cancel
            </Button>

            <Button
              disabled={
                saleEnabled &&
                (!salePercentValue ||
                  Number(salePercentValue) < 1 ||
                  Number(salePercentValue) > 90)
              }
              onClick={async () => {
                if (!saleProduct) return;

                try {
                  if (saleEnabled) {
                    // Validate percent (1-90)
                    const percent = Number(salePercentValue);
                    if (percent < 1 || percent > 90) {
                      toast.error("Sale percentage must be between 1 and 90");
                      return;
                    }

                    // Call API with isOnSale: true, salePercent
                    await statusMutation.mutateAsync({
                      productId: saleProduct._id,
                      data: { isOnSale: true, salePercent: percent },
                    });
                    toast.success(`Product marked as on sale with ${percent}% discount`);
                  } else {
                    // Call API with isOnSale: false, salePercent: 0
                    await statusMutation.mutateAsync({
                      productId: saleProduct._id,
                      data: { isOnSale: false, salePercent: 0 },
                    });
                    toast.success("Product removed from sale");
                  }

                  // Close dialog and reset state
                  setSaleDialogOpen(false);
                  setSaleProduct(null);
                  setSaleEnabled(false);
                  setSalePercentValue("");

                  // Invalidate queries
                  queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
                } catch (err) {
                  toast.error(getErrorMessage(err));
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Sale Percent Dialog */}
      <Dialog open={bulkSaleDialogOpen} onOpenChange={setBulkSaleDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Manage Sale for Selected Products</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Mode selection */}
            <div className="space-y-2">
              <Label>Action</Label>
              <RadioGroup
                value={bulkSaleMode}
                onValueChange={(v) => setBulkSaleMode(v as "enable" | "disable")}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enable" id="enableSaleBulk" />
                  <Label htmlFor="enableSaleBulk">Enable / Update Sale</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="disable" id="disableSaleBulk" />
                  <Label htmlFor="disableSaleBulk">Disable Sale</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Sale percent */}
            {bulkSaleMode === "enable" && (
              <div className="space-y-2">
                <Label htmlFor="bulkSalePercent">Sale Percentage (1–90%)</Label>
                <Input
                  id="bulkSalePercent"
                  type="number"
                  min={1}
                  max={90}
                  value={bulkSalePercentValue}
                  onChange={(e) => setBulkSalePercentValue(e.target.value)}
                  placeholder="Enter percentage"
                />
              </div>
            )}

            {/* Summary */}
            <p className="text-sm text-muted-foreground">
              {bulkSaleMode === "enable"
                ? `This will enable or update sale for ${bulkSaleProducts.length} product(s).`
                : `This will disable sale for ${bulkSaleProducts.length} product(s).`}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkSaleDialogOpen(false);
                setBulkSaleProducts([]);
                setBulkSalePercentValue("");
              }}
            >
              Cancel
            </Button>

            <Button
              disabled={
                bulkSaleMode === "enable" &&
                (!bulkSalePercentValue ||
                  Number(bulkSalePercentValue) < 1 ||
                  Number(bulkSalePercentValue) > 90)
              }
              onClick={async () => {
                if (bulkSaleProducts.length === 0) return;

                const productIds = bulkSaleProducts.map((p) => p._id);

                try {
                  if (bulkSaleMode === "enable") {
                    // Validate percent (1-90)
                    const percent = Number(bulkSalePercentValue);
                    if (percent < 1 || percent > 90) {
                      toast.error("Sale percentage must be between 1 and 90");
                      return;
                    }

                    // Call ONE API with isOnSale: true, salePercent
                    await apiClient.post("/v1/admin/products/bulk/toggle-on-sale", {
                      productIds,
                      isOnSale: true,
                      salePercent: percent,
                    });
                    toast.success(`Enabled sale with ${percent}% discount for ${bulkSaleProducts.length} product(s)`);
                  } else {
                    // Call ONE API with isOnSale: false, salePercent: 0
                    await apiClient.post("/v1/admin/products/bulk/toggle-on-sale", {
                      productIds,
                      isOnSale: false,
                      salePercent: 0,
                    });
                    toast.success(`Disabled sale for ${bulkSaleProducts.length} product(s)`);
                  }

                  // Close dialog and reset state
                  setBulkSaleDialogOpen(false);
                  setBulkSaleProducts([]);
                  setBulkSaleMode("enable");
                  setBulkSalePercentValue("");

                  // Invalidate queries
                  queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
                } catch (err: any) {
                  toast.error(getErrorMessage(err));
                  throw err;
                }
              }}
            >
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
