import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Dispatch, SetStateAction, useState } from 'react';

type prop = {
    start: number,
    count: number,
    setStart: Dispatch<SetStateAction<number>>,
    setBtnState: Dispatch<SetStateAction<string>>
}

function CounterCircle({ start, count, setStart,setBtnState }: prop) {
    const t = useTranslations("Session")
    const [showTooltip, setShowTooltip] = useState(false);
    const progress = (start / count) * 100;
    const radius = 160;
    const stroke = 12;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    return (
        <div className='w-fit m-auto' >
            <div className='flex flex-col group relative'>
                <button
                    type="button"
                    onClick={(e) =>{e.stopPropagation(); setShowTooltip((prev) => !prev)}}
                    className="cursor-pointer"
                >
                    <Image
                        src="/images/tooltip.svg"
                        alt="tooltip"
                        width={20}
                        height={20}
                    />
                </button>
                <p className={`
                    absolute text-center text-sm sm:-right-26 z-20 top-8  w-3/4 bg-white rounded-2xl p-5 group-hover:block  shadow-lg
                    transition-all duration-200
                    ${showTooltip
                                        ? "opacity-100 visible"
                                        : "opacity-0 invisible group-hover:opacity-100 group-hover:visible"
                                    }
                    `}>{t("tooltip")}</p>
            </div>


            <div className="mt-10 m-auto relative flex items-center justify-center w-70 h-70">
                <svg
                    className="absolute -rotate-90"
                    width={radius * 2}
                    height={radius * 2}
                >
                    {/* Background */}
                    <circle
                        cx={radius}
                        cy={radius}
                        r={normalizedRadius}
                        fill="transparent"
                        stroke="#FAF4E3"
                        strokeWidth={stroke}
                    />

                    {/* Progress */}
                    <circle
                        cx={radius}
                        cy={radius}
                        r={normalizedRadius}
                        fill="transparent"
                        stroke="#095543"
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                    />
                </svg>

                <div className="text-center">
                    <p className="text-8xl font-bold text-dark-green">
                        {start}
                    </p>
                    <hr className="my-3 border-light-green" />
                    <p className="text-3xl text-light-green">
                        {count}
                    </p>
                </div>
            </div>
            <div className='cursor-pointer' onClick={(e) => {
                e.stopPropagation();
                setBtnState("");
                setStart(0);
            }}>
                <Image src="/images/replay.svg" alt='replay' width={30} height={30} />
            </div>
        </div>
    )
}

export default CounterCircle