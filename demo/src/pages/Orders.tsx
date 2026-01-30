import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, MapPin, ChevronRight, ShoppingBag } from "lucide-react";
import OrderDetail from "@/components/orders/OrderDetail";

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

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "待付款", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "已付款", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "已发货", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "已送达", color: "bg-green-100 text-green-800" },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-800" },
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData) {
        const ordersWithDetails = await Promise.all(
          ordersData.map(async (order) => {
            const [itemsResult, trackingResult] = await Promise.all([
              supabase
                .from("order_items")
                .select("*")
                .eq("order_id", order.id),
              supabase
                .from("order_tracking")
                .select("*")
                .eq("order_id", order.id)
                .order("created_at", { ascending: false }),
            ]);

            return {
              ...order,
              shipping_address: order.shipping_address as Order["shipping_address"],
              order_items: itemsResult.data || [],
              order_tracking: trackingResult.data || [],
            };
          })
        );

        setOrders(ordersWithDetails);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    return order.status === activeTab;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">我的订单</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="pending">待付款</TabsTrigger>
            <TabsTrigger value="paid">已付款</TabsTrigger>
            <TabsTrigger value="shipped">已发货</TabsTrigger>
            <TabsTrigger value="delivered">已送达</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">暂无订单</h3>
                  <p className="text-muted-foreground mb-4">
                    您还没有任何订单记录
                  </p>
                  <Button onClick={() => navigate("/products")}>
                    去购物
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              订单号: {order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString("zh-CN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusMap[order.status]?.color || ""}>
                            {statusMap[order.status]?.label || order.status}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4">
                        <div className="flex -space-x-2">
                          {order.order_items.slice(0, 3).map((item, index) => (
                            <div
                              key={item.id}
                              className="w-16 h-16 rounded-lg border-2 border-background overflow-hidden"
                              style={{ zIndex: 3 - index }}
                            >
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          ))}
                          {order.order_items.length > 3 && (
                            <div className="w-16 h-16 rounded-lg border-2 border-background bg-muted flex items-center justify-center">
                              <span className="text-sm font-medium">
                                +{order.order_items.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            共 {order.order_items.reduce((sum, item) => sum + item.quantity, 0)} 件商品
                          </p>
                          <p className="text-lg font-bold text-primary">
                            ¥{order.total_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {order.status === "shipped" && order.order_tracking[0] && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-start gap-2">
                          <Truck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {order.order_tracking[0].description}
                            </p>
                            {order.order_tracking[0].location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {order.order_tracking[0].location}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Orders;
