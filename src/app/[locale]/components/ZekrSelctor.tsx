"use client";
import { useTranslations } from "next-intl";
import ZekrCard from "./ZekrCard";
import { useState } from "react";
import { useZekr } from "../context/ZekrContext";
import { DhikrItem } from "../types";


function ZekrSelctor() {
    const t = useTranslations("ZekrSelector")
    const [isSelected, setIsSelected] = useState(-1)
    const { zekrErr } = useZekr()

    const dhikrList: DhikrItem[] = [
        { id: 1, arabic: "اللَّهُ أَكْبَر", transliteration: "Allahu Akbar", translation: "Allah is Greatest" },
        { id: 2, arabic: "الْحَمْدُ لِلَّهِ", transliteration: "Alhamdulillah", translation: "All praise to Allah" },
        { id: 3, arabic: "سُبْحَانَ اللَّهِ", transliteration: "Subhan Allah", translation: "Glory be to Allah" },
        { id: 4, arabic: "أَسْتَغْفِرُ اللَّه", transliteration: "Astaghfirullah", translation: "I seek forgiveness" },
        { id: 5, arabic: "لاَ إِلَهَ إِلاَّ اللَّه", transliteration: "La ilaha illallah", translation: "No god but Allah" },
        { id: 6, arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", transliteration: "Subhanallahi wa bihamdihi", translation: "Glory & Praise" }
    ];
    return (
        <div >
            <div className="flex flex-col mt-16 gap-2">
                <p className="text-2xl font-medium">1. {t("title")}</p>
                <p className="text-[16px] text-zekr-gray">{t("description")}</p>
            </div>
            {/* zekr */}
            <div className="w-full flex flex-wrap gap-5 justify-between mt-10">
                {
                    dhikrList.map(d => <ZekrCard key={d.id} dhikr={d} isSelected={isSelected} setIsSelected={setIsSelected} />)
                }
            </div>
            {zekrErr && <div className="text-sm my-3 text-red-600">{zekrErr}</div>}
        </div>
    )
}

export default ZekrSelctor