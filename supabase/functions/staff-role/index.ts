// Verifies the caller is a real, currently-logged-in admin (by checking a
// genuine Firebase ID token's signature against Google's public keys — no
// shared secret involved) before performing any is_admin/is_staff change.
//
// Why this exists: the app's DB trigger (see
// supabase_fix_admin_escalation.sql) blocks ALL role changes coming through
// the public anon key, because the app has no way to otherwise tell a real
// admin's request from anyone else's — the anon key is public and Firebase
// login was never bridged into Supabase. This function IS that bridge for
// exactly the three staff-management actions the app needs
// (promote/remove/setRole). It runs with the service_role key, which is
// exempt from that trigger, but only after independently verifying identity
// itself — the trigger being bypassable here is intentional and paired with
// the check below, not a hole in it.
//
// Deploy: supabase functions deploy staff-role --project-ref <ref> --no-verify-jwt
// The --no-verify-jwt flag is required, not optional: this function does its
// OWN identity check via the Firebase ID token (see below), and the request
// carries the Supabase anon key (not a Supabase user JWT) for gateway
// routing. Without the flag, Supabase's platform-level JWT gate rejects the
// browser's CORS preflight before this code ever runs, which the browser
// reports as an opaque CORS error, not an auth error (hit this in prod on
// 2026-08-11, fixed by redeploying with the flag).
//
// Secrets needed (supabase secrets set ...): none beyond the project's
// default SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY, which Supabase injects
// automatically for every Edge Function. FIREBASE_PROJECT_ID must be set
// explicitly (see deploy notes at the bottom of this repo's SQL migration
// folder / README).

import { createClient } from 'npm:@supabase/supabase-js@2'
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@5'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')!
const HARDCODED_ADMIN_EMAIL = 'yugandhar.bhamare@gmail.com'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Standard JWKS endpoint for verifying Firebase Auth ID tokens (Google-hosted,
// public — no credentials required to fetch or use it).
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-firebase-id-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

async function verifyCallerIsAdmin(req: Request): Promise<{ ok: true; email: string } | { ok: false; error: string; status: number }> {
  const idToken = req.headers.get('x-firebase-id-token')
  if (!idToken) return { ok: false, error: 'Missing Firebase ID token', status: 401 }

  let payload
  try {
    const result = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    })
    payload = result.payload
  } catch (_e) {
    return { ok: false, error: 'Invalid or expired session. Please sign in again.', status: 401 }
  }

  const email = (payload.email as string | undefined)?.toLowerCase()
  if (!email || payload.email_verified !== true) {
    return { ok: false, error: 'Token missing a verified email', status: 401 }
  }

  if (email === HARDCODED_ADMIN_EMAIL) return { ok: true, email }

  const { data: caller, error } = await admin
    .from('users')
    .select('is_admin')
    .eq('emailid', email)
    .single()

  if (error || caller?.is_admin !== true) {
    return { ok: false, error: 'Admin privileges required', status: 403 }
  }

  return { ok: true, email }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authResult = await verifyCallerIsAdmin(req)
  if (!authResult.ok) return json({ error: authResult.error }, authResult.status)

  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { action, userId } = body ?? {}
  if (!userId || typeof userId !== 'string') return json({ error: 'userId is required' }, 400)

  if (action === 'promote') {
    const { data, error } = await admin.from('users').update({ is_staff: true }).eq('id', userId).select().single()
    if (error) return json({ error: error.message }, 400)
    return json({ success: true, user: data })
  }

  if (action === 'remove') {
    const { data: target, error: targetErr } = await admin.from('users').select('is_admin').eq('id', userId).single()
    if (targetErr) return json({ error: targetErr.message }, 400)
    if (target?.is_admin) return json({ error: 'Cannot remove staff access from an admin. Change their role first.' }, 400)

    const { data, error } = await admin.from('users').update({ is_staff: false }).eq('id', userId).select().single()
    if (error) return json({ error: error.message }, 400)
    return json({ success: true, user: data })
  }

  if (action === 'setRole') {
    const newRole = body?.newRole
    if (newRole !== 'admin' && newRole !== 'staff') {
      return json({ error: 'newRole must be "admin" or "staff"' }, 400)
    }

    if (newRole === 'staff') {
      const { data: targetUser, error: targetErr } = await admin.from('users').select('is_admin').eq('id', userId).single()
      if (targetErr) return json({ error: targetErr.message }, 400)

      if (targetUser?.is_admin) {
        const { data: allUsers, error: countErr } = await admin.from('users').select('is_admin, emailid')
        if (countErr) return json({ error: countErr.message }, 400)
        const adminCount = (allUsers ?? []).filter(
          (u) => u.is_admin === true || u.emailid?.toLowerCase() === HARDCODED_ADMIN_EMAIL
        ).length
        if (adminCount <= 1) {
          return json({ error: 'Cannot remove admin privileges from the last admin user.' }, 400)
        }
      }
    }

    const updates = newRole === 'admin' ? { is_admin: true, is_staff: true } : { is_admin: false, is_staff: true }
    const { data, error } = await admin.from('users').update(updates).eq('id', userId).select().single()
    if (error) return json({ error: error.message }, 400)
    return json({ success: true, user: data })
  }

  return json({ error: `Unknown action: ${action}` }, 400)
})
