/**
 * `npm run catalog`: every content type, and how many entries each has, read the way an
 * app reads them.
 *
 * Released content by default, from delivery, with COHO_DELIVERY_URL and
 * COHO_DELIVERY_KEY. The ref is `--ref`, or COHO_REF, or the ref in coho.config.json.
 *
 * `--preview` reads unreleased content instead, live through Coho, with the COHO_TOKEN
 * this library pulls its types with, or COHO_PREVIEW_TOKEN if that is set. The ref is
 * `--ref`, or `dev`.
 *
 * The project, and for a preview Coho's URL and the account, come from coho.config.json
 * unless the environment or `.env` sets them, under the names configFromEnv reads in an app.
 */
import { existsSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { CohoDeliveryError, configFromEnv } from '@coho-cms/delivery';
import type { ContentConfig } from '@coho-cms/delivery';
import { catalog } from '../src/index.ts';

if (existsSync('.env')) process.loadEnvFile('.env');

const { values: flags } = parseArgs({ options: { preview: { type: 'boolean', default: false }, ref: { type: 'string' } } });
const config = JSON.parse(readFileSync('coho.config.json', 'utf8')) as {
    url?: string;
    account?: string;
    project?: string;
    ref?: string;
    typeModel?: string;
};

// The variables an app would set, with gaps filled from coho.config.json.
const env: Record<string, string | undefined> = { ...process.env };
const fill = (name: string, value: string | undefined): void =>
{
    if ((env[name] ?? '').trim() === '') env[name] = value;
};
fill('COHO_PROJECT', config.project);
if (flags.preview)
{
    fill('COHO_PREVIEW_TOKEN', env['COHO_TOKEN']);
    if ((env['COHO_PREVIEW_TOKEN'] ?? '').trim() === '')
    {
        console.error('npm run catalog -- --preview needs COHO_TOKEN in .env, a project token with read access. See .env.example.');
        process.exit(1);
    }
    fill('COHO_URL', config.url);
    fill('COHO_ACCOUNT', config.account);
    delete env['COHO_DELIVERY_KEY'];
    // Not the config's ref: that is a tag, and a preview reads branches.
    env['COHO_REF'] = flags.ref ?? 'dev';
}
else
{
    delete env['COHO_PREVIEW_TOKEN'];
    fill('COHO_REF', config.ref);
    if (flags.ref !== undefined) env['COHO_REF'] = flags.ref;
}

let read: ContentConfig;
try
{
    read = configFromEnv(env);
}
catch (error)
{
    console.error(`npm run catalog: ${(error as Error).message}. See .env.example.`);
    process.exit(1);
}

// Display names, from the type model the code was generated from.
const model = JSON.parse(readFileSync(config.typeModel ?? 'coho-ir.json', 'utf8')) as { types?: Record<string, { name?: string }> };

try
{
    const counted = await catalog(read);
    const rows = counted.map(({ type, count }) => [type, model.types?.[type]?.name ?? '', String(count)] as const);
    const width = (column: 0 | 1): number => Math.max(...rows.map((row) => row[column].length));
    const total = counted.reduce((sum, { count }) => sum + count, 0);

    console.log(`${flags.preview ? 'Unreleased content' : 'Content'} on ${read.ref}:\n`);
    for (const [type, name, count] of rows)
    {
        console.log(`  ${type.padEnd(width(0))}   ${name.padEnd(width(1))}   ${count.padStart(5)}`);
    }
    console.log(`\n  ${total} ${total === 1 ? 'entry' : 'entries'} in ${counted.length} ${counted.length === 1 ? 'type' : 'types'}`);
}
catch (error)
{
    if (!(error instanceof CohoDeliveryError)) throw error;
    // Coho's own words, such as KEY_REQUIRED or PROJECT_NOT_FOUND, and what to check.
    console.error(error.message);
    process.exit(1);
}
