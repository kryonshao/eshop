import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, Check, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddressForm from "@/components/settings/AddressForm";
import { CryptoPayment } from "@/components/payment/CryptoPayment";
import { inventoryService } from "@/services/inventory/InventoryService";
import { skuService } from "@/services/inventory/SKUService";

interface Address {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  country: string;
  province: string;
  city: string;
  district: string | null;
  street_address: string;
  postal_code: string | null;
  is_default: boolean;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [guestAddress, setGuestAddress] = useState<Omit<Address, "id" | "is_default">>({
    label: "默认地址",
    recipient_name: "",
    phone: "",
    country: "中国",
    province: "",
    city: "",
    district: null,
    street_address: "",
    postal_code: null,
  });

  useEffect(() => {
    if (items.length === 0) {
      toast.error("购物车是空的");
      navigate("/");
      return;
    }

    if (user) {
      loadAddresses();
    } else {
      setLoading(false);
    }
  }, [user, items.length, navigate]);

  const loadAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAddresses(data || []);
      
      // Auto-select default address or first one
      if (data && data.length > 0) {
        const defaultAddr = data.find((a) => a.is_default) || data[0];
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
      toast.error("加载地址失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (data: Omit<Address, "id">) => {
    if (user) {
      try {
        if (editingAddress) {
          const { error } = await supabase
            .from("addresses")
            .update(data)
            .eq("id", editingAddress.id);

          if (error) throw error;
          toast.success("地址已更新");
        } else {
          const { data: newAddr, error } = await supabase
            .from("addresses")
            .insert({ ...data, user_id: user.id })
            .select()
            .single();

          if (error) throw error;
          toast.success("地址已添加");
          
          // Auto-select the new address
          if (newAddr) {
            setSelectedAddressId(newAddr.id);
          }
        }

        await loadAddresses();
        setShowAddressForm(false);
        setEditingAddress(null);
      } catch (error) {
        console.error("Error saving address:", error);
        toast.error("保存地址失败");
      }
    } else {
      // 访客模式：直接保存到状态
      setGuestAddress(data);
      setShowAddressForm(false);
      setEditingAddress(null);
      toast.success("地址已添加");
    }
  };

  const handleSubmitOrder = async () => {
    // 验证地址
    let selectedAddress;
    if (user) {
      if (!selectedAddressId) {
        toast.error("请选择收货地址");
        return;
      }
      selectedAddress = addresses.find((a) => a.id === selectedAddressId);
      if (!selectedAddress) {
        toast.error("地址无效");
        return;
      }
    } else {
      // 访客模式地址验证
      if (!guestAddress.recipient_name || !guestAddress.phone || !guestAddress.street_address) {
        toast.error("请填写完整的收货地址信息");
        setShowAddressForm(true);
        return;
      }
      if (!guestEmail) {
        toast.error("请填写邮箱");
        return;
      }
      selectedAddress = { ...guestAddress, id: "guest" };
    }

    setSubmitting(true);

    try {
      // Step 1: Check stock availability for all items
      const stockChecks = await Promise.all(
        items.map(async (item) => {
          const attributes = [];
          if (item.selectedSize) attributes.push({ name: "尺码", value: item.selectedSize });
          if (item.selectedColor) attributes.push({ name: "颜色", value: item.selectedColor });

          let skuId = item.skuId;
          if (!skuId) {
            const sku = await skuService.findSKUByAttributes(item.id, attributes);
            skuId = sku?.id;
          }

          if (!skuId) {
            return { success: false, item: item.name, reason: "SKU不存在" };
          }

          const hasStock = await inventoryService.checkStock(skuId, item.quantity);
          if (!hasStock) {
            return { success: false, item: item.name, reason: "库存不足" };
          }

          return { success: true, skuId, quantity: item.quantity };
        })
      );

      // Check if any stock check failed
      const failedCheck = stockChecks.find((check) => !check.success);
      if (failedCheck) {
        toast.error(`${failedCheck.item} ${failedCheck.reason}`);
        setSubmitting(false);
        return;
      }

      // Step 2: Get or generate guest ID
      let guestId;
      if (!user) {
        guestId = localStorage.getItem("guest_id");
        if (!guestId) {
          guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem("guest_id", guestId);
        }
      }

      // Step 3: Create order
      const dueAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null, // 访客用户ID为null
          guest_id: guestId || null, // 访客ID
          guest_email: user ? null : guestEmail,
          total_amount: Math.max(0, totalPrice - discountAmount + shippingFee + taxAmount),
          coupon_code: couponCode ? couponCode.toUpperCase() : null,
          discount_amount: discountAmount,
          payment_due_at: dueAt,
          status_updated_at: new Date().toISOString(),
          shipping_address: {
            recipient_name: selectedAddress.recipient_name,
            phone: selectedAddress.phone,
            country: selectedAddress.country,
            province: selectedAddress.province,
            city: selectedAddress.city,
            district: selectedAddress.district,
            street_address: selectedAddress.street_address,
            postal_code: selectedAddress.postal_code,
          },
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Step 3: Reserve stock for all items
      const reservationResults = await Promise.all(
        stockChecks.map((check) => {
          if (check.success && check.skuId) {
            return inventoryService.reserveStock(check.skuId, check.quantity, order.id);
          }
          return Promise.resolve(false);
        })
      );

      if (reservationResults.some((result) => !result)) {
        // If stock reservation fails, delete the order
        await supabase.from("orders").delete().eq("id", order.id);
        throw new Error("库存预留失败，订单已取消");
      }

      // Step 4: Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        price: item.price,
        size: item.selectedSize,
        color: item.selectedColor,
        sku_id: item.skuId || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Step 5: Create initial tracking entry
      await supabase.from("order_tracking").insert({
        order_id: order.id,
        status: "pending",
        description: "订单已创建，等待支付",
      });

      // Step 6: record coupon redemption
      if (discountAmount > 0 && couponCode) {
        const { data: couponRow } = await supabase
          .from("coupons" as any)
          .select("id")
          .eq("code", couponCode.toUpperCase())
          .maybeSingle();

        await supabase.from("coupon_redemptions" as any).insert({
          coupon_id: (couponRow as any)?.id,
          order_id: order.id,
          user_id: user?.id || null,
          guest_email: user ? null : guestEmail,
          discount_amount: discountAmount,
        });
      }

      // Show payment interface
      setCreatedOrderId(order.id);
      setShowPayment(true);
      toast.success("订单创建成功，请完成支付");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error instanceof Error ? error.message : "订单创建失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showAddressForm) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <AddressForm
          address={editingAddress}
          onSubmit={handleAddressSubmit}
          onCancel={() => {
            setShowAddressForm(false);
            setEditingAddress(null);
          }}
        />
      </div>
    );
  }

  if (showPayment && createdOrderId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/orders")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          查看订单
        </Button>

        <h1 className="font-display text-2xl md:text-3xl font-semibold mb-8">
          完成支付
        </h1>

        <CryptoPayment
          orderId={createdOrderId}
          amountUSD={Math.max(0, totalPrice - discountAmount + shippingFee + taxAmount)}
          customerId={user?.id || "guest"}
          onSuccess={async () => {
            await clearCart();
            toast.success("支付成功！");
            navigate("/orders");
          }}
          onCancel={() => {
            setShowPayment(false);
            navigate("/orders");
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      <h1 className="font-display text-2xl md:text-3xl font-semibold mb-8">
        确认订单
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Address & Items */}
        <div className="lg:col-span-2 space-y-6">
          {!user && (
            <Card>
              <CardHeader>
                <CardTitle>联系邮箱</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="guest-email">邮箱</Label>
                <Input
                  id="guest-email"
                  type="email"
                  placeholder="用于接收订单信息"
                  value={guestEmail}
                  onChange={(event) => setGuestEmail(event.target.value)}
                />
              </CardContent>
            </Card>
          )}
          {/* Address Selection */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                收货地址
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingAddress(null);
                  setShowAddressForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加地址
              </Button>
            </CardHeader>
            <CardContent>
              {user ? (
                addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-4">暂无收货地址</p>
                    <Button
                      onClick={() => setShowAddressForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      添加新地址
                    </Button>
                  </div>
                ) : (
                  <RadioGroup
                    value={selectedAddressId}
                    onValueChange={setSelectedAddressId}
                    className="space-y-3"
                  >
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`relative flex items-start gap-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                          selectedAddressId === address.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedAddressId(address.id)}
                      >
                        <RadioGroupItem
                          value={address.id}
                          id={address.id}
                          className="mt-1"
                        />
                        <Label
                          htmlFor={address.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {address.recipient_name}
                            </span>
                            <span className="text-muted-foreground">
                              {address.phone}
                            </span>
                            {address.is_default && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                默认
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {address.province} {address.city}{" "}
                            {address.district || ""} {address.street_address}
                          </p>
                        </Label>
                        {selectedAddressId === address.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                )
              ) : (
                // 访客模式地址展示
                guestAddress.recipient_name ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border bg-primary/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{guestAddress.recipient_name}</span>
                        <span className="text-muted-foreground">{guestAddress.phone}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {guestAddress.province} {guestAddress.city}{" "}
                        {guestAddress.district || ""} {guestAddress.street_address}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAddressForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      修改地址
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-4">暂无收货地址</p>
                    <Button
                      onClick={() => setShowAddressForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      添加新地址
                    </Button>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Coupon */}
          <Card>
            <CardHeader>
              <CardTitle>优惠码</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                <Input
                  placeholder="输入优惠码"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!couponCode.trim()) {
                      toast.error("请输入优惠码");
                      return;
                    }
                    setCouponLoading(true);
                    try {
                      const { data: coupon, error } = await supabase
                        .from("coupons" as any)
                        .select("*")
                        .eq("code", couponCode.trim().toUpperCase())
                        .eq("is_active", true)
                        .maybeSingle();

                      const couponRow = coupon as any;
                      if (error || !couponRow) {
                        toast.error("优惠码不可用");
                        setDiscountAmount(0);
                        return;
                      }

                      if (couponRow.min_order_amount && totalPrice < couponRow.min_order_amount) {
                        toast.error("订单金额未满足最低使用门槛");
                        setDiscountAmount(0);
                        return;
                      }

                      const discount =
                        couponRow.discount_type === "percentage"
                          ? Math.min(totalPrice, totalPrice * (Number(couponRow.discount_value) / 100))
                          : Math.min(totalPrice, Number(couponRow.discount_value));

                      setDiscountAmount(Number(discount.toFixed(2)));
                      toast.success("优惠码已应用");
                    } catch (err) {
                      console.error(err);
                      toast.error("优惠码校验失败");
                    } finally {
                      setCouponLoading(false);
                    }
                  }}
                  disabled={couponLoading}
                >
                  {couponLoading ? "校验中..." : "应用"}
                </Button>
              </div>
              {discountAmount > 0 && (
                <p className="text-sm text-muted-foreground">
                  已优惠 ¥{discountAmount.toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                商品清单
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                  className="flex gap-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-24 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.selectedColor} / {item.selectedSize}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        x{item.quantity}
                      </span>
                      <span className="font-semibold">
                        ¥{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>订单摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">商品小计</span>
                <span>¥{totalPrice.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">优惠</span>
                  <span className="text-green-600">-¥{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">运费</span>
                <span>¥{shippingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">税费</span>
                <span>¥{taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>订单总计</span>
                <span className="text-primary">
                  ¥{Math.max(0, totalPrice - discountAmount + shippingFee + taxAmount).toFixed(2)}
                </span>
              </div>

              <Button
                variant="hero"
                className="w-full mt-4"
                size="lg"
                onClick={handleSubmitOrder}
                disabled={submitting || (user ? !selectedAddressId : !guestAddress.recipient_name)}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  "提交订单"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                点击"提交订单"即表示您同意我们的服务条款
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
