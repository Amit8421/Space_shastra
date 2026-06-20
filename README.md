# Interior Design Manager

A comprehensive web application for managing interior design business operations including clients, vendors, projects/sites, invoices, and financial transactions.

## Features

- **Client Management**: Track and manage all client information and contact details
- **Vendor Management**: Maintain vendor database with categories and contact information
- **Project/Site Management**: Create and track interior design projects with client associations
- **Invoice Management**: Generate invoices with line items and track payment status
- **Transaction Tracking**: Record all business transactions (income, expenses, purchases)
- **Dashboard**: Overview of key business metrics
- **RESTful API**: Complete API for all operations

## Tech Stack

- **Frontend**: React + Next.js 14
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 12+ ([Download](https://www.postgresql.org/download/))
- npm or yarn package manager

## Installation

1. **Clone or extract the project**
   ```bash
   cd my\ interior\ project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your PostgreSQL database URL:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/interior_design_db"
   ```

4. **Create PostgreSQL database**
   ```bash
   # Using psql
   createdb interior_design_db
   ```

5. **Generate Prisma Client and push schema to database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Pages

- `/` - Dashboard with key metrics
- `/clients` - Client management
- `/vendors` - Vendor management
- `/projects` - Projects/Sites management
- `/transactions` - Transaction tracking

## API Endpoints

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create a new client

### Vendors
- `GET /api/vendors` - List all vendors
- `POST /api/vendors` - Create a new vendor

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project

### Transactions
- `GET /api/transactions` - List all transactions
- `POST /api/transactions` - Create a new transaction

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create a new invoice

## Database Schema

The application uses the following main entities:

- **User**: Admin/user accounts
- **Client**: Client information
- **Vendor**: Vendor information
- **Project**: Interior design projects/sites
- **Invoice**: Billing invoices
- **InvoiceItem**: Line items in invoices
- **Payment**: Payment records
- **Transaction**: General business transactions
- **Purchase**: Purchase orders

## Building for Production

```bash
npm run build
npm start
```

## Web Deployment

This project is deployed on Vercel with PostgreSQL hosted on Supabase.

Required Vercel environment variables:

```bash
DATABASE_URL="postgresql://..."
ADMIN_PASSWORD="change-this-password"
AUTH_SECRET="generate-a-long-random-secret"
```

Keep `.env`, `.env.local`, database exports, logs, and generated build folders out of GitHub. The live business data stays in Supabase; GitHub stores the application source, assets, Prisma schema, and deployment configuration.

For the fastest and safest workflow, connect this GitHub repository to the existing Vercel project and deploy from the `main` branch. After that, future updates only need:

```bash
git add .
git commit -m "Describe the change"
git push
```

Vercel will automatically build and deploy from GitHub using its build cache.

## Database Management

View and manage database with Prisma Studio:
```bash
npm run studio
```

This opens an interactive GUI at `http://localhost:5555` to view and edit your database.

## Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── clients/       # Client management pages
│   │   ├── vendors/       # Vendor management pages
│   │   ├── projects/      # Project management pages
│   │   ├── transactions/  # Transaction pages
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Dashboard
│   ├── components/        # Reusable React components
│   ├── lib/              # Utility functions and database client
│   └── styles/           # Global CSS
├── prisma/
│   └── schema.prisma     # Database schema
├── package.json
└── tsconfig.json
```

## Next Steps

1. Customize the UI components as needed
2. Add authentication/authorization
3. Implement form validation
4. Add more detailed reporting
5. Implement export functionality (PDF, Excel)
6. Add file upload capabilities
7. Implement user authentication
8. Add email notifications

## Notes

- All API endpoints return JSON responses
- Dates are stored in ISO format
- Amounts are stored as floats (for production, consider using Decimal for precision)
- Status fields use lowercase values (active, inactive, pending, completed, etc.)

## Support

For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
