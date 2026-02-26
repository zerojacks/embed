import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme') as Theme
        return saved || 'system'
    })

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        const updateResolvedTheme = () => {
            if (theme === 'system') {
                setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
            } else {
                setResolvedTheme(theme)
            }
        }

        updateResolvedTheme()

        if (theme === 'system') {
            mediaQuery.addEventListener('change', updateResolvedTheme)
            return () => mediaQuery.removeEventListener('change', updateResolvedTheme)
        }
    }, [theme])

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', resolvedTheme)
        localStorage.setItem('theme', theme)
    }, [theme, resolvedTheme])

    return { theme, setTheme, resolvedTheme }
}