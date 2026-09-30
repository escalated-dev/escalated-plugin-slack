import { it } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { handleSlackWebhook, verifySlackSignature } from '../src/webhook.js'
import plugin from '../src/index.js'
import type { EndpointRequest, PluginContext } from '@escalated-dev/plugin-sdk'

const secret = 'test-signing-secret'
const payload = { type: 'event_callback', event_id: 'Ev123', team_id: 'T123', event: {
  type: 'message', channel: 'C123', user: 'U123', ts: '1234567890.000100', text: '  Parcel 📦  ',
} }
function request(body: unknown = payload, timestamp = String(Math.floor(Date.now() / 1000))): EndpointRequest {
  const rawBody = Buffer.from(' ' + JSON.stringify(body) + '\r\n')
  const signature = 'v0=' + createHmac('sha256', secret).update(`v0:${timestamp}:`).update(rawBody).digest('hex')
  return { httpContract: 1, rawBody, body: { tampered: true }, params: {}, query: {},
    headers: { 'x-slack-signature': signature, 'x-slack-request-timestamp': timestamp } }
}
function context(overrides = {}, receipt: unknown = { accepted: true, event_id: 'Ev123' }) {
  const emitted: Array<{ hook: string; data: unknown }> = []
  const settings = { signing_secret: secret, workspace_id: 'T123', inbound_channels: ['C123'], ...overrides }
  const ctx = { config: { all: async () => settings }, log: { warn: () => {} },
    emit: async (hook: string, data: unknown) => { emitted.push({ hook, data }); return receipt } } as unknown as PluginContext
  return { ctx, emitted }
}

it('verifies raw whitespace and unicode before reading the authenticated payload', async () => {
  const { ctx, emitted } = context()
  const req = request()
  assert.equal(verifySlackSignature(req, secret), true)
  assert.equal((await handleSlackWebhook(ctx, req)).status, 202)
  assert.deepEqual((emitted[0].data as any).event, payload.event)
  assert.equal((emitted[0].data as any).raw_body_base64, Buffer.from(req.rawBody!).toString('base64'))
  assert.equal(emitted[0].hook, 'slack.message.received')
})

it('authenticates URL verification and rejects a forged challenge', async () => {
  const { ctx, emitted } = context()
  const req = request({ type: 'url_verification', challenge: 'challenge-value' })
  assert.deepEqual((await handleSlackWebhook(ctx, req)).body, { challenge: 'challenge-value' })
  req.headers['x-slack-signature'] = 'v0=' + '0'.repeat(64)
  assert.equal((await handleSlackWebhook(ctx, req)).status, 401)
  assert.equal(emitted.length, 0)
})

for (const [name, mutate] of Object.entries({
  'missing signature': (req: EndpointRequest) => { delete req.headers['x-slack-signature'] },
  'missing timestamp': (req: EndpointRequest) => { delete req.headers['x-slack-request-timestamp'] },
  'duplicate timestamp': (req: EndpointRequest) => { req.headers['x-slack-request-timestamp'] += ', 1' },
  'wrong version': (req: EndpointRequest) => { req.headers['x-slack-signature'] = 'v1=' + '0'.repeat(64) },
  'short signature': (req: EndpointRequest) => { req.headers['x-slack-signature'] = 'v0=abc' },
  'mutated body': (req: EndpointRequest) => { req.rawBody = Buffer.from('{}') },
})) it('rejects ' + name + ' without emitting a message', async () => {
  const { ctx, emitted } = context()
  const req = request()
  mutate(req)
  assert.equal((await handleSlackWebhook(ctx, req)).status, 401)
  assert.equal(emitted.length, 0)
})

it('rejects stale and future signed requests, allowing the five-minute boundary', () => {
  for (const delta of [-301, 301]) assert.equal(verifySlackSignature(request(payload, String(1000000000 + delta)), secret, 1000000000), false)
  for (const delta of [-300, 300]) assert.equal(verifySlackSignature(request(payload, String(1000000000 + delta)), secret, 1000000000), true)
})

it('fails closed for missing credentials, old bridges and unconfigured inbound routing', async () => {
  for (const settings of [{ signing_secret: '' }, { workspace_id: '' }, { inbound_channels: [] }]) {
    const { ctx, emitted } = context(settings)
    assert.equal((await handleSlackWebhook(ctx, request())).status, 503)
    assert.equal(emitted.length, 0)
  }
  const { ctx, emitted } = context()
  const req = request()
  delete req.rawBody
  assert.equal((await handleSlackWebhook(ctx, req)).status, 503)
  assert.equal(emitted.length, 0)
})

it('acknowledges foreign workspaces, channels, direct messages and blank text without emitting', async () => {
  for (const body of [{ ...payload, team_id: 'TOTHER' }, { ...payload, event: { ...payload.event, channel: 'COTHER' } },
    { ...payload, event: { ...payload.event, channel: 'D123' } }, { ...payload, event: { ...payload.event, text: ' \n\t ' } }]) {
    const { ctx, emitted } = context()
    const response = await handleSlackWebhook(ctx, request(body))
    assert.equal(response.status, 200)
    assert.deepEqual(response.body, { ignored: true })
    assert.equal(emitted.length, 0)
  }
})

it('forwards text beyond 65,535 UTF-16 units for the host to accept or dead-letter', async () => {
  const text = '\u{1F4E6}'.repeat(40000)
  assert.ok(text.length > 65535)
  const { ctx, emitted } = context()
  assert.equal((await handleSlackWebhook(ctx, request({ ...payload, event: { ...payload.event, text } }))).status, 202)
  assert.equal((emitted[0].data as any).event.text, text)
})

it('acknowledges an event the host authenticated and chose not to route', async () => {
  const { ctx, emitted } = context({}, { ignored: true })
  const response = await handleSlackWebhook(ctx, request())
  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { ignored: true })
  assert.equal(emitted.length, 1)
})

it('ignores bot messages, edits, deletion and hidden events', async () => {
  for (const change of [{ bot_id: 'B1' }, { bot_profile: {} }, { subtype: 'message_changed' }, { subtype: 'message_deleted' }, { hidden: true }]) {
    const { ctx, emitted } = context()
    assert.equal((await handleSlackWebhook(ctx, request({ ...payload, event: { ...payload.event, ...change } }))).status, 200)
    assert.equal(emitted.length, 0)
  }
})

it('requires a matching durable acceptance receipt and returns retryable errors otherwise', async () => {
  for (const receipt of [null, {}, { accepted: false }, { accepted: true, event_id: 'EvOTHER' }]) {
    const { ctx } = context({}, receipt)
    const response = await handleSlackWebhook(ctx, request())
    assert.equal(response.status, 503)
    assert.equal(response.headers['retry-after'], '30')
  }
  const { ctx } = context()
  ctx.emit = async () => { throw new Error('database down') }
  assert.equal((await handleSlackWebhook(ctx, request())).status, 503)
})

it('registers the authenticated handler in the real plugin definition', () => {
  assert.equal(plugin.webhooks?.['POST /webhook'], handleSlackWebhook)
  assert.equal(plugin.toManifest().webhooks[0].path, '/webhook')
})
