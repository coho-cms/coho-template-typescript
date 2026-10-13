import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createCoho, homepage, source } from '../src/index.ts';

/**
 * Checks that hold for any project's types, so they keep passing after you
 * regenerate for yours. Add tests for your own reads beside them.
 */

test('the library names the type model it was generated from', () => {
  assert.match(source.schemaHash, /^sha256:[0-9a-f]{64}$/);
});

test('a client asks nothing until it is read from, and the home page is one request', async () => {
  const asked: string[] = [];
  const fetch = async (input: string | URL | Request): Promise<Response> => {
    asked.push(String(input));
    return new Response(JSON.stringify({ roots: [], entries: {}, unresolved: {} }), {
      headers: { 'content-type': 'application/json' },
    });
  };

  const coho = createCoho({ url: 'https://delivery.test', project: source.project, ref: 'prod', fetch: fetch as typeof globalThis.fetch });
  assert.deepEqual(asked, []);

  assert.equal(await homepage(coho), null);
  assert.deepEqual(asked, [`https://delivery.test/v1/projects/${source.project}/prod/entries-by-slug/home-page?depth=2`]);
});
