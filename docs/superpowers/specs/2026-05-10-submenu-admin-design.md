# Sub-menu + Admin Panel Design

**Goal:** Add paged sub-menus to tool keys 4–8 and a `/mapa/admin` page for editing labels, colors, icons, and flat yields for all map items.

**Architecture:** Config Overlay pattern — hardcoded TypeScript values remain as defaults; `ConfigStore` (localStorage) holds overrides merged at read time. No rewrite of domain OOP layer.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, localStorage.

---

## 1. ConfigStore (`lib/civ/ConfigStore.ts`)

Singleton class backed by `localStorage` key `"civ-config"`.

### Schema

```typescript
interface ItemConfig {
  label?: string;
  color?: string;
  icon?: string;           // base64 data URL (starts with "data:") or single emoji char
  yields?: {
    food?: number;
    production?: number;
    science?: number;
    gold?: number;
    culture?: number;
    faith?: number;
    housing?: number;
    amenities?: number;
    appeal?: number;
  };
}

interface AppConfig {
  terrain:  Partial<Record<Terrain,      ItemConfig>>;
  feature:  Partial<Record<Feature,      ItemConfig>>;
  resource: Partial<Record<Resource,     ItemConfig>>;
  district: Partial<Record<DistrictType, ItemConfig>>;
  wonder:   Partial<Record<WonderType,   ItemConfig>>;
}
```

### API

```typescript
class ConfigStore {
  static get(): AppConfig                                          // full config
  static getItem(cat, key): ItemConfig                           // single item override (may be {})
  static setItem(cat, key, patch: Partial<ItemConfig>): void     // merge patch into item
  static resetItem(cat, key): void                               // remove all overrides for item
  static subscribe(listener: () => void): () => void             // for React re-renders
}
```

`get()` reads localStorage, parses JSON, returns merged AppConfig (missing keys return `{}`).  
`setItem` merges patch into existing item config and saves.  
`subscribe` allows React components to re-render when config changes (simple Set of listeners, called after every write).

---

## 2. Domain Layer Read Points

Four files get small patches to read from ConfigStore before falling back to defaults. No structural changes.

### `lib/civ/HexTile.ts`

`getBaseStats()` currently reads `TERRAIN_BASE[terrain]`, `FEATURE_BASE[feature]`, `RESOURCE_BASE[resource]`. After patch:

```typescript
function mergeYields(base: Stats, override: ItemConfig['yields']): Stats {
  if (!override) return base;
  return Stats.of({
    food:       override.food       ?? base.food,
    production: override.production ?? base.production,
    science:    override.science    ?? base.science,
    gold:       override.gold       ?? base.gold,
    culture:    override.culture    ?? base.culture,
    faith:      override.faith      ?? base.faith,
    housing:    override.housing    ?? base.housing,
    amenities:  override.amenities  ?? base.amenities,
    appeal:     override.appeal     ?? base.appeal,
  });
}
```

Called in `getBaseStats()` for terrain, feature, and resource lookups.

### `lib/civ/types.ts`

`TERRAIN_COLORS` and `TERRAIN_LABEL` become functions `getTerrainColor(t)` / `getTerrainLabel(t)` that check ConfigStore first. All callers (`HexCanvas`, `StatsPanel`, `HexTile`) updated.

### `lib/civ/Wonder.ts`

`getEffect()` merges `WONDER_DATA[type].effect` with `ConfigStore.getItem('wonder', type).yields`.

### `lib/civ/District.ts`

`DISTRICT_META` color and name fields readable via ConfigStore. Flat base stat override applies to `getEffect()` (added on top of adjacency bonus). Adjacency bonus logic stays hardcoded.

---

## 3. Sub-menu System

### State (`app/mapa/MapEditor.tsx`)

```typescript
const [subMenu, setSubMenu] = useState<{ toolId: ToolId; page: number } | null>(null);
```

### Tools with sub-menus

| Key | ToolId   | Sub-options source             | Count |
|-----|----------|-------------------------------|-------|
| 4   | Terrain  | all Terrain values except Fog  | 13    |
| 5   | Feature  | all Feature values except None | 7     |
| 6   | Resource | all Resource values except None| 37    |
| 7   | District | all DistrictType values        | 15    |
| 8   | Wonder   | all WonderType values          | 17    |

Tools 1 (Select), 2 (Pan), 3 (Fog), 9 (River), 0 (Erase) have no sub-menu.

### Keyboard logic (in `MapEditor` `onKey` handler)

```
key '4'–'8':
  if subMenu open for same tool → close
  else → open subMenu for that tool, page 0; activate tool with current/default payload

key '1'–'9' while subMenu open:
  index = (page * 9) + (parseInt(key) - 1)
  if item at index exists → select it as payload; close subMenu

key 'Tab' or '.':
  if subMenu open → advance page (clamp to last page)

key ',':
  if subMenu open → retreat page (clamp to 0)

key 'Escape':
  close subMenu
```

### `app/mapa/SubMenu.tsx`

