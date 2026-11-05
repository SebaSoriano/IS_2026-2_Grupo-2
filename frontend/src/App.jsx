import { useEffect, useState } from 'react'
import InternalPage from './InternalPage.jsx'
import PublicPage from './PublicPage.jsx';
import Auth from './Auth.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const syncPathname = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', syncPathname)
    return () => window.removeEventListener('popstate', syncPathname)
  }, [])

  // se quita la barra final para que /login/ sea igual que /login
  const path = pathname.replace(/\/+$/, '') || '/'

  // / es la página pública, /login el inicio de sesión y el resto es la intranet
  if (path === '/') return <PublicPage />
  if (path === '/login') return <Auth />

  // la intranet solo se muestra si hay sesión; RutaProtegida le pasa el usuario
  return (
    <RutaProtegida>
      {(usuario) => <InternalPage usuario={usuario} />}
    </RutaProtegida>
  )
}