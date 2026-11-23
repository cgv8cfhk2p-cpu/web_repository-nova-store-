"use client";

import { useEffect } from "react";

export function CancelOrder({ orderId }: { orderId: string }) {
  useEffect(() => {
    fetch("/api/checkout/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).catch(() => {});
  }, [orderId]);
  return null;
}
