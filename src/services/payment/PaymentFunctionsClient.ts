export type CreatePaymentPayload = {
  orderId: string;
  amountUSD: number;
  customerId: string;
  guestEmail?: string;
};

export type CreatePaymentResponse = {
  id: string;
  paymentId: string;
  paymentStatus: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  priceAmount: number;
  paymentUrl: string;
  expirationEstimateDate?: string;
};

export const createPayment = async (payload: CreatePaymentPayload) => {
  const response = await fetch("/functions/v1/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Create payment failed");
  }

  const data = (await response.json()) as Omit<CreatePaymentResponse, "id">;
  return {
    ...data,
    id: data.paymentId,
  } as CreatePaymentResponse;
};

export const getPaymentStatus = async (paymentId: string) => {
  const response = await fetch("/functions/v1/payment-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Get payment status failed");
  }

  return (await response.json()) as { status: string; rawStatus?: string; actuallyPaid?: number };
};
