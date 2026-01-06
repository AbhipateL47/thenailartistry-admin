import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, RotateCcw, AlertTriangle, Mail, Phone, MapPin } from "lucide-react";
import { DataTableColumn, DataTableFilter, DataTableAction } from "@/shared/components/DataTable/types";
import { DataTable } from "@/shared/components/DataTable/DataTable";
import { useAdminCustomers, AdminCustomer } from "@/features/customers/hooks/useAdminCustomers";
import { toast } from "@/shared/utils/toast";
import { getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";
import apiClient from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeleteResource } from "@/shared/hooks/useDeleteResource";
import { formatDateIST } from "@/shared/utils/dateFormat";

export default function Customers() {
  const queryClient = useQueryClient();
  const [currentFilterState, setCurrentFilterState] = useState<any>({});
  const latestParamsRef = useRef<any>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<AdminCustomer | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteCustomersList, setBulkDeleteCustomersList] = useState<AdminCustomer[]>([]);
  const { singleDelete: deleteCustomer, bulkDelete: bulkDeleteCustomersMutation } = useDeleteResource({
    resource: "customers",
    invalidateKeys: [["admin", "customers"]],
    idField: "customerIds",
  });

  // Restore customer handler
  const handleRestoreCustomer = async (customerId: string) => {
    try {
      const response = await apiClient.post(`/v1/admin/customers/${customerId}/restore`);
      if (response.data.success) {
        toast.success("Customer restored successfully");
        queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }
  };

  // Get default address
  const getDefaultAddress = (customer: AdminCustomer) => {
    if (!customer.addresses || customer.addresses.length === 0) return null;
    return customer.addresses.find((addr) => addr.isDefault) || customer.addresses[0];
  };

  // Define columns
  const columns: DataTableColumn<AdminCustomer>[] = [
    {
      key: "name",
      header: "NAME",
      align: "center",
      sortable: true,
      cell: (customer) => (
        <div className="flex items-center gap-3">
          {customer.profileImage ? (
            <img
              src={customer.profileImage}
              alt={customer.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <>
              {/* <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {customer.name?.charAt(0).toUpperCase() || "?"}
                </span>
              </div> */}
            </>
          )}
          <div>
            <div className="font-medium">{customer.name || "N/A"}</div>
            {customer.isEmailVerified && (
              <Badge variant="success" className="text-xs mt-0.5">
                Verified
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "EMAIL",
      align: "center",
      sortable: true,
      cell: (customer) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{customer.email}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "PHONE",
      align: "center",
      sortable: true,
      cell: (customer) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{customer.phone || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "address",
      header: "ADDRESS",
      align: "center",
      cell: (customer) => {
        const address = getDefaultAddress(customer);
        if (!address) return <span className="text-sm text-muted-foreground">No address</span>;
        return (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <div>{address.line1}</div>
              {address.city && address.state && (
                <div className="text-muted-foreground">
                  {address.city}, {address.state}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "wishlist",
      header: "WISHLIST",
      align: "center",
      cell: (customer) => (
        <span className="text-sm">
          {customer.wishlist?.length || 0} items
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "CREATED AT",
      align: "center",
      sortable: true,
      cell: (customer) => (
        <span className="text-sm text-muted-foreground">
          {formatDateIST(customer.createdAt)}
        </span>
      ),
    },
  ];

  // Define filters
  const filters: DataTableFilter[] = [
    {
      key: "isEmailVerified",
      label: "Email Verified",
      type: "select",
      options: [
        { label: "All", value: "all" },
        { label: "Verified", value: "true" },
        { label: "Not Verified", value: "false" },
      ],
      defaultValue: "all",
    },
    {
      key: "deletedFilter",
      label: "Deleted Customers",
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
  const getActions = (): DataTableAction<AdminCustomer>[] => {
    return [
      {
        label: "Restore",
        icon: RotateCcw,
        onClick: async (customer) => {
          await handleRestoreCustomer(customer._id);
        },
        variant: "outline",
        visible: (customer) => !!customer.deletedAt,
      },
      {
        label: "View",
        icon: Eye,
        onClick: (customer) => {
          // TODO: Navigate to customer detail page when implemented
          toast.info("Customer detail page coming soon");
        },
        variant: "ghost",
        visible: (customer) => !customer.deletedAt,
      },
      {
        label: "Delete",
        icon: Trash2,
        onClick: (customer) => {
          setDeletingCustomer(customer);
          setDeleteDialogOpen(true);
        },
        variant: "ghost",
        visible: (customer) => !customer.deletedAt,
      },
    ];
  };

  const actions = getActions();

  // Custom fetcher
  const useCustomersFetcher = (params: any) => {
    const apiParams: any = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && { search: params.search }),
      ...(params.sort && params.sort.key && { sort: params.sort.key, order: params.sort.order }),
      ...(params.isEmailVerified && params.isEmailVerified !== "all" && {
        isEmailVerified: params.isEmailVerified === "true",
      }),
      ...(params.deletedFilter === "all" && { deleted: "true" as const }),
      ...(params.deletedFilter === "deleted" && { deleted: "only" as const }),
    };

    latestParamsRef.current = { filters: apiParams };
    const result = useAdminCustomers(apiParams);
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
          onClick: async (customers) => {
            if (!window.confirm(`Are you sure you want to restore ${customers.length} customer(s)?`)) {
              return;
            }
            const customerIds = customers.map((c) => c._id);
            try {
              await apiClient.post("/v1/admin/customers/bulk/restore", {
                customerIds,
              });
              toast.success(`Restored ${customers.length} customer(s) successfully`);
              queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
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
          onClick: async (customers) => {
            if (!window.confirm(`WARNING: Are you sure you want to PERMANENTLY delete ${customers.length} customer(s)? This action CANNOT be undone!`)) {
              return;
            }
            const customerIds = customers.map((c) => c._id);
            try {
              await apiClient.post("/v1/admin/customers/bulk/permanent-delete", {
                customerIds,
              });
              toast.success(`Permanently deleted ${customers.length} customer(s)`);
              queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
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
          onClick: (customers) => {
            setBulkDeleteCustomersList(customers);
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
            <span className="text-foreground">Customers</span>
          </nav>
          <h1 className="text-3xl font-semibold">Customer Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customers and their information
          </p>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        fetcher={useCustomersFetcher}
        columns={columns}
        filters={filters}
        defaultSort={{ key: "createdAt", order: "desc" }}
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        rowActions={actions}
        selectable={true}
        getRowKey={(customer) => customer._id}
        urlSync={false}
        bulkActions={bulkActions}
      />

      {/* Single Delete Confirmation Dialog */}
      {deletingCustomer && (
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setDeletingCustomer(null);
          }}
          resourceName="customer"
          entityLabel={deletingCustomer.name || deletingCustomer.email}
          onConfirm={async () => {
            await deleteCustomer(deletingCustomer._id);
          }}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteCustomersList.length > 0 && (
        <DeleteConfirmDialog
          isOpen={bulkDeleteDialogOpen}
          onClose={() => {
            setBulkDeleteDialogOpen(false);
            setBulkDeleteCustomersList([]);
          }}
          resourceName="customer"
          entityLabel={`${bulkDeleteCustomersList.length} customer(s)`}
          entityCount={bulkDeleteCustomersList.length}
          isBulk={true}
          onConfirm={async () => {
            const customerIds = bulkDeleteCustomersList.map((c) => c._id);
            await bulkDeleteCustomersMutation(customerIds);
          }}
        />
      )}
    </>
  );
}
