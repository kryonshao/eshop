import { supabase } from '../../integrations/supabase/client';
import type { StockInfo, StockAlert, TransferParams } from '../../types/inventory';

export class InventoryService {
  /**
   * Check if sufficient stock is available
   */
  async checkStock(skuId: string, quantity: number, warehouseId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('inventory')
        .select('available')
        .eq('sku_id', skuId);

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const totalAvailable = data.reduce((sum, inv) => sum + inv.available, 0);
      return totalAvailable >= quantity;
    } catch (error) {
      console.error('Error checking stock:', error);
      return false;
    }
  }

  /**
   * Reserve stock for an order (when order is created)
   */
  async reserveStock(skuId: string, quantity: number, orderId: string, warehouseId?: string): Promise<boolean> {
    try {
      // Use database transaction for atomicity
      const { data: inventoryData, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('sku_id', skuId)
        .eq('warehouse_id', warehouseId || (await this.getDefaultWarehouseId()))
        .single();

      if (fetchError) throw fetchError;

      if (inventoryData.available < quantity) {
        return false; // Insufficient stock
      }

      // Update inventory: decrease available, increase reserved
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          available: inventoryData.available - quantity,
          reserved: inventoryData.reserved + quantity,
        })
        .eq('id', inventoryData.id);

      if (updateError) throw updateError;

      // Record stock movement
      await this.recordStockMovement({
        skuId,
        warehouseId: inventoryData.warehouse_id,
        quantity: -quantity,
        type: 'sale',
        referenceId: orderId,
        reason: 'Reserved for order',
      });

      return true;
    } catch (error) {
      console.error('Error reserving stock:', error);
      return false;
    }
  }

  /**
   * Release reserved stock (when order is cancelled)
   */
  async releaseStock(skuId: string, quantity: number, orderId: string, warehouseId?: string): Promise<void> {
    try {
      const { data: inventoryData, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('sku_id', skuId)
        .eq('warehouse_id', warehouseId || (await this.getDefaultWarehouseId()))
        .single();

      if (fetchError) throw fetchError;

      // Update inventory: increase available, decrease reserved
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          available: inventoryData.available + quantity,
          reserved: Math.max(0, inventoryData.reserved - quantity),
        })
        .eq('id', inventoryData.id);

      if (updateError) throw updateError;

      // Record stock movement
      await this.recordStockMovement({
        skuId,
        warehouseId: inventoryData.warehouse_id,
        quantity: quantity,
        type: 'return',
        referenceId: orderId,
        reason: 'Order cancelled - stock released',
      });
    } catch (error) {
      console.error('Error releasing stock:', error);
      throw error;
    }
  }

  /**
   * Deduct stock (when payment is confirmed)
   */
  async deductStock(skuId: string, quantity: number, warehouseId?: string): Promise<void> {
    try {
      const { data: inventoryData, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('sku_id', skuId)
        .eq('warehouse_id', warehouseId || (await this.getDefaultWarehouseId()))
        .single();

      if (fetchError) throw fetchError;

      // Update inventory: decrease reserved
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          reserved: Math.max(0, inventoryData.reserved - quantity),
        })
        .eq('id', inventoryData.id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error deducting stock:', error);
      throw error;
    }
  }

  /**
   * Update stock manually (for adjustments)
   */
  async updateStock(skuId: string, quantity: number, reason: string, warehouseId?: string): Promise<void> {
    try {
      const { data: inventoryData, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('sku_id', skuId)
        .eq('warehouse_id', warehouseId || (await this.getDefaultWarehouseId()))
        .single();

      if (fetchError) throw fetchError;

      // Update inventory
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          available: Math.max(0, inventoryData.available + quantity),
        })
        .eq('id', inventoryData.id);

      if (updateError) throw updateError;

      // Record stock movement
      await this.recordStockMovement({
        skuId,
        warehouseId: inventoryData.warehouse_id,
        quantity,
        type: 'adjustment',
        reason,
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Get stock information for a SKU
   */
  async getStockInfo(skuId: string, warehouseId?: string): Promise<StockInfo | null> {
    try {
      let query = supabase
        .from('inventory')
        .select('*')
        .eq('sku_id', skuId);

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        skuId: data.sku_id,
        warehouseId: data.warehouse_id,
        available: data.available,
        reserved: data.reserved,
        total: data.available + data.reserved,
        alertThreshold: data.alert_threshold,
      };
    } catch (error) {
      console.error('Error fetching stock info:', error);
      return null;
    }
  }

  /**
   * Check for low stock alerts
   */
  async checkStockAlerts(): Promise<StockAlert[]> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          sku_id,
          warehouse_id,
          available,
          alert_threshold,
          skus!inner(product_id)
        `)
        .lte('available', supabase.raw('alert_threshold'));

      if (error) throw error;

      return data.map((item) => ({
        skuId: item.sku_id,
        productName: 'Product', // Would need to join with products table
        currentStock: item.available,
        threshold: item.alert_threshold,
        warehouseId: item.warehouse_id,
      }));
    } catch (error) {
      console.error('Error checking stock alerts:', error);
      return [];
    }
  }

  /**
   * Transfer stock between warehouses
   */
  async transferStock(params: TransferParams): Promise<void> {
    try {
      // Deduct from source warehouse
      const { data: fromInventory, error: fromError } = await supabase
        .from('inventory')
        .select('*')
        .eq('sku_id', params.skuId)
        .eq('warehouse_id', params.fromWarehouse)
        .single();

      if (fromError) throw fromError;

      if (fromInventory.available < params.quantity) {
        throw new Error('Insufficient stock in source warehouse');
      }

      await supabase
        .from('inventory')
        .update({
          available: fromInventory.available - params.quantity,
        })
        .eq('id', fromInventory.id);

      // Add to destination warehouse
      const { data: toInventory, error: toFetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('sku_id', params.skuId)
        .eq('warehouse_id', params.toWarehouse)
        .single();

      if (toFetchError && toFetchError.code !== 'PGRST116') throw toFetchError;

      if (toInventory) {
        await supabase
          .from('inventory')
          .update({
            available: toInventory.available + params.quantity,
          })
          .eq('id', toInventory.id);
      } else {
        // Create new inventory record if doesn't exist
        await supabase.from('inventory').insert({
          sku_id: params.skuId,
          warehouse_id: params.toWarehouse,
          available: params.quantity,
          reserved: 0,
          alert_threshold: 10,
        });
      }

      // Record stock movements
      await this.recordStockMovement({
        skuId: params.skuId,
        warehouseId: params.fromWarehouse,
        quantity: -params.quantity,
        type: 'transfer',
        reason: `Transfer to ${params.toWarehouse}: ${params.reason}`,
      });

      await this.recordStockMovement({
        skuId: params.skuId,
        warehouseId: params.toWarehouse,
        quantity: params.quantity,
        type: 'transfer',
        reason: `Transfer from ${params.fromWarehouse}: ${params.reason}`,
      });
    } catch (error) {
      console.error('Error transferring stock:', error);
      throw error;
    }
  }

  /**
   * Record stock movement for audit trail
   */
  private async recordStockMovement(params: {
    skuId: string;
    warehouseId: string;
    quantity: number;
    type: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'return';
    referenceId?: string;
    reason?: string;
  }): Promise<void> {
    try {
      const user = await supabase.auth.getUser();

      await supabase.from('stock_movements').insert({
        sku_id: params.skuId,
        warehouse_id: params.warehouseId,
        quantity: params.quantity,
        type: params.type,
        reference_id: params.referenceId,
        reason: params.reason,
        created_by: user.data.user?.id,
      });
    } catch (error) {
      console.error('Error recording stock movement:', error);
      // Don't throw - stock movement is for audit only
    }
  }

  /**
   * Get default warehouse ID
   */
  private async getDefaultWarehouseId(): Promise<string> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('id')
      .eq('code', 'WH-MAIN')
      .single();

    if (error || !data) {
      throw new Error('Default warehouse not found');
    }

    return data.id;
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();
