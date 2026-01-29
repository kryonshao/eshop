import { useState, useEffect } from "react";
import { 
  Package, 
  MessageSquare, 
  TrendingUp, 
  Clock,
  CheckCircle,
  DollarSign,
  Users,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  pendingReviews: number;
  approvedReviews: number;
  averageRating: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch order stats
      const { data: orders } = await supabase
        .from("orders")
        .select("status, total_amount");

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter((o) => o.status === "pending").length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

      // Fetch review stats
      const { data: reviews } = await supabase
        .from("reviews")
        .select("status, rating");

      const pendingReviews = reviews?.filter((r) => r.status === "pending").length || 0;
      const approvedReviews = reviews?.filter((r) => r.status === "approved").length || 0;
      const avgRating = approvedReviews > 0
        ? reviews
            ?.filter((r) => r.status === "approved")
            .reduce((sum, r) => sum + r.rating, 0) / approvedReviews
        : 0;

      setStats({
        totalOrders,
        pendingOrders,
        totalRevenue,
        pendingReviews,
        approvedReviews,
        averageRating: avgRating,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentOrders(data || []);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "paid":
        return "text-blue-600 bg-blue-100";
      case "shipped":
        return "text-purple-600 bg-purple-100";
      case "delivered":
        return "text-accent bg-accent/10";
      case "cancelled":
        return "text-destructive bg-destructive/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "待付款";
      case "paid":
        return "已付款";
      case "shipped":
        return "已发货";
      case "delivered":
        return "已送达";
      case "cancelled":
        return "已取消";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总订单数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} 个待处理
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">所有订单总额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核评价</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedReviews} 条已通过
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均评分</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">基于已通过评价</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">最近订单</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              暂无订单
            </p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      订单 #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ¥{Number(order.total_amount).toFixed(2)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
