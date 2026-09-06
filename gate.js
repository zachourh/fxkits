(function () {
  const STORAGE_KEY = 'fxkits_email'
  const EXPORT_SELECTOR = '[data-fxkits-export]'

  let pendingElement = null
  let modal = null
  let nameInput = null
  let emailInput = null
  let roleInput = null
  let error = null
  let submitting = false

  function hasEmail() {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY))
    } catch (_) {
      return false
    }
  }

  function saveEmail(email) {
    try {
      localStorage.setItem(STORAGE_KEY, email)
    } catch (_) {}
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function ensureModal() {
    if (modal) return

    const style = document.createElement('style')
    style.textContent = `
      .fxkits-gate {
        position: fixed; inset: 0; z-index: 99999;
        display: none; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.46); backdrop-filter: blur(10px);
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .fxkits-gate.open { display: flex; }
      .fxkits-gate-card {
        width: min(380px, calc(100vw - 32px));
        background: rgba(18,18,20,0.94);
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 16px;
        padding: 18px;
        box-shadow: 0 24px 70px rgba(0,0,0,0.45);
        color: #fff;
      }
      .fxkits-gate-copy {
        margin: 0 0 12px;
        color: rgba(255,255,255,0.74);
        font-size: 13px;
        line-height: 1.35;
      }
      .fxkits-gate-form {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
      }
      .fxkits-gate-input {
        min-width: 0;
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 9px;
        background: rgba(255,255,255,0.07);
        color: #fff;
        font: inherit;
        font-size: 13px;
        padding: 10px 11px;
        outline: none;
      }
      .fxkits-gate-input:focus { border-color: rgba(255,255,255,0.34); }
      .fxkits-gate-input::placeholder { color: rgba(255,255,255,0.34); }
      .fxkits-gate-field {
        display: grid;
        gap: 6px;
      }
      .fxkits-gate-label {
        color: rgba(255,255,255,0.52);
        font-size: 11px;
        line-height: 1.2;
      }
      .fxkits-gate-select {
        appearance: none;
        background-image: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.58) 50%), linear-gradient(135deg, rgba(255,255,255,0.58) 50%, transparent 50%);
        background-position: calc(100% - 17px) 16px, calc(100% - 12px) 16px;
        background-size: 5px 5px, 5px 5px;
        background-repeat: no-repeat;
      }
      .fxkits-gate-submit {
        border: 1px solid rgba(255,255,255,0.16);
        border-radius: 9px;
        background: rgba(255,255,255,0.12);
        color: #fff;
        font: inherit;
        font-size: 13px;
        padding: 10px 14px;
        cursor: pointer;
      }
      .fxkits-gate-submit:hover { background: rgba(255,255,255,0.18); }
      .fxkits-gate-consent {
        margin: -1px 0 0;
        color: rgba(255,255,255,0.42);
        font-size: 11px;
        line-height: 1.35;
      }
      .fxkits-gate-error {
        min-height: 16px;
        margin-top: 8px;
        color: #ff9b9b;
        font-size: 11px;
      }
    `
    document.head.appendChild(style)

    modal = document.createElement('div')
    modal.className = 'fxkits-gate'
    modal.innerHTML = `
      <div class="fxkits-gate-card" role="dialog" aria-modal="true" aria-label="Export email">
        <p class="fxkits-gate-copy">Enter your email once to export from FXKits.</p>
        <form class="fxkits-gate-form">
          <input class="fxkits-gate-input" type="text" name="name" autocomplete="name" placeholder="Name">
          <input class="fxkits-gate-input" type="email" name="email" autocomplete="email" placeholder="Email" required>
          <label class="fxkits-gate-field">
            <span class="fxkits-gate-label">What best describes you?</span>
            <select class="fxkits-gate-input fxkits-gate-select" name="role" required>
              <option value="Student or learning" selected>Student or learning</option>
              <option value="Freelance designer">Freelance designer</option>
              <option value="I run a small studio">I run a small studio</option>
              <option value="Not a designer">Not a designer</option>
            </select>
          </label>
          <button class="fxkits-gate-submit" type="submit">Continue</button>
          <p class="fxkits-gate-consent">Your email unlocks exports on every fxkits tool. You will also get occasional emails about new tools and design work. Unsubscribe anytime.</p>
        </form>
        <div class="fxkits-gate-error" aria-live="polite"></div>
      </div>
    `
    document.body.appendChild(modal)

    nameInput = modal.querySelector('input[name="name"]')
    emailInput = modal.querySelector('input[name="email"]')
    roleInput = modal.querySelector('select[name="role"]')
    error = modal.querySelector('.fxkits-gate-error')

    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal()
    })

    modal.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault()
      if (submitting) return

      const name = nameInput.value.trim()
      const email = emailInput.value.trim()
      const role = roleInput.value
      error.textContent = ''

      if (!isValidEmail(email)) {
        error.textContent = 'Use a valid email address.'
        emailInput.focus()
        return
      }

      const payload = { email }
      if (name) payload.name = name
      if (role) payload.role = role

      submitting = true
      try {
        await fetch('/api/subscribe.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } catch (_) {
        // Export should keep working even when lead capture fails.
      }

      saveEmail(email)
      submitting = false
      const element = pendingElement
      closeModal()
      runExport(element)
    })

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && modal.classList.contains('open')) closeModal()
    })
  }

  function openModal(element) {
    ensureModal()
    pendingElement = element
    error.textContent = ''
    nameInput.value = ''
    emailInput.value = ''
    roleInput.value = 'Student or learning'
    modal.classList.add('open')
    requestAnimationFrame(() => nameInput.focus())
  }

  function closeModal() {
    if (!modal) return
    modal.classList.remove('open')
    pendingElement = null
    submitting = false
  }

  function runExport(element) {
    if (!element || !document.contains(element)) return
    element.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    }))
  }

  document.addEventListener('click', event => {
    const element = event.target.closest(EXPORT_SELECTOR)
    if (!element || hasEmail()) return

    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    openModal(element)
  }, true)
})()
