"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/trpc/client";
import { useMe } from "@/hooks/useMe";
import AdminProfileModal from "@/components/AdminProfileModal";
import { usePathname } from "next/navigation";

type Props = {
  title: string;
  description?: string;
};

export default function AdminHeader({ title, description }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const pathname = usePathname();

  const classBank = trpc.admin.classbank.getClassBankStatus.useQuery(
    undefined,
    {
      refetchInterval: 90_000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    }
  );
  const me = useMe();

  const initial = useMemo(() => {
    const u = me.data?.user?.username || "";
    return u ? u.charAt(0).toUpperCase() : "A";
  }, [me.data?.user?.username]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        btnRef.current &&
        !btnRef.current.contains(t)
      ) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    try {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("auth_token");
    } catch {}
    window.location.href = "/auth/login";
  };

  const balance =
    typeof classBank.data?.balance === "number" ? classBank.data.balance : 0;

  const allNav = [
    { href: "/admin", label: "Admin" },
    { href: "/admin/activity", label: "Activity" },
    { href: "/admin/bank", label: "Bank Access" },
    { href: "/marketplace", label: "Auction/Marketplace" },
    { href: "/admin/statistics", label: "Statistics" },
  ];
  const filteredNav = useMemo(
    () => allNav.filter((n) => n.href !== pathname),
    [pathname]
  );

  return (
    <>
      <div className="w-full order-0 relative z-40">
        <div
          className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-card"
          style={{
            background: "var(--background)",
            color: "var(--foreground)",
            borderColor: "var(--foreground)",
          }}
        >
          <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
            {/* Title + description */}
            <div className="min-w-0">
              <h1
                className="font-heading text-xl sm:text-2xl font-extrabold uppercase tracking-wider truncate"
                style={{ color: "var(--accent)" }}
              >
                {title}
              </h1>
              {description ? (
                <p className="font-mono text-xs sm:text-sm opacity-80 mt-1">
                  {description}
                </p>
              ) : null}
            </div>

            {/* Class Bank Balance */}
            <div className="flex items-center gap-2 order-2 lg:order-none">
              <div
                className="px-3 py-2 border-2 rounded-none font-mono text-xs sm:text-sm whitespace-nowrap"
                style={{ borderColor: "var(--foreground)" }}
              >
                <span className="opacity-80">Class Bank Credits:</span>{" "}
                <span className="font-bold">
                  {classBank.isLoading ? "…" : `${balance} cr`}
                </span>
              </div>
            </div>

            {/* Right cluster: nav (desktop) + avatar */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Desktop nav */}
              <nav className="hidden lg:flex items-center gap-2">
                {filteredNav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="border-4 px-3 py-1 btn-3d"
                    style={{
                      background: "var(--background)",
                      borderColor: "var(--foreground)",
                    }}
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>

              {/* Avatar / Hamburger */}
              <div className="relative">
                <button
                  ref={btnRef}
                  onClick={() => setMenuOpen((s) => !s)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-controls="admin-header-menu"
                  className="w-9 h-9 rounded-full border-4 flex items-center justify-center font-bold"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--foreground)",
                  }}
                  title="Admin Menu"
                >
                  {initial}
                </button>
                {menuOpen && (
                  <div
                    ref={menuRef}
                    id="admin-header-menu"
                    role="menu"
                    className="absolute right-0 mt-2 border-4 bg-[var(--background)] shadow-[6px_6px_0_0_#28282B] overflow-hidden z-[100]"
                    style={{ borderColor: "var(--foreground)" }}
                  >
                    <div className="min-w-56">
                      {/* Mobile: full nav */}
                      {filteredNav.map((n, idx) => (
                        <Link
                          key={n.href}
                          href={n.href}
                          className="lg:hidden block w-full text-left px-3 py-2 border-b-2 hover:opacity-90"
                          style={{ borderColor: "var(--foreground)" }}
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          {n.label}
                        </Link>
                      ))}

                      {/* Separator on mobile */}
                      <div
                        className="lg:hidden border-b-2"
                        style={{ borderColor: "var(--foreground)" }}
                      />

                      {/* Shared options */}
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setProfileOpen(true);
                        }}
                        className="block w-full text-left px-3 py-2 border-b-2 hover:opacity-90"
                        style={{ borderColor: "var(--foreground)" }}
                        role="menuitem"
                      >
                        Profile Settings
                      </button>
                      <button
                        onClick={logout}
                        className="block w-full text-left px-3 py-2 hover:opacity-90"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {profileOpen ? (
        <AdminProfileModal
          adminUser={
            me.data?.user
              ? {
                  username: me.data.user.username,
                  email: me.data.user.email,
                }
              : null
          }
          onClose={() => setProfileOpen(false)}
        />
      ) : null}
    </>
  );
}
