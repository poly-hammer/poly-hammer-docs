# Poly Hammer Documentation

The site uses **Fumadocs with the Black theme**, Next.js, and Vercel. It serves both human documentation and version-aware agent interfaces deployed here:
[docs.polyhammer.com](https://docs.polyhammer.com)

## Local development

Use Node.js 24 LTS and Python 3.13. From this repository:

```sh
npm ci
cp docs.local.example.json docs.local.json
```

Edit the ignored `docs.local.json` to point at the add-on checkouts or their separate worktrees. Paths may be absolute or relative to this repository. Only the `docs/` directory is used.

```sh
npm run docs:prepare
npm run docs:validate
npm run dev
```

Open `http://localhost:3000`.