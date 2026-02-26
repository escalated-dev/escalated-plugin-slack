<?php

/**
 * Slack Integration Plugin for Escalated
 *
 * Connects an Escalated helpdesk instance to a Slack workspace so that
 * ticket lifecycle events are forwarded as Slack messages and agents
 * receive DMs on assignment.
 */

if (!defined('ESCALATED_LOADED')) {
    exit('Direct access not allowed.');
}

// Load plugin classes
require_once __DIR__ . '/Support/Config.php';
require_once __DIR__ . '/Services/SlackClient.php';
require_once __DIR__ . '/Handlers/EventHandler.php';
require_once __DIR__ . '/Handlers/WebhookHandler.php';

use Escalated\Plugins\Slack\Support\Config;
use Escalated\Plugins\Slack\Handlers\EventHandler;
use Escalated\Plugins\Slack\Handlers\WebhookHandler;

// ---------------------------------------------------------------------------
// Action hooks
// ---------------------------------------------------------------------------

escalated_add_action('ticket.created', [EventHandler::class, 'onTicketCreated'], 10);
escalated_add_action('ticket.assigned', [EventHandler::class, 'onTicketAssigned'], 10);
escalated_add_action('reply.created', [EventHandler::class, 'onReplyCreated'], 10);

// ---------------------------------------------------------------------------
// Filter hooks
// ---------------------------------------------------------------------------

escalated_add_filter('notification.channels', function (array $channels) {
    $channels[] = [
        'id'          => 'slack',
        'name'        => 'Slack',
        'icon'        => 'slack',
        'description' => 'Send notifications to Slack channels and direct messages',
        'enabled'     => Config::get('bot_token', '') !== '',
    ];

    return $channels;
}, 10);

// ---------------------------------------------------------------------------
// UI registration
// ---------------------------------------------------------------------------

escalated_add_page_component('admin.settings', 'integrations', [
    'component' => 'SlackNotificationConfig',
    'props'     => ['pluginSlug' => Config::SLUG],
    'order'     => 10,
]);

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
// Lifecycle hooks
// ---------------------------------------------------------------------------

escalated_add_action('escalated_plugin_activated_slack', [Config::class, 'onActivate'], 10);
escalated_add_action('escalated_plugin_deactivated_slack', [Config::class, 'onDeactivate'], 10);
