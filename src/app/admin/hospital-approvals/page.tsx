
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type Application = {
  id: string;
  hospitalName?: string;
  bloodBankName?: string;
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  city?: string;
  district?: string;
  state?: string;
  address?: string;
  pincode?: string;
  status?: string;
  submittedAt?: string | null;
  [key: string]: unknown;
};

type Filter = "all" | "pending" | "approved" | "rejected";

function formatDate(value?: string | null) {
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
      `The server returned an invalid response (HTTP ${response.status}). Check the API route and terminal output.`
    );
  }
}

function HospitalApprovalsContent() {
  const { user } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadApplications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = await user.getIdToken();

      const response = await fetch("/api/admin/hospital-applications", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to load hospital applications.");
      }

      const list = Array.isArray(data.applications)
        ? data.applications
        : Array.isArray(data.hospitalApplications)
          ? data.hospitalApplications
          : Array.isArray(data.data)
            ? data.data
            : [];

      setApplications(list);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load hospital applications."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  async function reviewApplication(
    applicationId: string,
    decision: "approved" | "rejected"
  ) {
    if (!user) return;

    const action = decision === "approved" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this hospital application?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(applicationId);
      setError("");
      setMessage("");

      const token = await user.getIdToken();

      const response = await fetch("/api/admin/hospital-applications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          applicationId,
          decision,
        }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to update application.");
      }

      setMessage(
        data.message ||
          `Hospital application ${decision} successfully.`
      );

      await loadApplications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update application."
      );
    } finally {
      setProcessingId("");
    }
  }

  const counts = useMemo(() => {
    return {
      all: applications.length,
      pending: applications.filter(
        (item) => item.status?.toLowerCase() === "pending"
      ).length,
      approved: applications.filter(
        (item) => item.status?.toLowerCase() === "approved"
      ).length,
      rejected: applications.filter(
        (item) => item.status?.toLowerCase() === "rejected"
      ).length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const status = (application.status || "pending").toLowerCase();

      const matchesFilter =
        filter === "all" || status === filter;

      const hospitalName =
        application.hospitalName ||
        application.bloodBankName ||
        application.name ||
        "";

      const searchableText = [
        hospitalName,
        application.email,
        application.phone,
        application.mobile,
        application.city,
        application.district,
        application.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchableText.includes(query);
    });
  }, [applications, filter, search]);

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-100 bg-white px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-gray-50"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <p className="text-xs text-gray-400">
              Life Bridge / Admin
            </p>
            <h1 className="text-lg font-black sm:text-xl">
              Hospital Approvals
            </h1>
          </div>
        </div>

        <button
          onClick={loadApplications}
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
        <div className="mb-8">
          <p className="text-sm font-bold text-red-600">
            ADMINISTRATION
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight">
            Hospital Applications
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Review and manage hospital registration requests.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <XCircle size={19} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 size={19} className="shrink-0" />
            <p>{message}</p>
          </div>
        )}

        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Applications",
              value: counts.all,
              icon: Building2,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Pending Review",
              value: counts.pending,
              icon: Clock3,
              color: "bg-orange-50 text-orange-600",
            },
            {
              label: "Approved",
              value: counts.approved,
              icon: CheckCircle2,
              color: "bg-green-50 text-green-600",
            },
            {
              label: "Rejected",
              value: counts.rejected,
              icon: XCircle,
              color: "bg-red-50 text-red-600",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className={`rounded-xl p-3 ${item.color}`}>
                    <Icon size={21} />
                  </div>
                </div>

                <p className="mt-5 text-sm font-semibold text-gray-500">
                  {item.label}
                </p>

                <p className="mt-1 text-3xl font-black">
                  {loading ? "—" : item.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search hospital, email or location..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["pending", "Pending"],
                ["approved", "Approved"],
                ["rejected", "Rejected"],
                ["all", "All"],
              ] as [Filter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-lg px-4 py-2.5 text-xs font-bold transition ${
                  filter === value
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
                <span className="ml-2 opacity-75">
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white py-20 text-center">
              <RefreshCw
                size={25}
                className="mx-auto animate-spin text-red-500"
              />
              <p className="mt-3 text-sm text-gray-500">
                Loading hospital applications...
              </p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white px-5 py-16 text-center">
              <Building2
                size={38}
                className="mx-auto text-gray-300"
              />
              <h3 className="mt-4 text-lg font-bold">
                No applications found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                There are no applications matching this filter.
              </p>
            </div>
          ) : (
            filteredApplications.map((application) => {
              const hospitalName =
                application.hospitalName ||
                application.bloodBankName ||
                application.name ||
                "Unnamed hospital";

              const status = (
                application.status || "pending"
              ).toLowerCase();

              const location = [
                application.city,
                application.district,
                application.state,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <article
                  key={application.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <Building2 size={27} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-black">
                            {hospitalName}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                              status === "approved"
                                ? "bg-green-50 text-green-700"
                                : status === "rejected"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-orange-50 text-orange-700"
                            }`}
                          >
                            {status}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-gray-500 sm:grid-cols-2">
                          {application.email && (
                            <p className="flex items-center gap-2 break-all">
                              <Mail
                                size={15}
                                className="shrink-0"
                              />
                              {application.email}
                            </p>
                          )}

                          {(application.phone || application.mobile) && (
                            <p className="flex items-center gap-2">
                              <Phone
                                size={15}
                                className="shrink-0"
                              />
                              {application.phone || application.mobile}
                            </p>
                          )}

                          {location && (
                            <p className="flex items-center gap-2 sm:col-span-2">
                              <MapPin
                                size={15}
                                className="shrink-0"
                              />
                              {location}
                            </p>
                          )}

                          {application.address && (
                            <p className="text-xs text-gray-400 sm:col-span-2">
                              {application.address}
                              {application.pincode
                                ? ` - ${application.pincode}`
                                : ""}
                            </p>
                          )}
                        </div>

                        <p className="mt-3 text-xs text-gray-400">
                          Submitted: {formatDate(application.submittedAt)}
                        </p>
                      </div>
                    </div>

                    {status === "pending" && (
                      <div className="flex shrink-0 gap-2 lg:pt-1">
                        <button
                          disabled={processingId === application.id}
                          onClick={() =>
                            reviewApplication(application.id, "approved")
                          }
                          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} />
                          {processingId === application.id
                            ? "Processing..."
                            : "Approve"}
                        </button>

                        <button
                          disabled={processingId === application.id}
                          onClick={() =>
                            reviewApplication(application.id, "rejected")
                          }
                          className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5">
          <div className="flex items-center gap-3 text-red-700">
            <ShieldCheck size={21} />
            <p className="font-bold">Admin review reminder</p>
          </div>

          <p className="mt-2 text-sm leading-6 text-red-700/80">
            Approving an application grants the hospital account access
            according to the existing hospital approval workflow. Review
            the submitted details before making a decision.
          </p>
        </div>
      </section>
    </main>
  );
}

export default function HospitalApprovalsPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <HospitalApprovalsContent />
    </RoleGuard>
  );
}
