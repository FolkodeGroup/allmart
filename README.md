# 🛒 Allmart — E-Commerce Platform & Retail Management ERP

[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue?logo=githubactions&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20Hub%20%7C%20Linux%20VPS-2496ED?logo=docker&logoColor=white)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%207%20%7C%20TypeScript-61DAFB?logo=react&logoColor=white)](#)
[![Backend](https://img.shields.io/badge/Backend-Express%204%20%7C%20Node.js%2022-lightgrey?logo=express&logoColor=black)](#)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016%20%28UUIDv7%29%20%7C%20Prisma%207-336791?logo=postgresql&logoColor=white)](#)
[![Storage](https://img.shields.io/badge/Storage-Cloudflare%20R2%20%7C%20Sharp%20WebP-F38020?logo=cloudflare&logoColor=white)](#)
[![PDF Engine](https://img.shields.io/badge/PDF%20Engine-Puppeteer%20Headless%20Chrome-00D8A2?logo=puppeteer&logoColor=white)](#)
[![Testing](https://img.shields.io/badge/QA-Playwright%20%7C%20Vitest%20%7C%20MSW-darkgreen?logo=vitest&logoColor=white)](#)

> Enterprise Full-Stack e-commerce ecosystem and administrative ERP engineered for home decor, bazar, and retail distribution ([allmartbazar.com.ar](https://allmartbazar.com.ar)). Combines an ultra-fast B2C public storefront with an administrative back-office managing multi-attribute matrix SKUs, multi-supplier quotation with lead times and margin tracking, 4-step order pipelines with partial deposit reservations, tokenized customer review invitations, and headless vector PDF catalog compilation.
>
> 🌐 **Quick Navigation / Navegación Rápida:** [English Documentation](#-english-documentation) | [Documentación en Español](#-documentación-en-español)

---

## 🌐 English Documentation

### 1. Executive Summary & Commercial Scope
Retailers and distributors in the home goods and tableware industry face complex catalog structures (combinations of color, size, material), volatile supplier pricing, and logistics bottlenecks. Traditional platforms (such as WooCommerce or standard Shopify setups) often suffer from database slowdowns, lack multi-supplier cost tracking, and incur high recurring fees.

**Allmart** provides an end-to-end, self-hosted digital infrastructure developed by **Folkode Group**:
- **High-Conversion B2C Experience:** Sub-second page loads powered by React 19, responsive category carousels, instant WhatsApp order confirmation, and anonymous-to-authenticated cart synchronization.
- **Enterprise Management ERP:** Master-detail administration panel featuring drag-and-drop widget customization, bulk catalog imports, inline variant combination builders, and inventory audit logs.
- **Supplier & Lead Time Intelligence:** Relational multi-supplier mapping tracking purchase costs against public sale prices, supplier lead times in days/hours, real-time gross margin badges, and historical price volatility.
- **Cloud-Native Asset Pipeline:** Offloads media storage entirely to **Cloudflare R2** with automated Sharp WebP conversion and thumbnail generation, eliminating disk I/O bottlenecks.
- **Automated Verification & Post-Sale Retention:** Automated review invitation emails dispatched via SMTP with 30-day cryptographically signed JWT tokens for verified buyer feedback.

---

### 2. System Architecture & Topology

The platform separates client presentation from backend processing and media storage, utilizing modern cloud storage and isolated Docker containers:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT & CDN LAYER                                       │
│  - React 19 SPA (Vite 7, React Router v7, Recharts, Lucide Icons, CSS Modules)         │
│  - Cloudflare R2 CDN (imagenes.allmartbazar.com.ar) with dynamic resizing              │
└────────────────────────────────────────┬────────────────────────────────────────────────┘
                                         │ HTTPS / REST API
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               APPLICATION LAYER (VPS)                                   │
│  - Reverse Proxy (Nginx Alpine) routing /api and serving compiled assets               │
│  - Backend Container: Node.js 22, Express 4, TypeScript, Prisma ORM 7                   │
│  - Headless Browser: Puppeteer Chromium for high-res vector PDF catalog printing        │
│  - Scheduled Workers: Cart cleanup (14d), tag expiration, and auto-collection indexing   │
└───────────────────┬─────────────────────────────────────────────────┬───────────────────┘
                    │ pg.Pool (Max 25, KeepAlive 5s)                  │ AWS S3 SDK v3
                    ▼                                                 ▼
┌──────────────────────────────────────┐     ┌────────────────────────────────────────────┐
│      PERSISTENCE LAYER (VPS)         │     │         OBJECT STORAGE (EDGE)              │
│  - PostgreSQL 16 (Port 5434)         │     │  - Cloudflare R2 Bucket (allmart-images)   │
│  - Native UUID v7 Primary Keys       │     │  - Automated WebP optimization (Sharp)     │
│  - GIN Trigram Search Indexes        │     │  - 240px Thumbnails + 1200px Display Sizes │
│  - Immutable AuditLog Table          │     │  - Zero-egress bandwidth hosting fees      │
└──────────────────────────────────────┘     └────────────────────────────────────────────┘
```

---

### 3. Core Functional Domains

#### A. Multi-Attribute Variant & SKU Matrix
- Products support dynamic attribute definitions (`Color`, `Size`, `Material`) modeled through relational `ProductOption` and `ProductOptionValue` tables.
- Combinations generate unique children records (`ProductSku`) with independent pricing, stock balances, and dedicated variant photo galleries.
- Base product prices and stock automatically compute from the minimum active variant price and the sum of variant stock balances.

#### B. Sourcing & Supplier Intelligence
- Maps multiple suppliers to individual products (`ProductSupplier`), storing replacement costs alongside retail prices.
- Real-time gross margin calculation with visual alert badges:
  $$\text{Margin \%} = \left( \frac{\text{Sale Price} - \text{Supplier Cost}}{\text{Supplier Cost}} \right) \times 100$$
  - **Critical Alert (Red):** $\text{Margin} < 10\%$
  - **Warning Alert (Orange):** $10\% \le \text{Margin} < 15\%$
  - **Healthy (Green):** $\text{Margin} \ge 15\%$
- Lead Time monitoring in hours or days to identify fastest replenishment partners.
- Invariable price change ledger (`SupplierProductPrice`) with historical line charts.

#### C. Order Processing & 50% Deposit Pipeline
- Stepper workflow guiding operators through order fulfillment:
  $$\text{Pendiente} \longrightarrow \text{Confirmado} \longrightarrow \text{En Preparación} \longrightarrow \text{Preparado} \longrightarrow \text{Enviado} \longrightarrow \text{Entregado}$$
- **Deposit Reservation (50% Seña):** Allows retail and wholesale buyers to reserve inventory with a 50% deposit, displaying remaining balances and enabling one-touch settlement upon delivery.
- **Integrated Shipping Manager:** Stores recipient address, courier provider (OCA, Andreani, Flat Rate Express, Venue Pickup), and shipment tracking numbers.

#### D. Verified Reviews via Cryptographic Tokens
- Eliminates fake reviews by restricting ratings exclusively to verified purchasers.
- When an order transitions to `entregado`, background routines generate an invitation containing a signed JWT token (`ReviewTokenPayload`) linking the `orderId`, `productId`, and `customerEmail`.
- Reviewers submit ratings and feedback without requiring passwords; reviews display the official *Compra Verificada* badge.

---

### 4. Technical Stack Specification

| Domain | Technology / Library | Version | Role in Platform |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | React | `^19.2.0` | Reactive component tree, hooks, and DOM diffing |
| **Build Tooling** | Vite | `^7.3.1` | Instant HMR development and optimized Rollup bundling |
| **Routing** | React Router DOM | `^7.13.0` | Client-side routing, query parameters, and navigation blocker |
| **Form Management** | React Hook Form + Zod | `^7.81` / `^4.4` | Strictly typed runtime validation schemas |
| **Data Visualization**| Recharts | `^3.7.0` | Operational dashboards, margin distributions, and sales trends |
| **Document Export** | ExcelJS + jsPDF | `^4.4` / `^4.2` | Client-side XLSX spreadsheets and PDF data exports |
| **Backend Runtime** | Node.js | `>=22.12` | High-performance asynchronous execution environment |
| **Server Framework** | Express | `^4.18.2` | Modular routing pipeline, CORS, and error handlers |
| **Database & ORM** | PostgreSQL 16 + Prisma | `^7.8.0` | Relational persistence, migrations, and JS adapter pooling |
| **Media Processing** | Sharp + Cloudflare R2 | `^0.34` / `^3.1075` | On-the-fly WebP conversion, thumbnails, and S3 SDK transfer |
| **Headless Printing** | Puppeteer Chromium | `^25.0.4` | Server-side vector PDF generation for commercial catalogs |
| **Email Transport** | Nodemailer | `^8.0.7` | Transactional order receipts and tokenized review invitations |
| **Testing Suite** | Vitest + RTL + Playwright| `^4.0` / `^1.62`| Unit tests, mock service workers, and end-to-end tests |

---

### 5. Relational Data Model (Prisma ORM)

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["partialIndexes"]
}

model Product {
  id                     String                 @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  name                   String                 @db.VarChar(255)
  slug                   String                 @unique @db.VarChar(255)
  description            String?
  shortDescription       String?                @map("short_description")
  price                  Decimal                @db.Decimal(12, 2)
  rating                 Float                  @default(0)
  reviewCount            Int                    @default(0) @map("review_count")
  inStock                Boolean                @default(true) @map("in_stock")
  stock                  Int                    @default(0)
  criticalStockThreshold Int                    @default(5) @map("critical_stock_threshold")
  sku                    String?                @unique @db.VarChar(100)
  isFeatured             Boolean                @default(false) @map("is_featured")
  status                 ProductStatus          @default(active)
  primarySupplierId      String?                @map("primary_supplier_id") @db.Uuid
  createdAt              DateTime               @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt              DateTime               @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  productCategories      ProductCategory[]
  productImages          ProductImageStorage[]
  productSkus            ProductSku[]
  productSuppliers       ProductSupplier[]
  reviews                ProductReview[]
  orderItems             OrderItem[]
  cartItems              CartItem[]

  @@index([name(ops: raw("gin_trgm_ops"))], type: Gin)
  @@map("products")
}

model Order {
  id                  String               @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  customerId          String?              @map("customer_id") @db.Uuid
  customerFirstName   String               @map("customer_first_name") @db.VarChar(100)
  customerLastName    String               @map("customer_last_name") @db.VarChar(100)
  customerEmail       String               @map("customer_email") @db.VarChar(255)
  customerPhone       String?              @map("customer_phone") @db.VarChar(30)
  total               Decimal              @default(0) @db.Decimal(12, 2)
  status              OrderStatus          @default(pendiente)
  paymentStatus       PaymentStatus        @default(no_abonado) @map("payment_status")
  paidAt              DateTime?            @map("paid_at") @db.Timestamptz(6)
  has50PercentDeposit Boolean              @default(false) @map("has_50_percent_deposit")
  notes               String?
  createdAt           DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime             @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  orderItems          OrderItem[]
  orderStatusHistory  OrderStatusHistory[]
  shipment            Shipment?

  @@map("orders")
}

model ProductSupplier {
  id            String   @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  productId     String   @map("product_id") @db.Uuid
  supplierId    String   @map("supplier_id") @db.Uuid
  currentPrice  Decimal  @map("current_price") @db.Decimal(12, 2)
  cost          Decimal? @db.Decimal(12, 2)
  leadTimeValue Int?     @default(3) @map("lead_time_value")
  leadTimeUnit  String?  @default("dias") @map("lead_time_unit") @db.VarChar(20)
  isActive      Boolean  @default(true) @map("is_active")

  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  supplier      Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)

  @@unique([productId, supplierId])
  @@map("product_suppliers")
}
```

---

### 6. DevOps, CI/CD & Deployment Topology

The system deploys continuously to an Ubuntu Linux VPS via automated GitHub Actions:

- **Security Gate (`security-scan`):** Scans pull requests for leaked credentials using GitGuardian (`ggshield`).
- **Compilation & Validation (`build-and-test`):** Validates TypeScript compilation across frontend/backend, runs Vitest unit tests, and verifies Prisma client generation.
- **Container Registry Push (`docker-build-push`):** Builds multi-stage Docker images (`allmart-backend`, `allmart-frontend`) and pushes tagged builds to Docker Hub (`dgimenezdeveloper`).
- **Automated VPS Deployment (`deploy`):**
  - Connects via SSH (`appleboy/ssh-action`) to VPS host `168.197.49.120`.
  - Executes database backup before container updates (`pg_dump` compressed into `/opt/allmart/backups/`).
  - Pulls updated images and runs Prisma database migrations (`npx prisma migrate deploy`).
  - Swaps running containers with zero customer downtime.

---

### 7. Local Setup & Quick Start

#### Prerequisites
- Node.js 22+ and npm installed.
- PostgreSQL 16 instance running locally or via Docker.
- (Optional) Cloudflare R2 credentials for cloud image uploads.

#### Local Development Execution
```bash
# 1. Clone the repository
git clone https://github.com/dgimenezdeveloper/allmart.git
cd allmart

# 2. Start PostgreSQL via Docker (if not installed natively)
docker run --name allmart_postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=devpassword123 -e POSTGRES_DB=allmart_db -p 5432:5432 -d postgres:16-alpine

# 3. Configure Backend
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run seed              # Seeds admin (admin@admin.com / Admin2026!) and editor accounts
npm run dev               # Starts Express on http://localhost:3001

# 4. Configure Frontend (in a separate terminal)
cd ../frontend
npm install
npm run dev               # Starts Vite SPA on http://localhost:5173
```

---

## 🇪🇸 Documentación en Español

### 1. Resumen Ejecutivo y Alcance Comercial
Comercios, bazares y distribuidores mayoristas de artículos del hogar enfrentan desafíos constantes: catálogos con múltiples combinaciones de producto (color, tamaño, modelo), fluctuaciones de precios de proveedores y demoras logísticas.

**Allmart** es una plataforma integral desarrollada por **Folkode Group** que unifica tienda en línea y panel ERP administrativo:
- **Tienda B2C de Alto Rendimiento:** Carga veloz con React 19, navegación por subcategorías, checkout directo con resumen para WhatsApp y sincronización reactiva del carrito.
- **Panel Administrativo ERP:** Diseño master-detail con widgets personalizables, edición masiva, gestión de variantes por combinación (SKU), alertas de stock y auditoría inmutable de acciones.
- **Control Inteligente de Proveedores y Márgenes:** Registro de múltiples proveedores por producto, comparación de costos de compra vs. precio de venta, tiempos de entrega (*lead time*) y alertas visuales de margen comercial.
- **Almacenamiento en Cloudflare R2:** Procesamiento automático con Sharp a formato WebP (versión original y miniaturas de 240px), alojadas en R2 sin costos de transferencia saliente.
- **Opiniones de Compra Verificada:** Sistema de invitaciones por correo electrónico mediante tokens JWT válidos por 30 días para recopilar reseñas auténticas de compradores reales.

---

### 2. Módulos Funcionales Clave

1. **Gestión de Variantes y Matriz de SKUs:** Opciones relacionales (`Color`, `Tamaño`) que generan SKUs independientes con precio, stock e imágenes propias.
2. **Matriz de Suministro y Márgenes:** Semáforo de rentabilidad en tiempo real (Rojo $< 10\%$, Naranja $10\%-15\%$, Verde $\ge 15\%$) y cálculo de tiempos de reposición.
3. **Flujo de Pedidos con Seña del 50%:** Pipeline guiado de 6 etapas que permite reservar stock con el 50% del pago y liquidar el saldo restante en la entrega.
4. **Catálogos y Reportes en PDF con Puppeteer:** Compilación automatizada de catálogos comerciales vectoriales de alta resolución listos para enviar por WhatsApp.
5. **Gobernanza y Despliegue Automatizado:** Integración Continua con GitHub Actions, escaneo de secretos con GitGuardian, compilación a Docker Hub y despliegue automatizado en VPS Linux con backups de base de datos previos a cada actualización.

---

### 3. Puesta en Marcha Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/dgimenezdeveloper/allmart.git
cd allmart

# 2. Levantar Backend
cd backend
npm install
npx prisma migrate dev
npm run seed
npm run dev

# 3. Levantar Frontend (otra terminal)
cd ../frontend
npm install
npm run dev
```

---

## 👥 Engineering & Leadership Team

- **Darío Giménez** — *Full-Stack Software Engineer, DevOps & Lead Architect*  
  [GitHub](https://github.com/dgimenezdeveloper) • [LinkedIn](https://www.linkedin.com/in/daseg/) • [Portfolio](https://portafolio-daseg.vercel.app/)
- **Folkode Group** — *Collaborative Software Factory*  
  [Folkode Group GitHub](https://github.com/FolkodeGroup) • [Website](https://folkode.com.ar)

---

## 📄 License
This project is licensed under the **ISC License**. See package manifest for details.
