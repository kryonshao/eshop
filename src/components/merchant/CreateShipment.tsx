import { useState, useEffect } from 'react';
import { Package, Loader2 } from 'lucide-react';
import { shippingService } from '../../services/shipping/ShippingService';
import { supabase } from '../../integrations/supabase/client';
import type { ShippingProvider, CreateShipmentParams } from '../../types/shipping';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from '../ui/use-toast';

interface CreateShipmentProps {
  orderId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateShipment({ orderId, onClose, onSuccess }: CreateShipmentProps) {
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [orderData, setOrderData] = useState<any>(null);
  const [formData, setFormData] = useState({
    providerCode: '',
    trackingNumber: '',
    weightKg: '',
    estimatedDays: '',
    notes: '',
  });

  useEffect(() => {
    fetchProviders();
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  const fetchProviders = async () => {
    try {
      const data = await shippingService.getShippingProviders();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shipping providers',
        variant: 'destructive',
      });
    }
  };

  const fetchOrderData = async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(*)')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrderData(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load order data',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId || !orderData) {
      toast({
        title: 'Error',
        description: 'Order data not loaded',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.providerCode || !formData.trackingNumber) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const shippingAddress = orderData.shipping_address || {};
      const estimatedDeliveryDate = formData.estimatedDays
        ? new Date(Date.now() + parseInt(formData.estimatedDays) * 24 * 60 * 60 * 1000)
        : undefined;

      const params: CreateShipmentParams = {
        orderId,
        providerCode: formData.providerCode,
        trackingNumber: formData.trackingNumber,
        originAddress: {
          addressLine1: 'Warehouse Address',
          city: 'City',
          state: 'State',
          postalCode: '00000',
          country: 'US',
        },
        destinationAddress: {
          addressLine1: shippingAddress.street_address || '',
          city: shippingAddress.city || '',
          state: shippingAddress.province || '',
          postalCode: shippingAddress.postal_code || '',
          country: shippingAddress.country || '',
          recipientName: shippingAddress.recipient_name || '',
          phone: shippingAddress.phone || '',
        },
        shippingFee: orderData.shipping_fee || 0,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
        estimatedDeliveryDate,
        notes: formData.notes,
      };

      await shippingService.createShipment(params);

      // Update order status to shipped
      await supabase
        .from('orders')
        .update({ status: 'shipped' })
        .eq('id', orderId);

      toast({
        title: 'Success',
        description: 'Shipment created successfully',
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create shipment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create Shipment
          </DialogTitle>
          <DialogDescription>
            Create a new shipment for order {orderId?.slice(0, 8)}...
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shipping Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">Shipping Provider *</Label>
            <Select
              value={formData.providerCode}
              onValueChange={(value) =>
                setFormData({ ...formData, providerCode: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.code} value={provider.code}>
                    {provider.name} - ${provider.baseRate.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tracking Number */}
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Tracking Number *</Label>
            <Input
              id="trackingNumber"
              value={formData.trackingNumber}
              onChange={(e) =>
                setFormData({ ...formData, trackingNumber: e.target.value })
              }
              placeholder="Enter tracking number"
              required
            />
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight">Package Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              value={formData.weightKg}
              onChange={(e) =>
                setFormData({ ...formData, weightKg: e.target.value })
              }
              placeholder="Enter weight in kg"
            />
          </div>

          {/* Estimated Delivery Days */}
          <div className="space-y-2">
            <Label htmlFor="estimatedDays">Estimated Delivery (days)</Label>
            <Input
              id="estimatedDays"
              type="number"
              min="1"
              value={formData.estimatedDays}
              onChange={(e) =>
                setFormData({ ...formData, estimatedDays: e.target.value })
              }
              placeholder="e.g., 7"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Shipping Address Preview */}
          {orderData && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Shipping Address</h4>
              <div className="text-sm text-muted-foreground">
                {orderData.shipping_address?.street && (
                  <p>{orderData.shipping_address.street}</p>
                )}
                <p>
                  {orderData.shipping_address?.city},{' '}
                  {orderData.shipping_address?.state}{' '}
                  {orderData.shipping_address?.postal_code}
                </p>
                <p>{orderData.shipping_address?.country}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Shipment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
