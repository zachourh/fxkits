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
      display: flex; color: #fff; padding: 24px; overflow-y: auto;
      background: radial-gradient(ellipse at center, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.35) 100%),
        url('/lander-bg.webp') center / cover no-repeat #000;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      visibility: visible; -webkit-font-smoothing: antialiased;
    }
    .fxkits-lander * { box-sizing: border-box; }
    .fxl-inner {
      width: 100%; max-width: 680px; margin: auto;
      display: flex; flex-direction: column; align-items: center; text-align: center;
    }
    .fxl-logo { width: 52px; height: 52px; border-radius: 12px; margin-bottom: 36px; display: block; }
    .fxl-title { margin: 0; font-size: 30px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.12; color: #fff; }
    .fxl-title-hero { font-size: 40px; letter-spacing: -0.035em; line-height: 1.08; }
    .fxl-sub { margin: 14px 0 0; max-width: 470px; font-size: 16px; line-height: 1.5; color: #8d8d92; }
    .fxl-sub strong { color: #e4e4e7; font-weight: 500; }
    .fxl-actions { margin-top: 34px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .fxl-btn {
      height: 46px; padding: 0 22px; border-radius: 10px; cursor: pointer; white-space: nowrap;
      font: inherit; font-size: 15px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 10px;
      border: 1px solid transparent; transition: background 0.15s, border-color 0.15s, opacity 0.15s;
    }
    .fxl-btn:disabled { opacity: 0.55; cursor: default; }
    .fxl-btn-primary { background: #f4f4f5; color: #000; }
    .fxl-btn-primary:hover:not(:disabled) { background: #fff; }
    .fxl-btn-ghost { background: transparent; color: #fff; border-color: rgba(255,255,255,0.2); }
    .fxl-btn-ghost:hover:not(:disabled) { border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.05); }
    .fxl-form { margin-top: 30px; width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: 12px; }
    .fxl-form .fxl-btn { width: 100%; }
    .fxl-divider {
      display: flex; align-items: center; gap: 14px; margin: 6px 0;
      font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #5d5d62;
    }
    .fxl-divider::before, .fxl-divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.12); }
    .fxl-input {
      width: 100%; height: 46px; padding: 0 15px; border: 1px solid rgba(255,255,255,0.18); border-radius: 10px;
      background: rgba(255,255,255,0.04); color: #fff; font: inherit; font-size: 15px; outline: none; text-align: left;
    }
    .fxl-input:focus { border-color: rgba(255,255,255,0.5); }
    .fxl-input::placeholder { color: rgba(255,255,255,0.36); }
    .fxl-error { min-height: 18px; font-size: 12px; line-height: 1.4; color: #ff9b9b; }
    .fxl-switch { margin-top: 18px; font-size: 14px; color: #8d8d92; }
    .fxl-link { background: none; border: 0; padding: 0; font: inherit; color: #fff; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
    .fxl-link:hover { opacity: 0.75; }
    .fxl-legal { margin: 26px 0 0; max-width: 400px; font-size: 12px; line-height: 1.5; color: #5d5d62; }
    .fxl-legal a { color: #8d8d92; text-underline-offset: 2px; }
    .fxl-legal a:hover { color: #fff; }
    @media (max-width: 520px) {
      .fxl-title { font-size: 25px; }
      .fxl-title-hero { font-size: 31px; }
      .fxl-sub { font-size: 15px; }
      .fxl-actions { flex-direction: column; width: 100%; max-width: 380px; }
    }
  `
  document.head.appendChild(style)

  const GOOGLE_ICON = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>'
  const LOGO = '<img class="fxl-logo" src="/favicon.svg" alt="FXKits">'
  const LEGAL_LINKS = '<a href="/terms/">Terms</a> and <a href="/privacy/">Privacy Policy</a>'

  const lander = document.createElement('div')
  lander.className = 'fxkits-lander'
  lander.setAttribute('role', 'dialog')
  lander.setAttribute('aria-modal', 'true')
  lander.setAttribute('aria-label', 'Sign in to FXKits')
  const inner = document.createElement('div')
  inner.className = 'fxl-inner'
  lander.appendChild(inner)

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
    inner.innerHTML = `
      ${LOGO}
      <h1 class="fxl-title fxl-title-hero">AI-powered visual tools for creators</h1>
      <p class="fxl-sub">Upload your assets, tune the look, and export polished visuals from focused browser-based simulators.</p>
      <div class="fxl-actions">
        <button class="fxl-btn fxl-btn-primary" type="button" data-go="signin">Sign in</button>
        <button class="fxl-btn fxl-btn-ghost" type="button" data-go="signup">Create account</button>
      </div>
      <p class="fxl-legal">${LEGAL_LINKS.replace(' and ', ' &nbsp;·&nbsp; ')}</p>
    `
    inner.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => { mode = btn.dataset.go; viewAuth() }))
  }

  function viewAuth() {
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
    inner.innerHTML = `
      ${LOGO}
      <h1 class="fxl-title">Check your inbox</h1>
      <p class="fxl-sub">We sent a sign-in link to <strong>${esc(email)}</strong>. Open it on this device to finish. It can take a minute to arrive, so check your spam folder too.</p>
      <p class="fxl-switch"><button class="fxl-link" type="button" data-back>Use a different email</button></p>
    `
    $('[data-back]').addEventListener('click', viewAuth)
  }

  function viewConfirm() {
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

  function looksLikeEmailLink() {
    const params = new URLSearchParams(window.location.search)
    return params.get('mode') === 'signIn' && params.has('oobCode')
  }

  async function start() {
    document.body.appendChild(lander)
    root.classList.add(LOCK_CLASS)

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
