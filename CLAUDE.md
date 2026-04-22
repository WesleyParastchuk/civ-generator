# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # run ESLint
```

No test suite is configured yet.

## Stack

- **Next.js 16** with App Router, TypeScript, React 19
- **Tailwind CSS v4** (`@import "tailwindcss"` syntax — no `tailwind.config.js`)
- **lucide-react** for icons
- **Google Fonts**: Cinzel (`--font-cinzel`, display/headings) and Source Sans 3 (`--font-source-sans`, body)

## Architecture

This is a single-page app (currently just the home/lobby screen) for randomizing Civilization VI matches.

```
app/
  layout.tsx     — root layout: font CSS variables, metadata, lang="pt-BR"
  page.tsx       — home route, renders <HeroPanel>
  globals.css    — all global styles and design system utility classes

components/home/
  HeroPanel.tsx       — "use client" container: nickname form + layout with decorative columns
  OptionsPreview.tsx  — "use client" game options panel: turns/points-per-turn controls
  StartButton.tsx     — submit button (server component)
```

## Design System

All reusable visual styles are hand-rolled CSS classes in `globals.css` — there are no third-party UI components. The palette is gold-on-dark-blue (Civ VI aesthetic):

- CSS custom properties: `--civ-blue-*`, `--civ-gold-*`, `--civ-bronze-*`
- Utility classes: `.game-card`, `.game-panel-intro`, `.game-control-button`, `.game-text-input`, `.game-number-input`, `.game-summary-panel`
- Decorative elements: `.greek-column` (hidden below 1260 px), `.page-ornament`, `.grain-overlay`, `.imperial-border`
- Inline Tailwind is used for layout and spacing; the named classes above are used for themed interactive elements.

All user-facing text is in Brazilian Portuguese.
