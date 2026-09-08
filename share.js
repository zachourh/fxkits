(function () {
  const HASH_KEY = 's'
  const PANEL_SELECTORS = [
    '[data-fxkits-panel]',
    '#panel',
    '.panel',
    '.control-panel',
    '.controls-panel',
    '.settings-panel',
    '.controls',
    '.toolbar'
  ]

  let panel = null
  let controls = []
  let defaults = new Map()
  let restoredFromHash = false
  let updateTimer = 0
  let note = null

  function findPanel() {
    for (const selector of PANEL_SELECTORS) {
      const element = document.querySelector(selector)
      if (element) return element
    }
    return null
  }

  function getControls() {
    if (!panel) return []
    return Array.from(panel.querySelectorAll('input[id], select[id], textarea[id]'))
      .filter(control => control.type !== 'file' && control.id)
  }

  function getControlValue(control) {
    if (control.type === 'checkbox' || control.type === 'radio') {
      return control.checked ? 1 : 0
    }
    return control.value
  }

  function setControlValue(control, value) {
    if (control.type === 'checkbox' || control.type === 'radio') {
      control.checked = value === 1 || value === true || value === '1'
      return true
    }

    if (control.tagName === 'SELECT') {
      const next = String(value)
      const exists = Array.from(control.options).some(option => option.value === next)
      if (!exists) return false
      control.value = next
      return true
    }

    if (control.type === 'range' || control.type === 'number') {
      const next = Number(value)
      if (!Number.isFinite(next)) return false
      const min = control.min === '' ? -Infinity : Number(control.min)
      const max = control.max === '' ? Infinity : Number(control.max)
      if (next < min || next > max) return false
      control.value = String(value)
      return true
    }

    if (control.type === 'color') {
      const next = String(value)
      if (!/^#[0-9a-f]{6}$/i.test(next)) return false
      control.value = next
      return true
    }

    control.value = String(value)
    return true
  }

  function dispatchControlEvents(control) {
    control.dispatchEvent(new Event('input', { bubbles: true }))
    control.dispatchEvent(new Event('change', { bubbles: true }))
  }

  function encodeState(entries) {
    const json = JSON.stringify(entries)
    const bytes = new TextEncoder().encode(json)
    let binary = ''
    bytes.forEach(byte => { binary += String.fromCharCode(byte) })
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }

  function decodeState(value) {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4)
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return JSON.parse(new TextDecoder().decode(bytes))
  }

  function readHash() {
    const raw = window.location.hash.replace(/^#/, '')
    if (!raw) return null

    const params = new URLSearchParams(raw)
    const value = params.get(HASH_KEY)
    if (!value) return null

    try {
      const decoded = decodeState(value)
      return Array.isArray(decoded) ? decoded : null
    } catch (_) {
      return null
    }
  }

  function buildEntries() {
    const entries = []
    controls.forEach(control => {
      const value = getControlValue(control)
      if (String(value) === String(defaults.get(control.id))) return
      entries.push([control.id, value])
    })
    return entries
  }

  function writeHash() {
    const entries = buildEntries()
    const url = new URL(window.location.href)

    if (entries.length) {
      url.hash = `${HASH_KEY}=${encodeState(entries)}`
    } else {
      url.hash = ''
    }

    window.history.replaceState(null, '', url)
  }

  function scheduleHashUpdate() {
    clearTimeout(updateTimer)
    updateTimer = window.setTimeout(writeHash, 160)
  }

  function restoreHash() {
    const entries = readHash()
    if (!entries) return

    const byId = new Map(controls.map(control => [control.id, control]))
    entries.forEach(entry => {
      if (!Array.isArray(entry) || entry.length !== 2) return
      const control = byId.get(entry[0])
      if (!control) return
      if (!setControlValue(control, entry[1])) return
      dispatchControlEvents(control)
      restoredFromHash = true
    })
  }

  function needsUploadNotice() {
    if (!restoredFromHash || !panel) return false
    if (panel.querySelector('#char-input, [data-share-works-without-upload]')) return false
    const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'))
    return fileInputs.length > 0 && fileInputs.every(input => !input.files || input.files.length === 0)
  }

  function addNotice() {
    if (!needsUploadNotice()) return
    note = document.createElement('p')
    note.className = 'fxkits-share-note'
    note.textContent = 'Settings loaded. Upload an image to see them on your asset.'

    const footer = panel.querySelector('.panel-footer, .footer, [class*="footer"]')
    if (footer && footer.parentNode === panel) {
      panel.insertBefore(note, footer)
    } else {
      panel.appendChild(note)
    }
  }

  function addStyles() {
    const style = document.createElement('style')
    style.textContent = `
      .fxkits-copy-link {
        white-space: nowrap;
      }
      .fxkits-share-note {
        margin: 8px 0 0;
        color: rgba(255,255,255,0.52);
        font-size: 11px;
        line-height: 1.35;
      }
    `
    document.head.appendChild(style)
  }

  async function copyLink(button) {
    writeHash()
    const original = button.textContent
    const url = window.location.href

    try {
      await navigator.clipboard.writeText(url)
    } catch (_) {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    button.textContent = 'Copied'
    window.setTimeout(() => {
      button.textContent = original
    }, 1200)
  }

  function addCopyButton() {
    const button = document.createElement('button')
    const exportButton = panel.querySelector('[data-fxkits-export], [id*="export" i], [class*="export" i]')
    button.type = 'button'
    button.textContent = 'Copy link'
    button.className = exportButton && exportButton.className ? exportButton.className : 'fxkits-copy-link'
    button.classList.add('fxkits-copy-link')
    button.addEventListener('click', () => copyLink(button))

    const footer = panel.querySelector('.panel-footer, .footer, [class*="footer"]')
    if (footer && footer.parentNode === panel) {
      const exportInFooter = footer.querySelector('[data-fxkits-export], [id*="export" i], [class*="export" i]')
      footer.insertBefore(button, exportInFooter || null)
      return
    }

    panel.appendChild(button)
  }

  function init() {
    panel = findPanel()
    if (!panel) return

    controls = getControls()
    if (!controls.length) return

    controls.forEach(control => {
      defaults.set(control.id, getControlValue(control))
      control.addEventListener('input', scheduleHashUpdate)
      control.addEventListener('change', scheduleHashUpdate)
    })

    addStyles()
    restoreHash()
    addNotice()
    addCopyButton()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
