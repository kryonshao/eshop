import { supabase } from '../../integrations/supabase/client';
import type { SKU, CreateSKUParams, VariantAttribute } from '../../types/inventory';

export class SKUService {
  /**
   * Generate SKU code from product ID and attributes
   * Format: {PRODUCT_CODE}-{ATTR1}-{ATTR2}
   * Example: PROD123-RED-L
   */
  generateSKUCode(productId: string, attributes: VariantAttribute[]): string {
    const productCode = productId.substring(0, 8).toUpperCase();
    const attrCodes = attributes
      .map((attr) => attr.value.substring(0, 3).toUpperCase())
      .join('-');
    
    return `${productCode}-${attrCodes}`;
  }

  /**
   * Create a new SKU
   */
  async createSKU(params: CreateSKUParams): Promise<SKU> {
    try {
      const skuCode = this.generateSKUCode(params.productId, params.attributes);

      // Insert SKU
      const { data: skuData, error: skuError } = await supabase
        .from('skus' as any)
        .insert({
          product_id: params.productId,
          sku_code: skuCode,
          attributes: params.attributes,
          price: params.price,
          image_url: params.imageUrl,
          is_active: true,
        })
        .select()
        .single();

      if (skuError) throw skuError;

      const createdSku = skuData as any;

      // Create initial inventory record
      const { error: inventoryError } = await supabase
        .from('inventory' as any)
        .insert({
          sku_id: createdSku.id,
          warehouse_id: params.warehouseId,
          available: params.initialStock,
          reserved: 0,
          alert_threshold: 10,
        });

      if (inventoryError) throw inventoryError;

      // Record stock movement
      if (params.initialStock > 0) {
        await supabase.from('stock_movements' as any).insert({
          sku_id: createdSku.id,
          warehouse_id: params.warehouseId,
          quantity: params.initialStock,
          type: 'purchase',
          reason: 'Initial stock',
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });
      }

      return this.mapToSKU(createdSku);
    } catch (error) {
      console.error('Error creating SKU:', error);
      throw error;
    }
  }

  /**
   * Get all SKUs for a product
   */
  async getProductSKUs(productId: string): Promise<SKU[]> {
    try {
      const { data, error } = await supabase
        .from('skus' as any)
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((item) => this.mapToSKU(item));
    } catch (error) {
      console.error('Error fetching product SKUs:', error);
      return [];
    }
  }

  /**
   * Update SKU information
   */
  async updateSKU(skuId: string, updates: Partial<SKU>): Promise<SKU> {
    try {
      const updateData: any = {};

      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.attributes !== undefined) updateData.attributes = updates.attributes;

      const { data, error } = await supabase
        .from('skus' as any)
        .update(updateData)
        .eq('id', skuId)
        .select()
        .single();

      if (error) throw error;

      return this.mapToSKU(data);
    } catch (error) {
      console.error('Error updating SKU:', error);
      throw error;
    }
  }

  /**
   * Soft delete SKU (set is_active to false)
   */
  async deleteSKU(skuId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('skus' as any)
        .update({ is_active: false })
        .eq('id', skuId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting SKU:', error);
      throw error;
    }
  }

  /**
   * Get SKU by ID
   */
  async getSKUById(skuId: string): Promise<SKU | null> {
    try {
      const { data, error } = await supabase
        .from('skus' as any)
        .select('*')
        .eq('id', skuId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapToSKU(data);
    } catch (error) {
      console.error('Error fetching SKU:', error);
      return null;
    }
  }

  /**
   * Find SKU by product ID and variant attributes
   * This is used to map product + size + color to a specific SKU
   */
  async findSKUByAttributes(
    productId: string,
    attributes: { name: string; value: string }[]
  ): Promise<SKU | null> {
    try {
      const { data, error } = await supabase
        .from('skus' as any)
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true);

      if (error) throw error;

      if (!data || data.length === 0) return null;

      // Find SKU that matches all attributes
      const matchingSKU = data.find((sku) => {
        const isActive = (sku as any).is_active;
        if (isActive === false) return false;
        const skuAttrs = (sku as any).attributes || [];
        
        // Check if all provided attributes match
        return attributes.every((attr) =>
          skuAttrs.some(
            (skuAttr: VariantAttribute) =>
              skuAttr.name.toLowerCase() === attr.name.toLowerCase() &&
              skuAttr.value.toLowerCase() === attr.value.toLowerCase()
          )
        );
      });

      return matchingSKU ? this.mapToSKU(matchingSKU) : null;
    } catch (error) {
      console.error('Error finding SKU by attributes:', error);
      return null;
    }
  }

  /**
   * Map database record to SKU type
   */
  private mapToSKU(data: any): SKU {
    return {
      id: data.id,
      productId: data.product_id,
      skuCode: data.sku_code,
      attributes: data.attributes || [],
      price: Number(data.price),
      imageUrl: data.image_url,
      isActive: data.is_active,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }
}

// Export singleton instance
export const skuService = new SKUService();
