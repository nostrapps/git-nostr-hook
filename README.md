# git-nostr-hook

[![npm version](https://img.shields.io/npm/v/git-nostr-hook.svg)](https://www.npmjs.com/package/git-nostr-hook)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

Git hook that automatically publishes your repository state to Nostr ([NIP-34](https://github.com/nostr-protocol/nips/blob/master/34.md)) on every commit.

## Why?

Decentralize your git repository announcements. Every commit publishes a Kind 30617 event to Nostr relays, making your repository discoverable across the Nostr network without relying solely on centralized platforms like GitHub.

## Prerequisites

- **Node.js** 18+
- **Git** 2.9+ (for `core.hooksPath` support)

## Install

```bash
npm install -g git-nostr-hook
git-nostr-hook install
```

## Setup

Set your Nostr private key:

```bash
git config --global nostr.privkey <64-char-hex-key>
```

Generate a new key if needed:

```bash
npx noskey
```

## Usage

Once installed, every `git commit` automatically publishes a Kind 30617 event to Nostr relays.

### Manual Run

Test the hook without committing:

```bash
git-nostr-hook run
```

### Example Output

```
📡 git-nostr-hook

Event ID: abc123...
Pubkey: def456...

✓ Published to wss://relay.damus.io
✓ Published to wss://nos.lol
✓ Published to wss://relay.nostr.band

✓ Published to 3/3 relays
```

## Published Event

The hook publishes a Kind 30617 (NIP-34 repository announcement) event containing:

| Tag | Description |
|-----|-------------|
| `d` | Repository identifier (repo name) |
| `name` | Repository name |
| `HEAD` | Current branch reference |
| `clone` | Git clone URL |
| `web` | Web URL (GitHub, etc.) |
| `refs/heads/*` | Branch refs with commit SHAs |

### Example Event

```json
{
  "kind": 30617,
  "tags": [
    ["d", "my-project"],
    ["name", "my-project"],
    ["HEAD", "ref: refs/heads/main"],
    ["clone", "git@github.com:user/my-project.git"],
    ["web", "https://github.com/user/my-project"],
    ["refs/heads/main", "abc123..."]
  ],
  "content": "Latest commit: Add new feature"
}
```

## Commands

| Command | Description |
|---------|-------------|
| `git-nostr-hook install` | Install global git hook |
| `git-nostr-hook uninstall` | Remove global git hook |
| `git-nostr-hook run` | Run manually (for testing) |
| `git-nostr-hook help` | Show help |

## How It Works

1. Installs a post-commit hook to `~/.git-hooks/`
2. Sets `git config --global core.hooksPath ~/.git-hooks`
3. On every commit, the hook:
   - Reads private key from `git config nostr.privkey`
   - Builds a Kind 30617 repository announcement event
   - Signs with Schnorr signature (secp256k1)
   - Publishes to default relays

### Default Relays

- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.nostr.band`

## Troubleshooting

### "No nostr.privkey configured"

Set your private key:

```bash
git config --global nostr.privkey <your-64-char-hex-key>
```

### Hook not running after commit

Verify the global hooks path is set:

```bash
git config --global core.hooksPath
# Should output: ~/.git-hooks
```

Re-run install if needed:

```bash
git-nostr-hook install
```

### "Failed to publish" errors

Check your internet connection and verify the relays are online. The hook will continue even if some relays fail.

### Using with existing git hooks

If you have existing hooks in a repository's `.git/hooks/`, note that `core.hooksPath` takes precedence. You may need to manually call your other hooks from `~/.git-hooks/post-commit`.

## Verifying Events

View your published events on Nostr clients that support NIP-34, or query directly:

```bash
# Using nak (Nostr Army Knife)
nak req -k 30617 -a <your-pubkey> wss://relay.damus.io
```

## NIP-34

This implements [NIP-34](https://github.com/nostr-protocol/nips/blob/master/34.md) - Git repositories on Nostr.

Kind 30617 is a **replaceable event** (per NIP-01), so each commit updates the previous announcement rather than creating duplicates.

## License

MIT
