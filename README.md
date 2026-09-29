# Escalated Plugin: Slack

[![Views](https://hits.sh/github.com/escalated-dev/escalated-plugin-slack.svg?style=flat&label=views&color=007ec6)](https://hits.sh/github.com/escalated-dev/escalated-plugin-slack/)

**Website:** [escalated.dev](https://escalated.dev)

Slack integration for Escalated that forwards ticket lifecycle events to Slack channels and handles incoming Slack webhooks. Supports channel mapping by team or category, event routing toggles, and the Slack Events API.

## Features

- Notifies Slack channels on ticket created and assigned events
- Posts public replies; threading requires a host-supplied Slack thread timestamp
- Channel mapping rules to route notifications by team or category
- Per-event routing toggles to enable or disable individual event types
- Authenticated Slack Events API callbacks, including URL verification
- Admin settings page with connection test
- Registers Slack as a notification channel

## Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bot_token` | password | Yes | OAuth bot token (`xoxb-...`). Found in your Slack app settings. |
| `signing_secret` | password | For inbound | Required for every incoming request, including URL verification. |
| `workspace_id` | text | For messages | Allowed Slack team ID. |
| `inbound_channels` | json | For messages | Explicit array of allowed Slack channel IDs. Empty disables ingestion. |
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
- `ticket.assigned` — Posts an assignment notice to the channel.
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
https://your-escalated-domain.com/support/webhooks/plugins/slack/webhook
```

The prefix above is Laravel's default; use your host's configured prefix.
Inbound requests require plugin HTTP contract version 1 in the SDK, runtime and
host bridge. The SDK dependency is pinned to the merged contract source until a
coordinated package release. The plugin builds as ESM, matching the runtime/SDK.

Signatures use the exact original bytes, HMAC-SHA256, a five-minute timestamp
window and a constant-time comparison, following [Slack's signing protocol](https://docs.slack.dev/authentication/verifying-requests-from-slack/).
Missing credentials or raw bytes fail closed. Payloads are parsed from verified
bytes, independently of the host's parsed request body. Bot, hidden and subtype
events are ignored to prevent loops and unintended edits/deletions.

**Inbound ticket processing is not available from this plugin alone.** A host
adapter must durably accept `slack.message.received` and return
`{accepted: true, event_id: "the-matching-event-id"}`. The emitted data includes
the signed envelope bytes and headers so the host can authenticate it again,
apply trusted tenant/identity routing, and persist a deduplicated event. A missing
adapter or failed acceptance returns 503 for retry, rather than acknowledging a
message that was dropped. This change does not supply that durable processor,
claim arbitrary Slack text is verified email, or enable plugins in tenant mode.
Outbound thread mapping and inbound ticket/reply ingestion remain host work.

For Slack-origin tickets, a host can persist `metadata.source = "slack"` and
`metadata.slack = {workspace, channel, thread_ts}`. Host public replies return to
that thread only while its workspace/channel still matches the plugin allowlist.
Slack-origin ticket creation and replies marked `metadata.source = "slack"` are
not echoed. Internal notes are never posted. The host must dispatch the existing
ticket/reply hooks; this plugin does not itself wire framework event listeners or
persist thread mappings for ordinary outbound ticket notifications.

## Installation

```bash
npm install @escalated-dev/plugin-slack
```

## License

MIT - Copyright (c) Escalated.dev. See [LICENSE](LICENSE).
