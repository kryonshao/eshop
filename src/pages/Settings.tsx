import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, MapPin, Loader2, Plus, Trash2, Star, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import AddressForm from "@/components/settings/AddressForm";

interface Profile {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

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

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({ full_name: "", phone: "", avatar_url: "" });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          avatar_url: profileData.avatar_url || "",
        });
      }

      // Load addresses
      const { data: addressData } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (addressData) {
        setAddresses(addressData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("个人信息已更新");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("地址已删除");
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("删除失败，请重试");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === id,
        }))
      );
      toast.success("已设为默认地址");
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error("操作失败，请重试");
    }
  };

  const handleAddressSubmit = async (addressData: Omit<Address, "id">) => {
    if (!user) return;

    try {
      if (editingAddress) {
        const { error } = await supabase
          .from("addresses")
          .update(addressData)
          .eq("id", editingAddress.id);

        if (error) throw error;
        toast.success("地址已更新");
      } else {
        const { error } = await supabase.from("addresses").insert({
          ...addressData,
          user_id: user.id,
        });

        if (error) throw error;
        toast.success("地址已添加");
      }

      setShowAddressForm(false);
      setEditingAddress(null);
      loadData();
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("保存失败，请重试");
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <User className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-display font-semibold mb-2">请先登录</h1>
        <p className="text-muted-foreground text-center mb-6">
          登录后即可管理您的账户设置
        </p>
        <Button asChild>
          <Link to="/">返回首页</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-display font-semibold mb-8">账户设置</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            个人信息
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            收货地址
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>个人信息</CardTitle>
              <CardDescription>更新您的个人资料信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" value={user.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">邮箱地址无法修改</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">姓名</Label>
                <Input
                  id="fullName"
                  value={profile.full_name || ""}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="请输入您的姓名"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">手机号码</Label>
                <Input
                  id="phone"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="请输入手机号码"
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                保存更改
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          {showAddressForm || editingAddress ? (
            <AddressForm
              address={editingAddress}
              onSubmit={handleAddressSubmit}
              onCancel={() => {
                setShowAddressForm(false);
                setEditingAddress(null);
              }}
            />
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>收货地址</CardTitle>
                  <CardDescription>管理您的收货地址</CardDescription>
                </div>
                <Button onClick={() => setShowAddressForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加地址
                </Button>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无收货地址</p>
                    <p className="text-sm">点击上方按钮添加新地址</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="border rounded-lg p-4 relative hover:border-accent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{address.recipient_name}</span>
                              <span className="text-muted-foreground">{address.phone}</span>
                              {address.is_default && (
                                <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
                                  默认
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {address.province} {address.city} {address.district || ""}{" "}
                              {address.street_address}
                            </p>
                            {address.postal_code && (
                              <p className="text-xs text-muted-foreground">
                                邮编: {address.postal_code}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!address.is_default && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetDefault(address.id)}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingAddress(address)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
