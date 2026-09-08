"use client";
import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl'
import { useZekr } from '../../context/ZekrContext';
import { useRef } from 'react';
import CustomSelect from '../home/CustomSelect';

function Ringtone() {
    const t = useTranslations("Ringtone")
    const { setRingtone, ringtone } = useZekr()

    const audioRef = useRef<HTMLAudioElement>(null)
    const playAudio = () => {
        if (!audioRef.current) return;
        audioRef.current.load();
        audioRef.current?.play()
    }
    return (
        <div className='my-10'>
            <audio ref={audioRef} src={ringtone} preload="auto" />
            <div className="flex flex-col mt-16 gap-2">
                <p className="sm:text-2xl text-xl font-medium">3. {t("title")}</p>
                <p className="text-[16px] text-zekr-gray">{t("description")}</p>
            </div>
            <div className='flex gap-2 mt-8'>
                <CustomSelect
                    value={ringtone}
                    onChange={setRingtone} />
                <button onClick={playAudio} className='bg-white border border-main-biege p-3 rounded-2xl text-dark-green '>
                    <Play className='cursor-pointer'/>
                </button>
            </div>
            <hr className='w-full text-light-zekr-gray my-10' />
        </div>
    )
}

export default Ringtone