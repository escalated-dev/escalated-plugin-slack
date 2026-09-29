import { createHmac, timingSafeEqual } from 'node:crypto'
import { httpResponse } from '@escalated-dev/plugin-sdk'
import type { EndpointRequest, PluginContext } from '@escalated-dev/plugin-sdk'

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function verifySlackSignature(req: EndpointRequest, secret: unknown, now = Date.now() / 1000): boolean {
  if (typeof secret !== 'string' || secret.length === 0 || req.httpContract !== 1
    || !(req.rawBody instanceof Uint8Array) || req.rawBody.byteLength > 1024 * 1024) return false
  const timestamp = req.headers['x-slack-request-timestamp']
  const signature = req.headers['x-slack-signature']
  if (typeof timestamp !== 'string' || !/^[0-9]{1,12}$/.test(timestamp)
    || Math.abs(now - Number(timestamp)) > 300 || typeof signature !== 'string'
    || !/^v0=[a-f0-9]{64}$/.test(signature)) return false
  const expected = createHmac('sha256', secret).update(`v0:${timestamp}:`).update(req.rawBody).digest()
  return timingSafeEqual(expected, Buffer.from(signature.slice(3), 'hex'))
}

export async function handleSlackWebhook(ctx: PluginContext, req: EndpointRequest) {
  const settings = await ctx.config.all()
  if (typeof settings.signing_secret !== 'string' || settings.signing_secret.length === 0)
    return httpResponse(503, { error: 'Slack signing secret is not configured' })
  if (req.httpContract !== 1 || !(req.rawBody instanceof Uint8Array))
    return httpResponse(503, { error: 'Plugin HTTP contract version 1 is required' })
  if (!verifySlackSignature(req, settings.signing_secret))
    return httpResponse(401, { error: 'Invalid signature' })

  // Parse only the authenticated bytes. Framework middleware may have changed req.body.
  let payload: unknown
  try { payload = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(req.rawBody)) }
  catch { return httpResponse(400, { error: 'Invalid JSON' }) }
  if (!record(payload)) return httpResponse(400, { error: 'Invalid event' })
  if (payload.type === 'url_verification') {
    return typeof payload.challenge === 'string' && payload.challenge.length <= 4096
      ? httpResponse(200, { challenge: payload.challenge }) : httpResponse(400, { error: 'Invalid challenge' })
  }
  if (payload.type !== 'event_callback' || !record(payload.event))
    return httpResponse(200, { ignored: true })
  const event = payload.event
  if (event.type !== 'message' || event.bot_id || event.bot_profile || event.subtype || event.hidden)
    return httpResponse(200, { ignored: true })
  if (typeof settings.workspace_id !== 'string' || settings.workspace_id.length === 0
    || !Array.isArray(settings.inbound_channels) || settings.inbound_channels.length === 0)
    return httpResponse(503, { error: 'Inbound workspace and channels are not configured' })
  if (payload.team_id !== settings.workspace_id || !settings.inbound_channels.includes(event.channel))
    return httpResponse(403, { error: 'Workspace or channel is not allowed' })
  if (typeof payload.event_id !== 'string' || !/^Ev[A-Za-z0-9]+$/.test(payload.event_id)
    || typeof event.channel !== 'string' || !/^[CGD][A-Za-z0-9]+$/.test(event.channel)
    || typeof event.user !== 'string' || !/^[UW][A-Za-z0-9]+$/.test(event.user)
    || typeof event.ts !== 'string' || !/^[0-9]+\.[0-9]+$/.test(event.ts)
    || (event.thread_ts !== undefined && (typeof event.thread_ts !== 'string' || !/^[0-9]+\.[0-9]+$/.test(event.thread_ts)))
    || typeof event.text !== 'string' || event.text.trim() === '' || event.text.length > 65535)
    return httpResponse(400, { error: 'Invalid message' })
  try {
    const receipt: unknown = await ctx.emit('slack.message.received', {
      event_id: payload.event_id, team_id: payload.team_id, event,
      raw_body_base64: Buffer.from(req.rawBody).toString('base64'),
      timestamp: req.headers['x-slack-request-timestamp'], signature: req.headers['x-slack-signature'],
    })
    if (record(receipt) && receipt.accepted === true && receipt.event_id === payload.event_id)
      return httpResponse(202, { ok: true })
  } catch {
    ctx.log.warn('[slack] Host did not durably accept the inbound event')
  }
  // A fire-and-forget hook is not evidence that a ticket was stored. Let Slack retry.
  return httpResponse(503, { error: 'Durable inbound adapter is unavailable' }, { headers: { 'Retry-After': '30' } })
}
