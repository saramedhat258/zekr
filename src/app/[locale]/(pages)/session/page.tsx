"use client";
import Image from 'next/image';
import Header from '../../components/Header'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CounterCircle from '../../components/session/CounterCircle';
import Btn from '../../components/session/Btn';
import { useZekrSpeechRecognition } from '../../hooks/useZekrSpeechRecognition';
import { useLocale } from 'next-intl';

function Session() {
    const t = useTranslations("Session")
    const locale = useLocale()
    const [start, setStart] = useState(0)
    const [btnState, setBtnState] = useState("")
    const router = useRouter()

    const zekr = window.sessionStorage.getItem("zekr")
    const zekrobj = zekr ? JSON.parse(zekr) : null
    const count = Number(window.sessionStorage.getItem("zekrCount"))
    const ringtone = window.sessionStorage.getItem("ringtone")
    const ringtoneobj = ringtone ? JSON.parse(ringtone) : null
    const audioRef = useRef<HTMLAudioElement>(null)
    useEffect(() => {
        if (!audioRef.current || count !== start) return;
        audioRef.current.load();
        audioRef.current?.play()
    })

    const increase = () => {
        count !== start && setStart(start + 1)
    }

    // Voice counting: while btnState === "started", listen to the mic and
    // auto-increment every time the user says the current dhikr out loud.
    const { isSupported: speechSupported, error: speechError } = useZekrSpeechRecognition({
        targetPhrase: zekrobj?.arabic || "",
        active: btnState === "started" && start < count,
        locale: locale === "ar" ? "ar-EG" : "en-US",
        onMatch: (times) => {
            setStart((prev) => Math.min(count, prev + times));
        },
    })

    return (
        <div >
            <Header />
            <div className='mt-5' onClick={increase}>
                <div className='w-fit m-auto flex gap-2 px-5 p-2 font-light rounded-3xl text-[#786F59] bg-[#FAF4E3]'>
                    <Image src={btnState === "started" ? "/images/audio-wave.svg" : "/images/micgray.svg"} alt="mic" width={15} height={15} />
                    {btnState === "started" ? <p>{t("listeningNow")}</p> : <p>{t("listeningReady")}</p>}
                </div>
                {btnState === "started" && !speechSupported && (
                    <p className='text-center text-sm text-red-500 mt-2'>{t("speechNotSupported")}</p>
                )}
                {btnState === "started" && speechSupported && speechError && (
                    <p className='text-center text-sm text-red-500 mt-2'>{t("micError")}</p>
                )}
                <CounterCircle start={start} count={count} setStart={setStart} setBtnState={setBtnState} />
                <div className='flex flex-col gap-1 items-center p-5 mt-10'>
                    <p className=' text-5xl mb-2 font-bold'>{zekrobj.arabic}</p>
                    <p className='text-zekr-gray'>{zekrobj.transliteration}</p>
                    <p className='text-2xl font-medium text-zekr-gray'>{zekrobj.translation}</p>
                </div>
            </div>
            {/* buttons /////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className='flex flex-col md:flex-row gap-5 sm:w-1/2 m-auto'>
                {btnState === "started" && start !== count ?
                    <Btn src='/images/pause.svg' alt='pause' text={t("pauseSession")} onClick={() => setBtnState("start")} />
                    : start === count ?
                        <Btn src="/images/play.svg" alt='play' text={t("restartSession")} onClick={() => setStart(0)} />
                        :
                        <Btn src="/images/mic2.svg" alt='mic' text={t("startSession")} onClick={() => setBtnState("started")} />
                }
                <Btn src="/images/change.svg" alt='change' text={t("changeZekr")} onClick={() => router.back()} style='border border-dark-green text-dark-green' />
            </div >

            {/* note ///////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className='md:mt-0 text-center mt-5 flex gap-2 justify-center text-zekr-gray text-sm'>
                <Image src="/images/alert-circle.svg" alt='alert' width={20} height={20} />
                <p>{t("note")}</p>
            </div>

            {/* audio///////////////////////////////////////////////////////////////////////////////////////////////// */}
            <audio ref={audioRef} src={ringtoneobj} preload="auto" />
        </div >
    )
}

export default Session