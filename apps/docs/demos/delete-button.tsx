"use client";

import { DeleteButton } from "devignerui";

export default function DeleteButtonDemo() {
  // A promise, so the pending phase plays too - a synchronous confirm cuts
  // straight from the question to the tick.
  return <DeleteButton onConfirm={() => new Promise((resolve) => setTimeout(resolve, 900))} />;
}
