# Escalated Plugin: Slack

Slack integration for Escalated that forwards ticket lifecycle events to Slack channels and handles incoming Slack webhooks. Supports channel mapping by team or category, event routing toggles, and the Slack Events API.

## Features

- Notifies Slack channels on ticket created, assigned, and resolved events
- Posts replies as threaded messages in linked Slack conversations
- Channel mapping rules to route notifications by team or category
- Per-event routing toggles to enable or disable individual event types
- Slack Events API webhook support with URL verification and signature validation
- Admin settings page with connection test
- Registers Slack as a notification channel

## Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bot_token` | password | Yes | OAuth bot token (`xoxb-...`). Found in your Slack app settings. |
| `signing_secret` | password | No | Used to verify incoming Slack webhook request signatures. |
| `client_id` | text | No | Slack app client ID for OAuth flows. |
| `client_secret` | password | No | Slack app client secret for OAuth flows. |
| `workspace_name` | text | No | Display name of the connected Slack workspace. |
| `default_channel` | text | No | Fallback channel when no mapping matches. Defaults to `general`. |
| `channel_mappings` | json | No | Array of `{ source_type, source_id, source_name, slack_channel }` routing rules. |
| `event_routing` | json | No | Object toggling individual event types on or off. |

## Admin Pages

- **settings** — Configure Slack credentials, channel mappings, and event routing preferences.

## Hooks

### Actions
- `ticket.created` — Posts a notification to the resolved Slack channel with ticket details.
- `ticket.assigned` — Posts an assignment notice to the channel; optionally DMs the assigned agent.
- `reply.created` — Posts a threaded reply in the linked Slack thread (skips internal notes).

### Filters
- `notification.channels` — Appends Slack to the list of available notification channels.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/settings` | Return current plugin configuration. |
| POST | `/settings` | Save plugin configuration. |
| POST | `/test-connection` | Test the bot token against Slack's `auth.test` API. |
| POST | `/post-message` | Send a Slack message programmatically. |

## Webhooks

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhook` | Receives Slack Events API callbacks including URL verification and event routing. |

Configure this URL in your Slack app's Event Subscriptions:
```
https://your-escalated-domain.com/webhooks/plugins/slack/webhook
```

## Installation

```bash
npm install @escalated-dev/plugin-slack
```

## License

MIT
