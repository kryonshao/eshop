import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft } from "lucide-react";

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

interface AddressFormProps {
  address?: Address | null;
  onSubmit: (data: Omit<Address, "id">) => Promise<void>;
  onCancel: () => void;
}

export default function AddressForm({ address, onSubmit, onCancel }: AddressFormProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    label: address?.label || "默认地址",
    recipient_name: address?.recipient_name || "",
    phone: address?.phone || "",
    country: address?.country || "中国",
    province: address?.province || "",
    city: address?.city || "",
    district: address?.district || "",
    street_address: address?.street_address || "",
    postal_code: address?.postal_code || "",
    is_default: address?.is_default || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ...formData,
        district: formData.district || null,
        postal_code: formData.postal_code || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>{address ? "编辑地址" : "添加新地址"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipient_name">收件人姓名 *</Label>
              <Input
                id="recipient_name"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                placeholder="请输入收件人姓名"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">手机号码 *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入手机号码"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">国家/地区 *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="请输入国家/地区"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">省份 *</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="请输入省份"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">城市 *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="请输入城市"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">区/县</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="请输入区/县（可选）"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street_address">详细地址 *</Label>
            <Input
              id="street_address"
              value={formData.street_address}
              onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
              placeholder="请输入详细地址（街道、门牌号等）"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">邮政编码</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="请输入邮政编码（可选）"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">地址标签</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="如：家、公司"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_default: checked as boolean })
              }
            />
            <Label htmlFor="is_default" className="text-sm font-normal cursor-pointer">
              设为默认收货地址
            </Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              取消
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {address ? "保存修改" : "添加地址"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
