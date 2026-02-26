import { defineEscalatedPlugin } from '@escalated-dev/escalated';
import SlackNotificationConfig from './components/SlackNotificationConfig.vue';

export default defineEscalatedPlugin({
    name: 'Slack Integration',
    slug: 'slack',
    version: '0.1.0',
    description: 'Slack integration for notifications and ticket creation from Slack messages',

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
                    const slackService = context?.$escalated?.inject?.('slack');
                    if (!slackService) {
                        console.warn('[slack] Slack service not available');
                        return;
                    }
                    slackService.shareTicketToSlack(ticket);
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
            },
        ],
        pageComponents: {
            'admin.settings.integrations.slack': SlackNotificationConfig,
        },
    },

    hooks: {
        /**
         * When a new ticket is created, post a notification to the
         * configured Slack channel (resolved via channel mappings).
         */
        'ticket.created': (ticket, context) => {
            const slackService = context?.$escalated?.inject?.('slack');
            if (!slackService) return;

            if (!slackService.isEventEnabled('ticket.created')) return;

            const channel = slackService.resolveChannel(ticket);
            if (!channel) return;

            slackService.postMessage(channel, {
                text: `New ticket created: #${ticket.id} - ${ticket.subject || 'No subject'}`,
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*New Ticket* #${ticket.id}\n*Subject:* ${ticket.subject || 'No subject'}`,
                        },
                    },
                ],
            });
        },

        /**
         * When a ticket is resolved, send a resolution notice to the
         * linked Slack channel/thread.
         */
        'ticket.resolved': (ticket, context) => {
            const slackService = context?.$escalated?.inject?.('slack');
            if (!slackService) return;

            if (!slackService.isEventEnabled('ticket.resolved')) return;

            const channel = slackService.resolveChannel(ticket);
            if (!channel) return;

            slackService.postMessage(channel, {
                text: `Ticket #${ticket.id} has been resolved`,
                thread_ts: ticket.slack_thread_ts || undefined,
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Ticket Resolved* #${ticket.id}\n*Subject:* ${ticket.subject || 'No subject'}`,
                        },
                    },
                ],
            });
        },

        /**
         * When a new reply is posted on a ticket, append it as a threaded
         * reply in the linked Slack conversation.
         */
        'reply.created': (reply, ticket, context) => {
            const slackService = context?.$escalated?.inject?.('slack');
            if (!slackService) return;

            if (!slackService.isEventEnabled('reply.created')) return;

            const channel = slackService.resolveChannel(ticket);
            if (!channel || !ticket?.slack_thread_ts) return;

            slackService.postMessage(channel, {
                text: `Reply from ${reply.author_name || 'Agent'}: ${reply.body || ''}`,
                thread_ts: ticket.slack_thread_ts,
            });
        },

        /**
         * Extend the notification channels list with Slack.
         */
        'notification.channels': (channels) => {
            return [
                ...channels,
                {
                    id: 'slack',
                    name: 'Slack',
                    icon: 'slack',
                    description: 'Send notifications to Slack channels and DMs',
                },
            ];
        },

        /**
         * Add a Slack section to the admin integrations settings nav.
         */
        'admin.settings.nav': (items) => {
            return [
                ...items,
                {
                    id: 'slack-integration',
                    label: 'Slack',
                    icon: 'slack',
                    section: 'integrations',
                    order: 10,
                },
            ];
        },
    },

    setup(context) {
        const { reactive, ref } = context.vue || {};
        const _reactive = reactive || ((o) => o);
        const _ref = ref || ((v) => ({ value: v }));

        // ------------------------------------------------------------------
        // Reactive state
        // ------------------------------------------------------------------
        const state = _reactive({
            connected: false,
            workspaceName: '',
            settings: {
                bot_token: '',
                signing_secret: '',
                client_id: '',
                client_secret: '',
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
        });

        const saving = _ref(false);

        // ------------------------------------------------------------------
        // API helpers
        // ------------------------------------------------------------------
        const apiBase = () => {
            if (context.route) {
                return context.route('plugins.slack.api');
            }
            return '/api/plugins/slack';
        };

        async function apiRequest(path, options = {}) {
            const url = `${apiBase()}${path}`;
            const headers = {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(options.headers || {}),
            };

            if (options.body && typeof options.body === 'object') {
                headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(options.body);
            }

            const response = await fetch(url, { ...options, headers });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `API request failed: ${response.status}`);
            }

            return response.json();
        }

        // ------------------------------------------------------------------
        // Settings operations
        // ------------------------------------------------------------------

        async function fetchSettings() {
            state.loading = true;
            try {
                const data = await apiRequest('/settings');
                state.settings = {
                    ...state.settings,
                    ...data,
                };
                state.workspaceName = data.workspace_name || '';
                state.connected = !!(data.bot_token && data.workspace_name);
            } catch (err) {
                console.error('[slack] Failed to fetch settings:', err);
            } finally {
                state.loading = false;
            }
        }

        async function saveSettings(settings) {
            saving.value = true;
            try {
                const data = await apiRequest('/settings', {
                    method: 'POST',
                    body: settings,
                });
                state.settings = {
                    ...state.settings,
                    ...data,
                };
                state.workspaceName = data.workspace_name || '';
                state.connected = !!(data.bot_token && data.workspace_name);
                return data;
            } catch (err) {
                console.error('[slack] Failed to save settings:', err);
                throw err;
            } finally {
                saving.value = false;
            }
        }

        async function testConnection(botToken) {
            try {
                const data = await apiRequest('/test-connection', {
                    method: 'POST',
                    body: { bot_token: botToken },
                });
                return data;
            } catch (err) {
                console.error('[slack] Connection test failed:', err);
                throw err;
            }
        }

        // ------------------------------------------------------------------
        // Channel resolution (client-side mirror of PHP logic)
        // ------------------------------------------------------------------

        function resolveChannel(ticket) {
            if (!ticket) return '';

            const mappings = state.settings.channel_mappings || [];

            for (const mapping of mappings) {
                const sourceType = mapping.source_type || '';
                const sourceId = mapping.source_id || '';
                const channel = mapping.slack_channel || '';

                if (!channel) continue;

                if (sourceType === 'team' && ticket.team_id && String(ticket.team_id) === String(sourceId)) {
                    return channel;
                }

                if (sourceType === 'category' && ticket.category_id && String(ticket.category_id) === String(sourceId)) {
                    return channel;
                }
            }

            return state.settings.default_channel || '';
        }

        /**
         * Check whether a given event type is enabled in the settings.
         */
        function isEventEnabled(event) {
            const routing = state.settings.event_routing || {};
            return !!routing[event];
        }

        // ------------------------------------------------------------------
        // Slack messaging stubs
        // ------------------------------------------------------------------

        async function postMessage(channel, message) {
            try {
                return await apiRequest('/post-message', {
                    method: 'POST',
                    body: { channel, ...message },
                });
            } catch (err) {
                console.error('[slack] Failed to post message:', err);
                throw err;
            }
        }

        async function shareTicketToSlack(ticket) {
            const channel = resolveChannel(ticket);
            if (!channel) {
                console.warn('[slack] No channel resolved for ticket', ticket?.id);
                return;
            }

            return postMessage(channel, {
                text: `Ticket #${ticket.id}: ${ticket.subject || 'No subject'}`,
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: [
                                `*Ticket #${ticket.id}*`,
                                `*Subject:* ${ticket.subject || 'No subject'}`,
                                `*Status:* ${ticket.status || 'open'}`,
                                `*Priority:* ${ticket.priority || 'normal'}`,
                            ].join('\n'),
                        },
                    },
                ],
            });
        }

        // ------------------------------------------------------------------
        // Provide the Slack service to child components
        // ------------------------------------------------------------------
        context.provide('slack', {
            state,
            saving,
            fetchSettings,
            saveSettings,
            testConnection,
            resolveChannel,
            isEventEnabled,
            postMessage,
            shareTicketToSlack,
        });
    },
});
