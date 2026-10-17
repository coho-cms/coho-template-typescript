# coho-template-typescript

The starting point for your content library: a TypeScript package, generated from your Coho CMS project's content types, that your sites and services install. Each content type becomes an interface in its own file, and the library's client returns them.

**In testing.** The `@coho-cms` packages this depends on are alphas on npm.

It is a skeleton: it holds no content types, so it does not build until you generate yours in step 5. That writes your project's type model to `coho-ir.json`, and a file per content type, with `index.ts` to export them, to `src/coho/`.

## Set up

1. **Create your repository** from this template, or let `npm create coho@alpha` do steps 1 to 3 for you.
2. **Name the package** in `package.json`, under your own scope, such as `@acme/content`.
3. **Point it at your project** in `coho.config.json`: the Coho URL, your account and project ids, and the tag to generate from.
4. **Give it a project token** with read access, as `COHO_TOKEN`: in `.env` for local runs (copy `.env.example`), and as a secret in CI.
5. **Generate your types**, and commit the type model and the generated code:

   ```bash
   npm install
   npm run pull
   npm run generate
   ```

6. **Choose where it is published.** The release workflow publishes to GitHub Packages; change `registry-url` in `.github/workflows/release.yml` for another registry. Then remove `"private": true` from `package.json`, which is there so nothing is published by accident.

## See what's there

`npm run catalog` lists every content type and how many entries it has, read live from delivery with a delivery key, the way an app reads it. Add these to `.env`:

```
COHO_DELIVERY_URL=https://delivery.coho.example
COHO_DELIVERY_KEY=<a delivery key for the project>
COHO_REF=qa
```

`COHO_REF` is the tag or environment to read; leave it empty to read the ref in `coho.config.json`. A key made for one environment reads only that one. Then:

```bash
npm run catalog
```

```
Content on qa:

  blogPost     Blog post         2
  tag          Tag               3
  teamMember   Team member       2

  7 entries in 3 types
```

To see what is on `dev` or a branch, before it is released, add `--preview`. It reads live through Coho with the `COHO_TOKEN` you pull with, and needs no delivery key:

```bash
npm run catalog -- --preview
npm run catalog -- --preview --ref feature/spring-campaign
```

It is also part of the library, as `catalog(config)`, in `src/catalog.ts`: an example of reading content that uses the generated types.

## When the content types change

Cut a tag in Coho, then:

```bash
npm run pull -- --ref v1.4.0
npm run generate
```

Review and commit the diff. CI's `check` fails whenever the generated code doesn't match the committed type model.

To release, run the **Release** workflow with the Coho tag and the version to publish. It pulls that tag's types, generates, tests and publishes.

Your own reads go in `src/index.ts`, built on the generated ones. `src/coho/` is regenerated and never edited, so a schema change that breaks one of your reads fails this library's build, not an app.

## Using the library in an app

For a project with a `blogPost` type:

```bash
npm install @acme/content @coho-cms/delivery
```

```ts
import { createCoho, homepage, isResolved } from '@acme/content';

const coho = createCoho({
  url: 'https://delivery.coho.example',
  project: '0192…',
  key: process.env.COHO_DELIVERY_KEY,
  ref: 'prod',
  locale: 'en-US',
});

const home = await homepage(coho);
const latest = await coho.blogPost.list({ order: '-publishedAt', limit: 3, depth: 1 });
```

### Previews

To show `dev` or a branch before it is released, such as on a developer's machine or a preview deployment, read it with a project token instead of a delivery key:

```ts
const coho = createCoho({
  url: 'https://api.coho.example', // Coho's own URL, not delivery's
  account: '0191…',
  project: '0192…',
  token: process.env.COHO_PREVIEW_TOKEN!,
  ref: 'dev',
});
```

The answers are the same shapes, so the app's code doesn't change. To choose by deployment rather than in code, configure the library from the environment:

```ts
import { configFromEnv, createCoho } from '@acme/content';

const coho = createCoho(configFromEnv(process.env));
```

```
# .env.local: server-side only, never NEXT_PUBLIC_
COHO_URL=https://api.coho.example
COHO_ACCOUNT=0191…
COHO_PROJECT=0192…
COHO_PREVIEW_TOKEN=coho_pt_…
COHO_REF=dev
```

In production, set `COHO_DELIVERY_URL`, `COHO_DELIVERY_KEY`, `COHO_PROJECT` and `COHO_REF` instead. Setting a preview token and a delivery key together is refused.

## Three credentials, kept apart

| | Who holds it | For |
|---|---|---|
| `COHO_TOKEN` | This library's CI, and you when you pull | Reading the content types. Never deployed |
| A delivery key | Each app, on the server | Reading released content at runtime |
| A preview token | An app, on the server, wherever it previews | Reading unreleased content. A project token with the viewer role: `coho token create --role viewer` |

The library reads no environment variables, so a key or token is only ever where the app runs. Keep them on the server: one in a browser bundle is one anyone can read, and a preview token reads everything unreleased. The client refuses to start with a token in a browser.

## Development

Node 22.18 or later, which runs the TypeScript tests directly. The published library runs on Node 18 and later.

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run lint -- --fix` reformats: Allman braces, an opening brace on its own line, and four-space indents. The generated `src/coho/` is not linted; codegen writes it in the same style.

## License

Apache-2.0
