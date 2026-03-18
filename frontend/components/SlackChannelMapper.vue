<template>
    <div>
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
            <h4 :class="['text-sm font-medium', dark ? 'text-gray-300' : 'text-gray-700']">
                Channel Mappings
                <span :class="['ml-1 text-xs font-normal', dark ? 'text-gray-500' : 'text-gray-400']">
                    ({{ mappings.length }})
                </span>
            </h4>
            <button
                @click="addMapping"
                :class="[
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    dark
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white',
                ]"
            >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Mapping
            </button>
        </div>

        <p :class="['text-xs mb-3', dark ? 'text-gray-400' : 'text-gray-500']">
            Route ticket notifications to specific Slack channels based on the assigned team or category.
        </p>

        <!-- Empty state -->
        <div
            v-if="mappings.length === 0"
            :class="[
                'text-center py-8 rounded-lg',
                dark ? 'bg-gray-700/30 text-gray-500' : 'bg-gray-50 text-gray-400',
            ]"
        >
            <svg class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <p class="text-sm">No channel mappings configured.</p>
            <p class="text-xs mt-1">Add a mapping to route notifications to specific Slack channels.</p>
        </div>

        <!-- Mappings table -->
        <div v-else :class="['overflow-hidden rounded-lg border', dark ? 'border-gray-600' : 'border-gray-200']">
            <table class="w-full">
                <thead>
                    <tr :class="dark ? 'bg-gray-700/50' : 'bg-gray-50'">
                        <th :class="['text-left text-xs font-medium px-4 py-2.5', dark ? 'text-gray-400' : 'text-gray-500']">
                            Source Type
                        </th>
                        <th :class="['text-left text-xs font-medium px-4 py-2.5', dark ? 'text-gray-400' : 'text-gray-500']">
                            Source
                        </th>
                        <th :class="['text-center text-xs font-medium px-3 py-2.5 w-10', dark ? 'text-gray-400' : 'text-gray-500']">
                            <!-- Arrow -->
                        </th>
                        <th :class="['text-left text-xs font-medium px-4 py-2.5', dark ? 'text-gray-400' : 'text-gray-500']">
                            Slack Channel
                        </th>
                        <th :class="['text-center text-xs font-medium px-4 py-2.5 w-16', dark ? 'text-gray-400' : 'text-gray-500']">
                            Delete
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(mapping, index) in mappings"
                        :key="index"
                        :class="[
                            'transition-colors',
                            dark
                                ? 'border-t border-gray-700 hover:bg-gray-700/30'
                                : 'border-t border-gray-100 hover:bg-gray-50',
                        ]"
                    >
                        <!-- Source Type -->
                        <td class="px-4 py-2.5">
                            <select
                                :value="mapping.source_type"
                                @change="updateMapping(index, 'source_type', $event.target.value)"
                                :class="[
                                    'w-full px-2.5 py-1.5 rounded-md border text-sm transition-colors',
                                    dark
                                        ? 'border-gray-600 bg-gray-700 text-gray-200 focus:border-blue-500'
                                        : 'border-gray-300 bg-white text-gray-800 focus:border-blue-500',
                                    'focus:outline-none focus:ring-1 focus:ring-blue-500',
                                ]"
                            >
                                <option value="">Select type...</option>
                                <option value="team">Team</option>
                                <option value="category">Category</option>
                            </select>
                        </td>

                        <!-- Source Name / Selector -->
                        <td class="px-4 py-2.5">
                            <select
                                v-if="mapping.source_type && getSourceOptions(mapping.source_type).length > 0"
                                :value="mapping.source_id"
                                @change="onSourceSelect(index, $event.target.value)"
                                :class="[
                                    'w-full px-2.5 py-1.5 rounded-md border text-sm transition-colors',
                                    dark
                                        ? 'border-gray-600 bg-gray-700 text-gray-200 focus:border-blue-500'
                                        : 'border-gray-300 bg-white text-gray-800 focus:border-blue-500',
                                    'focus:outline-none focus:ring-1 focus:ring-blue-500',
                                ]"
                            >
                                <option value="">Select {{ mapping.source_type }}...</option>
                                <option
                                    v-for="option in getSourceOptions(mapping.source_type)"
                                    :key="option.id"
                                    :value="option.id"
                                >
                                    {{ option.name }}
                                </option>
                            </select>
                            <input
                                v-else
                                :value="mapping.source_name"
                                @input="updateMapping(index, 'source_name', $event.target.value)"
                                type="text"
                                :placeholder="mapping.source_type ? `Enter ${mapping.source_type} name` : 'Select type first'"
                                :disabled="!mapping.source_type"
                                :class="[
                                    'w-full px-2.5 py-1.5 rounded-md border text-sm transition-colors',
                                    !mapping.source_type
                                        ? (dark ? 'border-gray-700 bg-gray-800 text-gray-600 cursor-not-allowed' : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed')
                                        : (dark
                                            ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500 focus:border-blue-500'
                                            : 'border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:border-blue-500'),
                                    'focus:outline-none focus:ring-1 focus:ring-blue-500',
                                ]"
                            />
                        </td>

                        <!-- Arrow -->
                        <td class="px-3 py-2.5 text-center">
                            <svg
                                :class="['w-4 h-4 mx-auto', dark ? 'text-gray-500' : 'text-gray-400']"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                            >
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </td>

                        <!-- Slack Channel -->
                        <td class="px-4 py-2.5">
                            <div class="flex items-center">
                                <span :class="['text-sm mr-1', dark ? 'text-gray-500' : 'text-gray-400']">#</span>
                                <input
                                    :value="mapping.slack_channel"
                                    @input="updateMapping(index, 'slack_channel', $event.target.value)"
                                    type="text"
                                    placeholder="channel-name"
                                    :class="[
                                        'w-full px-2.5 py-1.5 rounded-md border text-sm font-mono transition-colors',
                                        dark
                                            ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500 focus:border-blue-500'
                                            : 'border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:border-blue-500',
                                        'focus:outline-none focus:ring-1 focus:ring-blue-500',
                                    ]"
                                />
                            </div>
                        </td>

                        <!-- Delete -->
                        <td class="px-4 py-2.5 text-center">
                            <button
                                @click="removeMapping(index)"
                                :class="[
                                    'p-1 rounded transition-colors',
                                    dark
                                        ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50',
                                ]"
                                title="Remove mapping"
                            >
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { inject, computed } from 'vue';

