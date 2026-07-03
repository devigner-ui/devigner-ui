import { NextRequest, NextResponse } from "next/server";
import { createCheckout, PRODUCTS } from "../../../lib/creem";

export async function POST(req: NextRequest) {
  try {
    const { plan, billing, email } = await req.json();

    // plan is the product key directly: "monthly" | "lifetime"
    const productId = PRODUCTS[plan as keyof typeof PRODUCTS];

    if (!productId) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const checkout = await createCheckout({
      productId,
      successUrl: `${baseUrl}/checkout/success?checkout_id={checkout_id}`,
      customerEmail: email,
      metadata: {
        plan,
        billing,
      },
    });

    return NextResponse.json({ checkout_url: checkout.checkout_url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
