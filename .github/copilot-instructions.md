# Interior Design Manager - Project Instructions

This is a full-stack Next.js application for managing interior design business operations.

## Project Setup Complete

- [x] Project scaffolded with Next.js, TypeScript, and Tailwind CSS
- [x] Database schema created with Prisma ORM for PostgreSQL
- [x] API routes implemented for all core entities (Clients, Vendors, Projects, Transactions, Invoices)
- [x] UI pages created for dashboard and main management sections
- [x] Environment configuration set up

## To Get Started

1. **Install Node.js** if not already installed: https://nodejs.org/
2. **Install PostgreSQL** if not already installed: https://www.postgresql.org/
3. **Install dependencies**: `npm install`
4. **Create a PostgreSQL database**: `createdb interior_design_db`
5. **Configure environment**: Copy `.env.example` to `.env.local` and update DATABASE_URL
6. **Set up database**: `npm run db:generate && npm run db:push`
7. **Start development server**: `npm run dev`
8. **Open browser**: http://localhost:3000

## Project Features

- Dashboard with key metrics
- Complete CRUD operations for:
  - Clients
  - Vendors
  - Projects/Sites
  - Invoices
  - Transactions
  - Purchases
- RESTful API architecture
- TypeScript for type safety
- Tailwind CSS for styling
- Prisma ORM for database operations

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run studio` - Open Prisma Studio for database management

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── clients/        # Client management
│   ├── vendors/        # Vendor management
│   ├── projects/       # Project management
│   ├── transactions/   # Transaction management
│   └── layout.tsx      # Root layout
├── components/        # Reusable components
├── lib/              # Utilities and database client
└── styles/           # Global styling

prisma/
└── schema.prisma     # Database schema definition
```

## Database Schema

The application manages 8 main entities:
- Users (admin accounts)
- Clients (customer information)
- Vendors (supplier information)
- Projects (interior design sites)
- Invoices (billing)
- Invoice Items (line items)
- Payments (payment records)
- Transactions (all business transactions)
- Purchases (purchase orders)

## Future Enhancements

- Add user authentication
- Implement form validation
- Add file upload for project images
- Create advanced reporting/analytics
- Export functionality (PDF/Excel)
- Email notifications
- Mobile app support
- Calendar/timeline views
- Budget tracking and forecasting

## Technology Stack

- **Frontend**: React 18, Next.js 14
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma 5
- **Styling**: Tailwind CSS 3
- **Language**: TypeScript 5
