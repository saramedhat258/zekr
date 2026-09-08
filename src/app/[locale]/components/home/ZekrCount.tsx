"use client";
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useState } from 'react';
import { useZekr } from '../../context/ZekrContext';

type propTypes = {
    count: number | string,
    setIsSelected: Dispatch<SetStateAction<number | string>>,
    isSelected: number | string
}
function ZekrCountCard({ count, isSelected, setIsSelected }: propTypes) {
    const { setCount } = useZekr()
    const handleclick = () => {
        setIsSelected(count)
        setCount(Number(count))
        window.sessionStorage.setItem("zekrCount", JSON.stringify(count))
    }
    return (
        <div onClick={handleclick} className={`${isSelected === count ? 'bg-dark-green text-white' : 'bg-white text-zekr-gray'} text-center lg:text-xl text-lg p-1 px-5 md:p-2 md:px-8 lg:p-3 lg:px-14 rounded-2xl border border-main-biege cursor-pointer`} >{count}</div>
    )
}

//todo: not allow zero or negative values تم
function ZekrCount() {
    const t = useTranslations("Counter")
    const [isSelected, setIsSelected] = useState<number | string>(-1)
    const zekrCount = [33, 99, 100, 500, t("unlimited")]
    const { setCount, countErr } = useZekr()
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") {
            setIsSelected(-1);
            return;
        }
        const numberValue = Number(value);
        if (numberValue === 0) {
            return;
        }
        setIsSelected(-1);
        setCount(numberValue);
        window.sessionStorage.setItem(
            "zekrCount",
            JSON.stringify(numberValue)
        );
    };

    return (
        <div className='my-10'>
            <div className="flex flex-col mt-16 gap-2">
                <p className="sm:text-2xl text-xl font-medium">2. {t("title")}</p>
                <p className="text-[16px] text-zekr-gray">{t("description")}</p>
            </div>
            <div className='my-8 flex flex-wrap justify-between gap-2'>
                {
                    zekrCount.map(z => <ZekrCountCard key={z} count={z} isSelected={isSelected} setIsSelected={setIsSelected} />)
                }
            </div>
            <div className='flex gap-3 items-center text-light-zekr-gray'>
                <hr className='w-full' />
                <p className='font-medium text-zekr-gray'>{t("or")}</p>
                <hr className='w-full' />
            </div>
            <div>
                <input type="number" 
                onKeyDown={(e) => {if (e.key === "-") e.preventDefault()}} 
                min={1} 
                onChange={handleChange} 
                name="zekrcount" 
                className='bg-white border text-zekr-gray focus:outline-0 border-main-biege w-full mt-5 p-3 rounded-2xl sm:placeholder:text-lg ' 
                placeholder={t("customPlaceholder")} />
            </div>

            {countErr && <div className="text-sm my-3 text-red-600">{countErr}</div>}
        </div>
    )
}

export default ZekrCount