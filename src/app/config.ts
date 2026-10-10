export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  appName: import.meta.env.VITE_APP_NAME || 'Sports Center Management System',
  useMock: import.meta.env.VITE_USE_MOCK === 'true', // Real API by default, mock only when explicitly true
}

