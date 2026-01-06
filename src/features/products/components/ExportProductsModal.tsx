import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "@/shared/utils/toast";
import { getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";
import apiClient from "@/api/client";

interface ExportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters?: Record<string, any>;
  currentSearch?: string;
  currentSort?: { key: string; order: "asc" | "desc" };
}

export function ExportProductsModal({
  isOpen,
  onClose,
  currentFilters,
  currentSearch,
  currentSort,
}: ExportProductsModalProps) {
  const [fileName, setFileName] = useState("");
  const [dataScope, setDataScope] = useState<"current" | "custom">("current");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [fileFormat, setFileFormat] = useState<"csv" | "xlsx">("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate default file name
  const getDefaultFileName = () => {
    const date = new Date().toISOString().split("T")[0];
    return `product_data_${date}`;
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFileName(getDefaultFileName());
      setDataScope("current");
      setDateRange({ start: "", end: "" });
      setFileFormat("csv");
      setError(null);
    }
  }, [isOpen]);

  const handleExport = async () => {
    if (!fileName.trim()) {
      setError("File name is required");
      return;
    }

    if (dataScope === "custom" && (!dateRange.start || !dateRange.end)) {
      setError("Date range is required for custom export");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const exportParams: any = {
        fileName: fileName.trim() || getDefaultFileName(),
        format: fileFormat,
        scope: dataScope,
        ...(dataScope === "current" && {
          filters: currentFilters,
          search: currentSearch,
          sort: currentSort,
        }),
        ...(dataScope === "custom" && {
          dateRange: {
            start: dateRange.start,
            end: dateRange.end,
          },
        }),
      };

      const response = await apiClient.post(
        "/v1/admin/products/export",
        exportParams,
        {
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${fileName.trim() || getDefaultFileName()}.${fileFormat}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Products exported successfully");
      onClose();
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Name */}
          <div className="space-y-2">
            <Label htmlFor="fileName">
              File Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={getDefaultFileName()}
            />
          </div>

          {/* Data Scope */}
          <div className="space-y-2">
            <Label>Data Scope</Label>
            <RadioGroup
              value={dataScope}
              onValueChange={(value: "current" | "custom") =>
                setDataScope(value)
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="current" id="current" />
                <Label htmlFor="current" className="cursor-pointer">
                  Current table view (respects filters, search, sort)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="cursor-pointer">
                  Custom date range
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Range (shown only if custom selected) */}
          {dataScope === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* File Format */}
          <div className="space-y-2">
            <Label htmlFor="fileFormat">File Format</Label>
            <Select
              value={fileFormat}
              onValueChange={(value: "csv" | "xlsx") => setFileFormat(value)}
            >
              <SelectTrigger id="fileFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Export
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

