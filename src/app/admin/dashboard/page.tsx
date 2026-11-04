
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Droplet,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";

type Statistics = {
  users: number;
  hospitals: number;
  bloodBanks: number;
  bloodRequests: number;
  applications: number;
  pendingApplications: number;
};

type Application = {
  id: string;
  hospitalName: string;
  email: string;
  city: string;
  district: string;
  status: string;
  submittedAt: string | null;
};

type BloodRequest = {
  id: string;
  patientName: string;
  bloodGroup: string;
  units: number;
  bloodBankName: string;
  status: string;
  createdAt: string | null;
};

const EMPTY_STATS: Statistics = {
  users: 0,
  hospitals: 0,
  bloodBanks: 0,
  bloodRequests: 0,
  applications: 0,
  pendingApplications: 0,
};

const navigation = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    label: "Hospital Approvals",
    icon: Building2,
    href: "/admin/hospital-approvals",
  },
];

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function readResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Invalid server response (HTTP ${response.status}). Check the API route and terminal output.`
    );
  }
}

function AdminDashboardContent() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();

  const [statistics, setStatistics] = useState(EMPTY_STATS);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recentRequests, setRecentRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = await user.getIdToken();

      const response = await fetch("/api/admin/overview", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to load dashboard.");
      }

      setStatistics(data.statistics || EMPTY_STATS);
      setApplications(data.recentApplications || []);
      setRecentRequests(data.recentRequests || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const cards = [
    {
      title: "Registered Users",
      value: statistics.users,
      description: "Total platform accounts",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Hospitals",
      value: statistics.hospitals,
      description: "Registered hospital accounts",
      icon: Building2,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Blood Banks",
      value: statistics.bloodBanks,
      description: "Blood bank records",
      icon: Droplet,
      color: "bg-red-50 text-red-600",
    },
    {
      title: "Blood Requests",
      value: statistics.bloodRequests,
      description: "Total patient requests",
      icon: Activity,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      <div className="flex min-h-screen">
        {mobileMenuOpen && (
          <button
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-100 bg-white transition-transform lg:static lg:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-20 items-center justify-between border-b border-gray-100 px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
                <Droplet size={23} fill="currentColor" />
              </div>

              <div>
                <h1 className="text-xl font-black tracking-tight">
                  Life <span className="text-red-600">Bridge</span>
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400">
                  Admin Console
                </p>
              </div>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-5 pt-8">
            <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[1.5px] text-gray-400">
              Main Menu
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/admin/dashboard";

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-red-50 text-red-600"
                        : "text-gray-500 hover:bg-gray-50 hover:text-red-600"
                    }`}
                  >
                    <Icon size={19} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-gray-100 p-5">
            <div className="mb-4 rounded-xl bg-gray-50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                  {(profile?.name || "A").charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {profile?.name || "Administrator"}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {profile?.email || user?.email}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-100 bg-white/95 px-5 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
              >
                <Menu size={22} />
              </button>

              <div>
                <p className="text-xs font-medium text-gray-400">
                  Life Bridge / Admin
                </p>
                <h2 className="text-lg font-black sm:text-xl">
                  Dashboard Overview
                </h2>
              </div>
            </div>

            <button
              onClick={loadDashboard}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </header>

          <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold text-red-600">
                  ADMINISTRATION
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  Welcome back, {profile?.name?.split(" ")[0] || "Admin"}!
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Here's what's happening across your Life Bridge platform.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-2.5 text-xs font-bold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Admin access active
              </div>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <XCircle size={19} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`rounded-xl p-3 ${card.color}`}>
                        <Icon size={22} />
                      </div>
                      <ArrowUpRight size={18} className="text-gray-300" />
                    </div>

                    <p className="mt-5 text-sm font-semibold text-gray-500">
                      {card.title}
                    </p>

                    <div className="mt-1 text-3xl font-black tracking-tight">
                      {loading ? (
                        <span className="inline-block h-9 w-16 animate-pulse rounded-lg bg-gray-100" />
                      ) : (
                        card.value.toLocaleString("en-IN")
                      )}
                    </div>

                    <p className="mt-2 text-xs text-gray-400">
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mb-8 grid gap-5 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black">
                      Hospital Applications
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Review hospital registrations.
                    </p>
                  </div>

                  <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                    <Building2 size={22} />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold text-gray-500">
                      Total applications
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {loading ? "—" : statistics.applications}
                    </p>
                  </div>

                  <div className="rounded-xl bg-orange-50 p-4">
                    <p className="text-xs font-semibold text-orange-700">
                      Awaiting review
                    </p>
                    <p className="mt-2 text-2xl font-black text-orange-700">
                      {loading ? "—" : statistics.pendingApplications}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-sm font-bold">
                      Recent applications
                    </h4>

                    <Link
                      href="/admin/hospital-approvals"
                      className="text-xs font-bold text-red-600 hover:text-red-700"
                    >
                      View all applications
                    </Link>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-10 text-gray-400">
                      <Loader2 className="animate-spin" size={22} />
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="rounded-xl bg-gray-50 py-10 text-center">
                      <Building2
                        className="mx-auto text-gray-300"
                        size={30}
                      />
                      <p className="mt-3 text-sm font-semibold text-gray-500">
                        No hospital applications yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applications.map((application) => (
                        <div
                          key={application.id}
                          className="flex flex-col justify-between gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">
                              {application.hospitalName}
                            </p>
                            <p className="mt-1 truncate text-xs text-gray-500">
                              {application.email}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {[application.city, application.district]
                                .filter(Boolean)
                                .join(", ") || "Location unavailable"}
                              {" · "}
                              {formatDate(application.submittedAt)}
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                              application.status === "approved"
                                ? "bg-green-50 text-green-700"
                                : application.status === "rejected"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-orange-50 text-orange-700"
                            }`}
                          >
                            {application.status || "pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black">Platform Health</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Current platform totals.
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-50 p-3 text-green-600">
                    <Activity size={22} />
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {[
                    {
                      label: "Registered hospitals",
                      value: statistics.hospitals,
                      color: "bg-purple-500",
                    },
                    {
                      label: "Blood banks",
                      value: statistics.bloodBanks,
                      color: "bg-red-500",
                    },
                    {
                      label: "Patient requests",
                      value: statistics.bloodRequests,
                      color: "bg-orange-500",
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-500">
                          {item.label}
                        </span>
                        <span className="font-black">{item.value}</span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full w-full rounded-full ${item.color}`} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-xl bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <ShieldCheck size={18} />
                    <p className="text-sm font-bold">Life Bridge Mission</p>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-red-700/80">
                    Connecting people who need blood with hospitals and donors
                    who can help save lives.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black">
                    Recent Blood Requests
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Latest patient requests across the platform.
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-3 text-red-600">
                  <Droplet size={22} />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-10 text-gray-400">
                  <Loader2 className="animate-spin" size={22} />
                </div>
              ) : recentRequests.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-gray-500">
                    No blood requests found.
                  </p>
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                        <th className="pb-3 font-bold">Patient</th>
                        <th className="pb-3 font-bold">Blood group</th>
                        <th className="pb-3 font-bold">Units</th>
                        <th className="pb-3 font-bold">Blood bank</th>
                        <th className="pb-3 font-bold">Status</th>
                        <th className="pb-3 font-bold">Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentRequests.map((request) => (
                        <tr
                          key={request.id}
                          className="border-b border-gray-50 text-sm last:border-0"
                        >
                          <td className="py-4 font-bold">
                            {request.patientName}
                          </td>

                          <td className="py-4">
                            <span className="rounded-lg bg-red-50 px-2.5 py-1 font-bold text-red-600">
                              {request.bloodGroup
                                .replace("_POSITIVE", "+")
                                .replace("_NEGATIVE", "-")}
                            </span>
                          </td>

                          <td className="py-4 text-gray-600">
                            {request.units}
                          </td>

                          <td className="py-4 text-gray-600">
                            {request.bloodBankName}
                          </td>

                          <td className="py-4">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold capitalize text-gray-600">
                              {request.status}
                            </span>
                          </td>

                          <td className="py-4 text-xs text-gray-500">
                            {formatDate(request.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row">
              <p>
                © {new Date().getFullYear()} Life Bridge. All rights reserved.
              </p>
              <p>Built to connect lives and save lives.</p>
            </footer>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function AdminDashboard() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminDashboardContent />
    </RoleGuard>
  );
}
