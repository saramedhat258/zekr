"use client";
import { useEffect } from 'react';
import Hero from '../../components/home/Hero';
import Ringtone from '../../components/home/Ringtone';
import Start from '../../components/home/Start';
import ZekrCount from '../../components/home/ZekrCount';
import ZekrSelctor from '../../components/home/ZekrSelctor';
import { useZekr } from '../../context/ZekrContext';

function Home() {
    const { setCount,setZekr } = useZekr()
    useEffect(() => {
        window.sessionStorage.clear();
        setCount(0)
        setZekr({
            id: 0,
            arabic: '',
            transliteration: '',
            translation: ''
        })
    }, [setCount,setZekr]);

    return (
        <div>
            <main className='sm:w-3/4 w-full m-auto'>
                <Hero />
                <ZekrSelctor />
                <ZekrCount />
                <Ringtone />
                <Start />
            </main>
        </div>
    )
}

export default Home