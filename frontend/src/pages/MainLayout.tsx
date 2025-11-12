import type { JSX } from 'react'
import { Outlet } from 'react-router-dom'

function MainLayout() : JSX.Element {
  return (
    <>
        <div>
            <Outlet />
        </div>
    </>
  )
}

export default MainLayout
