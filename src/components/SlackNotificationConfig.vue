<template>
    <div class="slack-config">
        <div class="slack-config-header">
            <h3>Slack Integration</h3>
            <span class="slack-status" :class="{ connected: isConnected }">
                {{ isConnected ? 'Connected' : 'Not Connected' }}
            </span>
        </div>
        <div class="slack-config-body">
            <p class="slack-placeholder">Slack integration configuration is coming soon.</p>
            <p class="slack-info">
                Connect your Slack workspace to receive ticket notifications, create tickets from Slack messages, and
                manage support threads directly from Slack channels.
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    ticketId: {
        type: [String, Number],
        default: null,
    },
});

const isConnected = ref(false);
</script>

<style scoped>
.slack-config {
    background: var(--escalated-bg-secondary, #1e1e2e);
    border: 1px solid var(--escalated-border, #2e2e3e);
    border-radius: 8px;
    padding: 16px;
    color: var(--escalated-text, #e0e0e0);
}

.slack-config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.slack-config-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
}

.slack-status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
    background: var(--escalated-bg-tertiary, #2e2e3e);
    color: var(--escalated-text-muted, #888);
}

.slack-status.connected {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
}

.slack-placeholder {
    font-size: 13px;
    color: var(--escalated-text-muted, #888);
    margin-bottom: 8px;
}

.slack-info {
    font-size: 12px;
    color: var(--escalated-text-muted, #666);
    line-height: 1.5;
}
</style>
