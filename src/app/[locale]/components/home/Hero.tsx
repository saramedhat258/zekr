"use client";
import { useTranslations } from "next-intl";

function Hero() {
    const t = useTranslations("Home")
    return (
        <div className="w-full flex flex-col items-center gap-3 mt-10">
            <h1 className="text-dark-green text-[40px] font-medium">{t("heroTitle")}</h1>
            <h4 className="text-zekr-gray text-lg">{t("heroDescription")}</h4>
        </div>
    )
}

export default Hero