// Payment types for cryptocurrency payments

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'succeeded' 
  | 'failed' 
  | 'canceled'
  | 'expired';

export type RefundStatus = 'pending' | 'completed' | 'failed';

export interface Payment {
  id: string;
  order_id: string;
  payment_method: 'crypto';
  nowpayments_payment_id?: string;
  pay_address?: string;
  pay_amount?: number;
  pay_currency?: string;
  price_amount: number;
  price_currency: 'USD';
  exchange_rate?: number;
  status: PaymentStatus;
  payment_url?: string;
  expiration_date?: Date;
  actually_paid?: number;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Refund {
  id: string;
  payment_id: string;
  amount_usd: number;
  crypto_amount?: number;
  crypto_currency?: string;
  exchange_rate?: number;
  reason?: string;
  status: RefundStatus;
  refund_id?: string;
  created_at: Date;
  completed_at?: Date;
}

export interface CryptoCurrency {
  code: string;
  name: string;
  network?: string;
  minAmount: number;
  maxAmount: number;
}

export interface CreateCryptoPaymentParams {
  orderId: string;
  amountUSD: number;
  cryptoCurrency: string;
  customerId: string;
}

export interface CryptoPaymentIntent {
  id: string;
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  priceAmount: number;
  paymentUrl: string;
  qrCodeUrl?: string;
  expirationDate: Date;
  status: PaymentStatus;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  transactionId?: string;
  actuallyPaid?: number;
  error?: string;
}

export interface RefundParams {
  paymentId: string;
  amountUSD: number;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amountUSD: number;
  cryptoAmount: number;
  cryptoCurrency: string;
  status: RefundStatus;
}

export interface PriceEstimateParams {
  amountUSD: number;
  cryptoCurrency: string;
}

export interface CryptoPriceEstimate {
  amountUSD: number;
  cryptoAmount: number;
  cryptoCurrency: string;
  exchangeRate: number;
  estimatedAt: Date;
}

// NOWPayments API types
export interface CryptoPaymentParams {
  orderId: string;
  priceAmount: number;
  priceCurrency: 'USD';
  payCurrency: string;
  ipnCallbackUrl: string;
  orderDescription: string;
}

export interface CryptoPaymentResponse {
  paymentId: string;
  paymentStatus: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  priceAmount: number;
  priceCurrency: 'USD';
  paymentUrl: string;
  expirationEstimateDate: string;
}
