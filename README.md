# @escalated-dev/plugin-slack

Slack integration plugin for Escalated, built with the TypeScript Plugin SDK.

Forwards ticket lifecycle events to Slack channels and handles incoming Slack webhooks.

## Features

- Notifies a Slack channel on ticket created, assigned, and resolved
- Posts replies as threaded messages in linked Slack conversations
- Channel mapping: route notifications per team or category
- Event routing toggles (enable/disable individual events)
- Slack Events API webhook support (with URL verification)
- Admin settings page with connection test

## Configuration

| Field | Type | Description |
|-------|------|-------------|
| `bot_token` | password | OAuth bot token (`xoxb-…`). Required. |
| `signing_secret` | password | Used to verify Slack webhook request signatures. |
| `client_id` | text | Slack app client ID (for OAuth flows). |
| `client_secret` | password | Slack app client secret (for OAuth flows). |
| `workspace_name` | text | Display name of the connected workspace. |
| `default_channel` | text | Fallback channel when no mapping matches (e.g. `general`). |
| `channel_mappings` | json | Array of `{ source_type, source_id, source_name, slack_channel }` rules. |
| `event_routing` | json | Object enabling/disabling individual event types. |

## Action Hooks

| Hook | Description |
|------|-------------|
| `ticket.created` | Posts a message to the resolved channel. |
| `ticket.assigned` | Posts an assignment notice; optionally DMs the agent. |
| `reply.created` | Posts a threaded reply in the linked Slack thread. |

## Filter Hooks

| Hook | Priority | Description |
|------|----------|-------------|
| `notification.channels` | 10 | Appends the Slack channel to the available notification channels list. |

## Endpoints

| Method | Path | Capability | Description |
|--------|------|------------|-------------|
| GET | `/settings` | `manage_settings` | Return current plugin configuration. |
| POST | `/settings` | `manage_settings` | Save plugin configuration. |
| POST | `/test-connection` | `manage_settings` | Test the bot token against `auth.test`. |
| POST | `/post-message` | `escalated-agent` | Send a Slack message from the frontend. |

## Webhooks

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhook` | Receives Slack Events API callbacks (URL verification + event routing). |

Configure this URL in your Slack app's Event Subscriptions:
```
https://your-escalated-domain.com/webhooks/plugins/slack/webhook
```

## Package structure

```
escalated-plugin-slack-sdk/
├── package.json
├── tsconfig.json
├── .gitignore
├── src/
│   ├── index.ts       # definePlugin() — backend
│   └── client.ts      # SlackClient (API wrapper using ctx.http)
├── frontend/
│   ├── index.js       # defineEscalatedPlugin() — Vue frontend
│   └── components/
│       ├── SlackNotificationConfig.vue
│       └── SlackChannelMapper.vue
└── README.md
```

## Migration from PHP

This SDK plugin replaces:
- `escalated-plugin-slack/Plugin.php` — action/filter registrations
- `escalated-plugin-slack/Services/SlackClient.php` — HTTP client (`src/client.ts`)
- `escalated-plugin-slack/Support/Config.php` — replaced by `ctx.config`
- `escalated-plugin-slack/Handlers/EventHandler.php` — replaced by `actions` handlers
- `escalated-plugin-slack/Handlers/WebhookHandler.php` — replaced by `webhooks` handler
