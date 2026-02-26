<?php

/**
 * Slack Integration Plugin for Escalated
 *
 * Connects an Escalated helpdesk instance to a Slack workspace so that
 * ticket lifecycle events (created, assigned, resolved, replied) are
 * forwarded as Slack messages.  Agents can also receive direct messages
 * when they are assigned a ticket, and replies are threaded back to the
 * original Slack message.
 *
 * Settings are persisted as a JSON file in the plugin's config directory.
 * All Slack Web API calls are performed through a single helper function
 * that attaches the configured Bot Token.
 */

// Prevent direct access
if (!defined('ESCALATED_LOADED')) {
    exit('Direct access not allowed.');
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

define('ESC_SLACK_VERSION', '0.1.0');
define('ESC_SLACK_SLUG', 'slack');
define('ESC_SLACK_CONFIG_DIR', __DIR__ . '/config');
define('ESC_SLACK_CONFIG_FILE', ESC_SLACK_CONFIG_DIR . '/settings.json');

// ---------------------------------------------------------------------------
// Configuration helpers
// ---------------------------------------------------------------------------

/**
 * Return the default settings structure.
 */
function esc_slack_default_settings(): array
{
    return [
        'workspace_name'    => '',
        'bot_token'         => '',
        'signing_secret'    => '',
        'client_id'         => '',
        'client_secret'     => '',
        'default_channel'   => '',
        'channel_mappings'  => [],  // [ { source_type, source_id, source_name, slack_channel } ]
        'event_routing'     => [
            'ticket.created'  => true,
            'ticket.assigned' => true,
            'ticket.resolved' => true,
            'reply.created'   => true,
            'sla.breached'    => false,
        ],
    ];
}

/**
 * Read the current settings from the JSON config file.
 */
function esc_slack_get_settings(): array
{
    if (!file_exists(ESC_SLACK_CONFIG_FILE)) {
        return esc_slack_default_settings();
    }

    $json = file_get_contents(ESC_SLACK_CONFIG_FILE);
    $data = json_decode($json, true);

    if (!is_array($data)) {
        return esc_slack_default_settings();
    }

    return array_merge(esc_slack_default_settings(), $data);
}

/**
 * Persist settings to the JSON config file.
 */
function esc_slack_save_settings(array $settings): bool
{
    if (!is_dir(ESC_SLACK_CONFIG_DIR)) {
        mkdir(ESC_SLACK_CONFIG_DIR, 0755, true);
    }

    $json = json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

    return file_put_contents(ESC_SLACK_CONFIG_FILE, $json) !== false;
}

// ---------------------------------------------------------------------------
// Slack API helper (stub)
// ---------------------------------------------------------------------------

/**
 * Send a request to the Slack Web API.
 *
 * @param  string $method  Slack API method (e.g. 'chat.postMessage').
 * @param  array  $payload JSON-encodable payload body.
 * @return array           Decoded response or error array.
 */
function esc_slack_api_request(string $method, array $payload = []): array
{
    $settings = esc_slack_get_settings();
    $token    = $settings['bot_token'] ?? '';

    if ($token === '') {
        return ['ok' => false, 'error' => 'bot_token_not_configured'];
    }

    $url = 'https://slack.com/api/' . $method;

    // TODO: Implement Slack API call
    // This stub returns a simulated success response.  In production the
    // implementation would use cURL or an HTTP client to POST to the Slack
    // Web API with the bot token in the Authorization header:
    //
    //   $ch = curl_init($url);
    //   curl_setopt($ch, CURLOPT_HTTPHEADER, [
    //       'Authorization: Bearer ' . $token,
    //       'Content-Type: application/json; charset=utf-8',
    //   ]);
    //   curl_setopt($ch, CURLOPT_POST, true);
    //   curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    //   curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    //   $response = curl_exec($ch);
    //   curl_close($ch);
    //   return json_decode($response, true) ?: ['ok' => false, 'error' => 'invalid_response'];

    return ['ok' => true, 'stub' => true, 'method' => $method];
}

// ---------------------------------------------------------------------------
// Channel resolution helper
// ---------------------------------------------------------------------------

/**
 * Determine the Slack channel for a given ticket based on channel mappings.
 *
 * Falls back to the configured default_channel when no mapping matches.
 *
 * @param  array $ticket Ticket data (expects 'team_id' and/or 'category_id').
 * @return string        Slack channel name/ID or empty string.
 */
function esc_slack_resolve_channel(array $ticket): string
{
    $settings = esc_slack_get_settings();
    $mappings = $settings['channel_mappings'] ?? [];

    foreach ($mappings as $mapping) {
        $sourceType = $mapping['source_type'] ?? '';
        $sourceId   = $mapping['source_id'] ?? '';
        $channel    = $mapping['slack_channel'] ?? '';

        if ($channel === '') {
            continue;
        }

        if ($sourceType === 'team' && isset($ticket['team_id']) && (string) $ticket['team_id'] === (string) $sourceId) {
            return $channel;
        }

        if ($sourceType === 'category' && isset($ticket['category_id']) && (string) $ticket['category_id'] === (string) $sourceId) {
            return $channel;
        }
    }

    return $settings['default_channel'] ?? '';
}

/**
 * Check whether a particular event type is enabled in event routing settings.
 */
function esc_slack_is_event_enabled(string $event): bool
{
    $settings = esc_slack_get_settings();
    $routing  = $settings['event_routing'] ?? [];

    return !empty($routing[$event]);
}

// ---------------------------------------------------------------------------
// Webhook endpoint handler for Slack Events API
// ---------------------------------------------------------------------------

/**
 * Handle incoming webhook requests from Slack.
 *
 * Supports:
 * - url_verification challenge (returns the challenge token)
 * - event_callback dispatch (delegates to registered handlers)
 *
 * @param  array $payload Decoded JSON body from the Slack webhook request.
 * @return array          Response array to be JSON-encoded back to Slack.
 */
function esc_slack_handle_webhook(array $payload): array
{
    $type = $payload['type'] ?? '';

    // -----------------------------------------------------------------------
    // URL verification challenge
    // -----------------------------------------------------------------------
    if ($type === 'url_verification') {
        return [
            'challenge' => $payload['challenge'] ?? '',
        ];
    }

    // -----------------------------------------------------------------------
    // Event callback
    // -----------------------------------------------------------------------
    if ($type === 'event_callback') {
        $event = $payload['event'] ?? [];
        $eventType = $event['type'] ?? '';

        // TODO: Implement Slack event dispatch
        // In production this would verify the request signature using the
        // signing_secret, then dispatch the event to the appropriate handler:
        //
        //   - message: potentially create a ticket from a Slack message
        //   - app_mention: respond to @bot mentions
        //   - reaction_added: trigger workflows based on emoji reactions
        //
        // For now, acknowledge receipt.
        if (function_exists('escalated_do_action')) {
            escalated_do_action('slack.event.' . $eventType, $event, $payload);
        }

        return ['ok' => true, 'event_type' => $eventType];
    }

    return ['ok' => false, 'error' => 'unknown_type'];
}

// ---------------------------------------------------------------------------
// Action: ticket.created -- notify Slack channel
// ---------------------------------------------------------------------------

escalated_add_action('ticket.created', function ($ticket) {
    if (!esc_slack_is_event_enabled('ticket.created')) {
        return;
    }

    $ticketData = is_array($ticket) ? $ticket : (array) $ticket;
    $channel    = esc_slack_resolve_channel($ticketData);

    if ($channel === '') {
        return;
    }

    $subject  = $ticketData['subject'] ?? 'No subject';
    $ticketId = $ticketData['id'] ?? '';

    // TODO: Implement Slack API call
    // Build a rich Slack message with ticket details and a link back to
    // the Escalated ticket view.
    esc_slack_api_request('chat.postMessage', [
        'channel' => $channel,
        'text'    => "New ticket created: #{$ticketId} - {$subject}",
        'blocks'  => [
            [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*New Ticket* #{$ticketId}\n*Subject:* {$subject}",
                ],
            ],
        ],
    ]);
}, 10);

