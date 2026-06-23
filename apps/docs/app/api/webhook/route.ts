import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET;

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const computed = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return computed === signature;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("creem-signature");
  const rawBody = await req.text();

  if (
    !WEBHOOK_SECRET ||
    !signature ||
    !verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  switch (event.eventType) {
    case "checkout.completed":
      // Payment successful - grant access
      console.log("Checkout completed:", event.object);
      // TODO: Create user license in database
      break;

    case "subscription.paid":
      // Recurring payment - extend access
      console.log("Subscription paid:", event.object);
      // TODO: Extend user access period
      break;

    case "subscription.canceled":
      // Subscription ended
      console.log("Subscription canceled:", event.object);
      // TODO: Revoke access at period end
      break;

    case "subscription.expired":
      // Subscription expired
      console.log("Subscription expired:", event.object);
      // TODO: Revoke access
      break;

    case "refund.created":
      // Refund processed
      console.log("Refund created:", event.object);
      // TODO: Handle refund - may revoke access
      break;

    default:
      console.log("Unhandled event:", event.eventType);
  }

  return NextResponse.json({ received: true });
}
