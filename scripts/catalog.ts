/**
 * `npm run catalog`: every content type, and how many entries each has, read live from
 * delivery the way an app reads it, with a delivery key.
 *
 * The project comes from coho.config.json; the rest from the environment or `.env`:
 * COHO_DELIVERY_URL, COHO_DELIVERY_KEY and, to read another tag or environment than
 * the config's ref, COHO_DELIVERY_REF.
 */
import { existsSync, readFileSync } from 'node:fs';
import { CohoDeliveryError } from '@coho-cms/delivery';
import { catalog } from '../src/index.ts';

if (existsSync('.env')) process.loadEnvFile('.env');

const config = JSON.parse(readFileSync('coho.config.json', 'utf8')) as { project?: string; ref?: string; typeModel?: string };
const url = process.env['COHO_DELIVERY_URL'] ?? '';
const key = process.env['COHO_DELIVERY_KEY'] ?? '';
const ref = process.env['COHO_DELIVERY_REF'] || config.ref || '';

if (url === '' || key === '' || ref === '' || (config.project ?? '') === '') {
  console.error('npm run catalog needs COHO_DELIVERY_URL and COHO_DELIVERY_KEY in .env (see .env.example), and the project in coho.config.json.');
  process.exit(1);
}

// Display names, from the type model the code was generated from.
const model = JSON.parse(readFileSync(config.typeModel ?? 'coho-ir.json', 'utf8')) as { types?: Record<string, { name?: string }> };

try {
  const counted = await catalog({ url, project: config.project ?? '', key, ref });
  const rows = counted.map(({ type, count }) => [type, model.types?.[type]?.name ?? '', String(count)] as const);
  const width = (column: 0 | 1): number => Math.max(...rows.map((row) => row[column].length));
  const total = counted.reduce((sum, { count }) => sum + count, 0);

  console.log(`Content on ${ref}:\n`);
  for (const [type, name, count] of rows) {
    console.log(`  ${type.padEnd(width(0))}   ${name.padEnd(width(1))}   ${count.padStart(5)}`);
  }
  console.log(`\n  ${total} ${total === 1 ? 'entry' : 'entries'} in ${counted.length} ${counted.length === 1 ? 'type' : 'types'}`);
} catch (error) {
  if (!(error instanceof CohoDeliveryError)) throw error;
  // Delivery's own words, such as KEY_REQUIRED or PROJECT_NOT_FOUND.
  console.error(error.message);
  process.exit(1);
}
