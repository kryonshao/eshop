import { useState, useEffect } from "react";
import { Package, Search, Loader2, Edit, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

export default function SimpleInventoryManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products" as any)
        .select("id, name, category, price, stock, image")
        .order("name", { ascending: true });

      if (error) throw error;

      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("获取商品列表失败");
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchQuery) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setNewStock(product.stock.toString());
    setEditDialogOpen(true);
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct) return;

    const stockValue = parseInt(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
      toast.error("请输入有效的库存数量");
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("products" as any)
        .update({ stock: stockValue })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      toast.success("库存更新成功");
      setEditDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("库存更新失败");
    } finally {
      setUpdating(false);
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          缺货
        </Badge>
      );
    } else if (stock < 10) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-600">
          <AlertTriangle className="h-3 w-3" />
          低库存
        </Badge>
      );
    }
    return <Badge variant="default">正常</Badge>;
  };

  const lowStockCount = products.filter(p => p.stock < 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

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
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总商品数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总库存</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">低库存商品</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">缺货商品</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            库存管理
          </CardTitle>
          <CardDescription>
            查看和管理所有商品的库存信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索商品名称或分类..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Inventory Table */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无商品数据</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead className="text-right">价格</TableHead>
                    <TableHead className="text-right">库存</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                      <TableCell className="text-right">¥{product.price}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {product.stock}
                      </TableCell>
                      <TableCell>{getStockBadge(product.stock)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
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

      {/* Edit Stock Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>调整库存</DialogTitle>
            <DialogDescription>
              修改商品的库存数量
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {/* Product Info */}
              <div className="bg-secondary/50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <p className="font-semibold">{selectedProduct.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedProduct.category} · ¥{selectedProduct.price}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Stock */}
              <div className="bg-secondary/50 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">当前库存</p>
                <p className="text-3xl font-bold">{selectedProduct.stock}</p>
              </div>

              {/* New Stock Input */}
              <div className="space-y-2">
                <Label htmlFor="new-stock">新库存数量</Label>
                <Input
                  id="new-stock"
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="输入新的库存数量"
                />
              </div>

              {/* Preview */}
              {newStock && !isNaN(parseInt(newStock)) && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">更新后库存:</span>
                    <span className="text-2xl font-bold">{parseInt(newStock)}</span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    变化: {parseInt(newStock) - selectedProduct.stock > 0 ? '+' : ''}
                    {parseInt(newStock) - selectedProduct.stock}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
            >
              取消
            </Button>
            <Button onClick={handleUpdateStock} disabled={updating}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
