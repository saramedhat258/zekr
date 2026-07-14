"use client";
import { createContext, useContext, useState } from "react";
import { DhikrItem } from "../types";

interface ZekrContextType {
  zekr: DhikrItem;
  setZekr: (item: DhikrItem) => void;
  count: number;
  setCount: (count: number) => void;
  ringtone: string;
  setRingtone: (ringtone: string) => void;
  zekrErr: string;
  setZekrErr: (zekrErr: string) => void;
  setCountErr: (countErr: string) => void;
  countErr: string;
}

export const ZekrContext = createContext<ZekrContextType | undefined>(undefined);
export const ZekrProvider = ({ children }: { children: React.ReactNode }) => {
  const [zekr, setZekr] = useState<DhikrItem>({ id: 0, arabic: "", translation: "", transliteration: "" });
  const [zekrErr, setZekrErr] = useState("");
  const [count, setCount] = useState(0);
  const [countErr, setCountErr] = useState("");
  const [ringtone, setRingtone] = useState("/sounds/soft-chime.mp3");


  const zekrValues = {
    zekr,
    setZekr,
    zekrErr,
    setZekrErr,
    count,
    setCount,
    setCountErr,
    countErr,
    ringtone,
    setRingtone
  };

  return (
    <ZekrContext.Provider value={zekrValues}>
      {children}
    </ZekrContext.Provider>
  );
};

export const useZekr = () => {
  const context = useContext(ZekrContext);
  if (context === undefined) {
    throw new Error("useZekr must be used within a ZekrProvider");
  }
  return context;
};