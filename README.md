# Social Credit - Digital Currency System

A secure digital wallet and currency exchange platform built with Next.js,
MongoDB, and TypeScript.

## Features

- 🔐 Secure user authentication with salted password hashing
- 🎓 University email validation (@mahindrauniversity.edu.in)
- 💳 Digital wallet system (coming soon)
- 🎨 Modern, minimalistic UI with high-tech styling
- 🌐 MongoDB integration for user data storage

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Security**: bcryptjs for password hashing
- **Styling**: Tailwind CSS with custom color scheme

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd social-credit
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up MongoDB

You have two options:

#### Option A: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. The app will connect to `mongodb://localhost:27017/social-credit`

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your MongoDB connection string:

```bash
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/social-credit

# For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/social-credit?retryWrites=true&w=majority
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
result.

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - Authenticate user login

### Request/Response Examples

#### Signup Request

```json
{
  "username": "johndoe",
  "email": "john.doe@mahindrauniversity.edu.in",
  "password": "securepassword123",
  "confirmPassword": "securepassword123"
}
```

#### Login Request

```json
{
  "identifier": "johndoe", // or email
  "password": "securepassword123"
}
```

## Security Features

- **Password Hashing**: Uses bcryptjs with salt rounds of 12
- **Email Validation**: Only allows university emails ending with
  @mahindrauniversity.edu.in
- **Input Validation**: Comprehensive validation on both client and server side
- **Error Handling**: Secure error messages that don't leak sensitive
  information

## Color Scheme

- **Background**: Red (#9D1B1B)
- **Components**: Black (#28282B)
- **Text**: Beige (#F9C784) and White (#E7E7E7)

## Project Structure

```
src/
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── auth/              # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   └── globals.css        # Global styles
├── lib/
│   └── mongodb.ts         # MongoDB connection
├── services/
│   └── userService.ts     # User-related business logic
└── types/
    └── user.ts            # TypeScript type definitions
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
result.

You can start editing the page by modifying `app/page.tsx`. The page
auto-updates as you edit the file.

This project uses
[`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
to automatically optimize and load [Geist](https://vercel.com/font), a new font
family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out
[the Next.js GitHub repository](https://github.com/vercel/next.js) - your
feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our
[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
for more details.
