# Social Credit (Next.js + MongoDB)

A university social currency app with user-to-user transfers, admin-controlled
credit updates, leaderboard, activity feed, and email-based auth and recovery.
Built with Next.js App Router, TypeScript, Tailwind CSS, and MongoDB.

## Features

- Email/password auth with verification links and secure session token (httpOnly
  cookie)
- Signup restricted by domain and allowlist (mahindrauniversity.edu.in +
  allowedEmails.json)
- User-to-user transfers (fixed 2 credits per transfer) with activity logging
- Admin dashboard: list users, grant/deduct credits from Admin or Class Bank,
  view activity
- Class Bank system account with transactional updates
- Leaderboard (top 5), global and per-user transaction history
- Password reset (email), change password, logout, “who am I” endpoint
- Email notifications (verification, reset, password change, admin credit
  updates)

## Tech stack

- Next.js 15 (App Router), React 19, TypeScript
- MongoDB (official Node driver v6)
- Tailwind CSS v4
- Nodemailer for email
- bcryptjs for password hashing

## Quick start

1. Install dependencies

```bash
npm install
```

2. Configure environment

- Copy .env.example to .env.local and fill in values.
- Ensure allowedEmails.json contains permitted addresses for signup.

3. Start dev server

```bash
npm run dev
```

App runs at http://localhost:3000

4. Optional: Initialize database helpers

- Create “Class Bank” account with 1000 balance:
  - API: POST /api/admin/init-class-bank (requires admin)
  - or run script: npm run init-db
- Create unique indexes and test connectivity: npm run test-db
- Backfill missing user credits to 20 for legacy rows: npm run reset-credits

## Environment variables

The app reads the following variables (see .env.example):

- MONGODB_URI: MongoDB connection string
- NEXT_PUBLIC_APP_URL: Base URL for links in emails (e.g.,
  http://localhost:3000)
- NEXT_PUBLIC_APP_NAME: App display name used in emails
- SMTP_HOST, SMTP_PORT: SMTP server host/port (587 default)
- SMTP_USER, SMTP_PASS: SMTP credentials (for Gmail, use an App Password)
- MAIL_FROM: From address (defaults to SMTP_USER if not set)

Notes

- Email is optional at runtime, but verification/reset features require working
  SMTP configuration. If unset, logs will warn.
- Middleware enforces presence of auth token for /admin pages. Role checks occur
  in API routes.

## Database overview

Collections used:

- userinformation: users (username, email, password hash, credits, role,
  verification/reset tokens, session token hash, timestamps)
- systemAccounts: system account(s) like { accountType: "classBank", balance }
- transactionHistory: denormalized transaction feed with themed message
- activityLogs: higher-level activity feed (admin grants/deductions, transfers)

Indexes recommended (created by npm run test-db):

- userinformation: unique indexes on username and email

## API reference (summary)

Auth

- POST /api/auth/signup: Create user. Requires email domain
  @mahindrauniversity.edu.in and allowlist match
- POST /api/auth/login: Returns user + token and sets httpOnly cookie
- POST /api/auth/logout: Clears session
- GET /api/auth/me: Returns authenticated user (safe fields)
- GET /api/auth/verify?token=...: Verify email (redirects to /auth/verified)
- POST /api/auth/verify/resend: Resend verification
- POST /api/auth/forgot: Start password reset (email)
- POST /api/auth/reset: Finish password reset with token
- POST /api/auth/change-password: Change password (email + current + new)

Users/Transactions/Leaderboard

- GET /api/users: Public list (safe fields)
- POST /api/transactions: Transfer exactly 2 credits from `from` to `to` if
  balance allows. Body: { from, to, reason? }
- GET /api/transactions?userId|username|email&limit: Fetch recent transactions
  for a user (or latest global if none specified)
- GET /api/leaderboard: Top 5 users by credits

Admin (require admin role)

- POST /api/admin/init-class-bank: Create class bank with default 1000 balance
- GET /api/admin/users?query=&page=&limit=: Paginated user search (safe fields)
- POST /api/admin/update-credits: Body { targetUserId, amount, sourceAccount:
  "admin"|"classBank", reason }
  - Positive amount credits target (deducts from Admin or Class Bank)
  - Negative amount deducts from target (credits Admin or Class Bank)
- GET /api/admin/activity?cursor=&limit=: Activity feed pagination

## Admin role setup

New signups default to role: "user". To promote an admin:

- Update the user document in userinformation and set role: "admin"
- Ensure the admin has sufficient credits if using sourceAccount: "admin"

## Allowed signup emails

Signup is restricted to:

- Emails ending with @mahindrauniversity.edu.in
- Emails present in allowedEmails.json (file at repo root)

Update allowedEmails.json and redeploy to permit additional addresses.

## Scripts

- dev: next dev --turbopack
- build: next build
- start: next start
- lint: next lint
- test-db: tsx scripts/test-db.ts
- init-db: tsx scripts/init-db.ts
- reset-credits: tsx scripts/reset-credits.ts
- test-mail: configured in package.json but script file is not present in
  scripts/. If needed, add scripts/test-mail.ts to send a sample email via
  Nodemailer.

## Security notes

- Passwords hashed with bcryptjs (12 rounds)
- Session token stored as SHA-256 hash in DB; raw token provided to client and
  set as httpOnly cookie (auth_token)
- Avoid user enumeration in auth flows (uniform success responses)
- Admin APIs double-check role on server (middleware only gates presence of
  token)

## Troubleshooting

- Email not sending: ensure SMTP_USER/SMTP_PASS are set; for Gmail, use an App
  Password and SMTP_HOST=smtp.gmail.com, SMTP_PORT=587
- Verify link says expired: try POST /api/auth/verify/resend and use the new
  link
- Insufficient balance errors: ensure Admin/Class Bank has funds for grants
- Allowlist failing closed: ensure allowedEmails.json shape is an array or {
  allowedEmails: [...] }

## Admin guide (video walkthrough)

See adminguide.md for a visual walkthrough of admin flows.
