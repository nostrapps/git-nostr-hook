#!/usr/bin/env node

/**
 * git-nostr-hook CLI
 *
 * Usage:
 *   git-nostr-hook install    Install global git hook
 *   git-nostr-hook uninstall  Remove global git hook
 *   git-nostr-hook run        Run the hook manually
 */

import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOKS_DIR = join(homedir(), '.git-hooks');
const HOOK_PATH = join(HOOKS_DIR, 'post-commit');

const HOOK_SCRIPT = `#!/usr/bin/env node
import { run } from 'git-nostr-hook/lib/hook.js';
run().catch(() => {});
`;

function install() {
  console.log('Installing git-nostr-hook...\n');

  // Create hooks directory
  if (!existsSync(HOOKS_DIR)) {
    mkdirSync(HOOKS_DIR, { recursive: true });
    console.log(`✓ Created ${HOOKS_DIR}`);
  }

  // Create package.json for ES modules
  const pkgPath = join(HOOKS_DIR, 'package.json');
  if (!existsSync(pkgPath)) {
    writeFileSync(pkgPath, JSON.stringify({
      name: "git-hooks",
      type: "module",
      private: true
    }, null, 2));
    console.log('✓ Created package.json');
  }

  // Write the hook
  writeFileSync(HOOK_PATH, HOOK_SCRIPT);
  execSync(`chmod +x "${HOOK_PATH}"`);
  console.log('✓ Installed post-commit hook');

  // Set global hooks path
  execSync('git config --global core.hooksPath ~/.git-hooks');
  console.log('✓ Set global core.hooksPath');

  console.log('\n✅ Installation complete!\n');
  console.log('Next steps:');
  console.log('  1. Set your Nostr private key:');
  console.log('     git config --global nostr.privkey <64-char-hex-key>\n');
  console.log('  2. Generate a key if needed:');
  console.log('     npx noskey\n');
  console.log('  3. Make a commit in any repo to test!');
}

function uninstall() {
  console.log('Uninstalling git-nostr-hook...\n');

  // Remove the hook
  if (existsSync(HOOK_PATH)) {
    unlinkSync(HOOK_PATH);
    console.log('✓ Removed post-commit hook');
  }

  // Unset global hooks path
  try {
    execSync('git config --global --unset core.hooksPath');
    console.log('✓ Unset global core.hooksPath');
  } catch {
    // Already unset
  }

  console.log('\n✅ Uninstalled successfully!');
}

async function runHook() {
  const { run } = await import('../lib/hook.js');
  await run();
}

function help() {
  console.log(`
git-nostr-hook v0.0.1

Publish repository state to Nostr (NIP-34) on every commit.

Usage:
  git-nostr-hook install     Install global git hook
  git-nostr-hook uninstall   Remove global git hook
  git-nostr-hook run         Run the hook manually
  git-nostr-hook help        Show this help

Setup:
  git config --global nostr.privkey <hex-private-key>

Learn more: https://github.com/nostrapps/git-nostr-hook
`);
}

const command = process.argv[2];

switch (command) {
  case 'install':
    install();
    break;
  case 'uninstall':
    uninstall();
    break;
  case 'run':
    runHook().catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
    break;
  case 'help':
  case '--help':
  case '-h':
    help();
    break;
  default:
    help();
}
