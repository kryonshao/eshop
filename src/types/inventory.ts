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

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: {
    country: string;
    state: string;
    city: string;
    postalCode: string;
    addressLine1: string;
    addressLine2?: string;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  isActive: boolean;
  createdAt?: Date;
}

export interface StockMovement {
  id: string;
  skuId: string;
  warehouseId: string;
  quantity: number;
  type: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'return';
  referenceId?: string;
  reason?: string;
  createdBy?: string;
  createdAt: Date;
}
