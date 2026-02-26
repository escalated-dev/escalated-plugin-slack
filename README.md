# Escalated Plugin: Slack Integration

Seamlessly connect Escalated with your Slack workspace for real-time ticket notifications, ticket creation from Slack messages, and bi-directional conversation sync between Slack threads and tickets.

## Features (Planned)
- OAuth2 Slack workspace connection
- Real-time ticket notifications to Slack channels
- Create tickets from Slack messages and emoji reactions
- Bi-directional reply sync between Slack threads and tickets
- Slash commands for ticket management (/escalated)
- Interactive message buttons (assign, resolve, reply)
- Channel-to-team/category mapping
- Rich Block Kit message formatting
- Per-agent notification preferences
- SLA breach alerts

## Installation

### Via ZIP Upload
1. Download the latest release ZIP from this repository
2. In Escalated admin, go to **Settings > Plugins**
3. Click **Upload Plugin** and select the ZIP file
4. Activate the plugin from the plugins list

### Via Composer
```bash
composer require escalated-dev/escalated-plugin-slack
```
Then activate the plugin from **Settings > Plugins** in Escalated admin.

### Requirements
- Escalated >= 0.6.0

## Status
This plugin is in early development. See TODO.md for implementation status.
