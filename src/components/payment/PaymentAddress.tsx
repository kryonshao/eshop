import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import type { CryptoPaymentIntent } from '../../types/payment';

interface PaymentAddressProps {
  payment: CryptoPaymentIntent;
}

export function PaymentAddress({ payment }: PaymentAddressProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(payment.payAddress);
      setCopied(true);
      toast({
        title: 'Address Copied',
        description: 'Payment address copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy address to clipboard',
        variant: 'destructive',
      });
    }
  };

  const openPaymentUrl = () => {
    window.open(payment.paymentUrl, '_blank');
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Payment Address</h3>
          
          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-lg">
              <QRCodeSVG
                value={payment.payAddress}
                size={192}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Payment Address */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Send exactly <span className="font-semibold">{payment.payAmount} {payment.payCurrency}</span> to:
            </p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-3 bg-muted rounded text-sm break-all">
                {payment.payAddress}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyAddress}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Important:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Send the exact amount shown above</li>
            <li>Payment will be confirmed after network confirmations</li>
            <li>Do not close this page until payment is confirmed</li>
            <li>
              Payment expires at{' '}
              {new Date(payment.expirationDate).toLocaleString()}
            </li>
          </ul>
        </div>

        {/* External Payment Link */}
        <Button
          variant="outline"
          className="w-full"
          onClick={openPaymentUrl}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in NOWPayments
        </Button>
      </div>
    </Card>
  );
}
