import { useState, useEffect } from "react";
import { Package, AlertTriangle, Search, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { inventoryService } from "@/services/inventory/InventoryService";
import { skuService } from "@/services/inventory/SKUService";
import StockAdjustment from "./StockAdjustment";
import StockAlerts from "./StockAlerts";
import StockMovementHistory from "./StockMovementHistory";
import type { SKU, StockInfo } from "@/types/inventory";

interface InventoryItem {
  sku: SKU;
  stock: StockInfo;
  productName: string;
}

export default function InventoryManagement() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedSKU, setSelectedSKU] = useState<SKU | null>(null);
  const [activeTab, setActiveTab] = useState("inventory");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, warehouseFilter, inventoryItems]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch warehouses
      const { data: warehousesData, error: warehousesError } = await supabase
        .from('warehouses' as any)
        .select('id, name')
        .eq('is_active', true);

      if (warehousesError) throw warehousesError;
      setWarehouses(warehousesData || []);

      // Fetch all SKUs with inventory
      const { data: skusData, error: skusError } = await supabase
        .from('skus' as any)
        .select(`
          *,
          inventory (
            available,
            reserved,
            alert_threshold,
            warehouse_id
          )
        `)
        .eq('is_active', true);

      if (skusError) throw skusError;

      // Transform data
      const items: InventoryItem[] = [];
      for (const skuData of skusData || []) {
        const sku: SKU = {
          id: skuData.id,
          productId: skuData.product_id,
          skuCode: skuData.sku_code,
          attributes: skuData.attributes || [],
          price: Number(skuData.price),
          imageUrl: skuData.image_url,
          isActive: skuData.is_active,
        };

        // Get inventory for each warehouse
        if (skuData.inventory && Array.isArray(skuData.inventory)) {
          for (const inv of skuData.inventory) {
            const stock: StockInfo = {
              skuId: skuData.id,
              warehouseId: inv.warehouse_id,
              available: inv.available,
              reserved: inv.reserved,
              total: inv.available + inv.reserved,
              alertThreshold: inv.alert_threshold,
            };

            items.push({
              sku,
              stock,
              productName: `Product ${skuData.product_id.substring(0, 8)}`, // Would need to join with products table
            });
          }
        }
      }

      setInventoryItems(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...inventoryItems];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.sku.skuCode.toLowerCase().includes(query) ||
          item.productName.toLowerCase().includes(query)
      );
    }

    // Warehouse filter
    if (warehouseFilter !== "all") {
      filtered = filtered.filter((item) => item.stock.warehouseId === warehouseFilter);
    }

    setFilteredItems(filtered);
  };

  const openAdjustmentDialog = (sku: SKU) => {
    setSelectedSKU(sku);
    setAdjustmentDialogOpen(true);
  };

  const closeAdjustmentDialog = () => {
    setAdjustmentDialogOpen(false);
    setSelectedSKU(null);
    fetchData(); // Refresh data
  };

  const getAlertBadge = (stock: StockInfo) => {
    if (stock.available <= stock.alertThreshold) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          低库存
        </Badge>
      );
    }
    return <Badge variant="default">正常</Badge>;
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    return warehouse?.name || warehouseId.substring(0, 8);
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="inventory">库存列表</TabsTrigger>
          <TabsTrigger value="alerts">库存预警</TabsTrigger>
          <TabsTrigger value="history">变动历史</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                库存管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索 SKU 代码或商品名称..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="选择仓库" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有仓库</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Inventory Table */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无库存数据</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU 代码</TableHead>
                        <TableHead>商品名称</TableHead>
                        <TableHead>仓库</TableHead>
                        <TableHead className="text-right">可用库存</TableHead>
                        <TableHead className="text-right">预留库存</TableHead>
                        <TableHead className="text-right">总库存</TableHead>
                        <TableHead>预警状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item, index) => (
                        <TableRow key={`${item.sku.id}-${item.stock.warehouseId}-${index}`}>
                          <TableCell className="font-mono text-sm">
                            {item.sku.skuCode}
                          </TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{getWarehouseName(item.stock.warehouseId)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.stock.available}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {item.stock.reserved}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.stock.total}
                          </TableCell>
                          <TableCell>{getAlertBadge(item.stock)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAdjustmentDialog(item.sku)}
                            >
                              调整库存
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <StockAlerts onAdjustStock={openAdjustmentDialog} />
        </TabsContent>

        <TabsContent value="history">
          <StockMovementHistory />
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>调整库存</DialogTitle>
          </DialogHeader>
          {selectedSKU && (
            <StockAdjustment
              sku={selectedSKU}
              onSuccess={closeAdjustmentDialog}
              onCancel={closeAdjustmentDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
