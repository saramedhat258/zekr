import React from 'react'
import Header from '../components/Header'

type childProps = {
    children: React.ReactNode
}
function layout({ children }: childProps) {
    return (
        <div className='bg-main-bg xl:px-30 px-5 h-fit sm:py-10 py-5'>
            <Header />
            {children}
        </div>
    )
}

export default layout