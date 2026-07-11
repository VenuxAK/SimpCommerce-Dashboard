let timer: any = null
let progressBar: HTMLDivElement | null = null

function getOrCreateProgressBar() {
  if (typeof document === 'undefined') return null
  if (progressBar) return progressBar

  progressBar = document.createElement('div')
  progressBar.id = 'route-progress'
  progressBar.style.position = 'fixed'
  progressBar.style.top = '0'
  progressBar.style.left = '0'
  progressBar.style.height = '3px'
  progressBar.style.backgroundColor = '#4ade80'
  progressBar.style.zIndex = '99999'
  progressBar.style.transition = 'width 0.2s ease, opacity 0.2s ease'
  progressBar.style.width = '0%'
  progressBar.style.opacity = '0'
  progressBar.style.pointerEvents = 'none'

  document.body.appendChild(progressBar)
  return progressBar
}

export function useProgress() {
  function start() {
    const bar = getOrCreateProgressBar()
    if (!bar) return

    bar.style.opacity = '1'
    bar.style.width = '0%'

    if (timer) clearInterval(timer)
    let currentWidth = 0

    timer = setInterval(() => {
      if (currentWidth < 70) {
        currentWidth += Math.random() * 8 + 2
      } else if (currentWidth < 90) {
        currentWidth += Math.random() * 2
      }
      bar.style.width = `${currentWidth}%`
    }, 150)
  }

  function done() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }

    const bar = getOrCreateProgressBar()
    if (!bar) return

    bar.style.width = '100%'
    setTimeout(() => {
      bar.style.opacity = '0'
      setTimeout(() => {
        bar.style.width = '0%'
      }, 200)
    }, 100)
  }

  return { start, done }
}
