import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { PaymentStatus as PaymentStatusType } from '../../types/payment';
import { getPaymentStatus } from '../../services/payment/PaymentFunctionsClient';

interface PaymentStatusProps {
  paymentId: string;
  onStatusChange?: (status: PaymentStatusType) => void;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'bg-yellow-500',
    variant: 'secondary' as const,
  },
  processing: {
    icon: Loader2,
    label: 'Processing',
    color: 'bg-blue-500',
    variant: 'default' as const,
  },
  succeeded: {
    icon: CheckCircle2,
    label: 'Succeeded',
    color: 'bg-green-500',
    variant: 'default' as const,
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'bg-red-500',
    variant: 'destructive' as const,
  },
  canceled: {
    icon: XCircle,
    label: 'Canceled',
    color: 'bg-gray-500',
    variant: 'secondary' as const,
  },
  expired: {
    icon: AlertCircle,
    label: 'Expired',
    color: 'bg-orange-500',
    variant: 'destructive' as const,
  },
};

export function PaymentStatus({ paymentId, onStatusChange }: PaymentStatusProps) {
  const [status, setStatus] = useState<PaymentStatusType>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
    
    // Poll status every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    
    return () => clearInterval(interval);
  }, [paymentId]);

  const checkStatus = async () => {
    try {
      const result = await getPaymentStatus(paymentId);
      setStatus(result.status as PaymentStatusType);
      onStatusChange?.(result.status as PaymentStatusType);
    } catch (err) {
      console.error('Failed to check payment status:', err);
    } finally {
      setLoading(false);
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${config.color} bg-opacity-10`}>
            <Icon
              className={`h-6 w-6 ${
                status === 'processing' ? 'animate-spin' : ''
              }`}
              style={{ color: config.color.replace('bg-', '') }}
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payment Status</p>
            <p className="text-lg font-semibold">{config.label}</p>
          </div>
        </div>
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      {status === 'pending' && (
        <p className="mt-4 text-sm text-muted-foreground">
          Waiting for payment confirmation...
        </p>
      )}

      {status === 'processing' && (
        <p className="mt-4 text-sm text-muted-foreground">
          Your payment is being processed. This may take a few minutes.
        </p>
      )}

      {status === 'succeeded' && (
        <p className="mt-4 text-sm text-green-600">
          Payment confirmed! Your order is being processed.
        </p>
      )}

      {status === 'failed' && (
        <p className="mt-4 text-sm text-destructive">
          Payment failed. Please try again or contact support.
        </p>
      )}

      {status === 'expired' && (
        <p className="mt-4 text-sm text-destructive">
          Payment expired. Please create a new payment.
        </p>
      )}
    </Card>
  );
}
