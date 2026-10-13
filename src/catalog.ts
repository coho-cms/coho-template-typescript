import { createDeliveryClient } from '@coho-cms/delivery';
import type { ContentConfig } from '@coho-cms/delivery';
import { shape } from './coho/index.ts';

/** How many entries one content type has. */
export interface CatalogEntry {
  /** The type's slug. */
  readonly type: string;
  readonly count: number;
}

/**
 * Every content type this library was generated for, with how many entries each has on
 * the config's ref. `npm run catalog` prints it.
 *
 * An example of reading content with the library. The types come from the generated
 * module, and each is counted by paging through its list, a hundred entries a request,
 * so this is a tool for looking around rather than something to run on every page view.
 */
export async function catalog(config: ContentConfig): Promise<CatalogEntry[]> {
  const delivery = createDeliveryClient({ ...config, cache: false });
  const counted: CatalogEntry[] = [];

  for (const type of Object.keys(shape)) {
    let count = 0;
    let more = true;
    while (more) {
      const page = await delivery.entries(config.ref, { type, limit: 100, offset: count });
      count += page.roots.length;
      more = page.hasMore && page.roots.length > 0;
    }
    counted.push({ type, count });
  }
  return counted;
}