Props:
```typescript
interface Props {
  toolId: ToolId;
  page: number;
  onSelect: (payload: Terrain | Feature | Resource | DistrictType | WonderType) => void;
  onPageChange: (page: number) => void;
  onClose: () => void;
}
```

- Renders as `position: absolute`, centered below toolbar (`top: 72px`)
- Shows up to 9 items in a grid (3×3 or flex-wrap)
- Each item: number badge, icon (base64 img or color swatch or emoji), label from ConfigStore
- Pagination footer: `< N/M >` with click handlers
- Click outside → close

### `app/mapa/subMenuItems.ts`

Helper returning `SubMenuItem[]` for a given `ToolId`:

```typescript
interface SubMenuItem {
  key: string;         // enum value (e.g. 'grassland')
  label: string;       // from ConfigStore || default label
  color: string;       // from ConfigStore || default color
  icon?: string;       // from ConfigStore (base64/emoji), may be undefined
  payload: Terrain | Feature | Resource | DistrictType | WonderType;
}

function getSubMenuItems(toolId: ToolId): SubMenuItem[]
```

---

## 4. Admin Page (`app/mapa/admin/`)

### Route: `/mapa/admin`

Server component `page.tsx` renders `AdminEditor` client component.

### Layout

Three-column layout (sidebar + list + editor):

```
┌─────────────┬──────────────────┬─────────────────────────┐
│  Categorias │  Lista de itens  │  Editor do item          │
│             │                  │                          │
│ ▶ Terreno   │  ■ Planície...   │  Label: [_____________]  │
│   Feature   │    Oceano        │  Cor:   [█ #1a3a5c    ]  │
│   Recurso   │    Costa  ...    │  Ícone: [Enviar] [👁]   │
│   Distrito  │                  │                          │
│   Maravilha │                  │  Yields (vazio = padrão) │
│             │                  │  Comida:    [___]        │
│             │                  │  Produção:  [___]        │
│             │                  │  Ciência:   [___]        │
│             │                  │  Ouro:      [___]        │
│             │                  │  Cultura:   [___]        │
│             │                  │  Fé:        [___]        │
│             │                  │  Moradia:   [___]        │
│             │                  │  Comod.:    [___]        │
│             │                  │  Atrat.:    [___]        │
│             │                  │                          │
│             │                  │  [Salvar]  [Resetar]     │
└─────────────┴──────────────────┴─────────────────────────┘
```

Header bar with `← Voltar ao Mapa` link.

### Files

```
app/mapa/admin/
  page.tsx              — server component, metadata, renders AdminEditor
  AdminEditor.tsx       — 'use client', full 3-column layout, state management
  CategoryList.tsx      — left sidebar: 5 category buttons
  ItemList.tsx          — middle: list of items for active category with color/icon preview
  ItemEditor.tsx        — right: form for label, color, icon upload, yield inputs
```

### `ItemEditor` behavior

- **Label**: text input, placeholder = hardcoded default label
- **Color**: `<input type="color">` + hex text input, placeholder = default color
- **Icon upload**: `<input type="file" accept="image/*,text/plain">` → FileReader → base64; text input for emoji (single char); preview `<img>` or char display; clear button
- **Yields**: 9 number inputs (step=0.5 for floats, step=1 for housing/amenities/appeal); placeholder shows hardcoded default value; empty = no override
- **Salvar**: calls `ConfigStore.setItem(category, key, patch)`, shows toast "Salvo"
- **Resetar**: calls `ConfigStore.resetItem(category, key)`, clears form to defaults, shows toast "Resetado"

### District note

Yield inputs for districts edit a flat base stat override. The label in the editor clarifies: "Bônus de adjacência permanece fixo pelo sistema."

---

## 5. Files Changed / Created

### Created
- `lib/civ/ConfigStore.ts`
- `app/mapa/SubMenu.tsx`
- `app/mapa/subMenuItems.ts`
- `app/mapa/admin/page.tsx`
- `app/mapa/admin/AdminEditor.tsx`
- `app/mapa/admin/CategoryList.tsx`
- `app/mapa/admin/ItemList.tsx`
- `app/mapa/admin/ItemEditor.tsx`

### Modified
- `lib/civ/HexTile.ts` — `getBaseStats()` reads ConfigStore yields
- `lib/civ/types.ts` — `TERRAIN_COLORS`/`TERRAIN_LABEL` become getter functions
- `lib/civ/Wonder.ts` — `getEffect()` merges ConfigStore yields
- `lib/civ/District.ts` — `getEffect()` adds ConfigStore flat stat override; name/color from ConfigStore
- `app/mapa/MapEditor.tsx` — sub-menu state + keyboard handler additions
- `app/mapa/HexCanvas.tsx` — use `getTerrainColor()` instead of `TERRAIN_COLORS`
- `app/mapa/StatsPanel.tsx` — use `getTerrainLabel()` instead of `TERRAIN_LABEL`

---

## 6. Out of Scope

- Adjacency bonus rules (Campus +1 mountain etc.) — stays hardcoded, not editable
- Multi-user sync or server persistence — localStorage only
- Adding/removing enum values (new terrain types etc.) — admin edits existing items only
- Import/export of config as file — future enhancement
