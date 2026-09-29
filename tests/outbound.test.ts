import { it } from 'node:test'
import assert from 'node:assert/strict'
import plugin from '../src/index.js'
import type { PluginContext } from '@escalated-dev/plugin-sdk'

const ticket = { id: 42, subject: 'Parcel', metadata: { source: 'slack', slack: {
  workspace: 'T123', channel: 'C123', thread_ts: '1234567890.000100',
} } }
function context(overrides = {}) {
  const posts: any[] = []
  const ctx = { config: { all: async () => ({ bot_token: 'fixture', workspace_id: 'T123', inbound_channels: ['C123'],
    default_channel: 'default', event_routing: { 'ticket.created': true, 'reply.created': true }, ...overrides }) },
    http: { post: async (_url: string, options: any) => { posts.push(options.json); return { json: async () => ({ ok: true }) } } },
    log: { info: () => {}, warn: () => {} } } as unknown as PluginContext
  return { ctx, posts }
}

it('does not echo a Slack-origin ticket back into Slack', async () => {
  const { ctx, posts } = context()
  await plugin.actions!['ticket.created'](ticket, ctx)
  assert.equal(posts.length, 0)
})

it('does not echo inbound replies or expose internal notes', async () => {
  const { ctx, posts } = context()
  for (const reply of [{ metadata: { source: 'slack' } }, { is_internal_note: true }])
    await plugin.actions!['reply.created']({ ticket, reply: { id: 1, ticket_id: 42, body: 'private', ...reply } }, ctx)
  assert.equal(posts.length, 0)
})

it('sends a host reply to the recorded Slack origin thread', async () => {
  const { ctx, posts } = context()
  await plugin.actions!['reply.created']({ ticket, reply: { id: 1, ticket_id: 42, body: 'Public reply' } }, ctx)
  assert.equal(posts.length, 1)
  assert.equal(posts[0].channel, 'C123')
  assert.equal(posts[0].thread_ts, '1234567890.000100')
})

for (const settings of [{ workspace_id: 'TOTHER' }, { inbound_channels: ['COTHER'] }])
  it('does not fall back to a different channel when origin routing is unavailable: ' + JSON.stringify(settings), async () => {
    const { ctx, posts } = context(settings)
    await plugin.actions!['reply.created']({ ticket, reply: { id: 1, ticket_id: 42, body: 'Must not leak' } }, ctx)
    assert.equal(posts.length, 0)
  })

it('preserves ordinary ticket notification routing', async () => {
  const { ctx, posts } = context()
  await plugin.actions!['ticket.created']({ id: 1, subject: 'Ordinary' }, ctx)
  assert.equal(posts.length, 1)
  assert.equal(posts[0].channel, 'default')
})
