import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, Package, TrendingUp } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { inventoryService } from "@/services/inventory/InventoryService";
import type { SKU } from "@/types/inventory";

interface AlertItem {
  sku: SKU;
  skuId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  warehouseId: string;
  warehouseName: string;
}

interface StockAlertsProps {
  onAdjustStock: (sku: SKU) => void;
}

export default function StockAlerts({ onAdjustStock }: StockAlertsProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      // Fetch low stock items
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory' as any)
        .select(`
          sku_id,
          warehouse_id,
          available,
          alert_threshold,
          warehouses (
            name
          ),
          skus (
            id,
            sku_code,
            product_id,
            attributes,
            price,
            image_url,
            is_active
          )
        `)
        .lte('available', 'alert_threshold')
        .eq('skus.is_active', true);

      if (inventoryError) throw inventoryError;

      const alertItems: AlertItem[] = (inventoryData || []).map((item: any) => {
        const skuData = item.skus;
        const sku: SKU = {
          id: skuData.id,
          productId: skuData.product_id,
          skuCode: skuData.sku_code,
          attributes: skuData.attributes || [],
          price: Number(skuData.price),
          imageUrl: skuData.image_url,
          isActive: skuData.is_active,
        };

        return {
          sku,
          skuId: item.sku_id,
          productName: `Product ${skuData.product_id.substring(0, 8)}`,
          currentStock: item.available,
          threshold: item.alert_threshold,
          warehouseId: item.warehouse_id,
          warehouseName: item.warehouses?.name || 'Unknown',
        };
      });

      setAlerts(alertItems);
    } catch (error) {
      console.error("Error fetching stock alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (currentStock: number, threshold: number) => {
    const percentage = (currentStock / threshold) * 100;
    
    if (currentStock === 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          缺货
        </Badge>
      );
    } else if (percentage <= 50) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          紧急
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          警告
        </Badge>
      );
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          库存预警
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-green-600 opacity-50" />
            <p className="text-lg font-semibold text-green-600">库存充足</p>
            <p className="text-sm text-muted-foreground mt-1">
              所有商品库存均在预警阈值以上
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                ⚠️ 发现 {alerts.length} 个 SKU 库存不足，请及时补货
              </p>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU 代码</TableHead>
                    <TableHead>商品名称</TableHead>
                    <TableHead>仓库</TableHead>
                    <TableHead className="text-right">当前库存</TableHead>
                    <TableHead className="text-right">预警阈值</TableHead>
                    <TableHead>紧急程度</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert, index) => (
                    <TableRow key={`${alert.skuId}-${alert.warehouseId}-${index}`}>
                      <TableCell className="font-mono text-sm">
                        {alert.sku.skuCode}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{alert.productName}</p>
                          {alert.sku.attributes.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {alert.sku.attributes.map((attr, i) => (
                                <span key={i} className="text-xs text-muted-foreground">
                                  {attr.name}: {attr.value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{alert.warehouseName}</TableCell>
                      <TableCell className="text-right">
                        <span className={alert.currentStock === 0 ? "text-destructive font-bold" : "font-semibold"}>
                          {alert.currentStock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {alert.threshold}
                      </TableCell>
                      <TableCell>
                        {getUrgencyBadge(alert.currentStock, alert.threshold)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onAdjustStock(alert.sku)}
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          补货
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
