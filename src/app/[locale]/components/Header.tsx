import Image from 'next/image'
import LanguageSwitcher from './LanguageSwitcher'
import Link from 'next/link'

function Header() {
    return (
        <header className=' h-20 flex justify-between align-middle items-center'>
            <Link href={`/home`}>
                <Image
                    src='/images/logo.svg'
                    alt='logo'
                    width={100}
                    height={100}
                    className='w-20 sm:w-25 h-auto cursor-pointer'
                />
            </Link>

            <LanguageSwitcher />
        </header>
    )
}

export default Header