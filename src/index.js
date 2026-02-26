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
                handler: (ticket) => {
                    // Share ticket to a Slack channel
                },
            },
        ],
    },

    hooks: {
        'ticket.created': (ticket) => {
            // Send Slack notification for new tickets
        },
        'ticket.resolved': (ticket) => {
            // Notify Slack channel when ticket is resolved
        },
        'reply.created': (reply, ticket) => {
            // Post reply notification to linked Slack thread
        },
    },

    setup(context) {
        context.provide('slack', {
            // Slack service will be provided here
        });
    },
});
