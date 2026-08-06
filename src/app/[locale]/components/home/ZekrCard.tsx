import React, { Dispatch, SetStateAction } from 'react'
import { DhikrItem } from "../../types";
import Image from 'next/image'
import { useZekr } from '../../context/ZekrContext'

type propTypes = {
    dhikr: DhikrItem,
    setIsSelected: Dispatch<SetStateAction<number>>,
    isSelected: number | null
}

function ZekrCard({ dhikr, isSelected, setIsSelected}: propTypes) {
    const {setZekr}=useZekr()
    const handleclick = () => {
        setIsSelected(dhikr.id)
        setZekr({ id: dhikr.id, arabic: dhikr.arabic, translation: dhikr.translation, transliteration: dhikr.transliteration })
        window.sessionStorage.setItem("zekr",JSON.stringify(dhikr))
    }
    return (
        <div onClick={handleclick} className={`border ${isSelected === dhikr.id ? 'border-dark-green' : 'border-main-biege'} cursor-pointer rounded-xl text-center lg:w-[30%] w-full p-5 bg-white`}>
            {isSelected === dhikr.id && <Image src="/images/selected.svg" alt='select icon' width={20} height={20} />}
            <div className='flex flex-col gap-1 items-center p-5'>
                <p className='text-dark-green text-2xl mb-2 font-bold'>{dhikr.arabic}</p>
                <p className='text-sm text-zekr-gray'>{dhikr.transliteration}</p>
                <p className='text-[16px] font-medium text-zekr-gray'>{dhikr.translation}</p>
            </div>
        </div>

    )
}

export default ZekrCard