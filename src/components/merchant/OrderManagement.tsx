import { useState, useEffect } from "react";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Search,
  Eye,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  user_id: string | null;
  guest_id: string | null;
  guest_email?: string | null;
  status: string;
  total_amount: number;
  shipping_address: any;
  created_at: string;
  items?: any[];
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "pending" | "paid" | "shipped" | "delivered" | "cancelled");
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("加载订单失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      const order = orders.find((o) => o.id === orderId);
      if (order) {
        setSelectedOrder({ ...order, items: items || [] });
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: "pending" | "paid" | "shipped" | "delivered" | "cancelled") => {
    try {
      const now = new Date().toISOString();
      if (newStatus === "shipped" && (!trackingCarrier || !trackingNumber)) {
        toast.error("请填写物流公司和运单号");
        return;
      }

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          status_updated_at: now,
          paid_at: newStatus === "paid" ? now : undefined,
          shipped_at: newStatus === "shipped" ? now : undefined,
          delivered_at: newStatus === "delivered" ? now : undefined,
          cancelled_at: newStatus === "cancelled" ? now : undefined,
        })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // Add tracking entry
      const trackingDescriptions: Record<string, string> = {
        paid: "订单已支付，准备发货",
        shipped: "订单已发货，正在运输中",
        delivered: "订单已送达",
        cancelled: "订单已取消",
      };

      await supabase.from("order_tracking").insert({
        order_id: orderId,
        status: newStatus,
        description: trackingDescriptions[newStatus] || `订单状态更新为 ${newStatus}`,
        carrier: newStatus === "shipped" ? trackingCarrier : null,
        tracking_number: newStatus === "shipped" ? trackingNumber : null,
      });

      toast.success("订单状态已更新");
      if (newStatus === "shipped") {
        setTrackingCarrier("");
        setTrackingNumber("");
      }
      fetchOrders();
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("更新失败");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "paid":
        return <CreditCard className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-accent/20 text-accent-foreground",
      cancelled: "bg-destructive/20 text-destructive",
    };

    const labels: Record<string, string> = {
      pending: "待付款",
      paid: "已付款",
      shipped: "已发货",
      delivered: "已送达",
      cancelled: "已取消",
    };

    return (
      <Badge className={styles[status] || "bg-muted"}>
        {getStatusIcon(status)}
        <span className="ml-1">{labels[status] || status}</span>
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索订单号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待付款</SelectItem>
            <SelectItem value="paid">已付款</SelectItem>
            <SelectItem value="shipped">已发货</SelectItem>
            <SelectItem value="delivered">已送达</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            订单列表
            <span className="text-sm font-normal text-muted-foreground">
              ({filteredOrders.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">加载中...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无订单</p>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-secondary/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        #{order.id.slice(0, 8)}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("zh-CN")}
                    </p>
                    <p className="text-sm mt-1">
                      收件人: {order.shipping_address?.recipient_name || "-"}
                    </p>
                    {order.guest_email && (
                      <p className="text-xs text-muted-foreground">邮箱: {order.guest_email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        ¥{Number(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchOrderDetails(order.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.status !== "delivered" &&
                        order.status !== "cancelled" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                操作
                                <ChevronDown className="h-4 w-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {order.status === "pending" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateOrderStatus(order.id, "paid")
                                  }
                                >
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  标记已付款
                                </DropdownMenuItem>
                              )}
                               {order.status === "paid" && (
                                 <DropdownMenuItem
                                   onClick={() =>
                                     updateOrderStatus(order.id, "shipped")
                                   }
                                 >
                                   <Truck className="h-4 w-4 mr-2" />
                                   标记已发货
                                 </DropdownMenuItem>
                               )}
                              {order.status === "shipped" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateOrderStatus(order.id, "delivered")
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  标记已送达
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  updateOrderStatus(order.id, "cancelled")
                                }
                                className="text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                取消订单
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              订单详情 #{selectedOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">订单状态</span>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {selectedOrder.guest_email && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">下单邮箱</span>
                  <span className="text-sm">{selectedOrder.guest_email}</span>
                </div>
              )}

              {/* Shipping Address */}
              <div>
                <h4 className="font-medium mb-2">收货地址</h4>
                <div className="p-4 bg-secondary rounded-lg text-sm">
                  <p className="font-medium">
                    {selectedOrder.shipping_address?.recipient_name}{" "}
                    {selectedOrder.shipping_address?.phone}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {selectedOrder.shipping_address?.province}{" "}
                    {selectedOrder.shipping_address?.city}{" "}
                    {selectedOrder.shipping_address?.district || ""}{" "}
                    {selectedOrder.shipping_address?.street_address}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2">商品列表</h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-3 bg-secondary rounded-lg"
                    >
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.color} / {item.size}
                        </p>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm">x{item.quantity}</span>
                          <span className="font-medium">
                            ¥{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-medium">订单总计</span>
                <span className="text-xl font-bold text-primary">
                  ¥{Number(selectedOrder.total_amount).toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              {selectedOrder.status !== "delivered" &&
                selectedOrder.status !== "cancelled" && (
                  <div className="flex gap-2 pt-4">
                    {selectedOrder.status === "pending" && (
                      <Button
                        onClick={() =>
                          updateOrderStatus(selectedOrder.id, "paid")
                        }
                        className="flex-1"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        标记已付款
                      </Button>
                    )}
                    {selectedOrder.status === "paid" && (
                      <div className="flex-1 space-y-2">
                        <div className="grid sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label>物流公司</Label>
                            <Input
                              value={trackingCarrier}
                              onChange={(e) => setTrackingCarrier(e.target.value)}
                              placeholder="例如 顺丰"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>运单号</Label>
                            <Input
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="请输入运单号"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() =>
                            updateOrderStatus(selectedOrder.id, "shipped")
                          }
                          className="w-full"
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          标记已发货
                        </Button>
                      </div>
                    )}
                    {selectedOrder.status === "shipped" && (
                      <Button
                        onClick={() =>
                          updateOrderStatus(selectedOrder.id, "delivered")
                        }
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        标记已送达
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() =>
                        updateOrderStatus(selectedOrder.id, "cancelled")
                      }
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      取消
                    </Button>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
