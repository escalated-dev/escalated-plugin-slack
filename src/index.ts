import { definePlugin } from '@escalated-dev/plugin-sdk'
import type { PluginContext } from '@escalated-dev/plugin-sdk'
import { SlackClient } from './client'

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

interface SlackSettings {
  bot_token?: string
  signing_secret?: string
  client_id?: string
  client_secret?: string
  workspace_name?: string
  default_channel?: string
  channel_mappings?: ChannelMapping[]
  event_routing?: Record<string, boolean>
}

interface ChannelMapping {
  source_type: 'team' | 'category'
  source_id: string
  source_name: string
  slack_channel: string
}

interface TicketEvent {
  id: string | number
  subject?: string
  title?: string
  status?: string
  priority?: string
  team_id?: string | number
  category_id?: string | number
  assigned_to?: string | number | null
  slack_thread_ts?: string
}

interface ReplyEvent {
  id: string | number
  ticket_id: string | number
  body?: string
  author_name?: string
  is_internal_note?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveChannel(ticket: TicketEvent, settings: SlackSettings): string {
  const mappings = settings.channel_mappings ?? []

  for (const mapping of mappings) {
    if (!mapping.slack_channel) continue

    if (
      mapping.source_type === 'team' &&
      ticket.team_id != null &&
      String(ticket.team_id) === String(mapping.source_id)
    ) {
      return mapping.slack_channel
    }

    if (
      mapping.source_type === 'category' &&
      ticket.category_id != null &&
      String(ticket.category_id) === String(mapping.source_id)
    ) {
      return mapping.slack_channel
    }
  }

  return settings.default_channel ?? ''
}

function isEventEnabled(event: string, settings: SlackSettings): boolean {
  return !!(settings.event_routing ?? {})[event]
}

async function getSettings(ctx: PluginContext): Promise<SlackSettings> {
  return (await ctx.config.all()) as SlackSettings
}

function makeClient(ctx: PluginContext, settings: SlackSettings): SlackClient | null {
  if (!settings.bot_token) {
    ctx.log.warn('[slack] bot_token not configured — skipping')
    return null
  }
  return new SlackClient(ctx.http, settings.bot_token)
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

export default definePlugin({
  name: 'slack',
  version: '0.1.0',
  description: 'Slack notifications for ticket events',

  config: [
    { name: 'bot_token', label: 'Bot Token', type: 'password', required: true,
      help: 'OAuth bot token starting with xoxb-. Found in your Slack app settings.' },
    { name: 'signing_secret', label: 'Signing Secret', type: 'password',
      help: 'Used to verify incoming Slack webhook signatures.' },
    { name: 'client_id', label: 'Client ID', type: 'text' },
    { name: 'client_secret', label: 'Client Secret', type: 'password' },
    { name: 'workspace_name', label: 'Workspace Name', type: 'text' },
    { name: 'default_channel', label: 'Default Channel', type: 'text', default: 'general',
      help: 'Fallback channel when no mapping matches.' },
    { name: 'channel_mappings', label: 'Channel Mappings', type: 'json', default: [] },
    { name: 'event_routing', label: 'Event Routing', type: 'json',
      default: {
        'ticket.created': true,
        'ticket.assigned': true,
        'ticket.resolved': true,
        'reply.created': true,
        'sla.breached': false,
      } },
  ],

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  onActivate: async (ctx) => {
    const cfg = await ctx.config.all()
    if (!cfg.default_channel) {
      await ctx.config.set({ default_channel: 'general' })
    }
    ctx.log.info('[slack] Plugin activated')
  },

  onDeactivate: async (ctx) => {
    ctx.log.info('[slack] Plugin deactivated')
  },

  // -------------------------------------------------------------------------
  // Action hooks
  // -------------------------------------------------------------------------

  actions: {
    'ticket.created': async (event, ctx) => {
      const ticket = event as TicketEvent
      const settings = await getSettings(ctx)

      if (!isEventEnabled('ticket.created', settings)) return

      const client = makeClient(ctx, settings)
      if (!client) return

      const channel = resolveChannel(ticket, settings)
      if (!channel) {
        ctx.log.warn('[slack] ticket.created — no channel resolved, skipping')
        return
      }

      await client.postMessage({
        channel,
        text: `New ticket #${ticket.id}: ${ticket.subject ?? ticket.title ?? 'No subject'}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: [
                `*New Ticket* #${ticket.id}`,
                `*Subject:* ${ticket.subject ?? ticket.title ?? 'No subject'}`,
                `*Status:* ${ticket.status ?? 'open'}`,
                `*Priority:* ${ticket.priority ?? 'normal'}`,
              ].join('\n'),
            },
          },
        ],
      })

      ctx.log.info('[slack] ticket.created notification sent', { ticketId: ticket.id, channel })
    },

