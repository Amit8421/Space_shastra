# Space Shastra Interiors - Workflow Diagram

This file maps the current business workflows handled by the application.

## Overall Business Workflow

```mermaid
flowchart TD
  Start["New inquiry or client"] --> Client["Create or update client"]
  Client --> Project["Create project / site"]
  Project --> Quote["Create quotation"]
  Quote --> QuoteItems["Add room-wise and work-wise quotation items"]
  QuoteItems --> Review["Preview final quotation report"]
  Review --> Print["Print or save quotation PDF"]
  Print --> ClientDecision{"Client accepts?"}

  ClientDecision -->|No| Revise["Revise quotation or copy from old quotation"]
  Revise --> QuoteItems

  ClientDecision -->|Yes| Accepted["Mark quotation accepted"]
  Accepted --> Payments["Record client payments"]
  Accepted --> VendorPlanning["Create vendor account for project"]
  VendorPlanning --> VendorItems["Sync furniture/vendor items from quotation"]
  VendorItems --> VendorRates["Enter vendor rates and balances"]
  VendorRates --> VendorPayments["Record vendor payments and charges"]
  Payments --> Dashboard["Dashboard receivable totals"]
  VendorPayments --> Dashboard

  Accepted --> Invoice["Create invoice if required"]
  Invoice --> InvoicePayment["Record invoice payments"]
  InvoicePayment --> Dashboard

  Accepted --> ProjectProgress["Track project status"]
  ProjectProgress --> Complete{"Project complete?"}
  Complete -->|No| ProjectProgress
  Complete -->|Yes| CloseProject["Mark project completed"]
  CloseProject --> Reports["Review dashboard and account reports"]
```

## Quotation Copy Workflow

```mermaid
sequenceDiagram
  participant Admin as Admin
  participant UI as Quotations Page
  participant API as Quotation API
  participant DB as Supabase PostgreSQL

  Admin->>UI: Select existing quotation
  Admin->>UI: Choose Copy Quotation
  UI->>API: Load source quotation and items
  API->>DB: Read quotation, client, project, items
  DB-->>API: Source quotation data
  API-->>UI: Return reusable quotation structure
  Admin->>UI: Select new client/project and adjust values
  UI->>API: Save as new quotation
  API->>DB: Insert new quotation and copied items
  DB-->>API: New quotation created
  API-->>UI: Show updated quotations list
```

## Payment And Balance Workflow

```mermaid
flowchart LR
  AcceptedQuote["Accepted quotation"] --> ClientTotal["Client total amount"]
  ClientPayment["Client payment transaction"] --> PaymentReceived["Payment received total"]
  ClientTotal --> Receivable["Receivable = total - received"]
  PaymentReceived --> Receivable

  VendorOpening["Vendor opening balance"] --> VendorAccount["Vendor account"]
  VendorCharge["Vendor charges / furniture items"] --> VendorAccount
  VendorPayment["Vendor payment entries"] --> VendorAccount
  VendorAccount --> VendorOutstanding["Vendor outstanding balance"]

  Receivable --> Dashboard["Dashboard"]
  VendorOutstanding --> Dashboard
```

## Deployment Workflow

```mermaid
flowchart TD
  Change["Code or documentation change"] --> LocalTest["Run lint/build locally when needed"]
  LocalTest --> Commit["Git commit"]
  Commit --> Push["Push to GitHub main"]
  Push --> Vercel["Vercel auto-deploy from GitHub"]
  Vercel --> Build["Install dependencies, generate Prisma client, build Next.js"]
  Build --> Deploy["Production deployment"]
  Deploy --> Live["Live app URL"]
```

## Enhancement Areas To Compare With Competitors

- Lead capture and follow-up tracking
- Measurement sheets and site survey forms
- Material catalog and rate library
- BOQ and estimate versioning
- Client approval workflow with digital signature
- Automated payment reminders
- Vendor purchase orders and delivery tracking
- Project timeline, tasks, and milestone tracking
- Photo/document uploads per project
- WhatsApp/email quotation sharing
- Role-based access for staff, designer, accountant, and vendor
- Analytics for profit, margin, conversion, and pending collections
