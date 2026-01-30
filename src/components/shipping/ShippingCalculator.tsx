import { useEffect, useState } from 'react';
import { Loader2, Truck } from 'lucide-react';
import { shippingService } from '../../services/shipping/ShippingService';
import { shippingRateCalculator } from '../../services/shipping/ShippingRateCalculator';
import type { ShippingOption, Address } from '../../types/shipping';
import { Alert, AlertDescription } from '../ui/alert';

interface ShippingCalculatorProps {
  items: Array<{
    weight?: number;
    quantity: number;
  }>;
  destination?: Address;
  orderAmount: number;
  onShippingOptionSelected?: (option: ShippingOption) => void;
  selectedOption?: ShippingOption;
}

export function ShippingCalculator({
  items,
  destination,
  orderAmount,
  onShippingOptionSelected,
  selectedOption,
}: ShippingCalculatorProps) {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!destination) {
      setOptions([]);
      return;
    }

    calculateShipping();
  }, [destination, items, orderAmount]);

  const calculateShipping = async () => {
    if (!destination) return;

    setLoading(true);
    setError(null);

    try {
      const calculatedOptions = await shippingService.calculateShippingOptions({
        items,
        destination,
        orderAmount,
      });

      setOptions(calculatedOptions);

      // Auto-select cheapest option if none selected
      if (!selectedOption && calculatedOptions.length > 0 && onShippingOptionSelected) {
        const cheapest = shippingRateCalculator.getCheapestOption(calculatedOptions);
        if (cheapest) {
          onShippingOptionSelected(cheapest);
        }
      }
    } catch (err) {
      console.error('Error calculating shipping:', err);
      setError('Failed to calculate shipping options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!destination) {
    return (
      <Alert>
        <Truck className="h-4 w-4" />
        <AlertDescription>
          Please enter a delivery address to calculate shipping costs.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">
          Calculating shipping options...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (options.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No shipping options available for this destination.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Shipping Options</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.providerCode}
            onClick={() => onShippingOptionSelected?.(option)}
            className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
              selectedOption?.providerCode === option.providerCode
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">{option.providerName}</div>
                {option.description && (
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  {shippingRateCalculator.formatDeliveryTime(
                    option.estimatedDaysMin,
                    option.estimatedDaysMax
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {option.isFreeShipping ? (
                  <span className="text-green-600">FREE</span>
                ) : (
                  shippingRateCalculator.formatFee(option.fee)
                )}
              </div>
              {option.isFreeShipping && (
                <div className="text-xs text-green-600">Free shipping applied</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
