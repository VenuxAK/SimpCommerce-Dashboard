import api from '../../lib/axios'

export const useBackupApi = () => {
  const list = () => api.get('/backups')
  const create = () => api.post('/backups')
  const download = (filename: string) =>
    api.get(`/backups/${filename}/download`, { responseType: 'blob' })

  return { list, create, download }
}
