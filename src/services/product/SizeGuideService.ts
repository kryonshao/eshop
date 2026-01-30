import { supabase } from "@/integrations/supabase/client";

export interface SizeGuideChart {
  headers: string[];
  rows: string[][];
}

export interface MeasurementTip {
  title: string;
  description: string;
}

export interface SizeGuide {
  id: string;
  category_id: string;
  name: string;
  name_en?: string;
  description?: string;
  chart_data: SizeGuideChart;
  measurement_tips?: {
    tips: MeasurementTip[];
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SizeGuideCategory {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  display_order: number;
}

class SizeGuideService {
  /**
   * Get size guide by ID
   */
  async getSizeGuide(sizeGuideId: string): Promise<SizeGuide | null> {
    try {
      const { data, error } = await supabase
        .from("size_guides")
        .select("*")
        .eq("id", sizeGuideId)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as SizeGuide;
    } catch (error) {
      console.error("Error fetching size guide:", error);
      return null;
    }
  }

  /**
   * Get size guide for a product
   */
  async getProductSizeGuide(productId: string): Promise<SizeGuide | null> {
    try {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("size_guide_id")
        .eq("id", productId)
        .single();

      if (productError) throw productError;
      
      // If product has a size guide, return it
      if (product?.size_guide_id) {
        return await this.getSizeGuide(product.size_guide_id);
      }
      
      // Otherwise, return the default size guide
      return await this.getDefaultSizeGuide();
    } catch (error) {
      console.error("Error fetching product size guide:", error);
      // Try to return default size guide as fallback
      return await this.getDefaultSizeGuide();
    }
  }

  /**
   * Get the default size guide (标准尺码)
   */
  async getDefaultSizeGuide(): Promise<SizeGuide | null> {
    try {
      const { data, error } = await supabase
        .from("size_guides")
        .select("*")
        .eq("name", "标准尺码")
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as SizeGuide;
    } catch (error) {
      console.error("Error fetching default size guide:", error);
      return null;
    }
  }

  /**
   * Get all size guide categories
   */
  async getCategories(): Promise<SizeGuideCategory[]> {
    try {
      const { data, error } = await supabase
        .from("size_guide_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as SizeGuideCategory[];
    } catch (error) {
      console.error("Error fetching size guide categories:", error);
      return [];
    }
  }

  /**
   * Get all size guides for a category
   */
  async getSizeGuidesByCategory(categoryId: string): Promise<SizeGuide[]> {
    try {
      const { data, error } = await supabase
        .from("size_guides")
        .select("*")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SizeGuide[];
    } catch (error) {
      console.error("Error fetching size guides by category:", error);
      return [];
    }
  }

  /**
   * Create a new size guide
   */
  async createSizeGuide(sizeGuide: Omit<SizeGuide, "id" | "created_at" | "updated_at">): Promise<SizeGuide | null> {
    try {
      const { data, error } = await supabase
        .from("size_guides")
        .insert(sizeGuide)
        .select()
        .single();

      if (error) throw error;
      return data as SizeGuide;
    } catch (error) {
      console.error("Error creating size guide:", error);
      return null;
    }
  }

  /**
   * Update a size guide
   */
  async updateSizeGuide(id: string, updates: Partial<SizeGuide>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("size_guides")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating size guide:", error);
      return false;
    }
  }

  /**
   * Delete a size guide
   */
  async deleteSizeGuide(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("size_guides")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting size guide:", error);
      return false;
    }
  }

  /**
   * Assign size guide to product
   */
  async assignSizeGuideToProduct(productId: string, sizeGuideId: string | null): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("products")
        .update({ size_guide_id: sizeGuideId })
        .eq("id", productId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error assigning size guide to product:", error);
      return false;
    }
  }
}

export const sizeGuideService = new SizeGuideService();
