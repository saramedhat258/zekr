"use client";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter()
    useEffect(() => {
      const timer = setTimeout(() => {
        router.replace('/home')
      }, 3000);
      return ()=> clearTimeout(timer)
    }, [router]) 

  return (

    <div className="relative h-screen bg-main-bg" >

      <Image
        src="/images/islamicpattern.png"
        className="opacity-50"
        alt="splach"
        loading="eager"
        fill
        
      />
      <div className=" absolute inset-0 flex items-center justify-center">
        <Image
          src="/images/logo.svg"
          alt="logo"
          width={200}
          height={200}
          className="logo sm:w-50 sm:h-50 w-32 h-32"
        />
      </div>
      
    </div >
  );
}
