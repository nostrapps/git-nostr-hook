import { test } from 'node:test';
import assert from 'node:assert';

test('SSH to HTTPS conversion', async (t) => {
  // Simulate the conversion logic from lib/hook.js
  function convertToHttps(remoteUrl) {
    return remoteUrl
      .replace(/^git@github\.com:/, 'https://github.com/')
      .replace(/^git@([^:]+):/, 'https://$1/');
  }

  await t.test('converts GitHub SSH to HTTPS', () => {
    const ssh = 'git@github.com:nostrapps/git-nostr-hook.git';
    const https = convertToHttps(ssh);
    assert.strictEqual(https, 'https://github.com/nostrapps/git-nostr-hook.git');
  });

  await t.test('converts GitLab SSH to HTTPS', () => {
    const ssh = 'git@gitlab.com:user/repo.git';
    const https = convertToHttps(ssh);
    assert.strictEqual(https, 'https://gitlab.com/user/repo.git');
  });

  await t.test('converts generic SSH to HTTPS', () => {
    const ssh = 'git@git.example.com:org/project.git';
    const https = convertToHttps(ssh);
    assert.strictEqual(https, 'https://git.example.com/org/project.git');
  });

  await t.test('leaves HTTPS URLs unchanged', () => {
    const url = 'https://github.com/nostrapps/git-nostr-hook.git';
    const result = convertToHttps(url);
    assert.strictEqual(result, url);
  });
});

test('web URL generation', async (t) => {
  function getWebUrl(httpsUrl) {
    return httpsUrl.replace(/\.git$/, '');
  }

  await t.test('strips .git suffix', () => {
    const clone = 'https://github.com/nostrapps/git-nostr-hook.git';
    const web = getWebUrl(clone);
    assert.strictEqual(web, 'https://github.com/nostrapps/git-nostr-hook');
  });

  await t.test('handles URLs without .git suffix', () => {
    const clone = 'https://github.com/nostrapps/git-nostr-hook';
    const web = getWebUrl(clone);
    assert.strictEqual(web, 'https://github.com/nostrapps/git-nostr-hook');
  });
});

test('clone tag ordering', async (t) => {
  function getCloneTags(remoteUrl) {
    const tags = [];
    const httpsUrl = remoteUrl
      .replace(/^git@github\.com:/, 'https://github.com/')
      .replace(/^git@([^:]+):/, 'https://$1/');

    if (httpsUrl.startsWith('https://')) {
      tags.push(['clone', httpsUrl]);
      if (remoteUrl !== httpsUrl) {
        tags.push(['clone', remoteUrl]);
      }
    } else {
      tags.push(['clone', remoteUrl]);
    }
    return tags;
  }

  await t.test('HTTPS comes before SSH for GitHub', () => {
    const tags = getCloneTags('git@github.com:user/repo.git');
    assert.strictEqual(tags.length, 2);
    assert.strictEqual(tags[0][1], 'https://github.com/user/repo.git');
    assert.strictEqual(tags[1][1], 'git@github.com:user/repo.git');
  });

  await t.test('single tag for HTTPS-only remote', () => {
    const tags = getCloneTags('https://github.com/user/repo.git');
    assert.strictEqual(tags.length, 1);
    assert.strictEqual(tags[0][1], 'https://github.com/user/repo.git');
  });
});
