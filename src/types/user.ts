import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string; // This will be the hashed password
  credits: number; // Current balance of credits
  earnedLifetime?: number; // Total credits earned since start (increments when user receives credits)
  spentLifetime?: number; // Total credits spent since start (increments when user sends credits)
  receivedLifetime?: number; // Total credits received from transfers
  rank?: string; // Vanity rank derived from earnedLifetime
  createdAt: Date;
  updatedAt: Date;
  emailVerified?: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
  resetToken?: string;
  resetTokenExpiresAt?: Date;
  // Role-based access control
  role?: "user" | "admin";
  transactionsSent?: number; // Total number of transactions sent by user
  transactionsReceived?: number; // Total number of transactions received by user
  // Token-based session (localStorage/cookie). Store only hash in DB.
  sessionTokenHash?: string;
  sessionTokenExpiresAt?: Date;
}

export interface UserInput {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  identifier: string; // Can be username or email
  password: string;
}
