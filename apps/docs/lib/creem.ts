const CREEM_API_KEY = process.env.CREEM_API_KEY;
const CREEM_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.creem.io"
    : "https://test-api.creem.io";

export interface CreemCheckoutOptions {
  productId: string;
  requestId?: string;
  successUrl?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface CreemCheckout {
  id: string;
  checkout_url: string;
  status: string;
}

export async function createCheckout(
  options: CreemCheckoutOptions
): Promise<CreemCheckout> {
  const response = await fetch(`${CREEM_BASE_URL}/v1/checkouts`, {
    method: "POST",
    headers: {
      "x-api-key": CREEM_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: options.productId,
      request_id: options.requestId,
      success_url: options.successUrl,
      customer: options.customerEmail
        ? { email: options.customerEmail }
        : undefined,
      metadata: options.metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Creem checkout failed: ${error}`);
  }

  return response.json();
}

export async function validateLicense(licenseKey: string) {
  const response = await fetch(`${CREEM_BASE_URL}/v1/licenses/validate`, {
    method: "POST",
    headers: {
      "x-api-key": CREEM_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key: licenseKey }),
  });

  if (!response.ok) {
    return { valid: false, status: "error" };
  }

  const result = await response.json();
  return {
    valid: result.status === "active",
    status: result.status,
    subscription: result.subscription,
  };
}

// Product IDs - create these in your Creem dashboard.
// Two-option pricing: a monthly subscription and a one-time lifetime purchase.
export const PRODUCTS = {
  monthly: process.env.CREEM_PRODUCT_MONTHLY || "",
  lifetime: process.env.CREEM_PRODUCT_LIFETIME || "",
};
