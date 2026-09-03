# React + TypeScript + Vite

## SnapGIS authentication

Set the backend base URL in a local environment file:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_TOPOLOGY_API_URL=http://localhost:3000/api
```

The client sends `POST /auth/login` with `{ phone, password }` and
`POST /auth/register` with `{ name, phone, password }`. Both endpoints should return either the
following object directly or wrapped in a `data` property:

```json
{
  "accessToken": "token",
  "refreshToken": "optional-refresh-token",
  "user": {
    "id": "user-id",
    "name": "User name",
    "phone": "09123456789",
    "roles": ["user"]
  }
}
```

Successful authentication is persisted in the browser and grants access to `/dashboard`. The
dashboard logout action clears the stored session.

## SnapGIS healing lifecycle

After dry-run analysis, the topology panel submits `POST /heal/:jobId` and
polls `GET /heal/:jobId` while the worker is queued or processing. Progress is
shown in the panel. When the worker completes, the client fetches
`GET /heal/:jobId/output`, replaces the original map preview with the healed
GeoJSON, displays a completion notice, and enables the attachment download at
`GET /heal/:jobId/download`.

Both API variables default to `http://localhost:3000/api` when they are not set.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactDom from "eslint-plugin-react-dom";
import reactX from "eslint-plugin-react-x";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
