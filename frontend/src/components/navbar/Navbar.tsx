import { CloudLightning } from 'lucide-react'
import { type JSX, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

interface propsType{
    children? : ReactNode; 
}

function Navbar({children}:propsType) : JSX.Element {
  return (
    <>
        <div className='flex flex-col h-full w-full'>
            <div className='border-b-2 mx-4 border-gray-300'>
                <NavLink to="/" >
                    <div className='mx-5 my-6 text-blue-400 hover:cursor-pointer'>
                        <div className='mx-10'>
                            <CloudLightning size={30} />
                        </div>
                        <p className='font-semibold'>
                            LightWay-VPN
                        </p>
                    </div>
                </NavLink>
            </div>
            <div className='pt-4'>
                <div className='mx-2'>
                    {children}
                </div>
            </div>
        </div>
    </>
  )
}

export default Navbar
