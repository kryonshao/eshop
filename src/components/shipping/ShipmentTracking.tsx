import { useEffect, useState } from 'react';
import { Package, Loader2, MapPin, Calendar } from 'lucide-react';
import { shippingService } from '../../services/shipping/ShippingService';
import type { TrackingInfo } from '../../types/shipping';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrackingTimeline } from './TrackingTimeline';
import { Alert, AlertDescription } from '../ui/alert';

interface ShipmentTrackingProps {
  shipmentId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export function ShipmentTracking({
  shipmentId,
  autoRefresh = false,
  refreshInterval = 30,
}: ShipmentTrackingProps) {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrackingInfo();

    if (autoRefresh) {
      const interval = setInterval(fetchTrackingInfo, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [shipmentId, autoRefresh, refreshInterval]);

  const fetchTrackingInfo = async () => {
    try {
      setError(null);
      const info = await shippingService.getTrackingInfo(shipmentId);
      setTrackingInfo(info);
    } catch (err) {
      console.error('Error fetching tracking info:', err);
      setError('Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading tracking information...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (error || !trackingInfo) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Tracking information not available'}</AlertDescription>
      </Alert>
    );
  }

  const { shipment, events, currentStatus, estimatedDelivery, actualDelivery } = trackingInfo;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-500',
      picked_up: 'bg-blue-500',
      in_transit: 'bg-blue-600',
      out_for_delivery: 'bg-purple-500',
      delivered: 'bg-green-500',
      failed: 'bg-red-500',
      cancelled: 'bg-gray-400',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shipment Tracking
            </CardTitle>
            <Badge className={getStatusColor(currentStatus)}>
              {getStatusLabel(currentStatus)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tracking Number */}
          {shipment.trackingNumber && (
            <div>
              <div className="text-sm text-muted-foreground">Tracking Number</div>
              <div className="font-mono font-semibold">{shipment.trackingNumber}</div>
            </div>
          )}

          {/* Carrier */}
          <div>
            <div className="text-sm text-muted-foreground">Carrier</div>
            <div className="font-medium">{shipment.providerName}</div>
          </div>

          {/* Delivery Address */}
          <div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Delivery Address
            </div>
            <div className="text-sm">
              {shipment.destinationAddress.addressLine1}
              {shipment.destinationAddress.addressLine2 && (
                <>, {shipment.destinationAddress.addressLine2}</>
              )}
              <br />
              {shipment.destinationAddress.city}, {shipment.destinationAddress.state}{' '}
              {shipment.destinationAddress.postalCode}
              <br />
              {shipment.destinationAddress.country}
            </div>
          </div>

          {/* Estimated/Actual Delivery */}
          <div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {actualDelivery ? 'Delivered On' : 'Estimated Delivery'}
            </div>
            <div className="font-medium">
              {actualDelivery
                ? actualDelivery.toLocaleDateString()
                : estimatedDelivery
                ? estimatedDelivery.toLocaleDateString()
                : 'Not available'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Timeline */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tracking History</CardTitle>
          </CardHeader>
          <CardContent>
            <TrackingTimeline events={events} currentStatus={currentStatus} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
