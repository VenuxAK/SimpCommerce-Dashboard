import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../lib/axios'
import { useNotify } from '../lib/notify'
import { useListing, type PaginationMeta } from './useListing'

export function useCrud<T extends Record<string, any>>(endpoint: string, defaults: Record<string, any>) {
  const { t } = useI18n()
  const { success, error } = useNotify()
  const { items, meta, loading, loadPage } = useListing<T>(endpoint)

  const showForm = ref(false)
  const editing = ref<T | null>(null)
  const form = ref<Record<string, any>>({ ...defaults })
  const saving = ref(false)

  function resetForm(data?: Record<string, any>) {
    form.value = { ...defaults, ...data }
  }

  function openCreate() {
    editing.value = null
    resetForm()
    showForm.value = true
  }

  function openEdit(item: T) {
    editing.value = item
    resetForm(item)
    showForm.value = true
  }

  function closeForm() {
    showForm.value = false
    editing.value = null
  }

  async function save(): Promise<boolean> {
    saving.value = true
    try {
      if (editing.value) {
        await api.put(`${endpoint}/${editing.value.id}`, form.value)
        success(t('common.save') + ' ✅')
      } else {
        await api.post(endpoint, form.value)
        success(t('common.create') + ' ✅')
      }
      closeForm()
      await loadPage(1)
      return true
    } catch (e: any) {
      error(e?.response?.data?.message || t('common.error'))
      return false
    } finally {
      saving.value = false
    }
  }

  async function remove(id: number): Promise<boolean> {
    try {
      await api.delete(`${endpoint}/${id}`)
      items.value = items.value.filter((item: any) => item.id !== id)
      success(t('common.delete') + ' ✅')
      return true
    } catch {
      return false
    }
  }

  return {
    items, meta, loading, showForm, editing, form, saving,
    loadPage, openCreate, openEdit, closeForm, save, remove, resetForm,
  }
}
