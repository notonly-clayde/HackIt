import React from 'react'
import {Link} from 'react-router-dom'


const Footer = () => {
    return (
        <div className='bg-primary text-highlight text-center p-6 pb-0'>
           
                <div className='flex flex-col justify-between gap-4 flex-2'>
                    <div>
                        <div className='font-bold text-lg text-accent'>HackIT</div>
                    </div>
            </div>
            <div className='text-xs mt-4 py-4'>&copy; 2026 HackIT</div>
        </div>
    )
}

export default Footer