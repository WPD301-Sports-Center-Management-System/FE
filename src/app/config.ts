export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  appName: import.meta.env.VITE_APP_NAME || 'ApexFIT',
  useMock: import.meta.env.VITE_USE_MOCK === 'true', // Real API by default, mock only when explicitly true
  // Account that receives counter bank transfers (shown with a VietQR code). Leave empty to hide the QR.
  bank: {
    bin: import.meta.env.VITE_BANK_BIN || '', // NAPAS bank BIN, e.g. 970436 (Vietcombank)
    name: import.meta.env.VITE_BANK_NAME || '',
    accountNo: import.meta.env.VITE_BANK_ACCOUNT_NO || '',
    accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || '',
  },
}

