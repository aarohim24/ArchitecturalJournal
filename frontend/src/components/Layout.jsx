// #genai
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, backgroundColor: isHome ? 'transparent' : 'var(--cream)', backgroundImage: isHome ? 'none' : "url('/noise.png')" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
