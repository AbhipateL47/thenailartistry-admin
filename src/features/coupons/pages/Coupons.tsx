import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Edit, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { DataTableColumn, DataTableFilter, DataTableAction } from "@/shared/components/DataTable/types";
import { DataTable } from "@/shared/components/DataTable/DataTable";
import {
  useAdminCoupons,
  Coupon,
} from "@/features/coupons/hooks/useAdminCoupons";
import { formatCurrency } from "@/shared/utils/currency";
import { toast } from "@/shared/utils/toast";
import { getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";
import apiClient from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { CouponFormModal } from "@/features/coupons/components/CouponFormModal";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeleteResource } from "@/shared/hooks/useDeleteResource";

export default function Coupons() {
  const queryClient = useQueryClient();
  const [restoringCouponId, setRestoringCouponId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [currentFilterState, setCurrentFilterState] = useState<any>({});
  const latestParamsRef = useRef<any>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteCouponsList, setBulkDeleteCouponsList] = useState<Coupon[]>([]);
  const { singleDelete: deleteCoupon, bulkDelete: bulkDeleteCouponsMutation } = useDeleteResource({
    resource: "coupons",
    invalidateKeys: [["admin", "coupons"]],
    idField: "couponIds",
  });

  // Restore coupon handler
  const handleRestoreCoupon = async (couponId: string) => {
    setRestoringCouponId(couponId);
    try {
      const response = await apiClient.post(`/v1/admin/coupons/${couponId}/restore`);
      if (response.data.success) {
        toast.success("Coupon restored successfully");
        queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setRestoringCouponId(null);
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

  // Check if coupon is expired
  const isExpired = (coupon: Coupon) => {
    return new Date() > new Date(coupon.validTill);
  };

  // Get status badge
  const getStatusBadge = (coupon: Coupon) => {
    if (coupon.deletedAt) {
      return <Badge variant="secondary">Deleted</Badge>;
    }
    if (isExpired(coupon)) {
      return <Badge variant="muted">Expired</Badge>;
    }
    if (!coupon.isActive) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    return <Badge variant="success">Active</Badge>;
  };

  // Define columns
  const columns: DataTableColumn<Coupon>[] = [
    {
      key: "code",
      header: "COUPON CODE",
      align: "center",
      sortable: true,
      cell: (coupon) => {
        const handleCopy = async () => {
          try {
            await navigator.clipboard.writeText(coupon.code);
            toast.success("Coupon code copied to clipboard");
          } catch (err) {
            toast.error("Failed to copy coupon code");
          }
        };

        return (
          <button
            onClick={handleCopy}
            className="font-mono hover:text-primary cursor-pointer flex items-center gap-1.5 transition-colors justify-center mx-auto"
            title="Click to copy"
          >
            {coupon.code}
            <Copy className="h-3 w-3 text-muted-foreground" />
          </button>
        );
      },
    },
    {
      key: "type",
      header: "TYPE",
      align: "center",
      cell: (coupon) => (
        <Badge variant={coupon.type === "percentage" ? "default" : "outline"}>
          {coupon.type === "percentage" ? `${coupon.value}%` : formatCurrency(coupon.value)}
        </Badge>
      ),
    },
    {
      key: "discount",
      header: "DISCOUNT",
      align: "center",
      cell: (coupon) => {
        if (coupon.type === "percentage") {
          return (
            <span>
              {coupon.value}%
              {coupon.maxDiscountAmount && (
                <span className="text-xs text-muted-foreground ml-1">
                  (max {formatCurrency(coupon.maxDiscountAmount)})
                </span>
              )}
            </span>
          );
        }
        return <span>{formatCurrency(coupon.value)}</span>;
      },
    },
    {
      key: "status",
      header: "STATUS",
      align: "center",
      cell: (coupon) => getStatusBadge(coupon),
    },
    {
      key: "validTill",
      header: "VALID TILL",
      align: "center",
      sortable: true,
      cell: (coupon) => (
        <span className="text-sm">{formatDate(coupon.validTill)}</span>
      ),
    },
    {
      key: "usedCount",
      header: "USAGE",
      align: "center",
      cell: (coupon) => (
        <span className="text-sm">
          {coupon.usedCount}
          {coupon.maxTotalUses && ` / ${coupon.maxTotalUses}`}
        </span>
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
      label: "Deleted Coupons",
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
  const getActions = (): DataTableAction<Coupon>[] => {
    return [
      {
        label: "Restore",
        icon: RotateCcw,
        onClick: async (coupon) => {
          await handleRestoreCoupon(coupon._id);
        },
        variant: "outline",
        visible: (coupon) => !!coupon.deletedAt,
      },
      {
        label: "Edit",
        icon: Edit,
        onClick: (coupon) => {
          setEditingCoupon(coupon);
          setIsModalOpen(true);
        },
        variant: "ghost",
        visible: (coupon) => !coupon.deletedAt && !isExpired(coupon),
      },
      {
        label: "Delete",
        icon: Trash2,
        onClick: (coupon) => {
          setDeletingCoupon(coupon);
          setDeleteDialogOpen(true);
        },
        variant: "ghost",
        visible: (coupon) => !coupon.deletedAt,
      },
    ];
  };

  const actions = getActions();

  // Custom fetcher
  const useCouponsFetcher = (params: any) => {
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
    const result = useAdminCoupons(apiParams);
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
          onClick: async (coupons) => {
            if (!window.confirm(`Are you sure you want to restore ${coupons.length} coupon(s)?`)) {
              return;
            }
            const couponIds = coupons.map((c) => c._id);
            try {
              await apiClient.post("/v1/admin/coupons/bulk/restore", {
                couponIds,
              });
              toast.success(`Restored ${coupons.length} coupon(s) successfully`);
              queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
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
          onClick: async (coupons) => {
            if (!window.confirm(`WARNING: Are you sure you want to PERMANENTLY delete ${coupons.length} coupon(s)? This action CANNOT be undone!`)) {
              return;
            }
            const couponIds = coupons.map((c) => c._id);
            try {
              await apiClient.post("/v1/admin/coupons/bulk/permanent-delete", {
                couponIds,
              });
              toast.success(`Permanently deleted ${coupons.length} coupon(s)`);
              queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
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
          onClick: (coupons) => {
            setBulkDeleteCouponsList(coupons);
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
            <span className="text-foreground">Coupons</span>
          </nav>
          <h1 className="text-3xl font-semibold">Coupon Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage discount coupons and promo codes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="gap-2 bg-primary hover:bg-primary-hover"
            onClick={() => {
              setEditingCoupon(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Coupon
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        fetcher={useCouponsFetcher}
        columns={columns}
        filters={filters}
        defaultSort={{ key: "createdAt", order: "desc" }}
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        rowActions={actions}
        selectable={true}
        getRowKey={(coupon) => coupon._id}
        urlSync={false}
        bulkActions={bulkActions}
      />

      {/* Coupon Form Modal */}
      <CouponFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCoupon(null);
        }}
        coupon={editingCoupon}
      />

      {/* Single Delete Confirmation Dialog */}
      {deletingCoupon && (
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setDeletingCoupon(null);
          }}
          resourceName="coupon"
          entityLabel={deletingCoupon.code}
          onConfirm={async () => {
            await deleteCoupon(deletingCoupon._id);
          }}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteCouponsList.length > 0 && (
        <DeleteConfirmDialog
          isOpen={bulkDeleteDialogOpen}
          onClose={() => {
            setBulkDeleteDialogOpen(false);
            setBulkDeleteCouponsList([]);
          }}
          resourceName="coupon"
          entityLabel={`${bulkDeleteCouponsList.length} coupon(s)`}
          entityCount={bulkDeleteCouponsList.length}
          isBulk={true}
          onConfirm={async () => {
            const couponIds = bulkDeleteCouponsList.map((c) => c._id);
            await bulkDeleteCouponsMutation(couponIds);
          }}
        />
      )}
    </>
  );
}

