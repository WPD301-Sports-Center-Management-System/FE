/**
 * Helper to trigger browser download for a Blob.
 * Validates that the blob is not an error response wrapped as a blob.
 */
export async function downloadBlob(blob: Blob, fallbackFilename: string): Promise<void> {
  // Check if blob is actually a JSON error response
  if (blob.type === 'application/json' || (blob.type.includes('json') && blob.size < 4096)) {
    try {
      const text = await blob.text()
      const json = JSON.parse(text)
      if (json && !json.success) {
        throw new Error(json.message || 'Lỗi khi tải tệp tin từ máy chủ.')
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('Unexpected token')) {
        throw e
      }
    }
  }

  const url = window.URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = fallbackFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 1000)
  }
}
