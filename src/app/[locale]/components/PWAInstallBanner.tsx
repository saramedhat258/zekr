/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export default function PWAInstallBanner() {
  const t = useTranslations("PWA");
  const pathname = usePathname();

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if app is already installed
    const mediaQuery = window.matchMedia(
      "(display-mode: standalone)"
    );

    const isStandalone = () => {
      return (
        mediaQuery.matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes("android-app://")
      );
    };

    // If already installed, don't show banner
    if (isStandalone()) {
      setIsVisible(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser from showing its own mini-infobar
      e.preventDefault();

      // Save the event so we can trigger it later
      setDeferredPrompt(
        e as BeforeInstallPromptEvent
      );

      // Show banner only when installation is actually available
      if (
        pathname === "/home" ||
        pathname.endsWith("/home")
      ) {
        setIsVisible(true);
      }
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [pathname]);

  // Hide/show banner when navigating between pages
  useEffect(() => {
    if (
      pathname === "/home" ||
      pathname.endsWith("/home")
    ) {
      // Only show if install prompt is available
      if (deferredPrompt) {
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [pathname, deferredPrompt]);

  // Install PWA
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the browser's install dialog
    await deferredPrompt.prompt();

    // Wait for user's choice
    const { outcome } =
      await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsVisible(false);
    }

    // The prompt can only be used once
    setDeferredPrompt(null);
  };

  // Close banner
  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (
    !isVisible ||
    !deferredPrompt ||
    !(pathname === "/home" || pathname.endsWith("/home"))
  ) {
    return null;
  }

  return (
    <div
      className="
        fixed
        bottom-4
        left-4
        right-4
        md:left-auto
        md:right-6
        md:w-96
        z-50
        bg-[#f7f3e8d6]
        border-2
        border-main-biege
        shadow-xl
        rounded-2xl
        p-4
        sm:p-5
        text-dark-green
        transition-all
        duration-300
        animate-fade-in
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="
              p-3
              bg-dark-green
              text-white
              rounded-xl
              shrink-0
            "
          >
            <Download className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-bold text-lg leading-tight">
              {t("title")}
            </h3>

            <p className="text-xs text-zekr-gray mt-1 leading-snug">
              {t("description")}
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          type="button"
          aria-label={t("dismiss")}
          className="
            p-1
            text-zekr-gray
            hover:text-dark-green
            hover:bg-main-biege/50
            rounded-lg
            transition-colors
            cursor-pointer
            shrink-0
          "
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleInstallClick}
          type="button"
          className="
            w-full
            flex
            items-center
            justify-center
            gap-2
            bg-dark-green
            hover:bg-dark-green/95
            text-white
            font-medium
            py-2.5
            px-4
            rounded-xl
            shadow-sm
            transition-transform
            active:scale-[0.98]
            cursor-pointer
            text-sm
            sm:text-base
          "
        >
          <Download className="w-4 h-4" />

          <span>
            {t("installBtn")}
          </span>
        </button>
      </div>
    </div>
  );
}


