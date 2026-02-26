<?php

namespace Escalated\Plugins\Slack\Handlers;

use Escalated\Plugins\Slack\Support\Config;
use Escalated\Plugins\Slack\Services\SlackClient;

class EventHandler
{
    public static function onTicketCreated($ticket): void
    {
        if (!Config::isEventEnabled('ticket.created')) {
            return;
        }

        $ticketData = is_array($ticket) ? $ticket : (array) $ticket;
        $channel    = self::resolveChannel($ticketData);

        if ($channel === '') {
            return;
        }

        $subject  = $ticketData['subject'] ?? 'No subject';
        $ticketId = $ticketData['id'] ?? '';

        SlackClient::request('chat.postMessage', [
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
    }

    public static function onTicketAssigned($ticket, $agent = null): void
    {
        if (!Config::isEventEnabled('ticket.assigned')) {
            return;
        }

        $ticketData = is_array($ticket) ? $ticket : (array) $ticket;
        $agentData  = is_array($agent) ? $agent : (array) $agent;

        $slackUserId = $agentData['slack_user_id'] ?? '';
        $subject     = $ticketData['subject'] ?? 'No subject';
        $ticketId    = $ticketData['id'] ?? '';

        if ($slackUserId === '') {
            return;
        }

        SlackClient::request('chat.postMessage', [
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
    }

    public static function onReplyCreated($reply, $ticket = null): void
    {
        if (!Config::isEventEnabled('reply.created')) {
            return;
        }

        $replyData  = is_array($reply) ? $reply : (array) $reply;
        $ticketData = is_array($ticket) ? $ticket : (array) $ticket;

        $channel  = self::resolveChannel($ticketData);
        $threadTs = $ticketData['slack_thread_ts'] ?? '';
        $ticketId = $ticketData['id'] ?? '';
        $author   = $replyData['author_name'] ?? 'Agent';
        $body     = $replyData['body'] ?? '';

        if ($channel === '' || $threadTs === '') {
            return;
        }

        SlackClient::request('chat.postMessage', [
            'channel'   => $channel,
            'thread_ts' => $threadTs,
            'text'      => "Reply from {$author} on ticket #{$ticketId}: {$body}",
        ]);
    }

    private static function resolveChannel(array $ticket): string
    {
        $settings = Config::all();
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
}