// ---------------------------------------------------------------------------
// Dark mode
// ---------------------------------------------------------------------------
const dark = inject('esc-dark', false);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
const props = defineProps({
    modelValue: {
        type: Array,
        default: () => [],
    },
    teams: {
        type: Array,
        default: () => [],
    },
    categories: {
        type: Array,
        default: () => [],
    },
});

// ---------------------------------------------------------------------------
// Emits
// ---------------------------------------------------------------------------
const emit = defineEmits(['update:modelValue']);

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------
const mappings = computed(() => props.modelValue || []);

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------

/**
 * Return the available source options based on source type.
 */
function getSourceOptions(sourceType) {
    if (sourceType === 'team') {
        return props.teams;
    }
    if (sourceType === 'category') {
        return props.categories;
    }
    return [];
}

/**
 * Handle selection of a source from the dropdown.
 * Sets both source_id and source_name.
 */
function onSourceSelect(index, sourceId) {
    const mapping = mappings.value[index];
    if (!mapping) return;

    const options = getSourceOptions(mapping.source_type);
    const selected = options.find((o) => String(o.id) === String(sourceId));

    const updated = [...mappings.value];
    updated[index] = {
        ...updated[index],
        source_id: sourceId,
        source_name: selected ? selected.name : '',
    };
    emit('update:modelValue', updated);
}

/**
 * Update a single field on a mapping row.
 */
function updateMapping(index, field, value) {
    const updated = [...mappings.value];
    updated[index] = {
        ...updated[index],
        [field]: value,
    };

    // Reset source fields when type changes
    if (field === 'source_type') {
        updated[index].source_id = '';
        updated[index].source_name = '';
    }

    emit('update:modelValue', updated);
}

/**
 * Add a new empty mapping row.
 */
function addMapping() {
    const updated = [
        ...mappings.value,
        {
            source_type: '',
            source_id: '',
            source_name: '',
            slack_channel: '',
        },
    ];
    emit('update:modelValue', updated);
}

/**
 * Remove a mapping row by index.
 */
function removeMapping(index) {
    const updated = mappings.value.filter((_, i) => i !== index);
    emit('update:modelValue', updated);
}
</script>
