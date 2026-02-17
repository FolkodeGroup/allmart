# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
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
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# CI/CD con GitHub Actions

Este proyecto utiliza un pipeline de Integración y Despliegue Continuo (CI/CD) configurado con **GitHub Actions**. El flujo automatiza la ejecución de pruebas, el build y el despliegue a entornos de staging o producción.

## Flujo del pipeline

1. **Ejecución automática**: Cada push o pull request a las ramas `main`, `develop`, `staging` o `production` dispara el pipeline.
2. **Instalación de dependencias**: Se ejecuta `npm ci` para instalar dependencias de forma limpia.
3. **Pruebas automáticas**: Se ejecutan los tests con `npm test`.
4. **Build**: Se construye el proyecto con `npm run build`.
5. **Despliegue**: Si el push es a `staging` o `production`, se ejecuta un paso de despliegue (actualmente simulado, modificar según tu entorno real).

El workflow está definido en `.github/workflows/ci-cd.yml`.

### Ejemplo de archivo de workflow

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [ main, develop, staging, production ]
  pull_request:
    branches: [ main, develop, staging, production ]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm ci
      - run: npm test
      - run: npm run build
  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/production' || github.ref == 'refs/heads/staging'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm ci
      - run: npm run build
      - run: echo "Desplegando a ${{ github.ref }}... (simulación)"
```

## Personalización del despliegue

- Para un despliegue real, reemplaza el paso de `echo` por comandos de tu proveedor (Vercel, Netlify, FTP, etc).
- Puedes agregar secretos en la configuración del repositorio para manejar credenciales.
