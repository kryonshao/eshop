import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ReviewButton from "@/components/reviews/ReviewButton";
import { supabase } from "@/integrations/supabase/client";
import { inventoryService } from "@/services/inventory/InventoryService";
import { skuService } from "@/services/inventory/SKUService";
import { toast } from "sonner";
import { useState } from "react";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  CreditCard,
  Phone,
  User,
  Loader2,
} from "lucide-react";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
}

interface OrderTracking {
  id: string;
  status: string;
  description: string;
  location: string | null;
  carrier?: string | null;
  tracking_number?: string | null;
  created_at: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  shipping_address: {
    recipient_name: string;
    phone: string;
    province: string;
    city: string;
    district?: string;
    street_address: string;
  };
  created_at: string;
  order_items: OrderItem[];
  order_tracking: OrderTracking[];
}

interface OrderDetailProps {
  order: Order;
  onBack: () => void;
}

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "待付款", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-5 w-5" /> },
  paid: { label: "已付款", color: "bg-blue-100 text-blue-800", icon: <CreditCard className="h-5 w-5" /> },
  shipped: { label: "已发货", color: "bg-purple-100 text-purple-800", icon: <Truck className="h-5 w-5" /> },
  delivered: { label: "已送达", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-5 w-5" /> },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-800", icon: <Package className="h-5 w-5" /> },
};

const OrderDetail = ({ order, onBack }: OrderDetailProps) => {
  const statusInfo = statusMap[order.status] || statusMap.pending;
  const [cancelling, setCancelling] = useState(false);

  const handleCancelOrder = async () => {
    if (!confirm("确定要取消订单吗？")) {
      return;
    }

    setCancelling(true);

    try {
      // Step 1: Release reserved stock for all items
      for (const item of order.order_items) {
        try {
          const attributes = [];
          if (item.size) attributes.push({ name: "尺码", value: item.size });
          if (item.color) attributes.push({ name: "颜色", value: item.color });

          const sku = await skuService.findSKUByAttributes(item.product_id, attributes);
          
          if (sku) {
            await inventoryService.releaseStock(sku.id, item.quantity, order.id);
          }
        } catch (stockError) {
          console.error("Error releasing stock:", stockError);
          // Continue with other items even if one fails
        }
      }

      // Step 2: Update order status
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (orderError) throw orderError;

      // Step 3: Create tracking entry
      await supabase.from("order_tracking").insert({
        order_id: order.id,
        status: "cancelled",
        description: "订单已取消",
      });

      toast.success("订单已取消");
      
      // Refresh the page or go back
      setTimeout(() => {
        onBack();
      }, 1000);
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("取消订单失败，请重试");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回订单列表
        </Button>

        {/* Order Status */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${statusInfo.color}`}>
                {statusInfo.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold">{statusInfo.label}</h2>
                <p className="text-sm text-muted-foreground">
                  订单号: {order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  下单时间: {new Date(order.created_at).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Timeline */}
        {order.order_tracking.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                物流追踪
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {order.order_tracking.map((tracking, index) => (
                  <div key={tracking.id} className="flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0 ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                      />
                      {index < order.order_tracking.length - 1 && (
                        <div className="w-0.5 h-full bg-muted-foreground/30 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 -mt-1">
                        <p
                          className={`font-medium ${
                            index === 0 ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {tracking.description}
                        </p>
                        {(tracking.carrier || tracking.tracking_number) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {tracking.carrier ? `${tracking.carrier}` : ""}
                            {tracking.carrier && tracking.tracking_number ? " · " : ""}
                            {tracking.tracking_number || ""}
                          </p>
                        )}
                      {tracking.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {tracking.location}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(tracking.created_at).toLocaleDateString("zh-CN", {
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shipping Address */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              收货地址
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.shipping_address.recipient_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.shipping_address.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>
                  {order.shipping_address.province}
                  {order.shipping_address.city}
                  {order.shipping_address.district || ""}
                  {order.shipping_address.street_address}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              商品清单
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.product_name}</h4>
                    <div className="flex gap-2 mt-1">
                      {item.color && (
                        <Badge variant="secondary" className="text-xs">
                          {item.color}
                        </Badge>
                      )}
                      {item.size && (
                        <Badge variant="secondary" className="text-xs">
                          {item.size}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary font-medium">
                        ¥{item.price.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">x{item.quantity}</span>
                        <ReviewButton
                          productId={item.product_id}
                          productName={item.product_name}
                          orderId={order.id}
                          orderStatus={order.status}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">商品小计</span>
                <span>¥{order.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">运费</span>
                <span>免运费</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>订单总计</span>
                <span className="text-primary text-lg">¥{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {order.status === "pending" && (
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleCancelOrder}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  取消中...
                </>
              ) : (
                "取消订单"
              )}
            </Button>
            <Button className="flex-1">
              立即付款
            </Button>
          </div>
        )}

        {order.status === "delivered" && (
          <Button className="w-full">
            再次购买
          </Button>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrderDetail;
