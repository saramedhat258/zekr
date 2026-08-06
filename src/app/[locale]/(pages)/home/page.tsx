"use client";
import { useEffect } from 'react';
import Header from '../../components/Header'
import Hero from '../../components/home/Hero';
import Ringtone from '../../components/home/Ringtone';
import Start from '../../components/home/Start';
import ZekrCount from '../../components/home/ZekrCount';
import ZekrSelctor from '../../components/home/ZekrSelctor';

function Home() {
    useEffect(()=>{
        window.sessionStorage.removeItem("zekr")
    })
    return (
        <div>
            <Header />
            <main className='w-3/4 m-auto'>
                <Hero/>
                <ZekrSelctor/>
                <ZekrCount />
                <Ringtone />
                <Start />
            </main>
        </div>
    )
}

export default Home