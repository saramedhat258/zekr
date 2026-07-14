"use client";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter()
    const locale = useLocale()
    useEffect(() => {
      const timer = setTimeout(() => {
        router.replace(`${locale}/home`)
      }, 3000);
      return ()=> clearTimeout(timer)
    }, [router,locale]) 

  return (

    <div className="relative h-screen bg-main-bg" >

      <Image
        src="/images/islamicpattern.png"
        alt="splach"
        loading="eager"
        fill
        
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/images/logo.svg"
          alt="logo"
          width={200}
          height={200}
          className="logo"
        />
      </div>
      
    </div >
  );
}