    'ticket.assigned': async (event, ctx) => {
      const ticket = event as TicketEvent
      const settings = await getSettings(ctx)

      if (!isEventEnabled('ticket.assigned', settings)) return

      const client = makeClient(ctx, settings)
      if (!client) return

      // Look up the assigned agent to DM them
      if (ticket.assigned_to) {
        const agent = await ctx.agents.find(ticket.assigned_to)
        if (agent) {
          ctx.log.info('[slack] ticket.assigned — DM to agent', { agentId: agent.id })
        }
      }

      const channel = resolveChannel(ticket, settings)
      if (!channel) return

      await client.postMessage({
        channel,
        text: `Ticket #${ticket.id} has been assigned`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: [
                `*Ticket Assigned* #${ticket.id}`,
                `*Subject:* ${ticket.subject ?? ticket.title ?? 'No subject'}`,
              ].join('\n'),
            },
          },
        ],
      })
    },

    'reply.created': async (event, ctx) => {
      const payload = event as { reply: ReplyEvent; ticket: TicketEvent }
      const reply = payload.reply ?? (event as unknown as ReplyEvent)
      const ticket = payload.ticket

      if (!ticket) return

      const settings = await getSettings(ctx)
      if (!isEventEnabled('reply.created', settings)) return

      // Skip internal notes
      if (reply.is_internal_note) return

      const client = makeClient(ctx, settings)
      if (!client) return

      const channel = resolveChannel(ticket, settings)
      if (!channel) return

      await client.postMessage({
        channel,
        text: `Reply on ticket #${ticket.id} from ${reply.author_name ?? 'Agent'}: ${reply.body ?? ''}`,
        thread_ts: ticket.slack_thread_ts,
      })
    },
  },

  // -------------------------------------------------------------------------
  // Filter hooks
  // -------------------------------------------------------------------------

  filters: {
    'notification.channels': {
      priority: 10,
      handler: async (channels, ctx) => {
        const settings = await getSettings(ctx)
        const enabled = !!(settings.bot_token)

        return [
          ...(channels as unknown[]),
          {
            id: 'slack',
            name: 'Slack',
            icon: 'slack',
            description: 'Send notifications to Slack channels and direct messages',
            enabled,
          },
        ]
      },
    },
  },

  // -------------------------------------------------------------------------
  // Admin pages
  // -------------------------------------------------------------------------

  pages: [
    {
      route: 'settings',
      component: 'SlackNotificationConfig',
      layout: 'admin',
      capability: 'manage_settings',
      menu: {
        label: 'Slack',
        section: 'admin',
        position: 10,
        icon: 'slack',
      },
    },
  ],

  // -------------------------------------------------------------------------
  // Component injections
  // -------------------------------------------------------------------------

  components: [
    {
      page: 'admin.settings',
      slot: 'integrations',
      component: 'SlackNotificationConfig',
      props: { pluginSlug: 'slack' },
      order: 10,
      capability: 'manage_settings',
    },
  ],

  // -------------------------------------------------------------------------
  // Data endpoints (called by the Vue frontend)
  // -------------------------------------------------------------------------

  endpoints: {
    'GET /settings': {
      capability: 'manage_settings',
      handler: async (ctx) => {
        return ctx.config.all()
      },
    },

    'POST /settings': {
      capability: 'manage_settings',
      handler: async (ctx, req) => {
        await ctx.config.set(req.body as Record<string, unknown>)
        return { success: true }
      },
    },

    'POST /test-connection': {
      capability: 'manage_settings',
      handler: async (ctx, req) => {
        const body = req.body as { bot_token?: string }
        const token = body.bot_token ?? ((await ctx.config.all()) as SlackSettings).bot_token

        if (!token) {
          return { success: false, message: 'bot_token not configured' }
        }

        const client = new SlackClient(ctx.http, token)
        try {
          const res = await client.authTest()
          return {
            success: true,
            team: (res as unknown as { team: string }).team ?? '',
            bot: (res as unknown as { bot_id: string }).bot_id ?? '',
            message: `Connected to workspace "${(res as unknown as { team: string }).team ?? 'Unknown'}"`,
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Connection failed'
          return { success: false, message: msg }
        }
      },
    },

    'POST /post-message': {
      capability: 'escalated-agent',
      handler: async (ctx, req) => {
        const settings = await getSettings(ctx)
        const client = makeClient(ctx, settings)
        if (!client) return { success: false, message: 'bot_token not configured' }

        const body = req.body as { channel: string; text: string; blocks?: unknown[]; thread_ts?: string }
        await client.postMessage(body)
        return { success: true }
      },
    },
  },

  // -------------------------------------------------------------------------
  // Webhook (Slack Events API)
  // -------------------------------------------------------------------------

  webhooks: {
    'POST /webhook': async (ctx, req) => {
      const payload = req.body as Record<string, unknown>

      // URL verification challenge
      if (payload.type === 'url_verification') {
        return { challenge: payload.challenge }
      }

      ctx.log.info('[slack] Webhook received', { type: payload.type })

      // Route Slack events back as internal actions
      if (payload.type === 'event_callback') {
        const slackEvent = payload.event as Record<string, unknown> | undefined
        if (slackEvent?.type === 'message') {
          await ctx.emit('slack.message.received', slackEvent)
        }
      }

      return { ok: true }
    },
  },
})
