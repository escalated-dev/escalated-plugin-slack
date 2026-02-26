<?php

namespace Escalated\Plugins\Slack\Handlers;

use Illuminate\Support\Facades\Log;
use Escalated\Plugins\Slack\Support\Config;

class WebhookHandler
{
    public static function handle(array $payload, string $rawBody = '', array $headers = []): array
    {
        $type = $payload['type'] ?? '';

        if ($type === 'url_verification') {
            return ['challenge' => $payload['challenge'] ?? ''];
        }

        if ($type === 'event_callback') {
            $signingSecret = Config::get('signing_secret', '');

            if ($signingSecret !== '' && $rawBody !== '') {
                $signature = $headers['X-Slack-Signature'] ?? $headers['x-slack-signature'] ?? '';
                $timestamp = $headers['X-Slack-Request-Timestamp'] ?? $headers['x-slack-request-timestamp'] ?? '';

                if (!self::verifySignature($signingSecret, $signature, $timestamp, $rawBody)) {
                    Log::warning('Slack webhook: invalid signature');
                    return ['ok' => false, 'error' => 'invalid_signature'];
                }
            }

            $event     = $payload['event'] ?? [];
            $eventType = $event['type'] ?? '';

            if (function_exists('escalated_do_action')) {
                escalated_do_action('slack.event.' . $eventType, $event, $payload);
            }

            return ['ok' => true, 'event_type' => $eventType];
        }

        return ['ok' => false, 'error' => 'unknown_type'];
    }

    public static function verifySignature(string $signingSecret, string $signature, string $timestamp, string $body): bool
    {
        if (abs(time() - (int) $timestamp) > 300) {
            return false;
        }

        $baseString = "v0:{$timestamp}:{$body}";
        $computed   = 'v0=' . hash_hmac('sha256', $baseString, $signingSecret);

        return hash_equals($computed, $signature);
    }
}
