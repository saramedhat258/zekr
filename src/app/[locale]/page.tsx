import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <div className="p-8 max-w-xl mx-auto space-y-4">
      <h1 className="text-3xl font-medium">{t("heroTitle")}</h1>
      <p className="text-gray-600">{t("heroDescription")}</p>
    </div>
  );
}
