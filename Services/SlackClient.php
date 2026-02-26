<?php

namespace Escalated\Plugins\Slack\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Escalated\Plugins\Slack\Support\Config;

class SlackClient
{
    public static function request(string $method, array $payload = []): array
    {
        $token = Config::get('bot_token', '');

        if ($token === '') {
            return ['ok' => false, 'error' => 'bot_token_not_configured'];
        }

        $url = 'https://slack.com/api/' . $method;

        try {
            $response = Http::withToken($token)
                ->timeout(15)
                ->post($url, $payload);

            $data = $response->json();

            if (!is_array($data)) {
                Log::warning('Slack API: invalid response', ['method' => $method, 'status' => $response->status()]);
                return ['ok' => false, 'error' => 'invalid_response'];
            }

            if (empty($data['ok'])) {
                Log::warning('Slack API error', ['method' => $method, 'error' => $data['error'] ?? 'unknown']);
            }

            return $data;
        } catch (\Exception $e) {
            Log::error('Slack API exception', ['method' => $method, 'message' => $e->getMessage()]);
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
