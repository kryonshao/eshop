export interface Product {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  originalPrice?: number;
  discountPrice?: number;
  image: string;
  images?: string[];
  category: string;
  sizes: string[];
  colors: string[];
  description: string;
  fullDescription?: string;
  material?: string;
  careInstructions?: string[];
  isNew?: boolean;
  isSale?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  skuId?: string;
}

// SKU and Inventory types
export interface VariantAttribute {
  name: string;  // e.g., "颜色", "尺码"
  value: string; // e.g., "红色", "L"
}

export interface SKU {
  id: string;
  productId: string;
  skuCode: string;
  attributes: VariantAttribute[];
  price: number;
  stock?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateSKUParams {
  productId: string;
  attributes: VariantAttribute[];
  price: number;
  initialStock: number;
  warehouseId: string;
  imageUrl?: string;
}

export interface StockInfo {
  skuId: string;
  warehouseId: string;
  available: number;
  reserved: number;
  total: number;
  alertThreshold: number;
}

export interface StockAlert {
  skuId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  warehouseId: string;
}

export interface TransferParams {
  skuId: string;
  fromWarehouse: string;
  toWarehouse: string;
  quantity: number;
  reason: string;
}
