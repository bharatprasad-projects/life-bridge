
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function UserMenu() {
  const { user, profile, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
      setOpen(false);
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1.5 pr-3"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt="Profile"
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
            {profile?.name?.charAt(0) || "U"}
          </div>
        )}

        <span className="text-sm font-semibold text-gray-700">
          {profile?.name?.split(" ")[0] || "Account"}
        </span>

        <span className="text-gray-400">⌄</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-64 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl">
          <div className="border-b border-gray-100 px-3 pb-3">
            <p className="font-semibold text-gray-900">
              {profile?.name || user.displayName || "User"}
            </p>
            <p className="mt-1 break-all text-xs text-gray-500">
              {user.email}
            </p>
          </div>

          <Link
            href={
              profile?.role === "admin"
                ? "/admin/dashboard"
                : profile?.role === "hospital"
                  ? "/hospital/dashboard"
                  : "/dashboard"
            }
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            My Dashboard
          </Link>

          <button
            onClick={handleLogout}
            className="mt-1 w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