// ---------------------------------------------------------------------------
// Action: ticket.assigned -- DM the assigned agent via Slack
// ---------------------------------------------------------------------------

escalated_add_action('ticket.assigned', function ($ticket, $agent = null) {
    if (!esc_slack_is_event_enabled('ticket.assigned')) {
        return;
    }

    $ticketData = is_array($ticket) ? $ticket : (array) $ticket;
    $agentData  = is_array($agent) ? $agent : (array) $agent;

    $slackUserId = $agentData['slack_user_id'] ?? '';
    $subject     = $ticketData['subject'] ?? 'No subject';
    $ticketId    = $ticketData['id'] ?? '';

    if ($slackUserId === '') {
        // No linked Slack user -- cannot DM
        return;
    }

    // TODO: Implement Slack API call
    // Open a DM conversation with the agent and send the assignment notice.
    // First call conversations.open to get the DM channel, then post.
    esc_slack_api_request('chat.postMessage', [
        'channel' => $slackUserId,
        'text'    => "You have been assigned ticket #{$ticketId}: {$subject}",
        'blocks'  => [
            [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*Ticket Assigned to You*\n*#{$ticketId}:* {$subject}",
                ],
            ],
        ],
    ]);
}, 10);

// ---------------------------------------------------------------------------
// Action: reply.created -- update linked Slack thread
// ---------------------------------------------------------------------------

