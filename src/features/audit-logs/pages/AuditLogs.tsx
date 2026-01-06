import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2 } from "lucide-react";
import { DataTableColumn, DataTableFilter, DataTableAction } from "@/shared/components/DataTable/types";
import { DataTable } from "@/shared/components/DataTable/DataTable";
import { useAdminAuditLogs, AuditLog } from "../hooks/useAdminAuditLogs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/shared/utils/toast";
import { getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";
import apiClient from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeleteResource } from "@/shared/hooks/useDeleteResource";

export default function AuditLogs() {
  const queryClient = useQueryClient();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLog, setDeletingLog] = useState<AuditLog | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteLogsList, setBulkDeleteLogsList] = useState<AuditLog[]>([]);
  const { singleDelete: deleteLog, bulkDelete: bulkDeleteLogsMutation } = useDeleteResource({
    resource: "audit-logs",
    invalidateKeys: ["adminAuditLogs"],
    idField: "auditLogIds",
    bulkEndpoint: "/v1/admin/audit-logs/bulk/delete",
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
      second: "2-digit",
      hour12: true,
    });
  };

  // Format action badge using operation type (SAFE)
  const getActionBadge = (log: AuditLog) => {
    // Guard: if operation is missing
    if (!log.operation) {
      return <Badge variant="secondary">{log.action || "Unknown"}</Badge>;
    }

    const operationUpper = log.operation.toUpperCase();

    if (operationUpper === "CREATE") {
      return <Badge variant="success">{log.action || "Created"}</Badge>;
    }

    if (operationUpper === "UPDATE") {
      return <Badge variant="default">{log.action || "Updated"}</Badge>;
    }

    if (operationUpper === "DELETE") {
      return <Badge variant="destructive">{log.action || "Deleted"}</Badge>;
    }

    if (operationUpper === "RESTORE") {
      return <Badge variant="outline">{log.action || "Restored"}</Badge>;
    }

    // Fallback: show action
    return <Badge variant="secondary">{log.action || "Unknown"}</Badge>;
  };


  // Define columns
  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: "actor",
      header: "ACTOR",
      align: "center",
      cell: (log) => (
        <div className="space-y-1">
          <div className="text-sm font-medium">{log.actorRole || "System"}</div>
          {/* <div className="text-xs text-muted-foreground">
            {log.actorId ? log.actorId.slice(-8) : "N/A"}
          </div> */}
        </div>
      ),
    },
    {
      key: "operation",
      header: "OPERATION",
      align: "center",
      cell: (log) => <Badge variant="default">{log.operation || "Unknown"}</Badge>,
    },
    {
      key: "action",
      header: "ACTION",
      align: "center",
      cell: (log) => getActionBadge(log),
    },
    {
      key: "collection",
      header: "COLLECTION",
      align: "center",
      cell: (log) => (
        <span className="text-sm font-mono">{log.collectionName}</span>
      ),
    },
    {
      key: "documentId",
      header: "DOCUMENT ID",
      align: "center",
      cell: (log) => (
        <span className="text-xs font-mono text-muted-foreground">
          {Array.isArray(log.documentId)
            ? log.documentId.join(", ")
            : log.documentId?.slice(-8) || "N/A"}
        </span>
      ),
    },
    // {
    //   key: "ip",
    //   header: "IP ADDRESS",
    //   align: "center",
    //   cell: (log) => (
    //     <span className="text-xs text-muted-foreground">{log.ip || "N/A"}</span>
    //   ),
    // },
    {
      key: "createdAt",
      header: "CREATED AT",
      align: "center",
      sortable: true,
      cell: (log) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(log.createdAt)}
        </span>
      ),
    },
  ];

  // Define filters
  const filters: DataTableFilter[] = [
    {
      key: "actorRole",
      label: "Actor Role",
      type: "select",
      options: [
        { label: "All", value: "all" },
        { label: "Admin", value: "admin" },
        { label: "Manager", value: "manager" },
        { label: "User", value: "user" },
      ],
      defaultValue: "all",
    },
    {
      key: "action",
      label: "Action",
      type: "select",
      options: [
        { label: "All", value: "all" },
        { label: "Created", value: "CREATE" },
        { label: "Updated", value: "UPDATE" },
        { label: "Deleted", value: "DELETE" },
        { label: "Restored", value: "RESTORE" },
      ],
      defaultValue: "all",
    },
    {
      key: "collectionName",
      label: "Collection",
      type: "select",
      options: [
        { label: "All", value: "all" },
        { label: "Product", value: "Product" },
        { label: "Order", value: "Order" },
        { label: "Coupon", value: "Coupon" },
        { label: "User", value: "User" },
      ],
      defaultValue: "all",
    },
    {
      key: "deletedFilter",
      label: "Deleted Logs",
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
  const actions: DataTableAction<AuditLog>[] = [
    {
      label: "View Details",
      icon: Eye,
      onClick: (log) => {
        setSelectedLog(log);
        setIsDetailOpen(true);
      },
      variant: "ghost",
      visible: (log) => !log.deletedAt,
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: (log) => {
        setDeletingLog(log);
        setDeleteDialogOpen(true);
      },
      variant: "ghost",
      visible: (log) => !log.deletedAt,
    },
  ];

  // Custom fetcher
  const useAuditLogsFetcher = (params: any) => {
    const apiParams: any = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && { search: params.search }),
      ...(params.sort && params.sort.key && { sort: params.sort.key, order: params.sort.order }),
      ...(params.actorRole && params.actorRole !== "all" && {
        actorRole: params.actorRole,
      }),
      ...(params.action && params.action !== "all" && {
        action: params.action,
      }),
      ...(params.collectionName && params.collectionName !== "all" && {
        collectionName: params.collectionName,
      }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
      ...(params.deletedFilter === "all" && { deleted: "true" as const }),
      ...(params.deletedFilter === "deleted" && { deleted: "only" as const }),
    };

    const result = useAdminAuditLogs(apiParams);
    return {
      data: result.data,
      isLoading: result.isLoading,
      isError: result.isError,
      error: result.error,
    };
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
        <div>
          <nav className="text-sm text-muted-foreground mb-2">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">Audit Logs</span>
          </nav>
          <h1 className="text-3xl font-semibold">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            View system activity and changes
          </p>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        fetcher={useAuditLogsFetcher}
        columns={columns}
        filters={filters}
        defaultSort={{ key: "createdAt", order: "desc" }}
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        rowActions={actions}
        selectable={true}
        getRowKey={(log) => log._id}
        urlSync={false}
        bulkActions={[
          {
            label: "Delete",
            icon: Trash2,
            onClick: (logs) => {
              setBulkDeleteLogsList(logs);
              setBulkDeleteDialogOpen(true);
            },
            variant: "destructive",
            minSelected: 1,
          },
        ]}
      />

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Actor Role</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedLog.actorRole}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Action</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedLog.action}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Collection</label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedLog.collectionName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Document ID</label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {Array.isArray(selectedLog.documentId)
                        ? selectedLog.documentId.join(", ")
                        : selectedLog.documentId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">IP Address</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedLog.ip || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Created At</label>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedLog.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Before</label>
                    <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto max-h-64">
                      {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : 'null'}
                    </pre>
                  </div>
                  <div>
                    <label className="text-sm font-medium">After</label>
                    <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto max-h-64">
                      {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : 'null'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      {deletingLog && (
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setDeletingLog(null);
          }}
          resourceName="audit log"
          entityLabel={`Log ${deletingLog._id.slice(-8)}`}
          onConfirm={async () => {
            await deleteLog(deletingLog._id);
          }}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteLogsList.length > 0 && (
        <DeleteConfirmDialog
          isOpen={bulkDeleteDialogOpen}
          onClose={() => {
            setBulkDeleteDialogOpen(false);
            setBulkDeleteLogsList([]);
          }}
          resourceName="audit log"
          entityLabel={`${bulkDeleteLogsList.length} audit log(s)`}
          entityCount={bulkDeleteLogsList.length}
          isBulk={true}
          onConfirm={async () => {
            const auditLogIds = bulkDeleteLogsList.map((l) => l._id);
            await bulkDeleteLogsMutation(auditLogIds);
          }}
        />
      )}
    </>
  );
}

