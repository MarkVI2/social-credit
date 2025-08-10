import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string; // This will be the hashed password
  credits: number; // Current balance of credits
  createdAt: Date;
  updatedAt: Date;
  emailVerified?: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiresAt?: Date;
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
