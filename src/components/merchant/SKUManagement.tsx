import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Package, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { skuService } from "@/services/inventory/SKUService";
import { inventoryService } from "@/services/inventory/InventoryService";
import type { SKU, StockInfo } from "@/types/inventory";
import SKUForm from "@/components/merchant/SKUForm";

interface SKUManagementProps {
  productId: string;
  productName: string;
}

export default function SKUManagement({ productId, productName }: SKUManagementProps) {
  const { toast } = useToast();
  const [skus, setSkus] = useState<SKU[]>([]);
  const [stockInfo, setStockInfo] = useState<Record<string, StockInfo>>({});
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSKU, setEditingSKU] = useState<SKU | null>(null);

  useEffect(() => {
    loadSKUs();
  }, [productId]);

  const loadSKUs = async () => {
    setLoading(true);
    try {
      const skuList = await skuService.getProductSKUs(productId);
      setSkus(skuList);

      // Load stock info for each SKU
      const stockMap: Record<string, StockInfo> = {};
      for (const sku of skuList) {
        const info = await inventoryService.getStockInfo(sku.id);
        if (info) {
          stockMap[sku.id] = info;
        }
      }
      setStockInfo(stockMap);
    } catch (error) {
      console.error("Error loading SKUs:", error);
      toast({
        title: "加载失败",
        description: "无法加载 SKU 列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSKU = () => {
    setEditingSKU(null);
    setFormOpen(true);
  };

  const handleEditSKU = (sku: SKU) => {
    setEditingSKU(sku);
    setFormOpen(true);
  };

  const handleDeleteSKU = async (skuId: string) => {
    if (!confirm("确定要删除这个 SKU 吗？")) return;

    try {
      await skuService.deleteSKU(skuId);
      toast({
        title: "删除成功",
        description: "SKU 已被删除",
      });
      loadSKUs();
    } catch (error) {
      console.error("Error deleting SKU:", error);
      toast({
        title: "删除失败",
        description: "无法删除 SKU",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingSKU(null);
    loadSKUs();
  };

  const formatAttributes = (attributes: any[]) => {
    if (!attributes || attributes.length === 0) return "-";
    return attributes.map((attr) => `${attr.name}: ${attr.value}`).join(", ");
  };

  const getStockBadge = (skuId: string) => {
    const info = stockInfo[skuId];
    if (!info) return <Badge variant="outline">-</Badge>;

    const total = info.available + info.reserved;
    if (total === 0) {
      return <Badge variant="destructive">缺货</Badge>;
    } else if (info.available <= info.alertThreshold) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">低库存</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-800">充足</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                SKU 管理
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                管理 "{productName}" 的商品变体
              </p>
            </div>
            <Button onClick={handleAddSKU}>
              <Plus className="mr-2 h-4 w-4" />
              添加 SKU
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {skus.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无 SKU</p>
              <p className="text-sm mt-2">点击"添加 SKU"创建商品变体</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU 代码</TableHead>
                    <TableHead>变体属性</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>库存状态</TableHead>
                    <TableHead>可用/预留</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skus.map((sku) => {
                    const info = stockInfo[sku.id];
                    return (
                      <TableRow key={sku.id}>
                        <TableCell className="font-mono text-sm">
                          {sku.skuCode}
                        </TableCell>
                        <TableCell>{formatAttributes(sku.attributes)}</TableCell>
                        <TableCell className="font-semibold">
                          ${sku.price.toFixed(2)}
                        </TableCell>
                        <TableCell>{getStockBadge(sku.id)}</TableCell>
                        <TableCell>
                          {info ? (
                            <span className="text-sm">
                              {info.available} / {info.reserved}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {sku.isActive ? (
                            <Badge variant="default">启用</Badge>
                          ) : (
                            <Badge variant="outline">禁用</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSKU(sku)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSKU(sku.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSKU ? "编辑 SKU" : "添加 SKU"}
            </DialogTitle>
            <DialogDescription>
              {editingSKU
                ? "更新 SKU 信息"
                : "为商品创建新的变体（如不同颜色、尺码等）"}
            </DialogDescription>
          </DialogHeader>
          <SKUForm
            productId={productId}
            sku={editingSKU}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
