# coho-template-typescript

The starting point for your content library: a TypeScript package, generated from your Coho CMS project's content types, that your sites and services install. Each content type becomes an interface, and the library's client returns them.

**In testing.** The `@coho-cms` packages this depends on are published to GitHub Packages as alphas, not to npm yet. Installing them needs a token even though they are public: a personal access token (classic) with `read:packages`, as `NODE_AUTH_TOKEN`. `.npmrc` sends the scope there, and CI uses the workflow's own token. When they reach npm, `.npmrc` goes.

It comes with the types of the `cli-next-blog` sample, generated, so it builds as it stands. Setting it up replaces them with yours.

## Set up

1. **Create your repository** from this template.
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

## Two credentials, kept apart

| | Who holds it | For |
|---|---|---|
| `COHO_TOKEN` | This library's CI, and you when you pull | Reading the content types. Never deployed |
| A delivery key | Each app, on the server | Reading content at runtime |

The library reads no environment variables, so the delivery key is only ever where the app runs. Keep it on the server: a key in a browser bundle is one anyone can read.

## Development

Node 22.18 or later, which runs the TypeScript tests directly. The published library runs on Node 18 and later.

```bash
npm run typecheck
npm test
npm run build
```

## License

Apache-2.0
