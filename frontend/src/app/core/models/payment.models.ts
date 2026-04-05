export interface PaymentRequest {
  orderId: string;
  amount: number;
}

export interface PaymentResult {
  orderId: string;
  transactionId: string;
  amount: number;
}
