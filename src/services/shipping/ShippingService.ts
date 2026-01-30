import { supabase } from '../../integrations/supabase/client';
import type {
  ShippingProvider,
  Shipment,
  TrackingEvent,
  ShippingOption,
  ShippingCalculationParams,
  CreateShipmentParams,
  UpdateShipmentParams,
  CreateTrackingEventParams,
  TrackingInfo,
} from '../../types/shipping';

export class ShippingService {
  /**
   * Get all active shipping providers
   */
  async getShippingProviders(): Promise<ShippingProvider[]> {
    try {
      const { data, error } = await supabase
        .from('shipping_providers')
        .select('*')
        .eq('is_active', true)
        .order('base_rate', { ascending: true });

      if (error) throw error;

      return data.map(this.mapProviderFromDb);
    } catch (error) {
      console.error('Error fetching shipping providers:', error);
      throw error;
    }
  }

  /**
   * Calculate shipping options for an order
   */
  async calculateShippingOptions(
    params: ShippingCalculationParams
  ): Promise<ShippingOption[]> {
    try {
      const providers = await this.getShippingProviders();
      
      // Calculate total weight
      const totalWeight = params.items.reduce(
        (sum, item) => sum + (item.weight || 0.5) * item.quantity,
        0
      );

      const options: ShippingOption[] = providers.map((provider) => {
        // Calculate shipping fee
        let fee = provider.baseRate + totalWeight * provider.perKgRate;

        // Check for free shipping
        const isFreeShipping =
          provider.freeShippingThreshold !== null &&
          provider.freeShippingThreshold !== undefined &&
          params.orderAmount >= provider.freeShippingThreshold;

        if (isFreeShipping) {
          fee = 0;
        }

        return {
          providerId: provider.id,
          providerCode: provider.code,
          providerName: provider.name,
          description: provider.description,
          fee: Math.max(0, fee),
          estimatedDaysMin: provider.estimatedDaysMin,
          estimatedDaysMax: provider.estimatedDaysMax,
          isFreeShipping,
        };
      });

      return options;
    } catch (error) {
      console.error('Error calculating shipping options:', error);
      throw error;
    }
  }

