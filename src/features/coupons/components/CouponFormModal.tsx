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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  useCreateCoupon,
  useUpdateCoupon,
  Coupon,
} from "@/features/coupons/hooks/useAdminCoupons";

interface CreateCouponDto {
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  maxDiscountAmount?: number | null;
  minCartValue?: number;
  maxTotalUses?: number | null;
  maxUsesPerUser?: number;
  validTill: string;
  isActive?: boolean;
  stackable?: boolean;
  tags?: string[];
  appliesTo?: 'ALL' | 'PRODUCTS' | 'CATEGORIES';
  productIds?: string[];
  categoryIds?: string[];
}
import { toast } from "@/shared/utils/toast";
import { getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";
import { useQueryClient } from "@tanstack/react-query";

interface CouponFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon?: Coupon | null;
}

export function CouponFormModal({
  isOpen,
  onClose,
  coupon,
}: CouponFormModalProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const isEditing = !!coupon;

  const [formData, setFormData] = useState<CreateCouponDto>({
    code: "",
    type: "percentage",
    value: 0,
    maxDiscountAmount: null,
    minCartValue: 0,
    maxTotalUses: null,
    maxUsesPerUser: 1,
    validTill: "",
    isActive: true,
    stackable: false,
    tags: [],
    appliesTo: "ALL",
    productIds: [],
    categoryIds: [],
  });

  // Reset form when modal opens/closes or coupon changes
  useEffect(() => {
    if (isOpen) {
      if (coupon) {
        setFormData({
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          maxDiscountAmount: coupon.maxDiscountAmount || null,
          minCartValue: coupon.minCartValue,
          maxTotalUses: coupon.maxTotalUses || null,
          maxUsesPerUser: coupon.maxUsesPerUser,
          validTill: coupon.validTill.split("T")[0], // Extract date part
          isActive: coupon.isActive,
          stackable: coupon.stackable,
          tags: coupon.tags || [],
          appliesTo: coupon.appliesTo,
          productIds: coupon.productIds || [],
          categoryIds: coupon.categoryIds || [],
        });
      } else {
        // Reset to defaults
        setFormData({
          code: "",
          type: "percentage",
          value: 0,
          maxDiscountAmount: null,
          minCartValue: 0,
          maxTotalUses: null,
          maxUsesPerUser: 1,
          validTill: "",
          isActive: true,
          stackable: false,
          tags: [],
          appliesTo: "ALL",
          productIds: [],
          categoryIds: [],
        });
      }
    }
  }, [isOpen, coupon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.validTill) {
      toast.error("Code and valid till date are required");
      return;
    }

    if (formData.type === "percentage" && (formData.value < 0 || formData.value > 100)) {
      toast.error("Percentage must be between 0 and 100");
      return;
    }

    if (formData.type === "flat" && formData.value < 0) {
      toast.error("Discount value cannot be negative");
      return;
    }

    try {
      if (isEditing && coupon) {
        await updateMutation.mutateAsync({
          id: coupon._id,
          data: formData,
        });
        toast.success("Coupon updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Coupon created successfully");
      }
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Coupon" : "Create New Coupon"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Coupon Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="SAVE20"
              disabled={isEditing}
              required
            />
          </div>

          {/* Type and Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">
                Discount Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: "flat" | "percentage") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="flat">Flat Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">
                Value <span className="text-destructive">*</span>
              </Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: Number(e.target.value) })
                }
                placeholder={formData.type === "percentage" ? "20" : "100"}
                min="0"
                max={formData.type === "percentage" ? "100" : undefined}
                required
              />
            </div>
          </div>

          {/* Max Discount Amount (for percentage) */}
          {formData.type === "percentage" && (
            <div className="space-y-2">
              <Label htmlFor="maxDiscountAmount">Max Discount Amount (optional)</Label>
              <Input
                id="maxDiscountAmount"
                type="number"
                value={formData.maxDiscountAmount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxDiscountAmount: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                placeholder="500"
                min="0"
              />
            </div>
          )}

          {/* Min Cart Value */}
          <div className="space-y-2">
            <Label htmlFor="minCartValue">Minimum Cart Value</Label>
            <Input
              id="minCartValue"
              type="number"
              value={formData.minCartValue}
              onChange={(e) =>
                setFormData({ ...formData, minCartValue: Number(e.target.value) })
              }
              placeholder="0"
              min="0"
            />
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxTotalUses">Max Total Uses (optional)</Label>
              <Input
                id="maxTotalUses"
                type="number"
                value={formData.maxTotalUses || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxTotalUses: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Unlimited"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUsesPerUser">Max Uses Per User</Label>
              <Input
                id="maxUsesPerUser"
                type="number"
                value={formData.maxUsesPerUser}
                onChange={(e) =>
                  setFormData({ ...formData, maxUsesPerUser: Number(e.target.value) })
                }
                placeholder="1"
                min="1"
              />
            </div>
          </div>

          {/* Valid Till */}
          <div className="space-y-2">
            <Label htmlFor="validTill">
              Valid Till <span className="text-destructive">*</span>
            </Label>
            <Input
              id="validTill"
              type="date"
              value={formData.validTill}
              onChange={(e) =>
                setFormData({ ...formData, validTill: e.target.value })
              }
              required
            />
          </div>

          {/* Applies To */}
          <div className="space-y-2">
            <Label htmlFor="appliesTo">Applies To</Label>
            <Select
              value={formData.appliesTo}
              onValueChange={(value: "ALL" | "PRODUCTS" | "CATEGORIES") =>
                setFormData({ ...formData, appliesTo: value })
              }
            >
              <SelectTrigger id="appliesTo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Products</SelectItem>
                <SelectItem value="PRODUCTS">Specific Products</SelectItem>
                <SelectItem value="CATEGORIES">Specific Categories</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.appliesTo === "PRODUCTS" &&
                "Product selection will be implemented in a future update"}
              {formData.appliesTo === "CATEGORIES" &&
                "Category selection will be implemented in a future update"}
            </p>
          </div>

          {/* Options */}
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="stackable"
                checked={formData.stackable}
                onChange={(e) =>
                  setFormData({ ...formData, stackable: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="stackable" className="cursor-pointer">
                Stackable (can be combined with other coupons)
              </Label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Coupon" : "Create Coupon"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

