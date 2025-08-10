"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LeaderboardSidebar from "@/components/LeaderboardSidebar";
import { useRouter } from "next/navigation";

type AdminUser = {
  _id: string;
  username: string;
  email: string;
  credits?: number;
  role?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_token");
      const cookieToken = raw || "";
      setToken(cookieToken);
    } catch {}
  }, []);

  const fetchUsers = useCallback(
    async (p = 1, q = "") => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/users?page=${p}&limit=${limit}&query=${encodeURIComponent(
            q
          )}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: "no-store",
          }
        );
        if (res.status === 401) router.push("/auth/login");
        const data = await res.json();
        if (data.success) {
          setUsers(data.items);
          setTotal(data.total);
          setPage(data.page);
        }
      } finally {
        setLoading(false);
      }
    },
    [limit, router, token]
  );

  useEffect(() => {
    const id = setTimeout(() => {
      void fetchUsers(1, query);
    }, 250);
    return () => clearTimeout(id);
  }, [query, fetchUsers]);

  const header = useMemo(
    () => (
      <div className="w-full">
        <div
          className="p-3 sm:p-4 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
          style={{
            background: "var(--background)",
            color: "var(--foreground)",
            borderColor: "var(--foreground)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div
              className="font-heading text-xl sm:text-2xl font-extrabold uppercase tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              The People’s Ledger
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <button
                className="border-4 px-3 py-1 btn-3d"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                Bank Access
              </button>
              <button
                className="border-4 px-3 py-1 btn-3d"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                Auction/Marketplace
              </button>
              <button
                className="border-4 px-3 py-1 btn-3d"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                Statistics
              </button>
            </div>
            <AdminAvatar token={token} />
          </div>
        </div>
      </div>
    ),
    [token]
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4 lg:px-6 py-3">
        {header}
        {/* Two-column on lg+: fixed 20rem sidebar + fluid content. Stack on small. */}
        <div className="grid gap-4 lg:grid-cols-[20rem_1fr] lg:items-start mt-4">
          {/* Main content first in DOM so on small screens it appears above the sidebar */}
          <div className="w-full lg:col-start-2 max-w-screen-xl mx-auto flex flex-col gap-4 min-w-0">
            <div
              className="p-3 sm:p-4 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              <div className="flex items-center gap-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by username or email"
                  className="flex-1 px-3 py-2 border-4 rounded-none"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--foreground)",
                  }}
                />
                <button
                  onClick={() => fetchUsers(1, query)}
                  className="border-4 px-4 py-2 btn-3d"
                  style={{
                    background: "var(--accent)",
                    borderColor: "var(--foreground)",
                    color: "white",
                  }}
                >
                  Search
                </button>
              </div>
            </div>
            <div
              className="p-0 border-4 rounded-none shadow-[8px_8px_0_0_#28282B] overflow-x-auto"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              <table className="w-full font-mono text-sm">
                <thead>
                  <tr className="bg-black/5">
                    <th className="text-left p-2 border-b-4">Username</th>
                    <th className="text-left p-2 border-b-4">Email</th>
                    <th className="text-right p-2 border-b-4">Credits</th>
                    <th className="text-center p-2 border-b-4">Role</th>
                    <th className="text-right p-2 border-b-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="odd:bg-white/30">
                      <td className="p-2">{u.username}</td>
                      <td className="p-2">{u.email}</td>
                      <td className="p-2 text-right">
                        {Math.trunc(u.credits || 0)}
                      </td>
                      <td className="p-2 text-center">{u.role || "user"}</td>
                      <td className="p-2 text-right">
                        <InlineGrant
                          userId={u._id}
                          username={u.username}
                          token={token}
                          onDone={() => fetchUsers(page, query)}
                        />
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center">
                        {loading ? "Loading…" : "No users"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <button
                disabled={page <= 1}
                onClick={() => fetchUsers(page - 1, query)}
                className="border-4 px-3 py-1 btn-3d disabled:opacity-60"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                Prev
              </button>
              <div className="font-mono">
                Page {page} / {totalPages}
              </div>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchUsers(page + 1, query)}
                className="border-4 px-3 py-1 btn-3d disabled:opacity-60"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                Next
              </button>
            </div>
          </div>
          {/* Sidebar: sticky on desktop, flows below on mobile/tablet */}
          <div className="w-full lg:col-start-1 lg:row-start-1 lg:sticky lg:top-24 self-start min-w-0">
            <div className="lg:pr-2">
              <LeaderboardSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineGrant({
  userId,
  username,
  token,
  onDone,
}: {
  userId: string;
  username: string;
  token: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [source, setSource] = useState<"admin" | "classBank">("admin");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/update-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          targetUserId: userId,
          amount,
          sourceAccount: source,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOpen(false);
        setAmount(0);
        setReason("");
        onDone();
      } else {
        alert(data.message || "Failed");
      }
    } catch (e) {
      console.error(e);
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-2">
      {!open ? (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setOpen(true);
              setAmount(10);
            }}
            className="border-4 px-2 py-1 btn-3d"
            style={{
              background: "var(--accent)",
              borderColor: "var(--foreground)",
              color: "white",
            }}
          >
            Give
          </button>
          <button
            onClick={() => {
              setOpen(true);
              setAmount(-10);
            }}
            className="border-4 px-2 py-1 btn-3d"
            style={{
              background: "var(--background)",
              borderColor: "var(--foreground)",
            }}
          >
            Deduct
          </button>
        </div>
      ) : (
        <div
          className="p-2 border-4 rounded-none"
          style={{
            background: "var(--background)",
            borderColor: "var(--foreground)",
          }}
        >
          <div className="font-mono text-xs mb-1">Action for {username}</div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-24 text-right px-2 py-1 border-4 rounded-none"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            />
            <select
              value={source}
              onChange={(e) =>
                setSource(e.target.value as "admin" | "classBank")
              }
              className="px-2 py-1 border-4 rounded-none"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              <option value="admin">Admin’s Own Account</option>
              <option value="classBank">Class Bank</option>
            </select>
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className="w-64 max-w-full px-2 py-1 border-4 rounded-none mb-2"
            style={{
              background: "var(--background)",
              borderColor: "var(--foreground)",
            }}
          />
          <div className="flex gap-2 justify-end">
            <button
              disabled={submitting}
              onClick={() => setOpen(false)}
              className="border-4 px-2 py-1 btn-3d disabled:opacity-60"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              Cancel
            </button>
            <button
              disabled={submitting || !amount || !reason}
              onClick={submit}
              className="border-4 px-3 py-1 btn-3d disabled:opacity-60"
              style={{
                background: "var(--accent)",
                borderColor: "var(--foreground)",
                color: "white",
              }}
            >
              {submitting ? "Saving…" : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminAvatar({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState("A");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store",
        });
        const data = await res.json();
        if (data?.authenticated && data.user?.username) {
          setInitial(String(data.user.username).charAt(0).toUpperCase());
        }
      } catch {}
    };
    load();
  }, [token]);

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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-9 h-9 rounded-full border-4 flex items-center justify-center font-bold"
        style={{
          background: "var(--background)",
          borderColor: "var(--foreground)",
        }}
      >
        {initial}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 border-4 p-2 bg-[var(--background)]"
          style={{ borderColor: "var(--foreground)" }}
        >
          <button
            onClick={logout}
            className="block w-full text-left px-2 py-1 hover:opacity-80"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
