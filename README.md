<div align="center">

# Social Credit System

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green?style=for-the-badge&logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![tRPC](https://img.shields.io/badge/tRPC-10-2596BE?style=for-the-badge&logo=trpc)

A gamified university social currency platform designed to foster collaboration
and community engagement. Features a communist-themed aesthetic with
user-to-user transfers, a dynamic marketplace, vanity ranks, and a relative
grading system ("Score") based on community participation.

</div>

---

## Features

### Core Gameplay

- **Social Currency**: Earn credits by helping others or receiving transfers.
- **User-to-User Transfers**: Send fixed 2 credit transfers to peers for help,
  support, or collaboration.
- **Dynamic Ranks**: Progress through 13 vanity ranks from _Recruit_ to
  _People's Hero_ based on lifetime earnings.
- **Veil of Anonymity**: Purchase temporary anonymity to send credits without
  revealing your identity.

### Economics & Scoring

- **Marketplace**: Spend credits on utility items (like Anonymity) or vanity
  upgrades.
- **Relative Scoring System**:
  - Calculates a "Score" (Course Credits) based on a weighted formula:
    `75% Earned Lifetime + 25% Spent Lifetime`.
  - **Statistical Grading**: Grades are determined using a Z-score distribution
    relative to the community mean and standard deviation.
  - **Dynamic Curve**: The system automatically adjusts grading thresholds as
    the economy evolves.
- **Class Bank**: A central reserve that collects spent credits and can be used
  for community rewards.

### Security & Auth

- **Domain-Restricted Signup**: Exclusive to `@mahindrauniversity.edu.in`
  emails.
- **Allowlist Enforcement**: Strict control over who can join via
  `allowedEmails.json`.
- **Secure Authentication**: HTTP-only cookies, session hashing, and email
  verification.
- **Role-Based Access**: Granular permissions for Users and Admins.

### Leaderboards & Stats

- **Live Leaderboard**: Real-time tracking of top earners.
- **Multi-Filter Leaderboard**: Filter by **Kredits**, **Most Active**, **Top
  Gainers**, or **Top Losers**.
- **Fair Activity Tracking**: Admin minting/burning transactions are excluded
  from user activity counts to ensure fair competition.
- **Network Graph**: Visual representation of credit flow between users.
- **Detailed Statistics**: Personal dashboard showing earnings, spending, and
  rank progress.

### Performance & UX

- **Optimized Dashboard**: Lightweight data fetching and efficient user
  selection for fast load times.
- **Mobile-First Design**: Responsive leaderboard and UI elements optimized for
  mobile devices.

---

## Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Native Driver)
- **API**: [tRPC](https://trpc.io/) (Type-safe APIs)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Email**: Nodemailer
- **Security**: bcryptjs, crypto

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Instance (Local or Atlas)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/MarkVI2/social-credit.git
   cd social-credit
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment** Copy `.env.example` to `.env.local` and populate
   the variables:

   ```env
   MONGODB_URI=mongodb://localhost:27017/social-credit
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   SMTP_HOST=smtp.example.com
   SMTP_USER=user@example.com
   SMTP_PASS=password
   ```

4. **Initialize Database** Run the initialization scripts to set up indexes and
   the Class Bank:

   ```bash
   npm run init-db
   npm run test-db
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to see the app in action.

---

## Scripts & Utilities

The project includes several utility scripts for maintenance and data
management:

| Command                           | Description                                                      |
| --------------------------------- | ---------------------------------------------------------------- |
| `npm run init-db`                 | Initializes system accounts (Class Bank) and basic config.       |
| `npm run test-db`                 | Verifies database connection and creates indexes.                |
| `npm run seed-marketplace`        | Populates the marketplace with default items (Ranks, Anonymity). |
| `npm run backfill-course-credits` | Recalculates "Score" for all users based on the dynamic curve.   |
| `npm run backfill-ranks`          | Updates user ranks based on lifetime earnings.                   |
| `npm run backfill-tx-counts`      | Recalculates transaction counts (excluding admin actions).       |
| `npm run test-course-credits`     | Runs unit tests for the scoring algorithm.                       |

---

## Project Structure

```
social-credit/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Shared utilities (DB, Ranks, Auth)
│   ├── services/         # Business logic services
│   ├── trpc/             # tRPC routers and server setup
│   └── types/            # TypeScript definitions
├── scripts/              # Maintenance and backfill scripts
├── public/               # Static assets
└── ...config files
```

---

## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
