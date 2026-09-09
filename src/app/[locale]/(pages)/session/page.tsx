/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import CounterCircle from '../../components/session/CounterCircle';
import Btn from '../../components/session/Btn';
import { useZekrSpeechRecognition } from '../../hooks/useZekrSpeechRecognition';
import { DhikrItem } from '../../types';

function Session() {
    const t = useTranslations("Session");
    const [start, setStart] = useState(0);
    const [btnState, setBtnState] = useState("");
    const router = useRouter();

    const [zekrobj, setZekrobj] = useState<DhikrItem | null>(null);
    const [count, setCount] = useState<number>(0);
    const [ringtoneobj, setRingtoneobj] = useState<string>("/sounds/soft-chime.mp3");
    const [isLoaded, setIsLoaded] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsOffline(!navigator.onLine);
            const handleOnline = () => setIsOffline(false);
            const handleOffline = () => setIsOffline(true);
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            const zekr = window.sessionStorage.getItem("zekr");
            const parsedZekr = zekr ? JSON.parse(zekr) : null;
            const zekrCount = Number(window.sessionStorage.getItem("zekrCount")) || 33;
            const ringtone = window.sessionStorage.getItem("ringtone");
            const parsedRingtone = ringtone ? JSON.parse(ringtone) : "/sounds/soft-chime.mp3";

            if (!parsedZekr || !parsedZekr.arabic) {
                router.replace('/home');
                return;
            }

            setZekrobj(parsedZekr);
            setCount(zekrCount);
            setRingtoneobj(parsedRingtone);
            setIsLoaded(true);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, [router]);

    useEffect(() => {
        if (!audioRef.current || start === 0 || count !== start) return;
        audioRef.current.load();
        audioRef.current?.play();
    }, [start, count]);

    const increase = () => {
        count !== start && setStart(start + 1);
    };

    // Voice counting: while btnState === "started" and online, listen to mic
    const { isSupported: speechSupported, error: speechError } = useZekrSpeechRecognition({
        targetPhrase: zekrobj?.arabic || "",
        active: btnState === "started" && start < count && !isOffline,
        locale: "ar-EG",
        onMatch: (times) => {
            setStart((prev) => Math.min(count, prev + times));
        },
    });

    if (!isLoaded || !zekrobj) {
        return null;
    }

    return (
        <div>
            <div className='mt-5' onClick={increase}>
                <div className='w-fit m-auto flex gap-2 px-5 p-2 font-light rounded-3xl text-[#786F59] bg-[#FAF4E3]'>
                    <Image src={btnState === "started" ? "/images/audio-wave.svg" : "/images/micgray.svg"} alt="mic" width={15} height={15} />
                    {btnState === "started" ? <p>{t("listeningNow")}</p> : <p>{t("listeningReady")}</p>}
                </div>

                {isOffline && (
                    <p className='text-center text-sm mb-5 text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl max-w-md m-auto mt-3 font-medium'>
                        {t("offlineAiNotice")}
                    </p>
                )}

                {!isOffline && btnState === "started" && !speechSupported && (
                    <p className='text-center text-sm text-red-500 mt-2'>{t("speechNotSupported")}</p>
                )}
                {!isOffline && btnState === "started" && speechSupported && speechError && (
                    <p className='text-center text-sm text-red-500 mt-2'>{t("micError")}</p>
                )}

                <CounterCircle start={start} count={count} setStart={setStart} setBtnState={setBtnState} isoffline={isOffline} />
                <div className='flex flex-col gap-1 text-center items-center p-5 sm:mt-10 mt-3'>
                    <p className=' sm:text-5xl text-4xl mb-2 font-bold'>{zekrobj.arabic}</p>
                    <p className='text-zekr-gray'>{zekrobj.transliteration}</p>
                    <p className='sm:text-2xl text-xl font-medium text-zekr-gray'>{zekrobj.translation}</p>
                </div>
            </div>
            {/* buttons /////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className='flex flex-col md:flex-row sm:gap-5 gap-2 lg:w-1/2 sm:w-3/4 m-auto'>
                {btnState === "started" && start !== count ?
                    <Btn src='/images/pause.svg' alt='pause' text={t("pauseSession")} onClick={() => setBtnState("start")} />
                    : start === count ?
                        <Btn src="/images/play.svg" alt='play' text={t("restartSession")} onClick={() => setStart(0)} />
                        :
                        <Btn src="/images/mic2.svg" alt='mic' text={t("startSession")} onClick={() => setBtnState("started")} />
                }
                <Btn src="/images/change.svg" alt='change' text={t("changeZekr")} onClick={() => router.back()} style='border border-dark-green text-dark-green' />
            </div>

            {/* note ///////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div className='md:mt-0 text-center mt-5 flex gap-2 justify-center text-zekr-gray text-sm'>
                <Image src="/images/alert-circle.svg" alt='alert' width={20} height={20} />
                <p>{t("note")}</p>
            </div>

            {/* audio///////////////////////////////////////////////////////////////////////////////////////////////// */}
            <audio ref={audioRef} src={ringtoneobj} preload="auto" />
        </div>
    );
}

export default Session;