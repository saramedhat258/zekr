import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { myArabicFont } from "@/fonts"
import { ZekrProvider } from "./context/ZekrContext";


export const metadata: Metadata = {
  title: "Zekr App",
  description: "zekr app",
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
        <ZekrProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ZekrProvider>

      </body>
    </html>
  );
}