escalated_add_action('reply.created', function ($reply, $ticket = null) {
    if (!esc_slack_is_event_enabled('reply.created')) {
        return;
    }

    $replyData  = is_array($reply) ? $reply : (array) $reply;
    $ticketData = is_array($ticket) ? $ticket : (array) $ticket;

    $channel  = esc_slack_resolve_channel($ticketData);
    $threadTs = $ticketData['slack_thread_ts'] ?? '';
    $ticketId = $ticketData['id'] ?? '';
    $author   = $replyData['author_name'] ?? 'Agent';
    $body     = $replyData['body'] ?? '';

    if ($channel === '' || $threadTs === '') {
        // No linked Slack thread to update
        return;
    }

    // TODO: Implement Slack API call
    // Post as a threaded reply in the original Slack message thread.
    esc_slack_api_request('chat.postMessage', [
        'channel'   => $channel,
        'thread_ts' => $threadTs,
        'text'      => "Reply from {$author} on ticket #{$ticketId}: {$body}",
    ]);
}, 10);

// ---------------------------------------------------------------------------
// Filter: notification.channels -- add Slack as a notification channel
// ---------------------------------------------------------------------------

escalated_add_filter('notification.channels', function (array $channels) {
    $channels[] = [
        'id'          => 'slack',
        'name'        => 'Slack',
        'icon'        => 'slack',
        'description' => 'Send notifications to Slack channels and direct messages',
        'enabled'     => esc_slack_get_settings()['bot_token'] !== '',
    ];

    return $channels;
}, 10);

// ---------------------------------------------------------------------------
// Settings page component registration
// ---------------------------------------------------------------------------

escalated_add_page_component('admin.settings', 'integrations', [
    'component' => 'SlackNotificationConfig',
    'props'     => [
        'pluginSlug' => ESC_SLACK_SLUG,
    ],
    'order' => 10,
]);

// ---------------------------------------------------------------------------
// Menu item registration
// ---------------------------------------------------------------------------

escalated_register_menu_item([
    'id'         => 'slack-integration',
    'label'      => 'Slack',
    'icon'       => 'slack',
    'route'      => '/settings/integrations/slack',
    'parent'     => 'settings.integrations',
    'order'      => 10,
    'capability' => 'manage_settings',
]);

// ---------------------------------------------------------------------------
// Activation hook
// ---------------------------------------------------------------------------

escalated_add_action('escalated_plugin_activated_slack', function () {
    if (!is_dir(ESC_SLACK_CONFIG_DIR)) {
        mkdir(ESC_SLACK_CONFIG_DIR, 0755, true);
    }

    if (!file_exists(ESC_SLACK_CONFIG_FILE)) {
        esc_slack_save_settings(esc_slack_default_settings());
    }

    if (function_exists('escalated_update_option')) {
        escalated_update_option('slack_plugin_version', ESC_SLACK_VERSION);
    }
}, 10);

// ---------------------------------------------------------------------------
// Deactivation hook
// ---------------------------------------------------------------------------

escalated_add_action('escalated_plugin_deactivated_slack', function () {
    // Preserve settings so re-activation restores the configuration.
    // Full cleanup only happens on uninstall.

    if (function_exists('escalated_broadcast')) {
        escalated_broadcast('admin', 'slack.deactivated', [
            'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
        ]);
    }
}, 10);
