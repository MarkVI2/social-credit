"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMe } from "@/hooks/useMe";

interface StoredUser {
  role?: string;
}

export default function BackHomeButton({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const me = useMe();
  const role = (me.data?.user as StoredUser | undefined)?.role || "user";

  const goHome = useCallback(() => {
    const isAdminSection = pathname.startsWith("/admin");
    if (isAdminSection) {
      // Protected admin-only sections always bounce to /admin
      router.push("/admin");
      return;
    }
    // Marketplace (or any non-admin page using this button): dual behavior
    const target = role === "admin" ? "/admin" : "/dashboard";
    router.push(target);
  }, [pathname, router, role]);

  return (
    <button
      onClick={goHome}
      className={`border-4 px-3 py-2 font-bold btn-3d rounded-none shadow-card-sm ${className}`}
      style={{
        background: "var(--background)",
        borderColor: "var(--foreground)",
        color: "var(--foreground)",
      }}
      aria-label="Back to Home"
    >
      ← Back to Home
    </button>
  );
}
