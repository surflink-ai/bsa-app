/**
 * Authorizes Vercel Cron invocations.
 *
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` to cron routes when the
 * CRON_SECRET env var is set. We require it so these endpoints can't be
 * triggered by the public. Returns true when the request is an authorized cron
 * (or an admin-triggered manual run passing the same secret).
 */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization') || ''
  return auth === `Bearer ${secret}`
}
