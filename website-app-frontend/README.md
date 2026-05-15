# Mystery Bake Bite Website App

This is the customer-facing frontend for Mystery Bake Bite. It allows users to view products, explore the menu, and interact with the bakery.

## 🏗 Architecture

- **Framework**: React (Vite)
- **State/Data**: Uses the shared `@backend` layer to communicate with the same IndexedDB as the management system.
- **Styling**: Standard Vanilla CSS / Tailwind CSS following the brand guidelines.

## 🚀 Development

To start the website app:

```bash
npm run dev
```

## 🔗 Connection to Backend

Imports from the shared backend should use the alias:
```tsx
import { ... } from '@backend/...'
```

This ensures that any changes to the database schema in the root `/backend` folder are immediately reflected here.
