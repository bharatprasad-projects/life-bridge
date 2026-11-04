
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function UserDashboard() {
  return (
    <RoleGuard allowedRoles={["user"]}>
      <DashboardContent />
    </RoleGuard>
  );
}

function DashboardContent() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-red-600">
            Life Bridge
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="rounded-3xl bg-red-600 p-8 text-white">
          <p className="text-sm text-red-100">User Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold">
            Welcome, {profile?.name || user?.displayName || "User"}!
          </h1>
          <p className="mt-2 text-red-100">{user?.email}</p>
          <p className="mt-4 text-sm">
            Every donation can make a difference.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="Find Blood Banks"
            description="Search for nearby blood banks."
            href="/search"
          />
          <DashboardCard
            title="Become a Donor"
            description="Register as a blood donor."
            href="/donate"
          />
          <DashboardCard
            title="Find Blood"
            description="Explore blood availability."
            href="/search"
          />
        </div>
      </section>
    </main>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
    >
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <p className="mt-5 text-sm font-semibold text-red-600">
        Explore →
      </p>
    </Link>
  );
}
