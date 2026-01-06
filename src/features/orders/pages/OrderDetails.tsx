import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CardSkeleton } from "@/shared/components/skeletons/CardSkeleton";
import { TableSkeleton } from "@/shared/components/skeletons/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminOrderDetails, AdminOrderDetails } from "@/features/orders/hooks/useAdminOrderDetails";
import { formatCurrency } from "@/shared/utils/currency";
import { useUpdateOrderStatus, useUpdateOrderTracking, getOrderStatusErrorMessage } from "@/features/orders/hooks/useAdminOrderStatusMutation";
import { toast } from "@/shared/utils/toast";

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, isError, error } = useAdminOrderDetails(orderId || '');
  
  // Status mutation hooks
  const updateStatusMutation = useUpdateOrderStatus();
  const updateTrackingMutation = useUpdateOrderTracking();
  
  // State for tracking form (PAID → SHIPPED)
  const [courier, setCourier] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [trackingError, setTrackingError] = useState('');
  
  // State for delivery confirmation dialog
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get customer name
  const getCustomerName = (order: AdminOrderDetails) => {
    if (order.userId?.name) {
      return order.userId.name;
    }
    if (order.guestEmail) {
      return order.guestEmail;
    }
    return "Guest";
  };

  // Get customer email
  const getCustomerEmail = (order: AdminOrderDetails) => {
    if (order.userId?.email) {
      return order.userId.email;
    }
    if (order.guestEmail) {
      return order.guestEmail;
    }
    return "N/A";
  };

  // Get customer phone
  const getCustomerPhone = (order: AdminOrderDetails) => {
    if (order.userId?.phone) {
      return order.userId.phone;
    }
    if (order.guestPhone) {
      return order.guestPhone;
    }
    return "N/A";
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: AdminOrderDetails['status']) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'SHIPPED':
        return 'default';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'destructive';
      case 'REFUNDED':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get payment status badge variant
  const getPaymentStatusBadgeVariant = (paymentStatus?: string) => {
    if (!paymentStatus) return 'default';
    const status = paymentStatus.toLowerCase();
    if (status === 'paid' || status === 'success') return 'success';
    if (status === 'failed') return 'destructive';
    return 'warning';
  };

  // Get refund status badge variant
  const getRefundStatusBadgeVariant = (refundStatus?: string | null) => {
    if (!refundStatus) return 'default';
    switch (refundStatus) {
      case 'PENDING':
        return 'warning';
      case 'PROCESSING':
        return 'default';
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Format payment status
  const formatPaymentStatus = (paymentStatus?: string) => {
    if (!paymentStatus) return 'N/A';
    return paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1).toLowerCase();
  };

  // Format payment method
  const formatPaymentMethod = (method?: string) => {
    if (!method) return 'N/A';
    return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
  };

  // Format address
  const formatAddress = (address?: AdminOrderDetails['shippingAddress']) => {
    if (!address) return 'N/A';
    const parts: string[] = [];
    if (address.line1) parts.push(address.line1);
    if (address.line2) parts.push(address.line2);
    const cityState = [address.city, address.state].filter(Boolean).join(', ');
    if (cityState) parts.push(cityState);
    if (address.pincode) parts.push(address.pincode);
    if (address.country) parts.push(address.country);
    return parts.length > 0 ? parts.join('\n') : 'N/A';
  };

  // Handle Mark as Shipped (PAID → SHIPPED)
  const handleMarkAsShipped = async () => {
    if (!orderId || !order) return;
    
    // Reset errors
    setTrackingError('');
    
    // Validate tracking fields
    if (!courier.trim()) {
      setTrackingError('Courier name is required');
      return;
    }
    if (!trackingId.trim()) {
      setTrackingError('Tracking ID is required');
      return;
    }
    
    try {
      // First, update status to SHIPPED
      await updateStatusMutation.mutateAsync({
        orderId,
        data: { status: 'SHIPPED' },
      });
      
      // Then, update tracking information
      await updateTrackingMutation.mutateAsync({
        orderId,
        data: {
          courier: courier.trim(),
          trackingId: trackingId.trim(),
          trackingUrl: trackingUrl.trim() || undefined,
        },
      });
      
      // Clear form
      setCourier('');
      setTrackingId('');
      setTrackingUrl('');
      toast.success('Order marked as shipped successfully');
    } catch (err) {
      toast.error(getOrderStatusErrorMessage(err));
    }
  };

  // Handle Mark as Delivered (SHIPPED → DELIVERED)
  const handleMarkAsDelivered = async () => {
    if (!orderId) return;
    
    
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        data: { status: 'DELIVERED' },
      });
      
      setShowDeliveryDialog(false);
      toast.success('Order marked as delivered successfully');
    } catch (err) {
      toast.error(getOrderStatusErrorMessage(err));
      setShowDeliveryDialog(false);
    }
  };
  
  // Check if actions should be shown
  const showActions = order && (order.status === 'PAID' || order.status === 'SHIPPED');
  const isPaid = order?.status === 'PAID';
  const isShipped = order?.status === 'SHIPPED';
  const isProcessing = updateStatusMutation.isPending || updateTrackingMutation.isPending;


  if (isError || !order) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        {/* Error State */}
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-destructive text-lg font-medium mb-2">
              Order not found
            </p>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'The order you are looking for does not exist.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <nav className="text-sm text-muted-foreground mb-2">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span>Orders</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">Order Details</span>
          </nav>
          <h1 className="text-3xl font-semibold">Order Details</h1>
          <p className="text-muted-foreground mt-1">
            {order.orderNumber || order._id}
          </p>
        </div>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-medium">{order.orderNumber || order._id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Status</p>
              <Badge variant={getStatusBadgeVariant(order.status)} className="mt-1">
                {order.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <Badge variant={getPaymentStatusBadgeVariant(order.payment?.status)} className="mt-1">
                {formatPaymentStatus(order.payment?.status)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created Date</p>
              <p className="font-medium">{formatDate(order.createdAt)}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(order.grandTotal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Details */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{getCustomerName(order)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{getCustomerEmail(order)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{getCustomerPhone(order)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {order.shippingAddress?.name && (
              <p className="font-medium">{order.shippingAddress.name}</p>
            )}
            <p className="text-muted-foreground whitespace-pre-line">
              {formatAddress(order.shippingAddress)}
            </p>
            {order.shippingAddress?.phone && (
              <p className="text-muted-foreground">
                Phone: {order.shippingAddress.phone}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          {order.items && order.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">PRODUCT</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">QUANTITY</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">UNIT PRICE</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr
                      key={item._id || index}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-12 h-12 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/60";
                              }}
                            />
                          )}
                          <div>
                            <p className="font-medium text-sm">{item.title}</p>
                            {item.variantSku && (
                              <p className="text-xs text-muted-foreground">SKU: {item.variantSku}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">{item.qty}</td>
                      <td className="px-4 py-4 text-sm">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-4 text-sm font-medium">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td colSpan={3} className="px-4 py-4 text-right font-medium">
                      Subtotal:
                    </td>
                    <td className="px-4 py-4 font-medium">
                      {formatCurrency(order.subTotal)}
                    </td>
                  </tr>
                  {order.shippingFee > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-right text-sm text-muted-foreground">
                        Shipping:
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {formatCurrency(order.shippingFee)}
                      </td>
                    </tr>
                  )}
                  {order.discount > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-right text-sm text-muted-foreground">
                        Discount:
                      </td>
                      <td className="px-4 py-4 text-sm text-green-600">
                        -{formatCurrency(order.discount)}
                      </td>
                    </tr>
                  )}
                  {order.tax > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-right text-sm text-muted-foreground">
                        Tax:
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {formatCurrency(order.tax)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-border">
                    <td colSpan={3} className="px-4 py-4 text-right font-bold">
                      Total:
                    </td>
                    <td className="px-4 py-4 font-bold text-lg">
                      {formatCurrency(order.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No items found in this order.</p>
          )}
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium">{formatPaymentMethod(order.payment?.method)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <Badge variant={getPaymentStatusBadgeVariant(order.payment?.status)} className="mt-1">
                {formatPaymentStatus(order.payment?.status)}
              </Badge>
            </div>
            {order.razorpayOrderId && (
              <div>
                <p className="text-sm text-muted-foreground">Razorpay Order ID</p>
                <p className="font-medium font-mono text-sm">{order.razorpayOrderId}</p>
              </div>
            )}
            {order.razorpayPaymentId && (
              <div>
                <p className="text-sm text-muted-foreground">Razorpay Payment ID</p>
                <p className="font-medium font-mono text-sm">{order.razorpayPaymentId}</p>
              </div>
            )}
            {order.paidAt && (
              <div>
                <p className="text-sm text-muted-foreground">Paid At</p>
                <p className="font-medium">{formatDate(order.paidAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Actions */}
      {showActions && (
        <Card>
          <CardHeader>
            <CardTitle>Order Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {/* PAID → SHIPPED Form */}
            {isPaid && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="courier">Courier Name *</Label>
                  <Input
                    id="courier"
                    value={courier}
                    onChange={(e) => {
                      setCourier(e.target.value);
                      setTrackingError('');
                    }}
                    placeholder="e.g., FedEx, DHL, India Post"
                    disabled={isProcessing}
                    className={trackingError && !courier.trim() ? 'border-destructive' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="trackingId">Tracking ID *</Label>
                  <Input
                    id="trackingId"
                    value={trackingId}
                    onChange={(e) => {
                      setTrackingId(e.target.value);
                      setTrackingError('');
                    }}
                    placeholder="Enter tracking number"
                    disabled={isProcessing}
                    className={trackingError && !trackingId.trim() ? 'border-destructive' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="trackingUrl">Tracking URL (Optional)</Label>
                  <Input
                    id="trackingUrl"
                    type="url"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://tracking.example.com/..."
                    disabled={isProcessing}
                  />
                </div>
                {trackingError && (
                  <p className="text-sm text-destructive">{trackingError}</p>
                )}
                <Button
                  onClick={handleMarkAsShipped}
                  disabled={isProcessing}
                  className="w-full sm:w-auto"
                >
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mark as Shipped
                </Button>
              </div>
            )}

            {/* SHIPPED → DELIVERED Button */}
            {isShipped && (
              <div>
                <Button
                  onClick={() => setShowDeliveryDialog(true)}
                  disabled={isProcessing}
                  className="w-full sm:w-auto"
                >
                  Mark as Delivered
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Refund Information */}
      {(order.refundStatus || order.status === 'REFUNDED' || order.status === 'CANCELLED') && (
        <Card>
          <CardHeader>
            <CardTitle>Refund Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.refundStatus && (
                <div>
                  <p className="text-sm text-muted-foreground">Refund Status</p>
                  <Badge variant={getRefundStatusBadgeVariant(order.refundStatus)} className="mt-1">
                    {order.refundStatus}
                  </Badge>
                </div>
              )}
              {order.payment?.amount && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Amount</p>
                  <p className="font-medium">{formatCurrency(order.payment.amount)}</p>
                </div>
              )}
              {order.payment?.method && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{formatPaymentMethod(order.payment.method)}</p>
                </div>
              )}
              {order.cancelledAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Order Cancelled At</p>
                  <p className="font-medium">{formatDate(order.cancelledAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Confirmation Dialog */}
      <AlertDialog open={showDeliveryDialog} onOpenChange={(open) => !open && !isProcessing && setShowDeliveryDialog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Order as Delivered</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this order as delivered? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsDelivered}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark as Delivered
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

