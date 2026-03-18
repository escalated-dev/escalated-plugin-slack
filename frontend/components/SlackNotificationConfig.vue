<template>
    <div :class="['max-w-4xl mx-auto', dark ? 'text-gray-200' : 'text-gray-800']">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 :class="['text-xl font-semibold', dark ? 'text-white' : 'text-gray-900']">
                    Slack Integration
                </h2>
                <p :class="['mt-1 text-sm', dark ? 'text-gray-400' : 'text-gray-500']">
                    Connect your Slack workspace to receive ticket notifications, share tickets, and
                    manage support threads directly from Slack.
                </p>
            </div>
            <span
                :class="[
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
                    isConnected
                        ? 'bg-green-500/15 text-green-500'
                        : (dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'),
                ]"
            >
                <span
                    :class="[
                        'w-1.5 h-1.5 rounded-full',
                        isConnected ? 'bg-green-500' : (dark ? 'bg-gray-500' : 'bg-gray-400'),
                    ]"
                ></span>
                {{ isConnected ? 'Connected' : 'Not Connected' }}
            </span>
        </div>

        <!-- Connection Status -->
        <div
            v-if="isConnected"
            :class="[
                'mb-6 p-4 rounded-lg border',
                dark ? 'bg-gray-800/50 border-gray-700' : 'bg-green-50 border-green-200',
            ]"
        >
            <div class="flex items-center gap-3">
                <div :class="['p-2 rounded-lg', dark ? 'bg-green-500/10' : 'bg-green-100']">
                    <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <p :class="['text-sm font-medium', dark ? 'text-gray-200' : 'text-green-800']">
                        Connected to workspace:
                        <span class="font-semibold">{{ workspaceName || 'Unknown' }}</span>
                    </p>
                    <p :class="['text-xs mt-0.5', dark ? 'text-gray-400' : 'text-green-600']">
                        Slack bot is active and ready to send notifications.
                    </p>
                </div>
            </div>
        </div>

        <!-- API Credentials Section -->
        <div
            :class="[
                'mb-6 rounded-lg border',
                dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            ]"
        >
            <div class="p-5">
                <h3 :class="['text-sm font-medium mb-1', dark ? 'text-gray-300' : 'text-gray-700']">
                    API Credentials
                </h3>
                <p :class="['text-xs mb-4', dark ? 'text-gray-400' : 'text-gray-500']">
                    Enter your Slack app credentials. You can find these in your Slack App settings at
                    <code :class="['text-xs px-1 py-0.5 rounded', dark ? 'bg-gray-700' : 'bg-gray-100']">api.slack.com/apps</code>.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Client ID -->
                    <div>
                        <label :class="['block text-xs font-medium mb-1', dark ? 'text-gray-400' : 'text-gray-500']">
                            Client ID
                        </label>
                        <input
                            v-model="form.client_id"
                            :type="showSecrets.client_id ? 'text' : 'password'"
                            placeholder="Enter Client ID"
                            :class="inputClass"
                        />
                    </div>

                    <!-- Client Secret -->
                    <div>
                        <label :class="['block text-xs font-medium mb-1', dark ? 'text-gray-400' : 'text-gray-500']">
                            Client Secret
                        </label>
                        <div class="relative">
                            <input
                                v-model="form.client_secret"
                                :type="showSecrets.client_secret ? 'text' : 'password'"
                                placeholder="Enter Client Secret"
                                :class="inputClass"
                            />
                            <button
                                type="button"
                                @click="showSecrets.client_secret = !showSecrets.client_secret"
                                :class="[
                                    'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors',
                                    dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600',
                                ]"
                                :title="showSecrets.client_secret ? 'Hide' : 'Show'"
                            >
                                <svg v-if="!showSecrets.client_secret" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Signing Secret -->
                    <div>
                        <label :class="['block text-xs font-medium mb-1', dark ? 'text-gray-400' : 'text-gray-500']">
                            Signing Secret
                        </label>
                        <div class="relative">
                            <input
                                v-model="form.signing_secret"
                                :type="showSecrets.signing_secret ? 'text' : 'password'"
                                placeholder="Enter Signing Secret"
                                :class="inputClass"
                            />
                            <button
                                type="button"
                                @click="showSecrets.signing_secret = !showSecrets.signing_secret"
                                :class="[
                                    'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors',
                                    dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600',
                                ]"
                                :title="showSecrets.signing_secret ? 'Hide' : 'Show'"
                            >
                                <svg v-if="!showSecrets.signing_secret" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Bot Token -->
                    <div>
                        <label :class="['block text-xs font-medium mb-1', dark ? 'text-gray-400' : 'text-gray-500']">
                            Bot Token
                        </label>
                        <div class="relative">
                            <input
                                v-model="form.bot_token"
                                :type="showSecrets.bot_token ? 'text' : 'password'"
                                placeholder="xoxb-..."
                                :class="inputClass"
                            />
                            <button
                                type="button"
                                @click="showSecrets.bot_token = !showSecrets.bot_token"
                                :class="[
                                    'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors',
                                    dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600',
                                ]"
                                :title="showSecrets.bot_token ? 'Hide' : 'Show'"
                            >
                                <svg v-if="!showSecrets.bot_token" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Test Connection Button -->
                <div class="mt-4 flex items-center gap-3">
                    <button
                        @click="testConnection"
                        :disabled="!form.bot_token || testingConnection"
                        :class="[
                            'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                            (!form.bot_token || testingConnection)
                                ? (dark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                                : (dark ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'),
                        ]"
                    >
                        <svg
                            v-if="testingConnection"
                            class="w-4 h-4 animate-spin"
                            fill="none" viewBox="0 0 24 24"
                        >
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        {{ testingConnection ? 'Testing...' : 'Test Connection' }}
                    </button>

                    <span
                        v-if="testResult !== null"
                        :class="[
                            'text-sm',
                            testResult.success ? 'text-green-500' : 'text-red-500',
                        ]"
                    >
                        {{ testResult.message }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Default Channel -->
        <div
            :class="[
                'mb-6 p-5 rounded-lg border',
                dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            ]"
        >
            <h3 :class="['text-sm font-medium mb-1', dark ? 'text-gray-300' : 'text-gray-700']">
                Default Notification Channel
            </h3>
            <p :class="['text-xs mb-3', dark ? 'text-gray-400' : 'text-gray-500']">
                The Slack channel where notifications are sent when no specific channel mapping matches.
            </p>
            <div class="flex items-center max-w-md">
                <span :class="['text-sm mr-1.5', dark ? 'text-gray-500' : 'text-gray-400']">#</span>
                <input
                    v-model="form.default_channel"
                    type="text"
                    placeholder="general"
                    :class="[
                        'flex-1 px-3 py-2 rounded-md border text-sm font-mono transition-colors',
                        dark
                            ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
                            : 'border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500',
                        'focus:outline-none focus:ring-1',
                    ]"
                />
            </div>
        </div>

        <!-- Channel Mapping Section -->
        <div
            :class="[
                'mb-6 p-5 rounded-lg border',
                dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            ]"
        >
            <SlackChannelMapper
                v-model="form.channel_mappings"
                :teams="teams"
                :categories="categories"
            />
        </div>

        <!-- Event Routing Section -->
        <div
            :class="[
                'mb-6 p-5 rounded-lg border',
                dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            ]"
        >
            <h3 :class="['text-sm font-medium mb-1', dark ? 'text-gray-300' : 'text-gray-700']">
                Event Routing
            </h3>
            <p :class="['text-xs mb-4', dark ? 'text-gray-400' : 'text-gray-500']">
                Choose which helpdesk events trigger Slack notifications.
            </p>

            <div class="space-y-3">
                <label
                    v-for="event in eventOptions"
                    :key="event.id"
                    :class="[
                        'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none',
                        form.event_routing[event.id]
                            ? (dark
                                ? 'border-blue-500/40 bg-blue-500/5'
                                : 'border-blue-300 bg-blue-50/50')
                            : (dark
                                ? 'border-gray-700 hover:border-gray-600'
                                : 'border-gray-200 hover:border-gray-300'),
                    ]"
                >
                    <div class="pt-0.5">
                        <button
                            type="button"
                            @click="form.event_routing[event.id] = !form.event_routing[event.id]"
                            :class="[
                                'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                                form.event_routing[event.id]
                                    ? 'bg-blue-500 border-blue-500'
                                    : (dark ? 'border-gray-500 bg-gray-700' : 'border-gray-300 bg-white'),
                            ]"
                            role="checkbox"
                            :aria-checked="form.event_routing[event.id]"
                        >
                            <svg
                                v-if="form.event_routing[event.id]"
                                class="w-3 h-3 text-white"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
                            >
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                    </div>
                    <div class="flex-1">
                        <div :class="['text-sm font-medium', dark ? 'text-gray-200' : 'text-gray-800']">
                            {{ event.label }}
                        </div>
                        <div :class="['text-xs mt-0.5', dark ? 'text-gray-400' : 'text-gray-500']">
                            {{ event.description }}
                        </div>
                    </div>
                </label>
            </div>
        </div>

        <!-- Webhook URL Section -->
        <div
            :class="[
                'mb-6 p-5 rounded-lg border',
                dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            ]"
        >
            <h3 :class="['text-sm font-medium mb-1', dark ? 'text-gray-300' : 'text-gray-700']">
                Webhook URL
            </h3>
            <p :class="['text-xs mb-3', dark ? 'text-gray-400' : 'text-gray-500']">
                Configure this URL in your Slack app's Event Subscriptions to receive events from Slack.
            </p>
            <div class="flex items-center gap-2 max-w-2xl">
                <input
                    :value="webhookUrl"
                    readonly
                    :class="[
                        'flex-1 px-3 py-2 rounded-md border text-sm font-mono transition-colors',
                        dark
                            ? 'border-gray-600 bg-gray-700/50 text-gray-300'
                            : 'border-gray-300 bg-gray-50 text-gray-600',
                        'cursor-text select-all',
                    ]"
                    @focus="$event.target.select()"
                />
                <button
                    @click="copyWebhookUrl"
                    :class="[
                        'inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors shrink-0',
                        copied
                            ? 'bg-green-500/15 text-green-500'
                            : (dark
                                ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'),
                    ]"
                >
                    <svg v-if="!copied" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ copied ? 'Copied' : 'Copy' }}
                </button>
            </div>
        </div>

        <!-- Save Bar -->
        <div class="flex items-center justify-between">
            <p
                v-if="saveMessage"
                :class="[
                    'text-sm',
                    saveError ? 'text-red-500' : 'text-green-500',
                ]"
            >
                {{ saveMessage }}
            </p>
            <span v-else></span>
            <div class="flex items-center gap-3">
                <span
                    v-if="hasUnsavedChanges"
                    :class="['text-xs', dark ? 'text-gray-500' : 'text-gray-400']"
                >
                    Unsaved changes
                </span>
                <button
                    @click="save"
                    :disabled="saving"
                    :class="[
                        'px-5 py-2 rounded-md text-sm font-medium transition-colors',
                        saving
                            ? (dark ? 'bg-blue-800 text-blue-400 cursor-wait' : 'bg-blue-300 text-white cursor-wait')
                            : 'bg-blue-600 hover:bg-blue-500 text-white',
                    ]"
                >
                    {{ saving ? 'Saving...' : 'Save Settings' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted, watch } from 'vue';
import SlackChannelMapper from './SlackChannelMapper.vue';

// ---------------------------------------------------------------------------
// Dark mode
// ---------------------------------------------------------------------------
const dark = inject('esc-dark', false);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
const props = defineProps({
    pluginSlug: {
        type: String,
        default: 'slack',
    },
});

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const loading = ref(true);
const saving = ref(false);
const saveMessage = ref('');
const saveError = ref(false);
const hasUnsavedChanges = ref(false);

// Connection test
const testingConnection = ref(false);
const testResult = ref(null);

// Copy webhook URL
const copied = ref(false);

// Teams and categories (fetched from Escalated)
const teams = ref([]);
const categories = ref([]);

// Snapshot for change detection
let savedSnapshot = '';

// Secret field visibility toggles
const showSecrets = reactive({
    client_id: false,
    client_secret: false,
    signing_secret: false,
    bot_token: false,
});

// Form data
const form = reactive({
    workspace_name: '',
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
});

// ---------------------------------------------------------------------------
// Event options configuration
// ---------------------------------------------------------------------------
const eventOptions = [
    {
        id: 'ticket.created',
        label: 'Ticket Created',
        description: 'Send a notification when a new ticket is created.',
    },
    {
        id: 'ticket.assigned',
        label: 'Ticket Assigned',
        description: 'DM the assigned agent when a ticket is assigned to them.',
    },
    {
        id: 'ticket.resolved',
        label: 'Ticket Resolved',
        description: 'Notify the channel when a ticket is marked as resolved.',
    },
    {
        id: 'reply.created',
        label: 'Reply Created',
        description: 'Post replies as threaded messages in the linked Slack thread.',
    },
    {
        id: 'sla.breached',
        label: 'SLA Breached',
        description: 'Alert the channel when a ticket breaches its SLA target.',
    },
];

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const isConnected = computed(() => {
    return !!(form.bot_token && form.workspace_name);
});

const workspaceName = computed(() => form.workspace_name);

const webhookUrl = computed(() => {
    // Build the webhook URL from the current window location
    if (typeof window !== 'undefined' && window.location) {
        const origin = window.location.origin;
        return `${origin}/api/plugins/slack/webhook`;
    }
    return '/api/plugins/slack/webhook';
});

// ---------------------------------------------------------------------------
// Watchers -- track unsaved changes
// ---------------------------------------------------------------------------
watch(form, () => {
    const current = JSON.stringify(form);
    hasUnsavedChanges.value = current !== savedSnapshot;
}, { deep: true });

// ---------------------------------------------------------------------------
// Computed classes
// ---------------------------------------------------------------------------
const inputClass = computed(() => [
    'w-full px-3 py-2 rounded-md border text-sm transition-colors pr-9',
    dark
        ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
        : 'border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500',
    'focus:outline-none focus:ring-1',
]);

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Test the Slack bot token by calling auth.test.
 */
async function testConnection() {
    if (!form.bot_token) return;

    testingConnection.value = true;
    testResult.value = null;

    try {
        const response = await fetch(
            `/api/plugins/${props.pluginSlug}/test-connection`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ bot_token: form.bot_token }),
            },
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Connection test failed');
        }

        const data = await response.json();
        testResult.value = {
            success: true,
            message: `Connected to workspace "${data.team || 'Unknown'}" as ${data.bot || 'bot'}`,
        };

        if (data.team) {
            form.workspace_name = data.team;
        }
    } catch (err) {
        testResult.value = {
            success: false,
            message: err.message || 'Connection test failed. Check your bot token.',
        };
    } finally {
        testingConnection.value = false;
    }
}

