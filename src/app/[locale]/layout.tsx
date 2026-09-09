import type { Metadata, Viewport } from "next";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { myArabicFont } from "@/fonts";
import { ZekrProvider } from "./context/ZekrContext";
import SWRegister from "./components/SWRegister";
import PWAInstallBanner from "./components/PWAInstallBanner";

export const metadata: Metadata = {
  title: "Zekr App - تطبيق ذكر",
  description: "تطبيق ذكر وتسبيح تفاعلي بالصوت والعد اليدوي",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zekr App",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#095543",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <body className={myArabicFont.variable}>
        <SWRegister />
        <ZekrProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
            <PWAInstallBanner />
          </NextIntlClientProvider>
        </ZekrProvider>
      </body>
    </html>
  );
}
