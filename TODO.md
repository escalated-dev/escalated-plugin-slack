# TODO: Escalated Plugin - Slack Integration

## Backend
- [ ] Slack OAuth2 app registration and token management
- [ ] Slack Bot setup with required scopes (chat:write, channels:read, users:read)
- [ ] Incoming webhook handler for Slack Events API
- [ ] Slash command handler (/escalated create, /escalated status)
- [ ] Slack message-to-ticket conversion logic
- [ ] Thread-based conversation sync (Slack thread <-> ticket replies)
- [ ] Channel mapping configuration (channel -> team/category)
- [ ] Slack user to Escalated agent/contact mapping
- [ ] Block Kit message formatting for rich ticket notifications
- [ ] Interactive message handlers (buttons for assign, resolve, reply)
- [ ] Slack workspace data model and migration

## Frontend
- [ ] OAuth connection flow UI (Connect to Slack button)
- [ ] Workspace connection status and management
- [ ] Channel selection and mapping configuration
- [ ] Notification rule builder (which events go to which channels)
- [ ] Slack message preview component
- [ ] Per-agent Slack notification preferences
- [ ] Test notification button

## Integration
- [ ] Ticket creation from Slack emoji reactions (e.g., :ticket:)
- [ ] Bi-directional reply sync between Slack threads and tickets
- [ ] Agent @mention notifications in Slack
- [ ] Ticket status change notifications with action buttons
- [ ] SLA breach alerts to Slack channels
- [ ] Daily/weekly summary reports posted to Slack

## Configuration
- [ ] Slack App credentials configuration (Client ID, Secret, Signing Secret)
- [ ] Default notification channel selection
- [ ] Event type to channel routing rules
- [ ] Message template customization
- [ ] Bot display name and avatar configuration
