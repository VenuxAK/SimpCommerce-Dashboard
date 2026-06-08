import api from '../lib/axios'

export const useBlobDownload = () => {
  const downloadBlob = async (url: string, filename: string): Promise<void> => {
    try {
      const response = await api.get(url, { responseType: 'blob' })
      const blobUrl = URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      link.click()
      URL.revokeObjectURL(blobUrl)
    } catch {}
  }

  return { downloadBlob }
}
