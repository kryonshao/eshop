import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Coupon = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
  is_active: boolean;
  created_at: string;
};

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCoupons((data || []) as unknown as Coupon[]);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("加载优惠券失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async () => {
    if (!code || !discountValue) {
      toast.error("请填写优惠码与折扣");
      return;
    }

    try {
      const { error } = await supabase.from("coupons" as any).insert({
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_amount: minOrderAmount ? Number(minOrderAmount) : null,
      });
      if (error) throw error;
      toast.success("优惠券已创建");
      setCode("");
      setDiscountValue("");
      setMinOrderAmount("");
      fetchCoupons();
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast.error("创建失败");
    }
  };

  const toggleCoupon = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from("coupons" as any)
        .update({ is_active: !coupon.is_active })
        .eq("id", coupon.id);
      if (error) throw error;
      fetchCoupons();
    } catch (error) {
      console.error("Error updating coupon:", error);
      toast.error("更新失败");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>优惠券管理</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>优惠码</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10" />
          </div>
          <div className="space-y-2">
            <Label>折扣类型</Label>
            <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percentage" | "fixed")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">百分比</SelectItem>
                <SelectItem value="fixed">固定金额</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>折扣值</Label>
            <Input value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "10" : "5"} />
          </div>
          <div className="space-y-2">
            <Label>最低订单金额</Label>
            <Input value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} placeholder="可选" />
          </div>
        </div>
        <Button onClick={handleCreate}>创建优惠券</Button>

        {loading ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无优惠券</p>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <p className="font-medium">{coupon.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `$${coupon.discount_value}`} / 最低订单 {coupon.min_order_amount ?? "-"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toggleCoupon(coupon)}>
                  {coupon.is_active ? "停用" : "启用"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
