import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
    theme: Theme
    resolvedTheme: 'light' | 'dark'
    setTheme: (theme: Theme) => void
}

const getResolvedTheme = (theme: Theme): 'light' | 'dark' => {
    if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
}

export const useThemeStore = create<ThemeState>((set) => ({
    theme: (localStorage.getItem('theme') as Theme) || 'system',
    resolvedTheme: 'light',
    setTheme: (theme: Theme) => {
        set({
            theme,
            resolvedTheme: getResolvedTheme(theme)
        })
        localStorage.setItem('theme', theme)
    }
}))

// 初始化主题
export const initializeTheme = () => {
    const { theme } = useThemeStore.getState()
    useThemeStore.setState({
        resolvedTheme: getResolvedTheme(theme)
    })
}