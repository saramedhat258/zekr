import Image from "next/image"

type props = {
    src: string,
    alt: string,
    text: string,
    onClick: () => void,
    style?:string,
}
function Btn({ src, alt, text,onClick,style }: props) {
    return (
        <button onClick={onClick} className={`md:my-8 cursor-pointer [400px]:text-[16px] text-sm ${style?style:"text-white bg-dark-green"} w-full p-4 flex gap-2 justify-center rounded-2xl`}>
            <Image src={src} alt={alt} width={15} height={15} />
            <p>{text}</p>
        </button>
    )
}

export default Btn