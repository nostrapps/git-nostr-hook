#!/usr/bin/env node

/**
 * Git post-commit hook that publishes repository state to Nostr (NIP-34)
 *
 * This hook:
 * 1. Reads the private key from: git config nostr.privkey
 * 2. Builds a Kind 30617 event (repository announcement)
 * 3. Signs and publishes to Nostr relays
 */

import { execSync } from 'child_process';
import { finalizeEvent } from 'nostr-tools/pure';
import { Relay } from 'nostr-tools/relay';

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band'
];

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function getBranchRefs() {
  const refs = [];
  const branches = git('for-each-ref --format="%(refname:short) %(objectname)" refs/heads/');
  if (branches) {
    for (const line of branches.split('\n')) {
      const [branch, sha] = line.split(' ');
      if (branch && sha) {
        refs.push([`refs/heads/${branch}`, sha]);
      }
    }
  }
  return refs;
}

function buildRepoEvent(secretKey) {
  const repoName = git('rev-parse --show-toplevel')?.split('/').pop() || 'unknown';
  const remoteUrl = git('remote get-url origin');
  const currentBranch = git('symbolic-ref --short HEAD') || 'main';
  const commitMsg = git('log -1 --pretty=%s');

  const tags = [
    ['d', repoName],
    ['name', repoName],
    ['HEAD', `ref: refs/heads/${currentBranch}`],
  ];

  if (remoteUrl) {
    tags.push(['clone', remoteUrl]);
    const webUrl = remoteUrl.replace(/\.git$/, '').replace('git@github.com:', 'https://github.com/');
    if (webUrl.startsWith('https://')) {
      tags.push(['web', webUrl]);
    }
  }

  for (const ref of getBranchRefs()) {
    tags.push(ref);
  }

  const event = {
    kind: 30617,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: `Latest commit: ${commitMsg}`
  };

  return finalizeEvent(event, secretKey);
}

async function publishToRelay(relayUrl, event) {
  try {
    const relay = await Relay.connect(relayUrl);
    await relay.publish(event);
    console.log(`✓ Published to ${relayUrl}`);
    relay.close();
    return true;
  } catch (err) {
    console.log(`✗ Failed ${relayUrl}: ${err.message}`);
    return false;
  }
}

export async function run() {
  console.log('\n📡 git-nostr-hook\n');

  const privkeyHex = git('config nostr.privkey');
  if (!privkeyHex) {
    console.log('⚠ No nostr.privkey configured. Skipping.');
    console.log('  Set with: git config nostr.privkey <hex-key>');
    process.exit(0);
  }

  const secretKey = Uint8Array.from(Buffer.from(privkeyHex, 'hex'));
  const event = buildRepoEvent(secretKey);

  console.log('Event ID:', event.id);
  console.log('Pubkey:', event.pubkey);
  console.log('');

  const results = await Promise.allSettled(
    RELAYS.map(relay => publishToRelay(relay, event))
  );

  const succeeded = results.filter(r => r.status === 'fulfilled' && r.value).length;
  console.log(`\n✓ Published to ${succeeded}/${RELAYS.length} relays\n`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
