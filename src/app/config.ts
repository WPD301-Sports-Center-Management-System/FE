export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  appName: import.meta.env.VITE_APP_NAME || 'Gym Center Management System',
  useMock: import.meta.env.VITE_USE_MOCK !== 'false', // Default to true unless explicitly 'false'
}
