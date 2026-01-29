import { useState, useEffect } from "react";
import { History, Loader2, Search, Filter, Calendar, TrendingUp, TrendingDown } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import type { StockMovement } from "@/types/inventory";

interface MovementWithDetails extends StockMovement {
  skuCode: string;
  warehouseName: string;
  createdByName?: string;
}

export default function StockMovementHistory() {
  const [movements, setMovements] = useState<MovementWithDetails[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<MovementWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchMovements();
  }, []);

  useEffect(() => {
    filterMovements();
  }, [searchQuery, typeFilter, movements]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_movements' as any)
        .select(`
          *,
          skus (
            sku_code
          ),
          warehouses (
            name
          ),
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200); // Limit to recent 200 movements

      if (error) throw error;

      const movementsWithDetails: MovementWithDetails[] = (data || []).map((item: any) => ({
        id: item.id,
        skuId: item.sku_id,
        warehouseId: item.warehouse_id,
        quantity: item.quantity,
        type: item.type,
        referenceId: item.reference_id,
        reason: item.reason,
        createdBy: item.created_by,
        createdAt: new Date(item.created_at),
        skuCode: item.skus?.sku_code || 'Unknown',
        warehouseName: item.warehouses?.name || 'Unknown',
        createdByName: item.profiles?.full_name || item.profiles?.email || 'System',
      }));

      setMovements(movementsWithDetails);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterMovements = () => {
    let filtered = [...movements];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (movement) =>
          movement.skuCode.toLowerCase().includes(query) ||
          movement.reason?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((movement) => movement.type === typeFilter);
    }

    setFilteredMovements(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      purchase: { label: "采购入库", variant: "default" },
      sale: { label: "销售出库", variant: "secondary" },
      transfer: { label: "仓库调拨", variant: "outline" },
      adjustment: { label: "库存调整", variant: "secondary" },
      return: { label: "退货入库", variant: "default" },
    };

    const config = typeConfig[type] || { label: type, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getQuantityDisplay = (quantity: number) => {
    if (quantity > 0) {
      return (
        <span className="flex items-center gap-1 text-green-600 font-semibold">
          <TrendingUp className="h-4 w-4" />
          +{quantity}
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 text-red-600 font-semibold">
          <TrendingDown className="h-4 w-4" />
          {quantity}
        </span>
      );
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMovements = filteredMovements.slice(startIndex, endIndex);

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
          <History className="h-5 w-5" />
          库存变动历史
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索 SKU 代码或原因..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="变动类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有类型</SelectItem>
              <SelectItem value="purchase">采购入库</SelectItem>
              <SelectItem value="sale">销售出库</SelectItem>
              <SelectItem value="transfer">仓库调拨</SelectItem>
              <SelectItem value="adjustment">库存调整</SelectItem>
              <SelectItem value="return">退货入库</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Movements Table */}
        {filteredMovements.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无库存变动记录</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>SKU 代码</TableHead>
                    <TableHead>仓库</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead className="text-right">数量变动</TableHead>
                    <TableHead>原因</TableHead>
                    <TableHead>操作人</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(movement.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {movement.skuCode}
                      </TableCell>
                      <TableCell>{movement.warehouseName}</TableCell>
                      <TableCell>{getTypeBadge(movement.type)}</TableCell>
                      <TableCell className="text-right">
                        {getQuantityDisplay(movement.quantity)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {movement.reason || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {movement.createdByName}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  显示 {startIndex + 1} - {Math.min(endIndex, filteredMovements.length)} 条，
                  共 {filteredMovements.length} 条记录
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
