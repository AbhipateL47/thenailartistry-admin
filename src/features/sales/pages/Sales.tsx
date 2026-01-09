import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, RotateCcw, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { DataTableColumn, DataTableFilter, DataTableAction } from "@/shared/components/DataTable/types";
import { DataTable } from "@/shared/components/DataTable/DataTable";
import {
  useAdminSales,
  Sale,
} from "@/features/sales/hooks/useAdminSales";
import { toast } from "@/shared/utils/toast";
import { getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";
import apiClient from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { SaleFormModal } from "@/features/sales/components/SaleFormModal";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeleteResource } from "@/shared/hooks/useDeleteResource";

export default function Sales() {
  const queryClient = useQueryClient();
  const [restoringSaleId, setRestoringSaleId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [currentFilterState, setCurrentFilterState] = useState<any>({});
  const latestParamsRef = useRef<any>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteSalesList, setBulkDeleteSalesList] = useState<Sale[]>([]);
  const { singleDelete: deleteSale, bulkDelete: bulkDeleteSalesMutation } = useDeleteResource({
    resource: "sales",
    invalidateKeys: [["admin", "sales"]],
    idField: "saleIds",
  });

  // Restore sale handler
  const handleRestoreSale = async (saleId: string) => {
    setRestoringSaleId(saleId);
    try {
      const response = await apiClient.post(`/v1/admin/sales/${saleId}/restore`);
      if (response.data.success) {
        toast.success("Sale restored successfully");
        queryClient.invalidateQueries({ queryKey: ['admin', 'sales'] });
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setRestoringSaleId(null);
    }
  };

  // Format date using IST
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour12: true,
    });
  };

  // Check if sale is expired
  const isExpired = (sale: Sale) => {
    if (!sale.validTill) return false;
    return new Date() > new Date(sale.validTill);
  };

  // Get status badge
  const getStatusBadge = (sale: Sale) => {
    if (sale.deletedAt) {
      return <Badge variant="secondary">Deleted</Badge>;
    }
    if (isExpired(sale)) {
      return <Badge variant="muted">Expired</Badge>;
    }
    if (!sale.isActive) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    return <Badge variant="success">Active</Badge>;
  };

  // Define columns
  const columns: DataTableColumn<Sale>[] = [
    {
      key: "image",
      header: "IMAGE",
      align: "center",
      cell: (sale) => (
        <div className="flex items-center justify-center">
          {sale.image ? (
            <img
              src={sale.image}
              alt={sale.imageAlt || sale.heading}
              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <ImageIcon className={`h-8 w-8 text-muted-foreground ${sale.image ? 'hidden' : ''}`} />
        </div>
      ),
    },
    {
      key: "heading",
      header: "HEADING",
      align: "left",
      sortable: true,
      cell: (sale) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{sale.heading}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{sale.description}</p>
        </div>
      ),
    },
    {
      key: "couponCode",
      header: "COUPON",
      align: "center",
      cell: (sale) => (
        sale.couponCode ? (
          <Badge variant="outline" className="font-mono">
            {sale.couponCode}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      ),
    },
    {
      key: "ctaText",
      header: "CTA",
      align: "center",
      cell: (sale) => (
        <div className="text-sm">
          <p className="font-medium">{sale.ctaText}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[100px]">{sale.ctaLink}</p>
        </div>
      ),
    },
    {
      key: "order",
      header: "ORDER",
      align: "center",
      sortable: true,
      cell: (sale) => (
        <span className="text-sm font-medium">{sale.order}</span>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      align: "center",
      cell: (sale) => getStatusBadge(sale),
    },
    {
      key: "validTill",
      header: "VALID TILL",
      align: "center",
      sortable: true,
      cell: (sale) => (
        sale.validTill ? (
          <span className="text-sm">{formatDate(sale.validTill)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">No expiry</span>
        )
      ),
    },
  ];

  // Define filters
  const filters: DataTableFilter[] = [
    {
      key: "isActive",
      label: "Status",
      type: "select",
      options: [
        { label: "All", value: "all" },
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
      defaultValue: "all",
    },
    {
      key: "expired",
      label: "Expired",
      type: "select",
      options: [
        { label: "All", value: "all" },
        { label: "Expired", value: "true" },
        { label: "Not Expired", value: "false" },
      ],
      defaultValue: "all",
    },
    {
      key: "deletedFilter",
      label: "Deleted Sales",
      type: "select",
      options: [
        { label: "Active Only", value: "active" },
        { label: "All", value: "all" },
        { label: "Deleted Only", value: "deleted" },
      ],
      defaultValue: "active",
    },
  ];

  // Define actions
  const getActions = (): DataTableAction<Sale>[] => {
    return [
      {
        label: "Restore",
        icon: RotateCcw,
        onClick: async (sale) => {
          await handleRestoreSale(sale._id);
        },
        variant: "outline",
        visible: (sale) => !!sale.deletedAt,
      },
      {
        label: "Edit",
        icon: Edit,
        onClick: (sale) => {
          setEditingSale(sale);
          setIsModalOpen(true);
        },
        variant: "ghost",
        visible: (sale) => !sale.deletedAt && !isExpired(sale),
      },
      {
        label: "Delete",
        icon: Trash2,
        onClick: (sale) => {
          setDeletingSale(sale);
          setDeleteDialogOpen(true);
        },
        variant: "ghost",
        visible: (sale) => !sale.deletedAt,
      },
    ];
  };

  const actions = getActions();

  // Custom fetcher
  const useSalesFetcher = (params: any) => {
    const apiParams: any = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && { search: params.search }),
      ...(params.sort && params.sort.key && { sort: params.sort.key, order: params.sort.order }),
      ...(params.isActive && params.isActive !== "all" && {
        isActive: params.isActive === "true",
      }),
      ...(params.expired && params.expired !== "all" && {
        expired: params.expired,
      }),
      ...(params.deletedFilter === "all" && { deleted: "true" as const }),
      ...(params.deletedFilter === "deleted" && { deleted: "only" as const }),
    };

    latestParamsRef.current = { filters: apiParams };
    const result = useAdminSales(apiParams);
    return {
      data: result.data,
      isLoading: result.isLoading,
      isError: result.isError,
      error: result.error,
    };
  };

  useEffect(() => {
    if (latestParamsRef.current) {
      setCurrentFilterState(latestParamsRef.current);
    }
  });

  // Compute bulk actions based on deleted-only mode
  const bulkActions = useMemo(() => {
    const isDeletedOnly = latestParamsRef.current?.filters?.deleted === "only";
    
    if (isDeletedOnly) {
      return [
        {
          label: "Restore",
          icon: RotateCcw,
          onClick: async (sales) => {
            if (!window.confirm(`Are you sure you want to restore ${sales.length} sale(s)?`)) {
              return;
            }
            const saleIds = sales.map((s) => s._id);
            try {
              await apiClient.post("/v1/admin/sales/bulk/restore", {
                saleIds,
              });
              toast.success(`Restored ${sales.length} sale(s) successfully`);
              queryClient.invalidateQueries({ queryKey: ["admin", "sales"] });
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
          onClick: async (sales) => {
            if (!window.confirm(`WARNING: Are you sure you want to PERMANENTLY delete ${sales.length} sale(s)? This action CANNOT be undone!`)) {
              return;
            }
            const saleIds = sales.map((s) => s._id);
            try {
              await apiClient.post("/v1/admin/sales/bulk/permanent-delete", {
                saleIds,
              });
              toast.success(`Permanently deleted ${sales.length} sale(s)`);
              queryClient.invalidateQueries({ queryKey: ["admin", "sales"] });
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
      return [
        {
          label: "Delete",
          icon: Trash2,
          onClick: (sales) => {
            setBulkDeleteSalesList(sales);
            setBulkDeleteDialogOpen(true);
          },
          variant: "destructive" as const,
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
            <span className="text-foreground">Sales</span>
          </nav>
          <h1 className="text-3xl font-semibold">Sale Banner Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage sale banners for the homepage carousel
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="gap-2 bg-primary hover:bg-primary-hover"
            onClick={() => {
              setEditingSale(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Sale Banner
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        fetcher={useSalesFetcher}
        columns={columns}
        filters={filters}
        defaultSort={{ key: "order", order: "asc" }}
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        rowActions={actions}
        selectable={true}
        getRowKey={(sale) => sale._id}
        urlSync={false}
        bulkActions={bulkActions}
      />

      {/* Sale Form Modal */}
      <SaleFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSale(null);
        }}
        sale={editingSale}
      />

      {/* Single Delete Confirmation Dialog */}
      {deletingSale && (
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setDeletingSale(null);
          }}
          resourceName="sale"
          entityLabel={deletingSale.heading}
          onConfirm={async () => {
            await deleteSale(deletingSale._id);
          }}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteSalesList.length > 0 && (
        <DeleteConfirmDialog
          isOpen={bulkDeleteDialogOpen}
          onClose={() => {
            setBulkDeleteDialogOpen(false);
            setBulkDeleteSalesList([]);
          }}
          resourceName="sale"
          entityLabel={`${bulkDeleteSalesList.length} sale(s)`}
          entityCount={bulkDeleteSalesList.length}
          isBulk={true}
          onConfirm={async () => {
            const saleIds = bulkDeleteSalesList.map((s) => s._id);
            await bulkDeleteSalesMutation(saleIds);
          }}
        />
      )}
    </>
  );
}
