# git-nostr-hook

Git hook that publishes repository state to Nostr (NIP-34) on every commit.

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

Generate a key if needed:

```bash
npx noskey
```

## Usage

Once installed, every `git commit` automatically publishes a Kind 30617 event to Nostr relays with:

- Repository name
- Branch refs (like `git ls-remote`)
- Clone/web URLs
- Latest commit message

## Commands

```bash
git-nostr-hook install    # Install global git hook
git-nostr-hook uninstall  # Remove global git hook
git-nostr-hook run        # Run manually
```

## How It Works

1. Git runs `.git-hooks/post-commit` after every commit
2. Hook reads private key from `git config nostr.privkey`
3. Builds a Kind 30617 (NIP-34 repository announcement) event
4. Signs with Schnorr signature
5. Publishes to relays: `relay.damus.io`, `nos.lol`, `relay.nostr.band`

## NIP-34

This implements [NIP-34](https://github.com/nostr-protocol/nips/blob/master/34.md) - Git repositories on Nostr.

Kind 30617 is a replaceable event, so each commit updates the previous announcement.

## License

MIT
