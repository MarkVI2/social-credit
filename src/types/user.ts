import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string; // This will be the hashed password
  credits: number; // Current balance of credits
  earnedLifetime?: number; // Total credits earned since start (increments when user receives credits)
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
