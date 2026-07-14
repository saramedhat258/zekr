
import Image from 'next/image'
import LanguageSwitcher from './LanguageSwitcher'

function Header() {


    return (
        <header className=' h-20 flex justify-between align-middle items-center'>
            <Image
                src='/images/logo.svg'
                alt='logo'
                width={100}
                height={100}
            />
            <LanguageSwitcher/>
        </header>
    )
}

export default Header