import type { HttpClient } from '@escalated-dev/plugin-sdk'

const SLACK_API_BASE = 'https://slack.com/api'

export interface SlackResponse {
  ok: boolean
  error?: string
  [key: string]: unknown
}

export interface SlackMessagePayload {
  channel: string
  text: string
  blocks?: unknown[]
  thread_ts?: string
}

/**
 * Thin wrapper around the Slack Web API.
 * Uses ctx.http so all requests run in-process within the plugin.
 */
export class SlackClient {
  constructor(
    private readonly http: HttpClient,
    private readonly botToken: string,
  ) {}

  async request(method: string, payload: Record<string, unknown>): Promise<SlackResponse> {
    const url = `${SLACK_API_BASE}/${method}`

    const response = await this.http.post(url, {
      headers: {
        Authorization: `Bearer ${this.botToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      json: payload,
      timeout: 15_000,
    })

    const data = (await response.json()) as SlackResponse

    if (!data.ok) {
      throw new Error(`Slack API error [${method}]: ${data.error ?? 'unknown'}`)
    }

    return data
  }

  async postMessage(payload: SlackMessagePayload): Promise<SlackResponse> {
    return this.request('chat.postMessage', payload as unknown as Record<string, unknown>)
  }

  async authTest(): Promise<SlackResponse> {
    return this.request('auth.test', {})
  }

  async openDirectMessage(userId: string): Promise<string> {
    const res = await this.request('conversations.open', { users: userId })
    return (res as unknown as { channel: { id: string } }).channel.id
  }
}
