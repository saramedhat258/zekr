import React from 'react'

type childProps = {
    children: React.ReactNode
}
function layout({ children }: childProps) {
    return (
        <div className='bg-main-bg xl:px-30 px-10 h-fit py-10'>
            {children}
        </div>
    )
}

export default layout