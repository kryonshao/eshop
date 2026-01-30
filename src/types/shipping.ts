// Shipping and logistics types

export interface Address {
  country: string;
  state?: string;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  phone?: string;
  recipientName?: string;
}

export type ShipmentStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface ShippingProvider {
  id: string;
  code: string;
  name: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  supportedCountries: string[];
  baseRate: number;
  perKgRate: number;
  freeShippingThreshold?: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  config?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shipment {
  id: string;
  orderId: string;
  providerId?: string;
  providerCode: string;
  providerName: string;
  trackingNumber?: string;
  status: ShipmentStatus;
  originAddress: Address;
  destinationAddress: Address;
  shippingFee: number;
  weightKg?: number;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  location?: string;
  description: string;
  eventTime: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ShippingOption {
  providerId: string;
  providerCode: string;
  providerName: string;
  description?: string;
  fee: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isFreeShipping: boolean;
}

export interface ShippingCalculationParams {
  items: Array<{
    weight?: number;
    quantity: number;
  }>;
  destination: Address;
  orderAmount: number;
}

export interface CreateShipmentParams {
  orderId: string;
  providerCode: string;
  trackingNumber?: string;
  originAddress: Address;
  destinationAddress: Address;
  shippingFee: number;
  weightKg?: number;
  estimatedDeliveryDate?: Date;
  notes?: string;
}

export interface UpdateShipmentParams {
  status?: ShipmentStatus;
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
}

export interface CreateTrackingEventParams {
  shipmentId: string;
  status: ShipmentStatus;
  location?: string;
  description: string;
  eventTime?: Date;
}

export interface TrackingInfo {
  shipment: Shipment;
  events: TrackingEvent[];
  currentStatus: ShipmentStatus;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
}
