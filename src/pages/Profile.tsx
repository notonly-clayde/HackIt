import React from 'react'
import Nav from '../components/Dashboard/Nav'

const Profile = () => {
    return (


    <div className='bg-accent-gradient h-screen flex gap-4'>
        <nav className="page-container sticky top-4 z-50 text-center mt-4">
            <div className="relative rounded-2xl border-0 border-highlight bg-accent-gradient sm:px-5">
                <h1 className="text-accent sm:text-[1.5rem] font-bold py-6 text-center">HackIT</h1>
                <div className="flex items-center gap-3">
            
                </div>
                </div>


                <div className='ml-20 p-20 w-12 h-12 rounded-full border-accent bg-secondary'>
                </div>

                <div className='border-accent w-[20vw] h-[50vh] p-10 mt-[-5rem] bg-midtone z-[-1000] absolute'>
                    <h2 className='font-bold p-10'>Clyde Limpangog</h2>
                </div>
                <div className=''>
                    <h2 className='font-bold px-4 py-4'>Game History</h2>
                    <div className='border border-accent p-10 m-10 w-[100vw]'>
                    </div>
                </div>
        </nav>

    </div>
)
}



export default Profile