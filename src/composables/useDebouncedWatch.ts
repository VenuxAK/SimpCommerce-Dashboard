import { watch, type WatchSource } from 'vue'

export const useDebouncedWatch = (sources: WatchSource | WatchSource[], callback: () => void, delay = 300) => {
  let timer: ReturnType<typeof setTimeout>

  watch(sources, () => {
    clearTimeout(timer)
    timer = setTimeout(callback, delay)
  })
}
