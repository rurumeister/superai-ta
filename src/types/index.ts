export interface CheckoutRequest {
  amount: number;
  email: string;
}

export interface CheckoutResponse {
  success: boolean;
  data?: {
    payment_url: string;
    checkout_id: string;
    expires_at: string;
  };
  error?: string;
}

export interface WebhookPayload {
  id: string;
  type: "charge:created" | "charge:confirmed" | "charge:failed";
  created_at: string;
  data: {
    id: string;
    code: string;
    name: string;
    description: string;
    pricing: {
      local: { amount: string; currency: string };
      bitcoin: { amount: string; currency: string };
    };
    metadata: {
      email: string;
      checkout_id: string;
    };
    timeline: Array<{
      time: string;
      status: string;
    }>;
  };
}

export interface Transaction {
  id: string;
  checkout_id: string;
  email: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "expired";
  coinbase_charge_id?: string;
  coinbase_charge_code?: string;
  payment_url?: string;
  expires_at?: Date;
  confirmed_at?: Date;
  created_at: Date;
  updated_at: Date;
}
