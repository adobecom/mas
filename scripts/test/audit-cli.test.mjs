import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('loads the audit formatters and prints help without starting an audit', () => {
    const script = fileURLToPath(new URL('../audit/audit.mjs', import.meta.url));
    const cwd = fileURLToPath(new URL('../audit/', import.meta.url));

    const { status, stdout, stderr } = spawnSync(process.execPath, [script, '--help'], {
        cwd,
        encoding: 'utf8',
        timeout: 5000,
    });

    assert.equal(status, 0, stderr);
    assert.match(stdout, /^Usage: node audit\.mjs /);
    assert.match(stdout, /-h, --help\s+print this help and exit/);
});
