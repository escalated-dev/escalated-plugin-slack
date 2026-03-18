import { defineEscalatedPlugin } from '@escalated-dev/escalated'
import SlackNotificationConfig from './components/SlackNotificationConfig.vue'
import SlackChannelMapper from './components/SlackChannelMapper.vue'

export default defineEscalatedPlugin({
    name: 'Slack Integration',
    slug: 'slack',
    version: '0.1.0',
    description: 'Slack notifications for ticket events',

    components: {
        SlackNotificationConfig,
        SlackChannelMapper,
    },

    extensions: {
        notificationChannels: [
            {
                id: 'slack-notifications',
                name: 'Slack',
                icon: 'slack',
                configComponent: SlackNotificationConfig,
            },
        ],
        settingsPanels: [
            {
                id: 'slack-settings',
                title: 'Slack Integration',
                component: SlackNotificationConfig,
                icon: 'slack',
                category: 'integrations',
            },
        ],
        ticketActions: [
            {
                id: 'slack-share-ticket',
                label: 'Share to Slack',
                icon: 'share',
                handler: (ticket, context) => {
                    const slackService = context?.$escalated?.inject?.('slack')
                    if (!slackService) {
                        console.warn('[slack] Slack service not available')
                        return
                    }
                    slackService.shareTicketToSlack(ticket)
                },
            },
        ],
        menuItems: [
            {
                id: 'slack-integration',
                label: 'Slack',
                icon: 'slack',
                route: '/settings/integrations/slack',
                parent: 'settings.integrations',
                order: 10,
                capability: 'manage_settings',
            },
        ],
    },

    setup(context) {
        const { reactive, ref } = context.vue || {}
        const _reactive = reactive || ((o) => o)
        const _ref = ref || ((v) => ({ value: v }))

        const state = _reactive({
            connected: false,
            workspaceName: '',
            settings: {
                bot_token: '',
                signing_secret: '',
                client_id: '',
                client_secret: '',
                workspace_name: '',
                default_channel: '',
                channel_mappings: [],
                event_routing: {
                    'ticket.created': true,
                    'ticket.assigned': true,
                    'ticket.resolved': true,
                    'reply.created': true,
                    'sla.breached': false,
                },
            },
            loading: false,
        })

        const saving = _ref(false)

        const apiBase = () => '/api/plugins/slack'

        async function apiRequest(path, options = {}) {
            const url = `${apiBase()}${path}`
            const headers = {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(options.headers || {}),
            }
            if (options.body && typeof options.body === 'object') {
                headers['Content-Type'] = 'application/json'
                options.body = JSON.stringify(options.body)
            }
            const response = await fetch(url, { ...options, headers })
            if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                throw new Error(error.message || `API request failed: ${response.status}`)
            }
            return response.json()
        }

        async function fetchSettings() {
            state.loading = true
            try {
                const data = await apiRequest('/settings')
                Object.assign(state.settings, data)
                state.workspaceName = data.workspace_name || ''
                state.connected = !!(data.bot_token && data.workspace_name)
            } catch (err) {
                console.error('[slack] Failed to fetch settings:', err)
            } finally {
                state.loading = false
            }
        }

        async function saveSettings(settings) {
            saving.value = true
            try {
                const data = await apiRequest('/settings', {
                    method: 'POST',
                    body: settings,
                })
                Object.assign(state.settings, data)
                state.workspaceName = data.workspace_name || ''
                state.connected = !!(data.bot_token && data.workspace_name)
                return data
            } catch (err) {
                console.error('[slack] Failed to save settings:', err)
                throw err
            } finally {
                saving.value = false
            }
        }

        async function testConnection(botToken) {
            try {
                return await apiRequest('/test-connection', {
                    method: 'POST',
                    body: { bot_token: botToken },
                })
            } catch (err) {
                console.error('[slack] Connection test failed:', err)
                throw err
            }
        }

        function resolveChannel(ticket) {
            if (!ticket) return ''
            const mappings = state.settings.channel_mappings || []
            for (const mapping of mappings) {
                const { source_type, source_id, slack_channel } = mapping
                if (!slack_channel) continue
                if (source_type === 'team' && ticket.team_id && String(ticket.team_id) === String(source_id)) {
                    return slack_channel
                }
                if (source_type === 'category' && ticket.category_id && String(ticket.category_id) === String(source_id)) {
                    return slack_channel
                }
            }
            return state.settings.default_channel || ''
        }

        function isEventEnabled(event) {
            return !!(state.settings.event_routing || {})[event]
        }

        async function shareTicketToSlack(ticket) {
            const channel = resolveChannel(ticket)
            if (!channel) return
            return apiRequest('/post-message', {
                method: 'POST',
                body: {
                    channel,
                    text: `Ticket #${ticket.id}: ${ticket.subject || 'No subject'}`,
                },
            })
        }

        context.provide('slack', {
            state,
            saving,
            fetchSettings,
            saveSettings,
            testConnection,
            resolveChannel,
            isEventEnabled,
            shareTicketToSlack,
        })
    },
})
