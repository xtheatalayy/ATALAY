# Dashboard kit (`@/components/viz`)

The app has the house dashboard runtime (abacus-viz on Apache ECharts): the same kit DeepAgent uses for its
one-off dashboards, as a React component. Every dashboard / analytics / report page is built with it; Recharts
and Plotly are not used on those pages.

```tsx
'use client';
import { AbacusDashboard, useDashboardData } from '@/components/viz/abacus-dashboard';
import { manifest } from '@/lib/dashboard-manifest';          // a VizManifest object, see the reference below

export default function DashboardPage() {
  const { data, dataAsOf, error } = useDashboardData('/api/dashboard', 60_000);  // re-fetches every 60 s
  return <AbacusDashboard manifest={manifest} data={data} dataAsOf={dataAsOf} className="min-h-screen" />;
}
```

- `app/api/dashboard/route.ts` returns `{ data_as_of: ISO string, data: { <data key>: rows[] } }` with one
  entry per distinct `tile.data` key (aggregate with Prisma `groupBy` / raw SQL, or compute from seeded rows;
  `export const dynamic = 'force-dynamic'`). Rows are flat objects; kpi ≤ 50 rows, table ≤ 500, charts ≤ 2000.
- Each data key is shaped for its tile, at the tile's grain: a ranking (`bar`, `lollipop`) gets one row per
  category, already summed across everything the tile does not split by (a "churn by reason" lollipop has one
  row per reason, not one per reason × region); a trend (`area`) gets one row per period with a field per
  series; a `kpi` row carries its own `delta` and `spark`. Do the aggregation in the route — the kit plots rows
  as given and never merges duplicates. Rows that a manifest `filters` tab slices must carry the filter field
  (e.g. `region`) and include the "All" rows explicitly. Months are a time series, never horizontal bars.
- `<AbacusDashboard>` mounts the runtime inside the page (filters, drawers, themes included); when `data` changes
  only the tiles whose rows changed re-render, so polling is cheap. One dashboard per page; a dashboard with more
  than ~8 tiles beyond the kpi strip, or several topics, uses `sections` (collapsible groups + a sticky jump strip)
  rather than one long scroll — split into separate pages only when the brief asks for them.
- Theme: `manifest.theme` — `app` is the default for a dashboard inside an app: the kit reads the app's shadcn
  tokens (`--background`, `--card`, `--primary`, `--chart-2/3`, `--border`, `--radius`, the page font), so the page
  wears the app's own palette and follows its dark mode. Use `midnight` / `clean` / `journal` only when the dashboard
  should deliberately look different from the app; `editorial` (warm paper, serif) only when the subject asks for
  it. The kit never writes the app's tokens. The root paints its own canvas edge to edge, so give it the full
  content width (no padding or max-width wrapper around it).
- The page around it stays quiet: the app shell (sidebar, header) and nothing else — no extra cards, glass,
  gradients, particles or count-up wrappers around the dashboard; the kit owns the hierarchy. Filters are the
  manifest's tabs; if the brief needs a server-side control (date range, account picker), put it in the page
  header and pass it to the route as a query parameter.
- `components/viz/examples/saas_revenue.json` is a complete manifest at the quality bar — read it before writing
  yours. In the reference below, `data/<key>.json` means the `<key>` entry of the route's `data` object; `query`
  is optional text shown in the tile's "View query" drawer (the SQL / Prisma call behind the rows).

# dashboard.json reference
Top level: `title` (the headline insight, a full sentence with the number in it — never "Sales Dashboard"),
`eyebrow` (who/what/when, e.g. "Acme · Q3 2026 business review"), `subtitle` (one sentence on scope and how to
read it), `data_as_of` (ISO 8601), `theme` (`clean` default — cool-grey canvas, white tiles, one blue accent, sans
type; `midnight` — dark; `journal` — flat white, condensed grotesk; `editorial` — warm paper, serif titles, only
when the subject asks for it; `app` — inside an app page only: the app's own palette and dark mode; the kit
applies it, a `?theme=` URL param overrides), `sources[]` (`{id,label}`; add `database_connector_id` when the rows came from `query_connector` — the dashboard pane's Refresh re-runs that tile's `queries/<tile>.sql` through it as the viewer), `filters[]`, `colors` (optional
`{category: token}` — the same category keeps the same colour on every tile; tokens: `accent`, `accent-2`,
`accent-3`, `pos`, `neg`, `ink`), `sections[]` (optional, see below), `refresh` (optional, see the data plan:
`{mode, every_hours}`), `asks[]` (the checklist, see Accuracy), `tiles[]`.

Sections (`sections: [{id, title, subtitle?, tiles:[tile ids], collapsed?: bool}]`): tiles grouped under a
collapsible heading; with two or more sections the kit adds a sticky jump strip. Tiles in no section (the kpi
strip) render first, above the sections. Use them whenever a dashboard goes past ~8 tiles beyond the kpi strip
or the brief lists distinct topics (overview / sales / operations): the reader jumps to a section instead of
scrolling one long page. Start deep-dive sections `collapsed: true`; the headline sections open.

Filters (v1: `type: "tabs"` only, client-side over the snapshot): `{id, type:"tabs", label, field, options:[
"All", ...], default:"All", applies_to:[tile ids]}`. A tile is filtered on `field` only when its rows carry
that field. Pre-aggregated tiles (kpi, area, heatmap) must ship one row set per option INCLUDING an `"All"`
row set; per-entity tiles (beeswarm, bubble, dots, lollipop, table) just carry the field on each row.
A filter must read as working from the top of the page: give every kpi tile a `where` on the filter field
(the kit dims the kpis of the other options) and put only tiles that stay full under EVERY option in
`applies_to` — a bar chart that compares the options collapses to one bar, a status table to one row; leave
those out of `applies_to` or re-aggregate them per option (a per-day trend, a breakdown by another field).

