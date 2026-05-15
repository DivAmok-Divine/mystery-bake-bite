# Mystery Bake Bite Backend (Shared)

This workspace serves as the **Shared Source of Truth** for the entire Mystery Bake Bite ecosystem. It contains non-UI logic that is shared between the Management System and the Website App.

## 📂 Contents

- **`lib/db.ts`**: The Dexie.js database configuration and schema definitions. All IndexedDB tables are defined here.
- **`lib/hooks.ts`**: Shared React hooks for data fetching and mutations (useOrders, useProducts, etc.).
- **`lib/utils.ts`**: Common utility functions (formatting, validation, etc.).

## 🔗 Usage in Frontends

This package is linked to frontends via the `@backend` path alias. 

Example import:
```tsx
import { db } from '@backend/lib/db'
import { useProducts } from '@backend/lib/hooks'
```

## ⚙️ Configuration

This workspace has its own `package.json` and `tsconfig.json` to handle dependencies (like `dexie` and `react`) and provide correct type definitions to the consuming apps.
