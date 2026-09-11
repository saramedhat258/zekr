"use client";

import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        console.log("SW registered:", reg.scope);

        // After the SW activates, warm the cache by fetching the main pages.
        // The SW's fetch handler will intercept and cache every _next/ chunk
        // that the server returns, ensuring offline-first works next time.
        const warmCache = async () => {
          const pages = ["/ar/home", "/en/home"];
          await Promise.allSettled(
            pages.map((page) =>
              fetch(page, { credentials: "same-origin", cache: "no-cache" })
                .catch(() => {})
            )
          );
        };

        if (reg.active) {
          // SW already active (returning visit) — warm quietly
          warmCache();
        } else {
          // First install — wait for it to activate then warm
          const newWorker = reg.installing || reg.waiting;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                warmCache();
              }
            });
          }
        }
      })
      .catch((err) => {
        console.error("SW registration failed:", err);
      });
  }, []);

  return null;
}
