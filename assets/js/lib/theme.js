export function resolveTheme({ systemPrefersDark }) {
  return systemPrefersDark ? 'dark' : 'light'
}
