import assert from 'node:assert/strict';
import { test } from 'node:test';
import { catalog, shape } from '../src/index.ts';

/** Holds for any project's types, so it keeps passing after you regenerate for yours. */
test('the catalog counts every type, a hundred entries a request', async () => {
  // Sizes either side of a page, so some types take more than one request.
  const types = Object.keys(shape);
  const sizes = new Map(types.map((type, i) => [type, [30, 100, 170, 0][i % 4] ?? 0]));
  const asked: string[] = [];

  const fetch = async (input: string | URL | Request): Promise<Response> => {
    const url = new URL(String(input));
    asked.push(`${url.searchParams.get('type')}@${url.searchParams.get('offset')}`);
    const total = sizes.get(url.searchParams.get('type') ?? '') ?? 0;
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const size = Math.max(0, Math.min(Number(url.searchParams.get('limit')), total - offset));
    const roots = Array.from({ length: size }, (_, i) => `entry-${offset + i}`);
    return new Response(JSON.stringify({ roots, entries: {}, unresolved: {}, hasMore: offset + size < total }), {
      headers: { 'content-type': 'application/json' },
    });
  };

  const counted = await catalog({ url: 'https://delivery.test', project: 'p1', ref: 'qa', fetch: fetch as typeof globalThis.fetch });

  assert.deepEqual(counted, types.map((type) => ({ type, count: sizes.get(type) })));
  // One request per hundred entries, and one for an empty type: 170 asks at offsets 0 and 100.
  const pages = (size: number): number => Math.max(1, Math.ceil(size / 100));
  assert.deepEqual(asked, types.flatMap((type) => Array.from({ length: pages(sizes.get(type) ?? 0) }, (_, page) => `${type}@${page * 100}`)));
});
