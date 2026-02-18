# Elias Immersive Platform

Multi-tenant SaaS platform for managing and viewing property digital twins — Matterport 3D tours and Nira drone scans.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5.9
- **Database:** PostgreSQL (Neon) via Prisma 6
- **Auth:** NextAuth.js v5 (JWT sessions, Credentials provider)
- **UI:** Tailwind CSS 4, shadcn/ui, Lucide icons, Space Grotesk font
- **Email:** Resend + React Email
- **Validation:** Zod 4 + React Hook Form
- **Deployment:** Vercel

## Features

- **Role-based access** — Admin and Customer roles with enforced route protection
- **Organization management** — Create, edit, soft-delete customer organizations
- **Property management** — Properties with address, location, thumbnail, and description
- **Scan viewer** — Embedded Matterport 3D tours and Nira drone scans with fullscreen support and tab switching
- **Invite system** — Token-based email invitations with 7-day expiry
- **Password reset** — Secure token-based flow with 1-hour expiry
- **Admin dashboard** — Platform stats: customers, properties, scans, pending invites
- **Customer dashboard** — View assigned properties and scans (auto-redirects if single property)
- **Profile & settings** — Update name, email, and password
- **Dark mode** — Theme toggle via next-themes

## Project Structure

```
src/
├── app/
│   ├── (auth)/                 # Login, invite, password reset pages
│   ├── (dashboard)/            # Dashboard, properties, admin, settings
│   └── api/auth/               # NextAuth route handlers
├── actions/                    # Server actions (auth, customers, properties, scans, invites, settings)
├── components/
│   ├── admin/                  # Admin forms and tables
│   ├── auth/                   # Auth forms
│   ├── dashboard/              # Dashboard components
│   ├── layout/                 # Shell, sidebar, header
│   ├── settings/               # Profile and password forms
│   └── ui/                     # shadcn/ui primitives
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── auth-guard.ts           # requireAuth(), requireAdmin(), requireOrgAccess()
│   ├── db.ts                   # Prisma client singleton
│   ├── email.ts                # Resend email service
│   └── validations.ts          # Zod schemas
├── types/                      # TypeScript definitions
└── emails/                     # Email templates
prisma/
├── schema.prisma               # Database schema
├── seed.ts                     # Admin user seeder
└── migrations/                 # Migration history
middleware.ts                   # Edge JWT validation (jose)
```

## Database Schema

| Model             | Purpose                                      |
|-------------------|----------------------------------------------|
| User              | Accounts with role (ADMIN / CUSTOMER)        |
| Organization      | Tenant organizations                         |
| Property          | Properties within an organization            |
| Scan              | Matterport or Nira scans attached to a property |
| Invite            | Email invitations (PENDING / ACCEPTED / EXPIRED) |
| PasswordReset     | Password reset tokens                        |
| Account / Session | NextAuth internals                           |

Soft deletes are handled via `isActive` flags. Organization deletion cascades to properties, scans, and users.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) account)
- [Resend](https://resend.com) API key

### Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
AUTH_SECRET="<same as NEXTAUTH_SECRET>"

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="Elias Immersive <noreply@eliasimmersive.com>"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Elias Immersive"
```

### Setup

```bash
npm install
npx prisma migrate dev
npm run db:seed          # Creates admin@eliasimmersive.com / changeme123
npm run dev
```

### Scripts

| Command           | Description                      |
|-------------------|----------------------------------|
| `npm run dev`     | Start dev server (Turbopack)     |
| `npm run build`   | Production build                 |
| `npm run start`   | Start production server          |
| `npm run lint`    | Run ESLint                       |
| `npm run db:generate` | Generate Prisma client       |
| `npm run db:migrate`  | Run migrations               |
| `npm run db:push`     | Push schema without migration |
| `npm run db:seed`     | Seed admin user              |
| `npm run db:studio`   | Open Prisma Studio           |

## Authentication

JWT-based sessions using NextAuth.js v5 with a Credentials provider. The Edge middleware (`middleware.ts`) validates tokens using `jose` to stay within Vercel's 1 MB Edge Function limit — it avoids importing Prisma or bcrypt at the edge.

**Auth guards** in `src/lib/auth-guard.ts`:
- `requireAuth()` — redirect unauthenticated users to `/login`
- `requireAdmin()` — restrict to ADMIN role
- `requireOrgAccess(orgId)` — verify the user belongs to the organization

## Routes

### Public
| Route                        | Description            |
|------------------------------|------------------------|
| `/login`                     | Sign in                |
| `/forgot-password`           | Request password reset |
| `/reset-password/[token]`    | Reset password         |
| `/invite/[token]`            | Accept invite          |

### Customer
| Route                        | Description                  |
|------------------------------|------------------------------|
| `/dashboard`                 | Organization properties      |
| `/properties`                | Property list                |
| `/properties/[propertyId]`   | Scan viewer                  |
| `/settings`                  | Profile & password           |

### Admin
| Route                                                        | Description         |
|--------------------------------------------------------------|---------------------|
| `/dashboard`                                                 | Platform stats      |
| `/admin/customers`                                           | All organizations   |
| `/admin/customers/new`                                       | Create organization |
| `/admin/customers/[orgId]`                                   | Org detail          |
| `/admin/customers/[orgId]/edit`                              | Edit org            |
| `/admin/customers/[orgId]/properties/new`                    | Add property        |
| `/admin/customers/[orgId]/properties/[propertyId]`           | Property detail     |
| `/admin/customers/[orgId]/properties/[propertyId]/edit`      | Edit property       |
| `/admin/customers/[orgId]/properties/[propertyId]/scans/new` | Add scan            |
| `/admin/customers/[orgId]/properties/[propertyId]/scans/[scanId]/edit` | Edit scan |

## Security

- Passwords hashed with bcrypt (10 salt rounds)
- Invite tokens: 32-byte random, base64url, 7-day expiry
- Password reset tokens: URL-safe base64, 1-hour expiry
- CSP headers allow iframes only from `*.matterport.com` and `*.nira.app`
- Embed URL validation whitelists Matterport and Nira domains
- CSRF protection via NextAuth

## Deployment

Deployed on Vercel. The Edge middleware uses lightweight JWT validation to avoid exceeding the free-plan 1 MB bundle limit.

Set all environment variables in the Vercel project settings. `DIRECT_DATABASE_URL` is required for Prisma migrations against Neon's connection pooler.
