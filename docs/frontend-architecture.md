# Frontend architecture

SnapGIS follows Feature-Sliced Design pragmatically. Dependencies flow down this list only:

`app → pages → widgets → features → entities → shared`

## Layers

- `app`: application bootstrap, global providers, router, store, and global styles.
- `pages`: route-level composition. A page may combine multiple widgets and features.
- `widgets`: reusable, page-sized composition such as the public shell, dashboard shell, or map workbench.
- `features`: a user action or use case, such as authentication, topology healing, conversion, or measurement.
- `entities`: reusable domain models and entity UI. The map lifecycle currently lives here.
- `shared`: domain-agnostic UI primitives, utilities, assets, and infrastructure.

Each slice exposes its cross-slice contract from `index.ts`. Code inside a slice may use relative
imports, while consumers import the slice public API (for example, `@features/auth`). Shared is not
split into business slices, so imports such as `@shared/ui/button` are expected.

## Adding code

1. Put route orchestration in `pages`, not in `features`.
2. Put multi-feature visual composition in `widgets`.
3. Keep a feature focused on one user intent and expose only its supported API from `index.ts`.
4. Put generic UI and helpers in `shared`; they must not import business layers.
5. Run `pnpm fsd:check`, `pnpm typecheck`, and `pnpm test -- --run` before merging.

`scripts/check-fsd-boundaries.mjs` rejects upward dependencies and cross-slice deep imports. The
typed Redux store types and hooks are the only allowed upward integration seam. Existing API-to-API exceptions are
listed explicitly in that script; the next architectural step is extracting their shared RTK Query
base into a neutral API module and removing those exceptions.
