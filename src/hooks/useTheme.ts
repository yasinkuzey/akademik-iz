import { useEffect, useState } from 'react'

const KEY = 'theme'

export function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(KEY) === 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem(KEY, 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem(KEY, 'light')
    }
  }, [dark])

  const toggle = () => setDark((d) => !d)
  return { dark, toggle }
}