Common tile fields: `id`, `type`, `span` (12-col grid: kpi 3, hero 8+4 or 7+5, pairs 6+6), `title` (what it
shows), `subtitle` (scope line: period, segment, unit), `insight` (one sentence stating the answer — required on
every non-kpi tile), `data` (data key → `data/<key>.json`), `where` (optional `{field: value}` row filter),
`source` (source id), `query` (`queries/<tile>.sql|.py` path, or the literal query), `format` (`currency_compact`
| `integer` | `percent` | `percent_delta` | `number`) or `unit` (e.g. `"$M"`, `"ms"`).

Tile types and their fields (the kit renders these; anything else falls back to a table):
- `kpi` — rows `{label, value, format, delta, delta_label, spark:[...], good_when:"up"|"down"}` (+ filter
  field). Tile `accent` (`accent`|`accent-2`|`accent-3`|`neg`|`pos`) colours the number; `icon` adds a tinted
  scorecard chip top-right (one of `users`, `user`, `dollar`, `trending-up`, `trending-down`, `cart`, `activity`,
  `clock`, `check`, `alert`, `target`, `star`, `box`, `mail`, `globe`, `bolt`, `percent`, `heart`, `calendar`,
  `chart`). Use `where` to pick one metric row set per tile; a 4-kpi strip is the standard opener.
- `ring` — one share as a gauge with the number in the middle: rows `[{label, value}]` (`value` 0..1, or set
  `max` to a number / field), tile `target`, `accent`. Completion, utilisation, attainment, a single rate.
- `donut` — part-of-whole: `category`, `value`, `limit` (≤ 5 slices, the rest folded into "Other"), `center`
  (text in the middle; default the total), `center_label`. Legend with value and share beside the ring.
- `progress` — ranked rows, each a label, a bar and the value: `category`, `value`, `max` (number, field, or the
  largest row), `target` (number or field, drawn as a mark), `limit`, `color` (field for semantic colour).
  Attainment per rep / region, capacity, budget used, anything "how far along".
- `steps` — stages on a line in row order (a numbered dot, the stage name, its value): `category`, `value`,
  `sub` (small text under the value), `status` (field: done / current / pending) or `current` (a stage name).
  Order flow, onboarding journey, project phases, a pipeline read left to right.
- `area` — `x` (time field, `YYYY-MM` or `YYYY-MM-DD`), `series:[{field,label}]`, `stacked`, `end_values`
  (labels at the line ends instead of a legend), `annotations:[{x,label}]`, `bands:[{from,to,label}]`.
- `bar` — `category`, `value`, `sort` (`desc`), `signed` (diverging +/−). Horizontal, values on bars.
- `lollipop` — `category`, `value`, `color` (field for semantic colour), `limit` (top-N each side). Diverging stems.
- `beeswarm` — one dot per row: `category`, `value`, `color`, `sub`, `scale:"log"|"linear"`, `label_top` (N),
  `radius`, `ticks:[...]`.
- `bubble` — `category`, `x`, `y`, `size`, `color`, `x_label/y_label/size_label`, `x_format/y_format/size_format`,
  `label_top`. Median guides drawn automatically.
- `dots` — unit chart: `category`, `group` (column field), `groups:[order]`, `color` (field), `color_order:[...]`.
- `slope` — `category`, `period`, `periods:[a,b]`, `value`. Declines drawn dashed in the negative colour.
- `heatmap` — `x`, `y`, `value`, `format`, `x_label`, `y_label`, `min`, `max`. In-cell numbers.
- `funnel` — `category` (stage name only), `value`. The kit prints the count, share of the first stage and
  step conversion on each stage — never bake numbers or percentages into the stage name.
- `table` — `columns:[{field,label,format,bar:true}]`, `sort:{field,dir}` (initial; headers are click-sortable).
  Inline bars; `format:"status"` renders a pill whose tone (green `healthy` / amber `watch` / red `at-risk`) is
  inferred from the label, or set per value with `status_map:{"at_risk":{"tone":"watch","label":"At risk"}}`.
- `small_multiples` — `facet`, `x`, `value`, `reference:{value,label}`. Linked hover.
Read the two closest manifests in `kit/examples/` before planning — they are the quality bar and show real field usage.

# Chart grammar (enforced)
Data shape → tile: time series → `area` (stacked only for part-of-whole); ranking → sorted `bar`/`lollipop`;
two-period change → `slope`; **one row per entity** (customers, stations, SKUs, reps) → show the entities with
`beeswarm` / `bubble` / `dots` / `lollipop`, never a bar of their sum; cohort / matrix → `heatmap`; staged
conversion → `funnel`; staged journey / phases → `steps`; several comparable series → `small_multiples`; lists
people will scan → `table`; part-of-whole with ≤ 5 parts → `donut` (more parts → sorted `bar`); one rate or
completion → `ring`; attainment / "how far along" per row → `progress`.
Hard bans: pies and donuts with more than 5 slices or for ranking, 3-D, dual y-axes, legends when end-labels fit,
more than 8 tiles beyond the kpi strip on one unsectioned page (group into `sections`, or follow the user's
explicit list), more than one accent per tile, raw unformatted numbers, bar axes that do not start at 0,
lorem/placeholder data, "Dashboard" as a title. Every tile answers one question, stated in its `insight`. One
hero tile (`span` ≥ 7) per dashboard.
Composition: the dashboard is one argument told in 5-8 tiles — kpi strip (the headline numbers) → hero
(the trend behind the headline) → the breakdowns that explain it → the entities that drive it.
