"use client";
import Header from '../../components/Header'
import Hero from '../../components/Hero';
import Ringtone from '../../components/Ringtone';
import Start from '../../components/Start';
import ZekrCount from '../../components/ZekrCount';
import ZekrSelctor from '../../components/ZekrSelctor';

function page() {
    
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

export default page