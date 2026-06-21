# Feature Analysis Prompt

Use this prompt with ChatGPT or another analysis tool when comparing this app with competitors.

```text
I have an interior design business management web app named Space Shastra Interiors.

Please review the system, workflow, and architecture diagrams in this repository and suggest new features that would make the app competitive with modern interior design, contractor, CRM, project management, quotation, and accounting tools.

Focus on:
- Features that save time for an interior design business owner.
- Features that improve client communication and approvals.
- Features that improve quotation accuracy, payment collection, and vendor tracking.
- Features that are practical for a small business and can be built in phases.
- Features that can work with the current stack: Next.js, React, Prisma, Supabase PostgreSQL, Vercel, and GitHub.

Please provide:
1. A competitor-style feature gap analysis.
2. A prioritized roadmap: must-have, should-have, later.
3. Database changes needed for each feature.
4. UI pages or controls needed for each feature.
5. Risks or complexity for each feature.
6. A recommended first sprint plan.
```

## Files To Share For Analysis

- `docs/system-diagram.md`
- `docs/architecture-diagram.md`
- `docs/workflow-diagram.md`
- `prisma/schema.prisma`
- `README.md`

## Current App Summary

The application currently supports:

- Admin login
- Dashboard for client totals, receivables, active projects, and vendor outstanding
- Client management
- Project/site management
- Vendor management
- Vendor accounts and vendor payment tracking
- Quotations with room-wise and work-wise itemization
- Copy existing quotation for a new client/project
- Quotation final report with terms, payment information, and QR code
- Invoice management
- Purchase management
- Transaction tracking
- Supabase PostgreSQL database
- Vercel deployment from GitHub
