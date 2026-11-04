
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  AlertCircle,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldX,
} from "lucide-react";

type Role = "user" | "hospital" | "admin";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  requireHospitalApproval?: boolean;
}

export default function RoleGuard({
  allowedRoles,
  children,
  requireHospitalApproval = false,
}: RoleGuardProps) {
  const {
    user,
    profile,
    loading,
    logout,
    refreshProfile,
  } = useAuth();

  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const authorized =
    !!profile &&
    allowedRoles.includes(profile.role) &&
    (!requireHospitalApproval ||
      profile.accountStatus === "approved");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  // Firebase authentication is still loading.
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2
            size={36}
            className="mx-auto animate-spin text-red-600"
          />
          <p className="mt-4 text-sm font-semibold text-gray-600">
            Checking your account...
          </p>
        </div>
      </main>
    );
  }

  // User is not authenticated.
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-red-600"
          />
          <p className="mt-4 text-sm text-gray-500">
            Redirecting to login...
          </p>
        </div>
      </main>
    );
  }

  // User is authenticated, but Firestore profile is unavailable.
  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <AlertCircle size={28} />
          </div>

          <h1 className="mt-5 text-xl font-black text-gray-900">
            Profile unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            We couldn't load your account profile. Please try again.
            If the problem continues, check your Firestore permissions
            and user document.
          </p>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Retrying..." : "Retry"}
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            <LogOut size={17} />
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </main>
    );
  }

  // Authenticated user does not have the required role.
  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ShieldX size={28} />
          </div>

          <h1 className="mt-5 text-xl font-black text-gray-900">
            Access denied
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Your account doesn't have permission to access this page.
            Please sign in with an authorized account.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
          >
            Return to homepage
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
