import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, Check, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddressForm from "@/components/settings/AddressForm";

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

  useEffect(() => {
    if (!user) {
      toast.error("请先登录");
      navigate("/");
      return;
    }

    if (items.length === 0) {
      toast.error("购物车是空的");
      navigate("/");
      return;
    }

    loadAddresses();
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
    if (!user) return;

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
  };

  const handleSubmitOrder = async () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }

    if (!selectedAddressId) {
      toast.error("请选择收货地址");
      return;
    }

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddress) {
      toast.error("地址无效");
      return;
    }

    setSubmitting(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: totalPrice,
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

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        price: item.price,
        size: item.selectedSize,
        color: item.selectedColor,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create initial tracking entry
      await supabase.from("order_tracking").insert({
        order_id: order.id,
        status: "pending",
        description: "订单已创建，等待支付",
      });

      // Clear cart
      await clearCart();

      toast.success("订单提交成功！");
      navigate("/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("订单创建失败，请重试");
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
              {addresses.length === 0 ? (
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">运费</span>
                <span className="text-accent">免运费</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>订单总计</span>
                <span className="text-primary">¥{totalPrice.toFixed(2)}</span>
              </div>

              <Button
                variant="hero"
                className="w-full mt-4"
                size="lg"
                onClick={handleSubmitOrder}
                disabled={submitting || !selectedAddressId}
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
