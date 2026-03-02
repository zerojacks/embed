import { useThemeStore } from '../stores/useThemeStore'

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <svg
          width="20px"
          height="20px"
          className="fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24">
          <path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
      </div>
      <ul tabIndex={0} className="dropdown-content bg-base-200 rounded-box z-1 w-52 p-2 shadow-2xl">
        <li>
          <label className="flex cursor-pointer items-center gap-2 p-2 rounded hover:bg-base-300">
            <input
              type="radio"
              name="theme-dropdown"
              className="theme-controller radio radio-sm"
              aria-label="Light"
              value="light"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
            />
            <span className="text-sm">Light</span>
          </label>
        </li>
        <li>
          <label className="flex cursor-pointer items-center gap-2 p-2 rounded hover:bg-base-300">
            <input
              type="radio"
              name="theme-dropdown"
              className="theme-controller radio radio-sm"
              aria-label="Dark"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
            />
            <span className="text-sm">Dark</span>
          </label>
        </li>
      </ul>
    </div>
  )
}