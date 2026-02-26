<?php

namespace Escalated\Plugins\Slack\Support;

class Config
{
    const VERSION = '0.1.0';
    const SLUG = 'slack';
    const CONFIG_DIR = __DIR__ . '/../config';
    const CONFIG_FILE = self::CONFIG_DIR . '/settings.json';

    public static function defaults(): array
    {
        return [
            'workspace_name'    => '',
            'bot_token'         => '',
            'signing_secret'    => '',
            'client_id'         => '',
            'client_secret'     => '',
            'default_channel'   => '',
            'channel_mappings'  => [],
            'event_routing'     => [
                'ticket.created'  => true,
                'ticket.assigned' => true,
                'ticket.resolved' => true,
                'reply.created'   => true,
                'sla.breached'    => false,
            ],
        ];
    }

    public static function all(): array
    {
        if (!file_exists(self::CONFIG_FILE)) {
            return self::defaults();
        }

        $json = file_get_contents(self::CONFIG_FILE);
        $data = json_decode($json, true);

        if (!is_array($data)) {
            return self::defaults();
        }

        return array_merge(self::defaults(), $data);
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $settings = self::all();
        return $settings[$key] ?? $default;
    }

    public static function save(array $settings): bool
    {
        if (!is_dir(self::CONFIG_DIR)) {
            mkdir(self::CONFIG_DIR, 0755, true);
        }

        $json = json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        return file_put_contents(self::CONFIG_FILE, $json) !== false;
    }

    public static function isEventEnabled(string $event): bool
    {
        $routing = self::get('event_routing', []);
        return !empty($routing[$event]);
    }

    public static function onActivate(): void
    {
        if (!is_dir(self::CONFIG_DIR)) {
            mkdir(self::CONFIG_DIR, 0755, true);
        }

        if (!file_exists(self::CONFIG_FILE)) {
            self::save(self::defaults());
        }

        if (function_exists('escalated_update_option')) {
            escalated_update_option('slack_plugin_version', self::VERSION);
        }
    }

    public static function onDeactivate(): void
    {
        if (function_exists('escalated_broadcast')) {
            escalated_broadcast('admin', 'slack.deactivated', [
                'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
            ]);
        }
    }
}
