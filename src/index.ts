/**
 * The content library's public API.
 *
 * `./coho/` is generated from the project's content types: after a schema change, run
 * `npm run pull` and `npm run generate`, and never edit it by hand. Reads of your own
 * belong here, built on the generated ones. Regeneration never touches this file, and
 * a schema change that removes something these reads use fails this library's build
 * rather than an app at runtime.
 */
import type { Coho } from './coho/index.ts';

export * from './coho/index.ts';
// So an app configures the library from its environment with one import: released
// content with a delivery key, or a preview with a project token.
export { configFromEnv } from '@coho-cms/delivery';
export { catalog } from './catalog.ts';
export type { CatalogEntry } from './catalog.ts';

/**
 * An example of a read of your own: the home page, and everything it links to two
 * levels deep, in one request. Replace it with yours, or remove it.
 */
export function homepage(coho: Coho) {
  return coho.bySlug('home-page', { depth: 2 });
}
