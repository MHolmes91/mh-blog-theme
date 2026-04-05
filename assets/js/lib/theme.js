export function resolveTheme({ storedTheme, systemPrefersDark }) {
  if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme
  return systemPrefersDark ? 'dark' : 'light'
}