/**
 * Copy the webhook URL to the clipboard.
 */
async function copyWebhookUrl() {
    try {
        await navigator.clipboard.writeText(webhookUrl.value);
        copied.value = true;
        setTimeout(() => {
            copied.value = false;
        }, 2000);
    } catch (err) {
        // Fallback: select the input text
        console.error('[slack] Failed to copy to clipboard:', err);
    }
}

// ---------------------------------------------------------------------------
// Fetch / Save
// ---------------------------------------------------------------------------

async function fetchSettings() {
    loading.value = true;
    try {
        const response = await fetch(`/api/plugins/${props.pluginSlug}/settings`, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        if (!response.ok) throw new Error('Failed to load settings');

        const data = await response.json();

        form.workspace_name = data.workspace_name || '';
        form.bot_token = data.bot_token || '';
        form.signing_secret = data.signing_secret || '';
        form.client_id = data.client_id || '';
        form.client_secret = data.client_secret || '';
        form.default_channel = data.default_channel || '';
        form.channel_mappings = Array.isArray(data.channel_mappings) ? data.channel_mappings : [];
        form.event_routing = {
            'ticket.created': true,
            'ticket.assigned': true,
            'ticket.resolved': true,
            'reply.created': true,
            'sla.breached': false,
            ...(data.event_routing || {}),
        };

        savedSnapshot = JSON.stringify(form);
        hasUnsavedChanges.value = false;
    } catch (err) {
        console.error('[slack] Failed to load settings:', err);
        saveMessage.value = 'Failed to load settings. Using defaults.';
        saveError.value = true;
        setTimeout(() => { saveMessage.value = ''; }, 4000);
    } finally {
        loading.value = false;
    }
}

async function fetchTeamsAndCategories() {
    // Fetch available teams
    try {
        const response = await fetch('/api/teams', {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
        if (response.ok) {
            const data = await response.json();
            teams.value = Array.isArray(data) ? data : data.teams || [];
        }
    } catch (err) {
        console.error('[slack] Failed to fetch teams:', err);
    }

    // Fetch available categories
    try {
        const response = await fetch('/api/categories', {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
        if (response.ok) {
            const data = await response.json();
            categories.value = Array.isArray(data) ? data : data.categories || [];
        }
    } catch (err) {
        console.error('[slack] Failed to fetch categories:', err);
    }
}

async function save() {
    saving.value = true;
    saveMessage.value = '';
    saveError.value = false;

    try {
        const response = await fetch(`/api/plugins/${props.pluginSlug}/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                workspace_name: form.workspace_name,
                bot_token: form.bot_token,
                signing_secret: form.signing_secret,
                client_id: form.client_id,
                client_secret: form.client_secret,
                default_channel: form.default_channel,
                channel_mappings: form.channel_mappings,
                event_routing: form.event_routing,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to save settings');
        }

        savedSnapshot = JSON.stringify(form);
        hasUnsavedChanges.value = false;

        saveMessage.value = 'Settings saved successfully.';
        saveError.value = false;
        setTimeout(() => { saveMessage.value = ''; }, 3000);
    } catch (err) {
        console.error('[slack] Failed to save settings:', err);
        saveMessage.value = err.message || 'An error occurred while saving.';
        saveError.value = true;
        setTimeout(() => { saveMessage.value = ''; }, 5000);
    } finally {
        saving.value = false;
    }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
    fetchSettings();
    fetchTeamsAndCategories();
});
</script>
