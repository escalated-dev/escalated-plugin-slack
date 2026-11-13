<p align="center">
  <a href="https://escalated.dev"><img src="https://raw.githubusercontent.com/escalated-dev/escalated/main/docs/assets/readme/logo.png" width="56" height="56" alt="Escalated"></a>
</p>

<h1 align="center">Slack plugin for Escalated</h1>

<p align="center">Ticket notifications in the Slack channels your team already watches.</p>

<p align="center">
  <a href="https://escalated.dev"><b>Website</b></a> ·
  <a href="https://escalated.dev/docs"><b>Docs</b></a> ·
  <a href="https://escalated.dev/cloud"><b>Cloud</b></a> ·
  <a href="https://github.com/escalated-dev/escalated-plugin-slack/releases"><b>Releases</b></a>
</p>

This plugin posts ticket events and public replies to Slack, routes them to channels by team or category, and accepts authenticated Slack Events API callbacks. It's for support teams that live in Slack; turning Slack messages into tickets also needs a host adapter, described in the reference.

## Features

<table>
<tr>
<td width="33%" valign="top">

**Notifications**
- Alerts when tickets are created and assigned
- Public replies, threaded with a host-supplied timestamp
- Slack added as a notification channel

</td>
<td width="33%" valign="top">

**Routing**
- Channel mapping by team or category
- Turn each event type on or off

</td>
<td width="33%" valign="top">

**Setup**
- Authenticated Events API callbacks
- Settings page with connection test

</td>
</tr>
</table>

<p align="center"><sub><a href="docs/features.md">Every feature in detail</a></sub></p>

<p align="center">
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"></a>
  <a href="https://vuejs.org"><img src="https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white" alt="Vue.js"></a>
</p>

## Learn more

- [Every feature](docs/features.md)
- [Configuration, hooks, endpoints and webhooks](docs/reference.md)
- [Plugin SDK](https://github.com/escalated-dev/escalated-plugin-sdk): how Escalated plugins are built
- [Escalated docs](https://escalated.dev/docs)
- [Escalated](https://github.com/escalated-dev/escalated), the main repo

## License

MIT. Copyright (c) 2026 Escalated.dev. See [LICENSE](LICENSE).
