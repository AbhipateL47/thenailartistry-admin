import { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { DataTableColumn, DataTableAction, DataTableSort } from "./types";

interface DataTableTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  selectable?: boolean;
  selectedRows?: Set<string>;
  onSelectAll?: (checked: boolean) => void;
  onSelectRow?: (row: T, checked: boolean) => void;
  getRowKey: (row: T) => string;
  renderRow?: (row: T, columns: DataTableColumn<T>[]) => ReactNode;
  actions?: DataTableAction<T>[];
  emptyMessage?: string;
  deletedOnlyMode?: boolean;
  onRowClick?: (row: T) => void;
  sort?: DataTableSort;
  onSort?: (columnKey: string) => void;
}

export function DataTableTable<T = any>({
  columns,
  data,
  selectable = false,
  selectedRows = new Set(),
  onSelectAll,
  onSelectRow,
  getRowKey,
  renderRow,
  actions = [],
  emptyMessage = "No data found.",
  deletedOnlyMode = false,
  onRowClick,
  sort,
  onSort,
}: DataTableTableProps<T>) {
  const allSelected = data.length > 0 && data.every((row) => selectedRows.has(getRowKey(row)));
  const someSelected = data.some((row) => selectedRows.has(getRowKey(row)));

  // Filter columns for mobile (show all by default, but can be controlled)
  const visibleColumns = columns.filter((col) => col.mobile !== false);

  if (data.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <table className="min-w-[900px] w-full">
        <thead>
          <tr className="border-b border-border bg-muted text-muted-foreground">
            {selectable && !deletedOnlyMode && (
              <th className="px-4 py-3 text-center" style={{ width: "50px" }}>
                <div className="flex justify-center">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) {
                        const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
                        if (input) {
                          input.indeterminate = someSelected && !allSelected;
                        }
                      }
                    }}
                    onCheckedChange={(checked) => onSelectAll?.(checked === true)}
                  />
                </div>
              </th>
            )}
            {visibleColumns.map((column) => {
              const isSortable = column.sortable && !deletedOnlyMode;
              const isSorted = sort?.key === column.key;
              const sortOrder = isSorted ? sort.order : undefined;

              return (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground ${column.align === "center"
                    ? "text-center"
                    : column.align === "right"
                      ? "text-right"
                      : "text-left"
                    } ${isSortable ? "cursor-pointer hover:bg-muted/50 select-none" : ""}`}
                  style={column.width ? { width: column.width } : undefined}
                  onClick={() => {
                    if (isSortable && onSort) {
                      onSort(column.key);
                    }
                  }}
                >
                  <div className={`flex items-center gap-2 ${column.align === "center" ? "justify-center" : column.align === "right" ? "justify-end" : "justify-start"}`}>
                    <span>{column.header}</span>
                    {isSortable && (
                      <span className="text-muted-foreground">
                        {isSorted ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
            {actions.length > 0 && (
              <th className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground text-center">
                ACTIONS
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const rowKey = getRowKey(row);
            const isSelected = selectedRows.has(rowKey);

            if (renderRow) {
              return (
                <tr
                  key={rowKey}
                  className={`border-b border-border transition-colors
                    ${index % 2 === 0 ? "bg-background" : "bg-muted/40"}
                    ${!deletedOnlyMode ? "hover:bg-muted/70 cursor-pointer" : ""}
                  `}
                  onClick={() => {
                    if (!deletedOnlyMode && onRowClick) {
                      onRowClick(row);
                    }
                  }}
                >
                  {selectable && !deletedOnlyMode && (
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => onSelectRow?.(row, checked === true)}
                        />
                      </div>
                    </td>
                  )}
                  {renderRow(row, visibleColumns)}
                  {actions.length > 0 && (
                    <td className="px-4 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        {actions.map((action, idx) => {
                          const Icon = action.icon;
                          const isVisible =
                            typeof action.visible === "function"
                              ? action.visible(row)
                              : action.visible !== false;
                          if (!isVisible) return null;

                          // Use the icon directly
                          const IconComponent = Icon;

                          return (
                            <Button
                              key={idx}
                              variant={action.variant || "ghost"}
                              size="sm"
                              onClick={() => action.onClick(row)}
                              className="h-8 w-8 p-0"
                              title={action.label}
                            >
                              {IconComponent && <IconComponent className="h-4 w-4" />}
                            </Button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              );
            }

            return (
              <tr
                key={rowKey}
                className={`border-b border-border transition-colors hover:bg-muted/70
                  ${index % 2 !== 0 ? "bg-background" : "bg-muted/40"}
                  ${!deletedOnlyMode ? "hover:bg-muted/70 cursor-pointer" : ""}
                `}
                onClick={() => {
                  if (!deletedOnlyMode && onRowClick) {
                    onRowClick(row);
                  }
                }}
              >
                {selectable && !deletedOnlyMode && (
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectRow?.(row, checked === true)}
                      />
                    </div>
                  </td>
                )}
                {visibleColumns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-4 text-sm ${column.align === "center"
                      ? "text-center"
                      : column.align === "right"
                        ? "text-right"
                        : "text-left"
                      }`}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-4 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      {actions.map((action, idx) => {
                        const Icon = action.icon;
                        const isVisible =
                          typeof action.visible === "function"
                            ? action.visible(row)
                            : action.visible !== false;
                        if (!isVisible) return null;

                        return (
                          <Button
                            key={idx}
                            variant={action.variant || "ghost"}
                            size="sm"
                            onClick={() => action.onClick(row)}
                            className="h-8 w-8 p-0"
                            title={action.label}
                          >
                            {Icon && <Icon className="h-4 w-4" />}
                          </Button>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
