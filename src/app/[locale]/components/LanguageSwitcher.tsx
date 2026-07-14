"use client";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const switchLanguage = () => {
        router.replace(pathname, {
            locale: locale === "ar" ? "en" : "ar",
        });
    };

    const lang = useTranslations("Header")
    return (
        <button
            onClick={switchLanguage}
            className="p-2 px-3 rounded-md border-2 border-main-biege font-bold text-dark-green cursor-pointer"
        >
            {lang("switchLanguage")}
        </button>
    )
}

export default LanguageSwitcher