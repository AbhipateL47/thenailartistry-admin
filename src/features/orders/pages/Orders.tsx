import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { DataTableColumn, DataTableFilter, DataTableAction } from "@/shared/components/DataTable/types";
import { DataTable } from "@/shared/components/DataTable/DataTable";
import { useAdminOrders, AdminOrder } from "@/features/orders/hooks/useAdminOrders";
import { formatCurrency } from "@/shared/utils/currency";
import { toast } from "@/shared/utils/toast";
import { getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";
import apiClient from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeleteResource } from "@/shared/hooks/useDeleteResource";

export default function Orders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentFilterState, setCurrentFilterState] = useState<any>({});
  const latestParamsRef = useRef<any>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<AdminOrder | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteOrdersList, setBulkDeleteOrdersList] = useState<AdminOrder[]>([]);
  const { singleDelete: deleteOrder, bulkDelete: bulkDeleteOrdersMutation } = useDeleteResource({
    resource: "orders",
    invalidateKeys: [["admin", "orders"]],
    idField: "orderIds",
  });

  // Format date using IST
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get customer name
  const getCustomerName = (order: AdminOrder) => {
    if (order.userId?.name) {
      return order.userId.name;
    }
    if (order.guestEmail) {
      return order.guestEmail;
    }
    return "Guest";
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: AdminOrder["status"]) => {
    switch (status) {
      case "PAID":
        return "success";
      case "SHIPPED":
        return "default";
      case "DELIVERED":
        return "success";
      case "CANCELLED":
        return "destructive";
      case "REFUNDED":
        return "warning";
      default:
        return "default";
    }
  };

  // Get payment status badge variant
  const getPaymentStatusBadgeVariant = (paymentStatus?: string) => {
    if (!paymentStatus) return "default";
    const status = paymentStatus.toLowerCase();
    if (status === "paid" || status === "success") return "success";
    if (status === "failed") return "destructive";
    return "warning";
  };

  // Format payment status
  const formatPaymentStatus = (paymentStatus?: string) => {
    if (!paymentStatus) return "N/A";
    return paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1).toLowerCase();
  };

  // Define columns
  const columns: DataTableColumn<AdminOrder>[] = [
    {
      key: "orderNumber",
      header: "ORDER ID",
      align: "center",
      cell: (order) => (
        <span className="font-medium">{order.orderNumber || order._id.slice(-8)}</span>
      ),
    },
    {
      key: "customer",
      header: "CUSTOMER",
      align: "center",
      cell: (order) => <span className="text-sm">{getCustomerName(order)}</span>,
    },
    {
      key: "total",
      header: "TOTAL AMOUNT",
      align: "center",
      cell: (order) => (
        <span className="font-medium">{formatCurrency(order.grandTotal)}</span>
      ),
    },
    {
      key: "paymentStatus",
      header: "PAYMENT STATUS",
      align: "center",
      cell: (order) => (
        <Badge variant={getPaymentStatusBadgeVariant(order.payment?.status)}>
          {formatPaymentStatus(order.payment?.status)}
        </Badge>
      ),
    },
    {
      key: "orderStatus",
      header: "ORDER STATUS",
      align: "center",
      cell: (order) => (
        <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
      ),
    },
    {
      key: "createdAt",
      header: "CREATED DATE",
      align: "center",
      sortable: true,
      cell: (order) => (
        <span className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</span>
      ),
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
        { label: "Paid", value: "PAID" },
        { label: "Shipped", value: "SHIPPED" },
        { label: "Delivered", value: "DELIVERED" },
        { label: "Cancelled", value: "CANCELLED" },
        { label: "Refunded", value: "REFUNDED" },
      ],
      defaultValue: "all",
    },
  ];

  // Define actions
  const actions: DataTableAction<AdminOrder>[] = [
    {
      label: "View",
      icon: Eye,
      onClick: (order) => {
        navigate(`/orders/${order._id}`);
      },
      variant: "outline",
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: (order) => {
        setDeletingOrder(order);
        setDeleteDialogOpen(true);
      },
      variant: "ghost",
    },
  ];

  // Custom fetcher that maps filter values to API params
  const useOrdersFetcher = (params: any) => {
    const apiParams: any = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && { search: params.search }),
      ...(params.sort && params.sort.key && { sort: params.sort.key, order: params.sort.order }),
      ...(params.status && params.status !== "all" && {
        status: params.status as AdminOrder["status"],
      }),
      ...(params.deletedFilter === "all" && { deleted: "true" as const }),
      ...(params.deletedFilter === "deleted" && { deleted: "only" as const }),
    };

    latestParamsRef.current = { filters: apiParams };
    const result = useAdminOrders(apiParams);
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
          onClick: async (orders) => {
            if (!window.confirm(`Are you sure you want to restore ${orders.length} order(s)?`)) {
              return;
            }
            const orderIds = orders.map((o) => o._id);
            try {
              await apiClient.post("/v1/admin/orders/bulk/restore", {
                orderIds,
              });
              toast.success(`Restored ${orders.length} order(s) successfully`);
              queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
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
          onClick: async (orders) => {
            if (!window.confirm(`WARNING: Are you sure you want to PERMANENTLY delete ${orders.length} order(s)? This action CANNOT be undone!`)) {
              return;
            }
            const orderIds = orders.map((o) => o._id);
            try {
              await apiClient.post("/v1/admin/orders/bulk/permanent-delete", {
                orderIds,
              });
              toast.success(`Permanently deleted ${orders.length} order(s)`);
              queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
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
          onClick: (orders) => {
            setBulkDeleteOrdersList(orders);
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
            <span className="text-foreground">Orders</span>
          </nav>
          <h1 className="text-3xl font-semibold">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer orders
          </p>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        fetcher={useOrdersFetcher}
        columns={columns}
        filters={filters}
        defaultSort={{ key: "createdAt", order: "desc" }}
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        rowActions={actions}
        selectable={true}
        getRowKey={(order) => order._id}
        urlSync={false}
        bulkActions={bulkActions}
      />

      {/* Single Delete Confirmation Dialog */}
      {deletingOrder && (
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setDeletingOrder(null);
          }}
          resourceName="order"
          entityLabel={deletingOrder.orderNumber || deletingOrder._id.slice(-8)}
          onConfirm={async () => {
            await deleteOrder(deletingOrder._id);
          }}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteOrdersList.length > 0 && (
        <DeleteConfirmDialog
          isOpen={bulkDeleteDialogOpen}
          onClose={() => {
            setBulkDeleteDialogOpen(false);
            setBulkDeleteOrdersList([]);
          }}
          resourceName="order"
          entityLabel={`${bulkDeleteOrdersList.length} order(s)`}
          entityCount={bulkDeleteOrdersList.length}
          isBulk={true}
          onConfirm={async () => {
            const orderIds = bulkDeleteOrdersList.map((o) => o._id);
            await bulkDeleteOrdersMutation(orderIds);
          }}
        />
      )}
    </>
  );
}
