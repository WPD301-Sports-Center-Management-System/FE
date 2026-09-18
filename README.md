# Sports Center Web

Web portal dành cho Center Manager, Receptionist và Coach.

## Cài đặt

```bash
cp .env.example .env
npm install
npm run dev
```

Web chạy tại `http://localhost:5173` và gọi API qua `VITE_API_URL`.

## Cấu trúc

```text
FE/
├── public/                   # Tài nguyên tĩnh
├── src/
│   ├── app/                  # Router và global providers
│   ├── assets/               # Ảnh/font import trong code
│   ├── features/             # Auth, Manager, Receptionist, Coach và nghiệp vụ
│   ├── layouts/              # Dashboard/auth layouts
│   ├── pages/                # Trang hệ thống như 404
│   ├── shared/
│   │   ├── api/              # Axios client và API dùng chung
│   │   ├── components/       # Button, table, modal, input
│   │   ├── hooks/            # Hooks dùng chung
│   │   ├── types/            # API response/shared types
│   │   └── utils/            # Formatter và helper thuần
│   ├── styles/               # Global CSS/Tailwind
│   └── main.tsx              # Entry point
├── .env.example              # Public runtime config; không để secret
├── vite.config.ts            # Vite plugins và alias `@`
└── package.json              # Scripts và dependencies
```

Mỗi feature dùng cấu trúc `api/`, `components/`, `hooks/`, `pages/`, `schemas/` và `types/`. Không gọi Axios trực tiếp trong component. Server state dùng TanStack Query; form state dùng React Hook Form. AI key và VNPay secret tuyệt đối không đặt trong biến `VITE_*`.

## Ownership

- Member 1: Manager pages, reports và integration review.
- Member 3: Common Web, Receptionist pages và Coach pages.
- Member 2 cung cấp Swagger/API contract.

## Scripts

| Lệnh | Chức năng |
|---|---|
| `npm run dev` | Chạy Vite dev server |
| `npm run build` | Type-check và production build |
| `npm run lint` | Chạy Oxlint |
| `npm test` | Chạy unit/component tests |
| `npm run preview` | Xem production build local |

## Ghi chú từ Vite template

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
