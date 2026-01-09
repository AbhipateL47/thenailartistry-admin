import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, ChevronDown, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  useCreateSale,
  useUpdateSale,
  Sale,
} from "@/features/sales/hooks/useAdminSales";
import { useCouponsForSelect, CouponForSelect } from "@/features/coupons/hooks/useAdminCoupons";
import { toast } from "@/shared/utils/toast";
import { getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDateOnlyIST } from "@/shared/utils/dateFormat";
import { useDebounce } from "@/shared/hooks/useDebounce";

interface CreateSaleDto {
  heading: string;
  description: string;
  couponCode?: string;
  couponId?: string | null;
  ctaText?: string;
  ctaLink?: string;
  image: string;
  imageAlt?: string;
  order?: number;
  isActive?: boolean;
  validFrom?: string;
  validTill?: string;
  placement?: 'homeHero' | 'homeMid' | 'productPage';
  ctaType?: 'link' | 'coupon';
}

interface SaleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale?: Sale | null;
}

export function SaleFormModal({
  isOpen,
  onClose,
  sale,
}: SaleFormModalProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateSale();
  const updateMutation = useUpdateSale();
  const isEditing = !!sale;

  // Search state for coupon selector
  const [couponSearchQuery, setCouponSearchQuery] = useState('');
  const [isCouponDropdownOpen, setIsCouponDropdownOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(couponSearchQuery, 300);
  const couponDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch coupons for selection using lightweight endpoint
  const { data: couponsData, isLoading: isLoadingCoupons } = useCouponsForSelect({
    q: debouncedSearchQuery || undefined,
    limit: 20,
  });

  const [formData, setFormData] = useState<CreateSaleDto>({
    heading: "",
    description: "",
    couponCode: "",
    couponId: null,
    ctaText: "Shop Now",
    ctaLink: "/products",
    image: "",
    imageAlt: "",
    order: 0,
    isActive: true,
    validFrom: "",
    validTill: "",
  });

  // Get coupons list from API response, ensuring selected coupon is included
  const availableCoupons = useMemo(() => {
    return couponsData || [];
  }, [couponsData]);

  // Format coupon display text
  const getCouponDisplayText = (coupon: CouponForSelect): string => {
    const discountText = coupon.discountType === 'percentage' 
      ? `${coupon.discountValue}%` 
      : formatCurrency(coupon.discountValue);
    const expiryText = coupon.validTill 
      ? ` — Expires ${formatDateOnlyIST(coupon.validTill)}`
      : '';
    return `${coupon.code} — ${discountText}${expiryText}`;
  };

  // Reset form when modal opens/closes or sale changes
  useEffect(() => {
    if (isOpen) {
      if (sale) {
        // Extract couponId from sale (could be string or populated object)
        let couponId: string | null = null;
        if (sale.couponId) {
          if (typeof sale.couponId === 'object' && sale.couponId._id) {
            couponId = sale.couponId._id;
          } else if (typeof sale.couponId === 'string') {
            couponId = sale.couponId;
          }
        }

        setFormData({
          heading: sale.heading,
          description: sale.description,
          couponCode: sale.couponCode || "",
          couponId: couponId,
          ctaText: sale.ctaText,
          ctaLink: sale.ctaLink,
          image: sale.image,
          imageAlt: sale.imageAlt || "",
          order: sale.order,
          isActive: sale.isActive,
          validFrom: sale.validFrom ? sale.validFrom.split("T")[0] : "",
          validTill: sale.validTill ? sale.validTill.split("T")[0] : "",
          placement: sale.placement || 'homeHero',
          ctaType: sale.ctaType || 'link',
        });
        // Clear search when editing
        setCouponSearchQuery('');
      } else {
        // Reset to defaults
        setFormData({
          heading: "",
          description: "",
          couponCode: "",
          couponId: null,
          ctaText: "Shop Now",
          ctaLink: "/products",
          image: "",
          imageAlt: "",
          order: 0,
          isActive: true,
          validFrom: "",
          validTill: "",
          placement: 'homeHero',
          ctaType: 'link',
        });
        // Clear search when creating new
        setCouponSearchQuery('');
      }
    }
  }, [isOpen, sale]);

  // Handle coupon selection
  const handleCouponChange = (value: string) => {
    if (value === 'none') {
      setFormData({
        ...formData,
        couponId: null,
        couponCode: "",
      });
      setCouponSearchQuery(''); // Clear search when clearing selection
    } else {
      const selectedCoupon = availableCoupons.find((c: CouponForSelect) => c._id === value);
      if (selectedCoupon) {
        setFormData({
          ...formData,
          couponId: selectedCoupon._id,
          couponCode: selectedCoupon.code, // Set couponCode for backward compatibility
        });
        setCouponSearchQuery(''); // Clear search after selection
      }
    }
    setIsCouponDropdownOpen(false); // Close dropdown after selection
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        couponDropdownRef.current &&
        !couponDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCouponDropdownOpen(false);
      }
    };

    if (isCouponDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCouponDropdownOpen]);

  // Get selected coupon display text
  const getSelectedCouponText = () => {
    if (!formData.couponId || formData.couponId === 'none') {
      return 'Select a coupon';
    }
    const selected = availableCoupons.find((c) => c._id === formData.couponId);
    if (selected) {
      return getCouponDisplayText(selected);
    }
    return formData.couponCode || 'Select a coupon';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.heading || !formData.description || !formData.image) {
      toast.error("Heading, description, and image are required");
      return;
    }

    if (!formData.ctaText || !formData.ctaLink) {
      toast.error("CTA text and link are required");
      return;
    }

    try {
      const submitData: CreateSaleDto = {
        ...formData,
        couponCode: formData.couponCode || undefined,
        couponId: formData.couponId || null,
        imageAlt: formData.imageAlt || undefined,
        validFrom: formData.validFrom || undefined,
        validTill: formData.validTill || undefined,
        placement: formData.placement || 'homeHero',
        ctaType: formData.ctaType || 'link',
      };

      if (isEditing && sale) {
        await updateMutation.mutateAsync({
          id: sale._id,
          data: submitData,
        });
        toast.success("Sale updated successfully");
      } else {
        await createMutation.mutateAsync(submitData);
        toast.success("Sale created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales'] });
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Sale Banner" : "Create New Sale Banner"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Heading */}
          <div className="space-y-2">
            <Label htmlFor="heading">
              Heading <span className="text-destructive">*</span>
            </Label>
            <Input
              id="heading"
              value={formData.heading}
              onChange={(e) =>
                setFormData({ ...formData, heading: e.target.value })
              }
              placeholder="Summer Sale - Up to 50% Off!"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Get amazing deals on our premium press-on nails..."
              rows={3}
              required
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image">
              Image URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) =>
                setFormData({ ...formData, image: e.target.value })
              }
              placeholder="https://example.com/sale-image.jpg"
              required
            />
            {formData.image && (
              <div className="mt-2">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Image Alt */}
          <div className="space-y-2">
            <Label htmlFor="imageAlt">Image Alt Text (optional)</Label>
            <Input
              id="imageAlt"
              value={formData.imageAlt}
              onChange={(e) =>
                setFormData({ ...formData, imageAlt: e.target.value })
              }
              placeholder="Summer sale banner"
            />
          </div>

          {/* CTA Text and Link */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ctaText">
                CTA Button Text <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ctaText"
                value={formData.ctaText}
                onChange={(e) =>
                  setFormData({ ...formData, ctaText: e.target.value })
                }
                placeholder="Shop Now"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaLink">
                CTA Link <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ctaLink"
                value={formData.ctaLink}
                onChange={(e) =>
                  setFormData({ ...formData, ctaLink: e.target.value })
                }
                placeholder="/products"
                required
              />
            </div>
          </div>

          {/* Coupon Selector */}
          <div className="space-y-2">
            <Label htmlFor="couponId">Coupon (optional)</Label>
            <div className="relative" ref={couponDropdownRef}>
              {/* Trigger Button */}
              <button
                type="button"
                id="couponId"
                onClick={() => setIsCouponDropdownOpen(!isCouponDropdownOpen)}
                disabled={isLoadingCoupons}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  isCouponDropdownOpen && "ring-2 ring-ring ring-offset-2"
                )}
              >
                <span className={cn(
                  "truncate",
                  !formData.couponId && "text-muted-foreground"
                )}>
                  {getSelectedCouponText()}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>

              {/* Dropdown Content */}
              {isCouponDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md">
                  {/* Search Input */}
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={searchInputRef}
                        type="search"
                        placeholder="Search..."
                        value={couponSearchQuery}
                        onChange={(e) => setCouponSearchQuery(e.target.value)}
                        className="pl-8 h-9"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsCouponDropdownOpen(false);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="max-h-[300px] overflow-auto">
                    {isLoadingCoupons ? (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading coupons...</span>
                      </div>
                    ) : (
                      <>
                        {/* No coupon option */}
                        <button
                          type="button"
                          onClick={() => handleCouponChange('none')}
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                            "focus:bg-accent focus:text-accent-foreground outline-none",
                            !formData.couponId && "bg-accent text-accent-foreground"
                          )}
                        >
                          No coupon
                        </button>

                        {/* Coupon options */}
                        {availableCoupons.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            {couponSearchQuery 
                              ? `No coupons found matching "${couponSearchQuery}"`
                              : 'No active coupons available'}
                          </div>
                        ) : (
                          availableCoupons.map((coupon: CouponForSelect) => (
                            <button
                              key={coupon._id}
                              type="button"
                              onClick={() => handleCouponChange(coupon._id)}
                              className={cn(
                                "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                                "focus:bg-accent focus:text-accent-foreground outline-none",
                                formData.couponId === coupon._id && "bg-accent text-accent-foreground"
                              )}
                            >
                              {getCouponDisplayText(coupon)}
                            </button>
                          ))
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            {formData.couponCode && (
              <p className="text-xs text-muted-foreground">
                Selected coupon: <span className="font-mono font-semibold">{formData.couponCode}</span>
              </p>
            )}
          </div>

          {/* Order */}
          <div className="space-y-2">
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: Number(e.target.value) })
              }
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first in the carousel
            </p>
          </div>

          {/* Valid From and Valid Till */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Valid From (optional)</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) =>
                  setFormData({ ...formData, validFrom: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validTill">Valid Till (optional)</Label>
              <Input
                id="validTill"
                type="date"
                value={formData.validTill}
                onChange={(e) =>
                  setFormData({ ...formData, validTill: e.target.value })
                }
              />
            </div>
          </div>

          {/* Active Toggle */}
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

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Sale" : "Create Sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