  /**
   * Create a new shipment
   */
  async createShipment(params: CreateShipmentParams): Promise<Shipment> {
    try {
      // Get provider info
      const { data: provider, error: providerError } = await supabase
        .from('shipping_providers')
        .select('id, name')
        .eq('code', params.providerCode)
        .single();

      if (providerError) throw providerError;

      const { data, error } = await supabase
        .from('shipments')
        .insert({
          order_id: params.orderId,
          provider_id: provider.id,
          provider_code: params.providerCode,
          provider_name: provider.name,
          tracking_number: params.trackingNumber,
          status: 'pending',
          origin_address: params.originAddress,
          destination_address: params.destinationAddress,
          shipping_fee: params.shippingFee,
          weight_kg: params.weightKg,
          estimated_delivery_date: params.estimatedDeliveryDate,
          notes: params.notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial tracking event
      await this.createTrackingEvent({
        shipmentId: data.id,
        status: 'pending',
        description: 'Shipment created',
        eventTime: new Date(),
      });

      return this.mapShipmentFromDb(data);
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  }

  /**
   * Update shipment status and details
   */
  async updateShipment(
    shipmentId: string,
    params: UpdateShipmentParams
  ): Promise<Shipment> {
    try {
      const updateData: any = {};

      if (params.status) updateData.status = params.status;
      if (params.trackingNumber) updateData.tracking_number = params.trackingNumber;
      if (params.estimatedDeliveryDate)
        updateData.estimated_delivery_date = params.estimatedDeliveryDate;
      if (params.actualDeliveryDate)
        updateData.actual_delivery_date = params.actualDeliveryDate;
      if (params.notes) updateData.notes = params.notes;

      const { data, error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipmentId)
        .select()
        .single();

      if (error) throw error;

      // Create tracking event if status changed
      if (params.status) {
        await this.createTrackingEvent({
          shipmentId,
          status: params.status,
          description: this.getStatusDescription(params.status),
          eventTime: new Date(),
        });
      }

      return this.mapShipmentFromDb(data);
    } catch (error) {
      console.error('Error updating shipment:', error);
      throw error;
    }
  }

  /**
   * Get shipment by ID
   */
  async getShipment(shipmentId: string): Promise<Shipment | null> {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', shipmentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapShipmentFromDb(data);
    } catch (error) {
      console.error('Error fetching shipment:', error);
      throw error;
    }
  }

  /**
   * Get shipment by order ID
   */
  async getShipmentByOrderId(orderId: string): Promise<Shipment | null> {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapShipmentFromDb(data);
    } catch (error) {
      console.error('Error fetching shipment by order:', error);
      return null;
    }
  }

  /**
   * Get tracking information for a shipment
   */
  async getTrackingInfo(shipmentId: string): Promise<TrackingInfo | null> {
    try {
      const shipment = await this.getShipment(shipmentId);
      if (!shipment) return null;

      const { data: events, error } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('event_time', { ascending: false });

      if (error) throw error;

      return {
        shipment,
        events: events.map(this.mapTrackingEventFromDb),
        currentStatus: shipment.status,
        estimatedDelivery: shipment.estimatedDeliveryDate,
        actualDelivery: shipment.actualDeliveryDate,
      };
    } catch (error) {
      console.error('Error fetching tracking info:', error);
      throw error;
    }
  }

  /**
   * Create a tracking event
   */
  async createTrackingEvent(
    params: CreateTrackingEventParams
  ): Promise<TrackingEvent> {
    try {
      const { data, error } = await supabase
        .from('tracking_events')
        .insert({
          shipment_id: params.shipmentId,
          status: params.status,
          location: params.location,
          description: params.description,
          event_time: params.eventTime || new Date(),
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapTrackingEventFromDb(data);
    } catch (error) {
      console.error('Error creating tracking event:', error);
      throw error;
    }
  }

  /**
   * Get all shipments for merchant (with pagination)
   */
  async getShipments(
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Shipment[]> {
    try {
      let query = supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(this.mapShipmentFromDb);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      throw error;
    }
  }

  // Helper methods

  private mapProviderFromDb(data: any): ShippingProvider {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
      logoUrl: data.logo_url,
      isActive: data.is_active,
      supportedCountries: data.supported_countries || [],
      baseRate: parseFloat(data.base_rate),
      perKgRate: parseFloat(data.per_kg_rate),
      freeShippingThreshold: data.free_shipping_threshold
        ? parseFloat(data.free_shipping_threshold)
        : undefined,
      estimatedDaysMin: data.estimated_days_min,
      estimatedDaysMax: data.estimated_days_max,
      config: data.config || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapShipmentFromDb(data: any): Shipment {
    return {
      id: data.id,
      orderId: data.order_id,
      providerId: data.provider_id,
      providerCode: data.provider_code,
      providerName: data.provider_name,
      trackingNumber: data.tracking_number,
      status: data.status,
      originAddress: data.origin_address,
      destinationAddress: data.destination_address,
      shippingFee: parseFloat(data.shipping_fee),
      weightKg: data.weight_kg ? parseFloat(data.weight_kg) : undefined,
      estimatedDeliveryDate: data.estimated_delivery_date
        ? new Date(data.estimated_delivery_date)
        : undefined,
      actualDeliveryDate: data.actual_delivery_date
        ? new Date(data.actual_delivery_date)
        : undefined,
      notes: data.notes,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapTrackingEventFromDb(data: any): TrackingEvent {
    return {
      id: data.id,
      shipmentId: data.shipment_id,
      status: data.status,
      location: data.location,
      description: data.description,
      eventTime: new Date(data.event_time),
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
    };
  }

  private getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      pending: 'Shipment is being prepared',
      picked_up: 'Package has been picked up',
      in_transit: 'Package is in transit',
      out_for_delivery: 'Package is out for delivery',
      delivered: 'Package has been delivered',
      failed: 'Delivery failed',
      cancelled: 'Shipment has been cancelled',
    };
    return descriptions[status] || 'Status updated';
  }
}

// Export singleton instance
export const shippingService = new ShippingService();
