// FXKits sign-in gate.
// A visitor who is not signed in sees a full-screen lander on the homepage and on every tool page.
// They sign in with Google or with a link sent to their email (Firebase Authentication).
// Once signed in, the whole site is open and their verified email is added to Kit.
(function () {
  const USER_KEY = 'fxkits_user'
  const PENDING_KEY = 'fxkits_pending_email'
  const LEGACY_EMAIL_KEY = 'fxkits_email'
  const LOCK_CLASS = 'fx-locked'
  const SDK = 'https://www.gstatic.com/firebasejs/10.14.1'
  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBrTrB8rsNdUQOwXb-1Iflg9iyoSx29BEg',
    authDomain: 'fxkits-2d263.firebaseapp.com',
    projectId: 'fxkits-2d263',
    storageBucket: 'fxkits-2d263.firebasestorage.app',
    messagingSenderId: '478220363911',
    appId: '1:478220363911:web:8aac11927fe8ecb8463022'
  }
  const root = document.documentElement

  function read(key) {
    try { return localStorage.getItem(key) } catch (_) { return null }
  }
  function write(key, value) {
    try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value) } catch (_) {}
  }
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  let sdkPromise = null
  function loadSdk() {
    if (!sdkPromise) {
      sdkPromise = Promise.all([import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`)])
        .then(([appMod, authMod]) => {
          const app = appMod.initializeApp(FIREBASE_CONFIG)
          return { fb: authMod, auth: authMod.getAuth(app) }
        })
    }
    return sdkPromise
  }

  // ---- Already signed in on this browser: open the site, wire the sign-out link ----

  function wireSignOut() {
    document.querySelectorAll('[data-fxkits-signout]').forEach(link => {
      link.hidden = false
      link.addEventListener('click', async event => {
        event.preventDefault()
        write(USER_KEY, null)
        try {
          const { fb, auth } = await loadSdk()
          await fb.signOut(auth)
        } catch (_) {}
        window.location.reload()
      })
    })
  }

  if (read(USER_KEY)) {
    root.classList.remove(LOCK_CLASS)
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireSignOut)
    else wireSignOut()
    return
  }

  // ---- Not signed in: show the lander ----

  const style = document.createElement('style')
  style.textContent = `
    html.fx-locked { overflow: hidden !important; }
    .fxkits-lander {
      position: fixed; inset: 0; z-index: 2147483000;
      display: flex; flex-direction: column; background: #000; color: #fff; padding: 0 20px 20px; overflow-y: auto;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      visibility: visible; -webkit-font-smoothing: antialiased;
    }
    .fxkits-lander * { box-sizing: border-box; }

    .fxl-nav { flex: 0 0 auto; height: 76px; padding: 0 10px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .fxl-wordmark { background: none; border: 0; padding: 0; cursor: pointer; display: block; }
    .fxl-wordmark img { height: 18px; width: auto; filter: invert(1); display: block; }
    .fxl-nav-actions { display: flex; align-items: center; gap: 22px; }
    .fxl-nav-link { background: none; border: 0; padding: 6px 2px; color: #fff; font: inherit; font-size: 15px; font-weight: 500; cursor: pointer; }
    .fxl-nav-link:hover { opacity: 0.7; }
    .fxl-nav-pill {
      height: 40px; padding: 0 20px; border: 0; border-radius: 12px; background: #3e3e3e; color: #fff;
      font: inherit; font-size: 15px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: background 0.15s;
    }
    .fxl-nav-pill:hover { background: #4d4d4d; }

    .fxl-panel {
      position: relative; flex: 1 1 auto; min-height: 520px; display: flex; padding: 48px 24px;
      border-radius: 16px; overflow: hidden; background-color: #075d3f;
      background-image:
        radial-gradient(ellipse 44% 32% at 50% 106%, #f1ffe2 0%, rgba(196,246,178,0.9) 20%, rgba(70,178,118,0.55) 48%, rgba(7,93,63,0) 80%),
        radial-gradient(ellipse 120% 95% at 50% 38%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.24) 100%);
      background-size: 100% 100%, 100% 100%;
    }
    .fxl-dots { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    .fxl-inner {
      position: relative; width: 100%; max-width: 680px; margin: auto;
      display: flex; flex-direction: column; align-items: center; text-align: center;
    }
    .fxl-inner.fxl-wide { max-width: 1040px; }

    .fxl-title { margin: 0; font-size: 34px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.12; color: #fff; }
    .fxl-title-hero { font-size: 46px; letter-spacing: -0.035em; line-height: 1.08; }
    .fxl-sub { margin: 16px 0 0; max-width: 480px; font-size: 16px; line-height: 1.5; color: rgba(255,255,255,0.82); }
    .fxl-sub-hero { margin-top: 12px; max-width: 560px; font-size: 19px; line-height: 1.45; color: rgba(255,255,255,0.92); }
    .fxl-sub strong { color: #fff; font-weight: 600; }
    .fxl-actions { margin-top: 40px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .fxl-btn {
      height: 46px; padding: 0 22px; border-radius: 10px; cursor: pointer; white-space: nowrap;
      font: inherit; font-size: 15px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 10px;
      border: 1px solid transparent; transition: background 0.15s, border-color 0.15s, opacity 0.15s, transform 0.15s;
    }
    .fxl-btn:disabled { opacity: 0.55; cursor: default; }
    .fxl-btn-primary { background: #fbfaf4; color: #0b0b0b; }
    .fxl-btn-primary:hover:not(:disabled) { background: #fff; }
    .fxl-btn-hero { height: 56px; padding: 0 32px; border-radius: 999px; font-size: 17px; font-weight: 500; }
    .fxl-btn-hero:hover:not(:disabled) { transform: translateY(-1px); }
    .fxl-btn-ghost { background: rgba(0,0,0,0.16); color: #fff; border-color: rgba(255,255,255,0.32); }
    .fxl-btn-ghost:hover:not(:disabled) { border-color: rgba(255,255,255,0.65); background: rgba(0,0,0,0.26); }
    .fxl-form { margin-top: 30px; width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: 12px; }
    .fxl-form .fxl-btn { width: 100%; }
    .fxl-divider {
      display: flex; align-items: center; gap: 14px; margin: 6px 0;
      font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.66);
    }
    .fxl-divider::before, .fxl-divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.26); }
    .fxl-input {
      width: 100%; height: 46px; padding: 0 15px; border: 1px solid rgba(255,255,255,0.32); border-radius: 10px;
      background: rgba(0,0,0,0.2); color: #fff; font: inherit; font-size: 15px; outline: none; text-align: left;
    }
    .fxl-input:focus { border-color: rgba(255,255,255,0.8); }
    .fxl-input::placeholder { color: rgba(255,255,255,0.5); }
    .fxl-error { min-height: 18px; font-size: 12px; line-height: 1.4; color: #ffd9d9; }
    .fxl-switch { margin-top: 18px; font-size: 14px; color: rgba(255,255,255,0.8); }
    .fxl-link { background: none; border: 0; padding: 0; font: inherit; color: #fff; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
    .fxl-link:hover { opacity: 0.75; }
    .fxl-legal { margin: 26px 0 0; max-width: 400px; font-size: 12px; line-height: 1.5; color: rgba(255,255,255,0.66); }
    .fxl-legal a { color: rgba(255,255,255,0.9); text-underline-offset: 2px; }
    .fxl-legal a:hover { color: #fff; }
    @media (max-width: 900px) {
      .fxl-title-hero { font-size: 38px; }
      .fxl-sub-hero { font-size: 17px; }
    }
    @media (max-width: 520px) {
      .fxkits-lander { padding: 0 12px 12px; }
      .fxl-nav { height: 62px; padding: 0 6px; }
      .fxl-wordmark img { height: 15px; }
      .fxl-nav-actions { gap: 14px; }
      .fxl-nav-pill { height: 36px; padding: 0 14px; font-size: 14px; }
      .fxl-nav-link { font-size: 14px; }
      .fxl-panel { border-radius: 12px; padding: 36px 18px; min-height: 460px; }
      .fxl-title { font-size: 26px; }
      .fxl-title-hero { font-size: 30px; }
      .fxl-sub { font-size: 15px; }
      .fxl-sub-hero { font-size: 16px; margin-top: 10px; }
      .fxl-actions { margin-top: 30px; }
    }
  `
  document.head.appendChild(style)

  const GOOGLE_ICON = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>'
  // The wordmark sits in the nav bar now, so the views carry no logo of their own.
  const LOGO = ''
  const LEGAL_LINKS = '<a href="/terms/">Terms</a> and <a href="/privacy/">Privacy Policy</a>'

  const lander = document.createElement('div')
  lander.className = 'fxkits-lander'
  lander.setAttribute('role', 'dialog')
  lander.setAttribute('aria-modal', 'true')
  lander.setAttribute('aria-label', 'Sign in to FXKits')
  const nav = document.createElement('div')
  nav.className = 'fxl-nav'
  nav.innerHTML = `
    <button class="fxl-wordmark" type="button" data-home aria-label="FXKits"><img src="/logo.svg" alt="FXKits"></button>
    <div class="fxl-nav-actions">
      <button class="fxl-nav-link" type="button" data-go="signin">Login</button>
      <button class="fxl-nav-pill" type="button" data-go="signup">Try Now</button>
    </div>
  `
  const panel = document.createElement('div')
  panel.className = 'fxl-panel'
  const inner = document.createElement('div')
  inner.className = 'fxl-inner'
  panel.appendChild(inner)
  lander.append(nav, panel)
  nav.addEventListener('click', event => {
    if (busy) return
    const go = event.target.closest('[data-go]')
    if (go) { mode = go.dataset.go; viewAuth(); return }
    if (event.target.closest('[data-home]')) viewWelcome()
  })

  // Inter is the lander's typeface. Tool pages do not all load it, so the lander brings its own.
  if (!document.querySelector('link[href*="family=Inter"]')) {
    const font = document.createElement('link')
    font.rel = 'stylesheet'
    font.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    document.head.appendChild(font)
  }

  let mode = 'signup'
  let busy = false
  let finished = false

  function esc(text) {
    return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  }
  function $(selector) { return inner.querySelector(selector) }
  function setError(text) { const el = $('.fxl-error'); if (el) el.textContent = text || '' }

  function friendlyError(err) {
    const code = (err && err.code) || ''
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return ''
    if (code === 'auth/popup-blocked') return 'Your browser blocked the Google window. Allow pop-ups for this site and try again.'
    if (code === 'auth/network-request-failed') return 'Network problem. Check your connection and try again.'
    if (code === 'auth/invalid-email') return 'Use a valid email address.'
    if (code === 'auth/too-many-requests') return 'Too many attempts. Wait a few minutes and try again.'
    if (code === 'auth/invalid-action-code' || code === 'auth/expired-action-code') return 'That sign-in link has expired or was already used. Request a new one.'
    if (code === 'auth/unauthorized-domain') return 'Sign-in is not enabled for this address yet.'
    return 'Something went wrong. Please try again.'
  }

  function viewWelcome() {
    inner.classList.add('fxl-wide')
    inner.innerHTML = `
      <h1 class="fxl-title fxl-title-hero">AI-powered visual tools for creators</h1>
      <p class="fxl-sub fxl-sub-hero">Upload your assets, tune the look, and export polished visuals from focused browser-based simulators.</p>
      <div class="fxl-actions">
        <button class="fxl-btn fxl-btn-primary fxl-btn-hero" type="button" data-go="signup">Create account</button>
      </div>
      <p class="fxl-legal">${LEGAL_LINKS.replace(' and ', ' &nbsp;·&nbsp; ')}</p>
    `
    inner.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => { mode = btn.dataset.go; viewAuth() }))
  }

  function viewAuth() {
    inner.classList.remove('fxl-wide')
    const signup = mode === 'signup'
    inner.innerHTML = `
      ${LOGO}
      <h1 class="fxl-title">${signup ? 'Create your FXKits account' : 'Sign in to FXKits'}</h1>
      <form class="fxl-form" novalidate>
        <button class="fxl-btn fxl-btn-ghost" type="button" data-google>${GOOGLE_ICON}<span>Continue with Google</span></button>
        <div class="fxl-divider">or continue with email</div>
        <input class="fxl-input" type="email" name="email" autocomplete="email" placeholder="you@example.com" aria-label="Email" required>
        <button class="fxl-btn fxl-btn-primary" type="submit">Email me a sign-in link</button>
        <div class="fxl-error" aria-live="polite"></div>
      </form>
      <p class="fxl-switch">${signup ? 'Already have an account?' : 'New to FXKits?'} <button class="fxl-link" type="button" data-switch>${signup ? 'Sign in' : 'Create account'}</button></p>
      <p class="fxl-legal">${signup ? 'You will also get occasional emails about new tools and design work. Unsubscribe anytime. ' : ''}By continuing you agree to the ${LEGAL_LINKS}.</p>
    `
    // People who gave an email through the old export popup get it prefilled.
    const known = read(LEGACY_EMAIL_KEY)
    if (known && isValidEmail(known)) $('input').value = known
    $('[data-switch]').addEventListener('click', () => { mode = signup ? 'signin' : 'signup'; viewAuth() })
    $('[data-google]').addEventListener('click', signInWithGoogle)
    $('form').addEventListener('submit', event => { event.preventDefault(); sendLink($('input').value.trim()) })
  }

  function viewSent(email) {
    inner.classList.remove('fxl-wide')
    inner.innerHTML = `
      ${LOGO}
      <h1 class="fxl-title">Check your inbox</h1>
      <p class="fxl-sub">We sent a sign-in link to <strong>${esc(email)}</strong>. Open it on this device to finish. It can take a minute to arrive, so check your spam folder too.</p>
      <p class="fxl-switch"><button class="fxl-link" type="button" data-back>Use a different email</button></p>
    `
    $('[data-back]').addEventListener('click', viewAuth)
  }

  function viewConfirm() {
    inner.classList.remove('fxl-wide')
    inner.innerHTML = `
      ${LOGO}
      <h1 class="fxl-title">Confirm your email</h1>
      <p class="fxl-sub">Enter the email address this sign-in link was sent to.</p>
      <form class="fxl-form" novalidate>
        <input class="fxl-input" type="email" name="email" autocomplete="email" placeholder="you@example.com" aria-label="Email" required>
        <button class="fxl-btn fxl-btn-primary" type="submit">Finish signing in</button>
        <div class="fxl-error" aria-live="polite"></div>
      </form>
    `
    $('form').addEventListener('submit', event => { event.preventDefault(); completeLink($('input').value.trim()) })
  }

  function viewWorking(text) {
    inner.classList.remove('fxl-wide')
    inner.innerHTML = `${LOGO}<h1 class="fxl-title">${esc(text)}</h1>`
  }

  function setBusy(state) {
    busy = state
    inner.querySelectorAll('button, input').forEach(el => { el.disabled = state })
  }

  async function signInWithGoogle() {
    if (busy) return
    setError('')
    setBusy(true)
    try {
      const { fb, auth } = await loadSdk()
      const result = await fb.signInWithPopup(auth, new fb.GoogleAuthProvider())
      await finish(result.user)
    } catch (err) {
      setBusy(false)
      setError(friendlyError(err))
    }
  }

  async function sendLink(email) {
    if (busy) return
    setError('')
    if (!isValidEmail(email)) { setError('Use a valid email address.'); return }
    setBusy(true)
    try {
      const { fb, auth } = await loadSdk()
      const url = window.location.origin + window.location.pathname + window.location.hash
      await fb.sendSignInLinkToEmail(auth, email, { url, handleCodeInApp: true })
      write(PENDING_KEY, email)
      busy = false
      viewSent(email)
    } catch (err) {
      setBusy(false)
      setError(friendlyError(err))
    }
  }

  function cleanUrl() {
    const url = new URL(window.location.href)
    ;['apiKey', 'oobCode', 'mode', 'lang', 'continueUrl'].forEach(param => url.searchParams.delete(param))
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  }

  async function completeLink(email) {
    if (busy) return
    if (!isValidEmail(email)) { setError('Use a valid email address.'); return }
    setBusy(true)
    try {
      const { fb, auth } = await loadSdk()
      const result = await fb.signInWithEmailLink(auth, email, window.location.href)
      write(PENDING_KEY, null)
      cleanUrl()
      await finish(result.user)
    } catch (err) {
      busy = false
      write(PENDING_KEY, null)
      cleanUrl()
      mode = 'signin'
      viewAuth()
      setError(friendlyError(err))
    }
  }

  // Adds the verified email to Kit. The server reads the email from the sign-in token, not from this request.
  async function addToKit(user) {
    try {
      const idToken = await user.getIdToken()
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, email: user.email }),
        keepalive: true
      }
      const response = await fetch('/api/subscribe', options)
      if (response.status === 404 || response.status === 405 || response.status === 501) {
        await fetch('/api/subscribe.php', options)
      }
    } catch (_) {
      // Access should still open when the list signup fails.
    }
  }

  async function finish(user) {
    if (finished || !user || !user.email) return
    finished = true
    write(USER_KEY, user.email)
    addToKit(user)
    lander.remove()
    style.remove()
    root.classList.remove(LOCK_CLASS)
    wireSignOut()
  }


  // Dot texture on the green panel, with two layers of motion on the same grid:
  //  - rain: small squares fall from top to bottom in columns, always running
  //  - hover: cells near the cursor switch on through an ordered-dither pattern and leave a short trail
  function initDots() {
    const canvas = document.createElement('canvas')
    canvas.className = 'fxl-dots'
    canvas.setAttribute('aria-hidden', 'true')
    panel.prepend(canvas)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const GAP = 7                 // cell size
    const REACH = 7               // hover radius, in cells
    const FADE = 0.945            // how fast the hover trail dies, per 60th of a second
    const RAIN_SHARE = 0.55       // falling streaks per column of the grid
    const RAIN_SQUARE = 3         // size of a falling square, in px
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const base = document.createElement('canvas')   // the resting dots, drawn once per resize
    let w = 0, h = 0, dpr = 1, cols = 0, rows = 0
    let heat = new Float32Array(0)
    let drops = []
    let mx = 0, my = 0, lx = 0, ly = 0
    let inside = false
    let hot = false
    let clock = 0
    let last = 0

    function hash(a, b) {
      const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
      return n - Math.floor(n)
    }

    function newDrop(fromTop) {
      const length = 5 + Math.floor(Math.random() * 14)
      return {
        col: Math.floor(Math.random() * cols),
        head: fromTop ? -Math.random() * 12 : Math.random() * (rows + length),
        speed: 7 + Math.random() * 16,      // cells per second
        length,
        level: 0.35 + Math.random() * 0.65
      }
    }

    // Lights a roughly round patch of cells. Each row gets a slightly different reach, so the edge is uneven.
    function deposit(cx, cy) {
      const col = Math.round(cx / GAP), row = Math.round(cy / GAP)
      const beat = Math.floor(clock / 5)
      for (let dy = -REACH; dy <= REACH; dy++) {
        const y = row + dy
        if (y < 0 || y >= rows) continue
        const reach = REACH * (0.72 + hash(y, beat) * 0.5)
        for (let dx = -REACH - 2; dx <= REACH + 2; dx++) {
          const x = col + dx
          if (x < 0 || x >= cols) continue
          const v = 1 - Math.sqrt(dx * dx + dy * dy) / reach
          if (v <= 0) continue
          const i = y * cols + x
          if (v > heat[i]) heat[i] = v
        }
      }
    }

    function drawBase() {
      base.width = canvas.width
      base.height = canvas.height
      const b = base.getContext('2d')
      b.setTransform(dpr, 0, 0, dpr, 0, 0)
      b.fillStyle = 'rgba(255,255,255,0.13)'
      b.beginPath()
      const o = GAP / 2 - 0.7
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) b.rect(x * GAP + o, y * GAP + o, 1.4, 1.4)
      b.fill()
    }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(base, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // rain: three brightness steps, brightest at the head of each streak
      if (drops.length) {
        const steps = [new Path2D(), new Path2D(), new Path2D()]
        const o = (GAP - RAIN_SQUARE) / 2
        for (const drop of drops) {
          const head = Math.floor(drop.head)
          for (let k = 0; k < drop.length; k++) {
            const y = head - k
            if (y < 0 || y >= rows) continue
            const v = (1 - k / drop.length) * drop.level
            steps[v > 0.62 ? 2 : v > 0.3 ? 1 : 0].rect(drop.col * GAP + o, y * GAP + o, RAIN_SQUARE, RAIN_SQUARE)
          }
        }
        ctx.fillStyle = 'rgba(255,255,255,0.17)'; ctx.fill(steps[0])
        ctx.fillStyle = 'rgba(255,255,255,0.36)'; ctx.fill(steps[1])
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill(steps[2])
      }

      // hover: ordered dither, so it runs from solid at the cursor to scattered squares at the edge
      if (hot) {
        const mid = new Path2D(), bright = new Path2D()
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const v = heat[y * cols + x]
            if (v <= 0.03) continue
            const threshold = (BAYER[(x & 3) + ((y & 3) << 2)] + 0.5) / 16
            if (v * 1.12 > threshold) (v > threshold + 0.26 ? bright : mid).rect(x * GAP + 1, y * GAP + 1, GAP - 2, GAP - 2)
          }
        }
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill(mid)
        ctx.fillStyle = 'rgba(255,255,255,0.86)'; ctx.fill(bright)
      }
    }

    function resize() {
      const rect = panel.getBoundingClientRect()
      dpr = Math.min(2, window.devicePixelRatio || 1)
      w = rect.width
      h = rect.height
      cols = Math.ceil(w / GAP)
      rows = Math.ceil(h / GAP)
      heat = new Float32Array(cols * rows)
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      drawBase()
      drops = []
      if (!still) for (let i = 0; i < Math.round(cols * RAIN_SHARE); i++) drops.push(newDrop(false))
      draw()
    }

    function tick(now) {
      if (!canvas.isConnected) return
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      clock += dt * 60

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i]
        drop.head += drop.speed * dt
        if (drop.head - drop.length > rows) drops[i] = newDrop(true)
      }

      if (hot) {
        // Rows fade at slightly different speeds, so the trail tears apart instead of shrinking evenly.
        let peak = 0
        for (let y = 0; y < rows; y++) {
          const fade = Math.pow(FADE - 0.05 * hash(y, 7), dt * 60)
          const start = y * cols
          for (let x = 0; x < cols; x++) {
            const v = heat[start + x] * fade
            heat[start + x] = v
            if (v > peak) peak = v
          }
        }
        if (!inside && peak < 0.03) { heat.fill(0); hot = false }
      }

      if (inside) {
        // Fill the path since the last frame, so a fast sweep leaves one unbroken streak.
        const dx = mx - lx, dy = my - ly
        const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / GAP))
        for (let i = 1; i <= steps; i++) deposit(lx + dx * i / steps, ly + dy * i / steps)
        lx = mx
        ly = my
        hot = true
      }

      draw()
      requestAnimationFrame(tick)
    }

    if (!still) {
      panel.addEventListener('pointermove', event => {
        if (event.pointerType && event.pointerType !== 'mouse') return
        const rect = panel.getBoundingClientRect()
        mx = event.clientX - rect.left
        my = event.clientY - rect.top
        if (!inside) { lx = mx; ly = my; inside = true }
      })
      panel.addEventListener('pointerleave', () => { inside = false })
    }

    if (window.ResizeObserver) new ResizeObserver(resize).observe(panel)
    else window.addEventListener('resize', resize)
    resize()
    if (!still) requestAnimationFrame(tick)
  }

  function looksLikeEmailLink() {
    const params = new URLSearchParams(window.location.search)
    return params.get('mode') === 'signIn' && params.has('oobCode')
  }

  async function start() {
    document.body.appendChild(lander)
    root.classList.add(LOCK_CLASS)
    initDots()

    if (looksLikeEmailLink()) {
      const pending = read(PENDING_KEY)
      if (pending) { viewWorking('Signing you in...'); completeLink(pending) }
      else viewConfirm()
    } else {
      viewWelcome()
    }

    // A session from an earlier visit signs the person in without any click.
    try {
      const { fb, auth } = await loadSdk()
      fb.onAuthStateChanged(auth, user => { if (user && !looksLikeEmailLink()) finish(user) })
    } catch (_) {}
  }

  // Keep keyboard shortcuts of the tool underneath from firing while the lander is up.
  lander.addEventListener('keydown', event => event.stopPropagation())

  if (document.body) start()
  else document.addEventListener('DOMContentLoaded', start)
})()
