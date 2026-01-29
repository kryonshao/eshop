import { supabase } from '../../integrations/supabase/client';
import type { Locale } from '../../i18n/config';

export interface ProductTranslation {
  id?: string;
  productId: string;
  locale: Locale;
  title: string;
  description: string;
  specifications?: Record<string, string>;
}

export interface UserPreferences {
  userId: string;
  locale: Locale;
  currency: string;
  timezone?: string;
}

export class I18nService {
  // Get product translation for a specific locale
  async getProductTranslation(
    productId: string,
    locale: Locale
  ): Promise<ProductTranslation | null> {
    try {
      const { data, error } = await supabase
        .from('product_translations')
        .select('*')
        .eq('product_id', productId)
        .eq('locale', locale)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No translation found
          return null;
        }
        throw error;
      }

      return {
        id: data.id,
        productId: data.product_id,
        locale: data.locale as Locale,
        title: data.title,
        description: data.description,
        specifications: data.specifications,
      };
    } catch (error) {
      console.error('Error fetching product translation:', error);
      return null;
    }
  }

  // Get all translations for a product
  async getProductTranslations(productId: string): Promise<ProductTranslation[]> {
    try {
      const { data, error } = await supabase
        .from('product_translations')
        .select('*')
        .eq('product_id', productId);

      if (error) throw error;

      return data.map((item) => ({
        id: item.id,
        productId: item.product_id,
        locale: item.locale as Locale,
        title: item.title,
        description: item.description,
        specifications: item.specifications,
      }));
    } catch (error) {
      console.error('Error fetching product translations:', error);
      return [];
    }
  }

  // Save or update product translation
  async saveProductTranslation(translation: ProductTranslation): Promise<void> {
    try {
      const { error } = await supabase.from('product_translations').upsert({
        product_id: translation.productId,
        locale: translation.locale,
        title: translation.title,
        description: translation.description,
        specifications: translation.specifications,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving product translation:', error);
      throw error;
    }
  }

  // Delete product translation
  async deleteProductTranslation(productId: string, locale: Locale): Promise<void> {
    try {
      const { error } = await supabase
        .from('product_translations')
        .delete()
        .eq('product_id', productId)
        .eq('locale', locale);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting product translation:', error);
      throw error;
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return {
        userId: data.user_id,
        locale: data.locale as Locale,
        currency: data.currency,
        timezone: data.timezone,
      };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  // Save user preferences
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: preferences.userId,
        locale: preferences.locale,
        currency: preferences.currency,
        timezone: preferences.timezone,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  // Detect user locale from browser
  detectUserLocale(): Locale {
    const browserLang = navigator.language;
    const supportedLocales: Locale[] = ['zh-CN', 'en-US', 'es-ES', 'fr-FR', 'de-DE'];

    // Try exact match
    if (supportedLocales.includes(browserLang as Locale)) {
      return browserLang as Locale;
    }

    // Try language code match (e.g., 'zh' -> 'zh-CN')
    const langCode = browserLang.split('-')[0];
    const match = supportedLocales.find((locale) => locale.startsWith(langCode));

    return match || 'en-US';
  }
}

// Export singleton instance
export const i18nService = new I18nService();
