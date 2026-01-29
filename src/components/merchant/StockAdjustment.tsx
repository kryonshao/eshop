import { useState, useEffect } from "react";
import { Loader2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { inventoryService } from "@/services/inventory/InventoryService";
import type { SKU, StockInfo } from "@/types/inventory";

interface StockAdjustmentProps {
  sku: SKU;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StockAdjustment({ sku, onSuccess, onCancel }: StockAdjustmentProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [currentStock, setCurrentStock] = useState<StockInfo | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">("increase");
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchCurrentStock();
    }
  }, [selectedWarehouse]);

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses' as any)
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;

      const warehouseList = (data || []) as unknown as Array<{ id: string; name: string }>;
      setWarehouses(warehouseList);
      if (warehouseList.length > 0) {
        setSelectedWarehouse(warehouseList[0].id);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      toast({
        title: "错误",
        description: "获取仓库列表失败",
        variant: "destructive",
      });
    }
  };

  const fetchCurrentStock = async () => {
    try {
      const stock = await inventoryService.getStockInfo(sku.id, selectedWarehouse);
      setCurrentStock(stock);
    } catch (error) {
      console.error("Error fetching stock info:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWarehouse) {
      toast({
        title: "错误",
        description: "请选择仓库",
        variant: "destructive",
      });
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      toast({
        title: "错误",
        description: "请输入有效的调整数量",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "错误",
        description: "请输入调整原因",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const adjustmentQuantity = adjustmentType === "increase" 
        ? Number(quantity) 
        : -Number(quantity);

      await inventoryService.updateStock(
        sku.id,
        adjustmentQuantity,
        reason,
        selectedWarehouse
      );

      toast({
        title: "成功",
        description: "库存调整成功",
      });

      onSuccess();
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast({
        title: "错误",
        description: "库存调整失败，请重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getNewStock = () => {
    if (!currentStock || !quantity) return null;
    const adjustmentQuantity = adjustmentType === "increase" 
      ? Number(quantity) 
      : -Number(quantity);
    return Math.max(0, currentStock.available + adjustmentQuantity);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SKU Info */}
      <div className="bg-secondary/50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">SKU 代码:</span>
            <p className="font-mono font-semibold">{sku.skuCode}</p>
          </div>
          <div>
            <span className="text-muted-foreground">价格:</span>
            <p className="font-semibold">¥{sku.price}</p>
          </div>
        </div>
        {sku.attributes.length > 0 && (
          <div className="mt-2">
            <span className="text-muted-foreground text-sm">变体属性:</span>
            <div className="flex gap-2 mt-1">
              {sku.attributes.map((attr, index) => (
                <span key={index} className="text-sm bg-background px-2 py-1 rounded">
                  {attr.name}: {attr.value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Warehouse Selection */}
      <div className="space-y-2">
        <Label htmlFor="warehouse">仓库</Label>
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger id="warehouse">
            <SelectValue placeholder="选择仓库" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current Stock Display */}
      {currentStock && (
        <div className="bg-secondary/50 p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">可用库存</p>
              <p className="text-2xl font-bold">{currentStock.available}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">预留库存</p>
              <p className="text-2xl font-bold text-muted-foreground">{currentStock.reserved}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">总库存</p>
              <p className="text-2xl font-bold">{currentStock.total}</p>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Type */}
      <div className="space-y-2">
        <Label>调整类型</Label>
        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant={adjustmentType === "increase" ? "default" : "outline"}
            onClick={() => setAdjustmentType("increase")}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            增加库存
          </Button>
          <Button
            type="button"
            variant={adjustmentType === "decrease" ? "default" : "outline"}
            onClick={() => setAdjustmentType("decrease")}
            className="w-full"
          >
            <Minus className="mr-2 h-4 w-4" />
            减少库存
          </Button>
        </div>
      </div>

      {/* Quantity Input */}
      <div className="space-y-2">
        <Label htmlFor="quantity">调整数量</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="输入调整数量"
        />
      </div>

      {/* New Stock Preview */}
      {getNewStock() !== null && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">调整后库存:</span>
            <span className="text-2xl font-bold">{getNewStock()}</span>
          </div>
        </div>
      )}

      {/* Reason Input */}
      <div className="space-y-2">
        <Label htmlFor="reason">调整原因</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="请输入调整原因（例如：盘点调整、损坏报废、补货入库等）"
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          确认调整
        </Button>
      </div>
    </form>
  );
}
