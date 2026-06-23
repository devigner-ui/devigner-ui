#!/usr/bin/env node

/**
 * Creem Product Setup Guide
 *
 * Run this script to get step-by-step instructions for setting up
 * products in your Creem dashboard.
 *
 * Usage: node scripts/setup-creem.mjs
 */

const products = [
  {
    name: "Devigner UI - Basic Monthly",
    key: "CREEM_PRODUCT_BASIC_MONTHLY",
    price: 900, // $9.00 in cents
    interval: "month",
    description: "Access to components released during subscription month",
  },
  {
    name: "Devigner UI - Basic Yearly",
    key: "CREEM_PRODUCT_BASIC_YEARLY",
    price: 7900, // $79.00 in cents
    interval: "year",
    description: "Access to components released during subscription month",
  },
  {
    name: "Devigner UI - Pro Monthly",
    key: "CREEM_PRODUCT_PRO_MONTHLY",
    price: 1900, // $19.00 in cents
    interval: "month",
    description: "Current + 2 previous months of components",
  },
  {
    name: "Devigner UI - Pro Yearly",
    key: "CREEM_PRODUCT_PRO_YEARLY",
    price: 17900, // $179.00 in cents
    interval: "year",
    description: "Current + 2 previous months of components",
  },
  {
    name: "Devigner UI - Ultra Monthly",
    key: "CREEM_PRODUCT_ULTRA_MONTHLY",
    price: 3900, // $39.00 in cents
    interval: "month",
    description: "Access to ALL components, no date restriction",
  },
  {
    name: "Devigner UI - Ultra Yearly",
    key: "CREEM_PRODUCT_ULTRA_YEARLY",
    price: 34900, // $349.00 in cents
    interval: "year",
    description: "Access to ALL components, no date restriction",
  },
  {
    name: "Devigner UI - Lifetime",
    key: "CREEM_PRODUCT_LIFETIME",
    price: 60000, // $600.00 in cents
    interval: null, // one-time
    description: "All components forever, lifetime updates",
  },
];

console.log("=".repeat(60));
console.log("  Devigner UI - Creem Product Setup Guide");
console.log("=".repeat(60));
console.log("");

console.log("STEP 1: Get your API key");
console.log("-".repeat(40));
console.log("1. Go to https://creem.io/dashboard");
console.log("2. Sign up or log in");
console.log("3. Go to Settings → API Keys");
console.log("4. Create a new API key");
console.log("5. Copy the key");
console.log("");

console.log("STEP 2: Create products");
console.log("-".repeat(40));
console.log("For each product below:");
console.log("  a. Go to Products → Create Product");
console.log("  b. Enter the name and description");
console.log("  c. Set the price (in cents)");
console.log("  d. Set the billing interval");
console.log("  e. Copy the product ID");
console.log("");

products.forEach((p, i) => {
  console.log(`${i + 1}. ${p.name}`);
  console.log(`   Price: $${(p.price / 100).toFixed(2)} ${p.interval || "(one-time)"}`);
  console.log(`   Description: ${p.description}`);
  console.log(`   Env var: ${p.key}=<your-product-id>`);
  console.log("");
});

console.log("STEP 3: Set up webhook");
console.log("-".repeat(40));
console.log("1. Go to Settings → Webhooks");
console.log("2. Add endpoint: https://your-domain.com/api/webhook");
console.log("3. Copy the webhook signing secret");
console.log("4. Set CREEM_WEBHOOK_SECRET in your .env");
console.log("");
console.log("Webhook events to subscribe to:");
console.log("  - checkout.completed");
console.log("  - subscription.paid");
console.log("  - subscription.canceled");
console.log("  - subscription.expired");
console.log("  - refund.created");
console.log("");

console.log("STEP 4: Create .env file");
console.log("-".repeat(40));
console.log("Copy .env.example to .env and fill in the values:");
console.log("");
console.log("  cp .env.example .env");
console.log("");

console.log("STEP 5: Test in sandbox");
console.log("-".repeat(40));
console.log("1. Use test API key (starts with 'test_')");
console.log("2. Use test product IDs");
console.log("3. Test with card: 4242 4242 4242 4242");
console.log("4. Run: pnpm dev");
console.log("5. Go to /pricing and test checkout");
console.log("");

console.log("=".repeat(60));
console.log("  Done! Run 'pnpm dev' to test locally.");
console.log("=".repeat(60));
