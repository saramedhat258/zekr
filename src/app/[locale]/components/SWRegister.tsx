"use client";

import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("SW registered:", reg.scope);

        // When online: warm the cache proactively after the SW activates.
        // This ensures the next offline visit has HTML pages cached too.
        const warmCache = () => {
          if (!navigator.onLine) return; // don't bother if already offline
          const pages = ["/ar/home", "/en/home", "/ar", "/en", "/ar/session", "/en/session"];
          Promise.allSettled(
            pages.map((page) =>
              fetch(page, { credentials: "same-origin", cache: "no-cache" }).catch(() => {})
            )
          );
        };

        if (reg.active) {
          warmCache();
        } else {
          const worker = reg.installing || reg.waiting;
          if (worker) {
            worker.addEventListener("statechange", () => {
              if (worker.state === "activated") warmCache();
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
