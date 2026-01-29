import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import type { CryptoPriceEstimate } from '../../types/payment';

interface PaymentAmountProps {
  amountUSD: number;
  cryptoCurrency: string;
}

export function PaymentAmount({ amountUSD, cryptoCurrency }: PaymentAmountProps) {
  const [estimate, setEstimate] = useState<CryptoPriceEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cryptoCurrency) {
      loadEstimate();
    }
  }, [amountUSD, cryptoCurrency]);

  const loadEstimate = async () => {
    try {
      setLoading(true);
      setError(null);
      setEstimate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to estimate price');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadEstimate}
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!estimate) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          创建支付后会显示实时 USDT 支付金额。
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">You Pay (USD)</p>
          <p className="text-3xl font-bold">${amountUSD.toFixed(2)}</p>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-1">
            Amount in {cryptoCurrency}
          </p>
          <p className="text-2xl font-semibold">
            {estimate.cryptoAmount.toFixed(8)} {cryptoCurrency}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Exchange Rate</span>
          <span>
            1 USD = {estimate.exchangeRate.toFixed(8)} {cryptoCurrency}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Updated</span>
          <div className="flex items-center space-x-2">
            <span>{new Date(estimate.estimatedAt).toLocaleTimeString()}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadEstimate}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
