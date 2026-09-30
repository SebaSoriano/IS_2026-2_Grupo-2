import { useEffect, useState } from 'react'
import InternalPage from './InternalPage.jsx'
import PublicPage from './PublicPage.jsx'

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const syncPathname = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', syncPathname)
    return () => window.removeEventListener('popstate', syncPathname)
  }, [])

  return pathname === '/' ? <PublicPage /> : <InternalPage />
}