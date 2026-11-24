// Cloudflare Pages Function: POST /api/subscribe
// Replaces api/subscribe.php. Adds the email to Kit (subscriber, form, tag, optional role tag).
//
// Settings, in the Cloudflare Pages project under Settings > Variables and Secrets:
//   KIT_API_KEY    (secret)  Kit v4 API key
//   KIT_TAG_ID               numeric id of the main FXKits tag
//   KIT_ROLE_TAGS  (optional) JSON object mapping a role label to a tag id,
//                  e.g. {"Freelance designer": 123, "Student or learning": 456}

const KIT_FORM_ID = 9881119
const ALLOWED_ROLES = [
  'Student or learning',
  'Freelance designer',
  'I run a small studio',
  'Not a designer',
]

function respond(ok, status = 200) {
  return new Response(JSON.stringify({ ok }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

async function kitPost(path, payload, apiKey) {
  try {
    const res = await fetch(`https://api.kit.com/v4${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Kit-Api-Key': apiKey },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    })
    return res.ok
  } catch (_) {
    return false
  }
}

function readRoleTags(raw) {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (_) {
    return {}
  }
}

export async function onRequestPost({ request, env }) {
  let data = null
  try {
    data = await request.json()
  } catch (_) {
    data = null
  }
  const body = data && typeof data === 'object' ? data : {}
  const email = String(body.email ?? '').trim()
  const name = String(body.name ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80)
  const role = String(body.role ?? '').trim()

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return respond(false, 400)

  const apiKey = String(env.KIT_API_KEY ?? '').trim()
  const tagId = parseInt(env.KIT_TAG_ID ?? '', 10)
  if (!apiKey || !(tagId > 0)) return respond(false, 500)

  const roleTags = readRoleTags(env.KIT_ROLE_TAGS)
  const roleTagId = ALLOWED_ROLES.includes(role) ? parseInt(roleTags[role] ?? 0, 10) : 0

  const payload = { email_address: email }
  const subscriberPayload = name ? { ...payload, first_name: name } : payload

  if (!(await kitPost('/subscribers', subscriberPayload, apiKey))) return respond(false, 502)
  if (!(await kitPost(`/forms/${KIT_FORM_ID}/subscribers`, payload, apiKey))) return respond(false, 502)
  if (!(await kitPost(`/tags/${tagId}/subscribers`, payload, apiKey))) return respond(false, 502)
  if (roleTagId > 0) await kitPost(`/tags/${roleTagId}/subscribers`, payload, apiKey)

  return respond(true)
}

export function onRequest() {
  return respond(false, 405)
}
