# Space Shastra Interiors - System Diagram

This diagram shows the major users, screens, API routes, database, and deployment services in the current web application.

```mermaid
flowchart TB
  Owner["Business Owner / Admin"] --> Browser["Browser on desktop, tablet, or mobile"]

  Browser --> Login["Login Page"]
  Browser --> Dashboard["Dashboard"]
  Browser --> Clients["Clients"]
  Browser --> Projects["Projects"]
  Browser --> Quotations["Quotations"]
  Browser --> Vendors["Vendors"]
  Browser --> Invoices["Invoices"]
  Browser --> Purchases["Purchases"]
  Browser --> Transactions["Transactions"]

  Login --> AuthApi["/api/auth/login and /api/auth/logout"]
  Dashboard --> DashboardData["Server-rendered dashboard data"]
  Clients --> ClientApi["/api/clients"]
  Projects --> ProjectApi["/api/projects"]
  Quotations --> QuotationApi["/api/quotations"]
  Vendors --> VendorApi["/api/vendors"]
  Invoices --> InvoiceApi["/api/invoices"]
  Purchases --> PurchaseApi["/api/purchases"]
  Transactions --> TransactionApi["/api/transactions"]

  QuotationApi --> ImportApi["/api/quotations/import"]
  ClientApi --> ReconcileApi["/api/clients/reconcile"]
  ProjectApi --> AccountReportApi["/api/projects/[id]/account-report"]
  Vendors --> VendorAccountApi["/api/vendorAccounts"]
  VendorAccountApi --> VendorEntryApi["/api/vendorAccountEntries"]

  AuthApi --> Middleware["Auth middleware and session cookie"]
  Middleware --> ProtectedPages["Protected app pages"]

  DashboardData --> Prisma["Prisma ORM"]
  ClientApi --> Prisma
  ProjectApi --> Prisma
  QuotationApi --> Prisma
  VendorApi --> Prisma
  InvoiceApi --> Prisma
  Purchases --> Prisma
  Transactions --> Prisma
  VendorAccountApi --> Prisma
  VendorEntryApi --> Prisma

  Prisma --> Supabase["Supabase PostgreSQL database"]

  GitHub["GitHub repo: Amit8421/Space_shastra"] --> Vercel["Vercel production deployment"]
  Vercel --> NextApp["Next.js 14 app"]
  NextApp --> Browser
  Vercel --> EnvVars["Vercel environment variables"]
  EnvVars --> Prisma

  PublicAssets["Logo and QR assets in /public"] --> NextApp
```

## Main Data Areas

- Client records and client balances
- Project/site records
- Quotations with itemized interior work
- Copy quotation workflow for new clients
- Vendor accounts, vendor furniture items, and vendor balances
- Invoices, payments, purchases, and transactions
- Dashboard totals for client receivables and vendor outstanding balances

## External Services

- GitHub stores application source code and deployment documentation.
- Vercel hosts the web application and runs production builds.
- Supabase hosts the PostgreSQL database.
- Vercel environment variables store database and login secrets.
