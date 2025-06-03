# nwPlus Admin

For development:

```bash
pnpm install
pnpm dev
```


## Styling, Formatting, & Linting

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The following scripts are available:


```bash
pnpm format # formats styles
pnpm format:imports # formats imports only
pnpm lint # performs lint check
pnpm lint:write # makes safe changes
pnpm lint:write:unsafe # makes unsafe changes
pnpm check
```

**Notes**
- Install the Biome Toolchain extension to VSCode for auto-formatting
- Format on save after adding imports to a file may bug out; just undo and re-save
- To address TailwindCSS class ordering lint errors, run `pnpm lint:write:unsafe`


## Routing & Directory Structure
This project uses [TanStack Router](https://tanstack.com/router) using file-based routing. The routes are managed as files in `src/routes`. Quick refresher:
- Routes are files: `src/routes/nugget.tsx` will be accessible at the `/nugget` URL 
- `$` at the beginning of a file or folder means it's a URL parameter (see: `$hackathonId`)
- `/[folder]/index.tsx` appears as `/[folder]` in the URL (e.x. `_auth/index.tsx` appears as `/` URL)
- `_` appended means it's a routing group, and won't appear in the URL (see: `_auth/`)

```
src/
├── components/
│   ├── features/       <- Components relevant to specific features (e.g. auth, evaluator, faq, etc.)
│   ├── graphy/         <- Typography and icons (in tsx to preserve `currentColor` value)
│   ├── layout/         <- Components related to screen layouts (e.g. sidebar)
│   └── ui/             <- UI components (mainly shadcn)
├── hooks/              <- Custom react hooks
├── lib/                <- Re-usable helper functions
│   ├── firebase/
│   └── utils.ts
├── providers/          <- React context providers
├── routes/             <- Tanstack routing
│   ├── _auth/
│   │   ├── hackathons/
│   │   │   └── $hackathonId/
│   │   │       ├── application.tsx
│   │   │       ├── index.tsx
│   │   │       ├── schedule.tsx
│   │   │       └── sponsors.tsx
│   │   ├── evaluator.tsx
│   │   ├── factotum.tsx
│   │   ├── faq.tsx
│   │   ├── index.tsx
│   │   ├── query.tsx
│   │   └── route.tsx
│   ├── __root.tsx
│   └── signin.tsx
├── services/           <- Contained business logic, typically for calling external services
├── main.tsx
├── routeTree.gen.ts
└── styles.css
```

# Development

## Structure

The project has to main branches:

- `main` - Deployed production site
- `dev` - Feature PRs will be merged here

## Process

1. Create a feature branch
```bash
git checkout dev
git pull origin dev

git checkout -b name/feature
```

2. Work on your feature

- For faster reviews and to minimize bugs, keep your branch focused on a specific feature

```bash
git add .
# or to pick hunks
git add -p

git commit -m "Descriptive commit"

git push -u origin name/feature
```

3. Submit PR to `dev` branch

- Request review
- Merge once approved!

All set!
