import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { PaymentAmount } from './PaymentAmount';
import { PaymentAddress } from './PaymentAddress';
import { PaymentStatus } from './PaymentStatus';
import { useToast } from '../../hooks/use-toast';
import type { CryptoPaymentIntent, PaymentStatus as PaymentStatusType } from '../../types/payment';
import { createPayment } from '../../services/payment/PaymentFunctionsClient';

interface CryptoPaymentProps {
  orderId: string;
  amountUSD: number;
  customerId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CryptoPayment({
  orderId,
  amountUSD,
  customerId,
  onSuccess,
  onCancel,
}: CryptoPaymentProps) {
  const [payment, setPayment] = useState<CryptoPaymentIntent | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreatePayment = async () => {
    try {
      setLoading(true);
      const paymentIntent = await createPayment({ orderId, amountUSD, customerId });
      setPayment({
        id: paymentIntent.id,
        paymentId: paymentIntent.paymentId,
        payAddress: paymentIntent.payAddress,
        payAmount: paymentIntent.payAmount,
        payCurrency: paymentIntent.payCurrency,
        priceAmount: paymentIntent.priceAmount,
        paymentUrl: paymentIntent.paymentUrl,
        expirationDate: paymentIntent.expirationEstimateDate
          ? new Date(paymentIntent.expirationEstimateDate)
          : new Date(),
        status: paymentIntent.paymentStatus as PaymentStatusType,
      });
      toast({
        title: 'Payment Created',
        description: 'Please send the payment to the address shown',
      });
    } catch (err) {
      toast({
        title: 'Payment Failed',
        description: err instanceof Error ? err.message : 'Failed to create payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: PaymentStatusType) => {
    if (status === 'succeeded') {
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been confirmed',
      });
      onSuccess?.();
    }
  };

  if (payment) {
    return (
      <div className="space-y-6">
        <PaymentStatus
          paymentId={payment.id}
          onStatusChange={handleStatusChange}
        />
        <PaymentAddress payment={payment} />
        <Button variant="outline" onClick={onCancel} className="w-full">
          Cancel Payment
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">USDT Payment</h2>
        
        <div className="space-y-6">
          <PaymentAmount amountUSD={amountUSD} cryptoCurrency="USDT" />

          <div className="flex space-x-3">
            <Button
              onClick={handleCreatePayment}
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Payment
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
