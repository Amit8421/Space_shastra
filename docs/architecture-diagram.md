# Space Shastra Interiors - Architecture Diagram

This diagram describes the application architecture from browser to database and deployment automation.

```mermaid
flowchart LR
  subgraph ClientLayer["Client Layer"]
    Browser["Browser UI"]
    PrintPdf["Browser print / Save as PDF"]
  end

  subgraph NextLayer["Next.js App on Vercel"]
    AppRouter["App Router pages"]
    ServerComponents["Server-rendered dashboard"]
    ClientComponents["Client React pages and forms"]
    ApiRoutes["API routes"]
    Middleware["Authentication middleware"]
    StaticAssets["Static assets: logo, QR code"]
  end

  subgraph DomainLayer["Business Logic"]
    AuthLogic["Password login and signed session token"]
    QuotationLogic["Quotation create, edit, copy, import, final report"]
    FinanceLogic["Receivables, payments, balances, dashboard totals"]
    VendorLogic["Vendor accounts, entries, furniture item sync"]
    ReportLogic["Quotation PDF-ready report and project account report"]
  end

  subgraph DataLayer["Data Layer"]
    Prisma["Prisma Client"]
    Postgres["Supabase PostgreSQL"]
  end

  subgraph DeploymentLayer["Deployment"]
    LocalDev["Local development"]
    Git["Git commit and push"]
    GitHub["GitHub main branch"]
    VercelBuild["Vercel build cache and production deploy"]
    Env["Vercel env vars"]
  end

  Browser --> AppRouter
  Browser --> ClientComponents
  Browser --> PrintPdf
  PrintPdf --> ReportLogic

  AppRouter --> ServerComponents
  AppRouter --> Middleware
  ClientComponents --> ApiRoutes
  ApiRoutes --> Middleware
  StaticAssets --> AppRouter

  Middleware --> AuthLogic
  ApiRoutes --> QuotationLogic
  ApiRoutes --> FinanceLogic
  ApiRoutes --> VendorLogic
  ApiRoutes --> ReportLogic
  ServerComponents --> FinanceLogic

  AuthLogic --> Prisma
  QuotationLogic --> Prisma
  FinanceLogic --> Prisma
  VendorLogic --> Prisma
  ReportLogic --> Prisma
  Prisma --> Postgres

  LocalDev --> Git
  Git --> GitHub
  GitHub --> VercelBuild
  VercelBuild --> AppRouter
  Env --> Prisma
```

## Current Technology Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Prisma ORM
- Supabase PostgreSQL
- Vercel hosting
- GitHub deployment source

## Security Boundary

- Public repository contains source code, diagrams, assets, and schema.
- Secrets are not committed.
- Production secrets live in Vercel environment variables.
- Production business data lives in Supabase, not in GitHub.

## Important Runtime Flows

- Login creates a signed auth token stored as a browser cookie.
- Middleware protects app pages and API routes from unauthenticated access.
- Pages and forms call Next.js API routes.
- API routes use Prisma to read and write Supabase PostgreSQL data.
- Quotation final report is rendered in the browser and exported through browser print or Save as PDF.
