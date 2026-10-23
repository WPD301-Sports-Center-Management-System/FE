export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  appName: import.meta.env.VITE_APP_NAME || 'Sports Center Management System',
  // Fixtures are available only during local development; a production build can
  // never silently display demo records because of an environment misconfiguration.
  useMock: import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true',
}

