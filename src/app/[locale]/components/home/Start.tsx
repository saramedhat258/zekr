"use client";
import { useTranslations } from 'next-intl'
import Image from 'next/image';
import { useZekr } from '../../context/ZekrContext';
import { useRouter } from '@/i18n/navigation';

function Start() {
    const t = useTranslations("Privacy")
    const s = useTranslations("Actions")
    const e = useTranslations("Errors")

    const { zekr, count, setZekrErr, setCountErr } = useZekr()
    const router = useRouter()

    const handleClick = () => {
        if (zekr.id === 0) setZekrErr(e("zekrErr"))
        else setZekrErr("")

        if (count === 0) setCountErr(e("countErr"))
        else setCountErr("")

        if (zekr.id !== 0 && count !== 0)
            router.push("/session")
    }

    return (
        <div>
            <div className='mb-5 flex gap-5 items-center'>
                <div className='bg-light-green sm:p-4 p-3 rounded-2xl shrink-0'>
                    <Image src="/images/privacy.svg" alt='privacy' width={20} height={20} className='w-4 h-4 sm:w-5 sm:h-5' />
                </div>
                <div className="flex flex-col gap-1">
                    <p className="font-medium">{t("title")}</p>
                    <p className="text-sm text-zekr-gray">{t("description")}</p>
                </div>
            </div>
            <div className='flex gap-3 items-center p-3 bg-light-blue sm:text-[16px] text-sm border border-[#BCD4E6EE] rounded-2xl'>
                <Image src="/images/mic.svg" alt='privacy' width={20} height={20} />
                <p>{t("microphoneNotice")}</p>
            </div>
            <button onClick={handleClick} className=' [400px]:text-[16px] text-sm my-8 cursor-pointer text-white w-full p-4 flex gap-2 justify-center rounded-2xl bg-dark-green'>
                <Image src="/images/mic2.svg" alt='mic' width={15} height={15} />
                <p>{s("start")}</p>
            </button>
        </div>

    )
}

export default Start