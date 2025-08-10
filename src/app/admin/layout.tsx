import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { getDatabase } from "@/lib/mongodb";
import type { User } from "@/types/user";

export const runtime = "nodejs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || "";
  if (!token) redirect("/auth/login");

  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const db = await getDatabase();
  const user = await db.collection<User>("userinformation").findOne({
    sessionTokenHash: hash,
    sessionTokenExpiresAt: { $gt: new Date() },
  });
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/dashboard");

  return <>{children}</>;
}
