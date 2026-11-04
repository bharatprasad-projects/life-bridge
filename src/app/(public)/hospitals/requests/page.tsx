
"use client";

import { useCallback, useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Droplet,
  Mail,
} from "lucide-react";
import Link from "next/link";

type BloodRequest = {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  bloodBankId: string;
  bloodBankName: string;
  bloodGroup: string;
  units: number;
  requiredDate: string;
  reason?: string;
  status: "pending" | "confirmed" | "rejected";
  emailStatus?: string;
  createdAt?: string | null;
  response?: string;
};

function HospitalRequestsContent() {
  const { user } = useAuth();

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [responses, setResponses] = useState<Record<string, string>>({});

  const loadRequests = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = await user.getIdToken();
      const response = await fetch("/api/hospital/blood-requests", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load requests.");
      }

      setRequests(data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load requests.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function updateRequest(requestId: string, status: "confirmed" | "rejected") {
    if (!user) return;

    const action = status === "confirmed" ? "confirm" : "reject";

    if (!window.confirm(`Are you sure you want to ${action} this request?`)) {
      return;
    }

    try {
      setProcessingId(requestId);
      setError("");
      setMessage("");

      const token = await user.getIdToken();
      const response = await fetch("/api/hospital/blood-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId,
          status,
          response: responses[requestId] || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update request.");
      }

      setMessage(data.message || "Request updated successfully.");
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update request.");
    } finally {
      setProcessingId("");
    }
  }

  const filteredRequests = requests.filter((request) =>
    filter === "all" ? true : request.status === filter
  );

  const pendingCount = requests.filter((item) => item.status === "pending").length;
  const confirmedCount = requests.filter((item) => item.status === "confirmed").length;
  const rejectedCount = requests.filter((item) => item.status === "rejected").length;

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <Link href="/hospital/dashboard" className="mb-2 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600">
              <ArrowLeft size={16} /> Hospital dashboard
            </Link>
            <h1 className="text-2xl font-black">Blood Requests</h1>
            <p className="mt-1 text-sm text-gray-500">Manage requests sent to your blood banks.</p>
          </div>

          <button
            onClick={loadRequests}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <Stat label="Pending" value={pendingCount} />
          <Stat label="Confirmed" value={confirmedCount} />
          <Stat label="Rejected" value={rejectedCount} />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {["all", "pending", "confirmed", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                filter === status
                  ? "bg-red-600 text-white"
                  : "border border-gray-200 bg-white text-gray-600"
              }`}
            >
              {status === "all" ? "All requests" : status}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 text-gray-500">
            <Loader2 className="animate-spin" />
            Loading requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-5 py-16 text-center">
            <Droplet className="mx-auto mb-4 text-red-400" size={38} />
            <h2 className="font-bold">No requests found</h2>
            <p className="mt-2 text-sm text-gray-500">
              New patient requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-red-50 px-3 py-1.5 text-lg font-black text-red-600">
                        {request.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")}
                      </span>
                      <Status status={request.status} />
                    </div>

                    <h2 className="mt-4 text-lg font-bold">{request.patientName}</h2>
                    <p className="mt-1 text-sm text-gray-500">{request.patientEmail}</p>
                    <p className="mt-1 text-sm text-gray-500">{request.patientPhone}</p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4 sm:min-w-64">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Blood bank</p>
                    <p className="mt-1 font-bold">{request.bloodBankName}</p>
                    <p className="mt-3 text-sm text-gray-600">
                      Requested units: <strong>{request.units}</strong>
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Required date: <strong>{request.requiredDate}</strong>
                    </p>
                  </div>
                </div>

                {request.reason && (
                  <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                    <strong>Additional information:</strong> {request.reason}
                  </div>
                )}

                {request.status === "pending" ? (
                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <label className="mb-3 block">
                      <span className="mb-2 block text-sm font-semibold">Response to patient (optional)</span>
                      <textarea
                        rows={2}
                        maxLength={1000}
                        value={responses[request.id] || ""}
                        onChange={(event) =>
                          setResponses((previous) => ({
                            ...previous,
                            [request.id]: event.target.value,
                          }))
                        }
                        placeholder="Add a message for the patient"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                      />
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => updateRequest(request.id, "confirmed")}
                        disabled={processingId === request.id}
                        className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {processingId === request.id ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                        Confirm request & email patient
                      </button>

                      <button
                        onClick={() => updateRequest(request.id, "rejected")}
                        disabled={processingId === request.id}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 disabled:opacity-50"
                      >
                        <XCircle size={17} />
                        Reject request
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 text-sm text-gray-500">
                    {request.status === "confirmed" ? (
                      <>
                        <Mail size={16} />
                        Patient email: {request.emailStatus || "unknown"}
                      </>
                    ) : (
                      <>
                        <Clock size={16} />
                        Request rejected
                      </>
                    )}
                    {request.response && <p className="w-full">Hospital response: {request.response}</p>}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

function Status({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
  };

  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function HospitalRequestsPage() {
  return (
    <RoleGuard allowedRoles={["hospital"]}>
      <HospitalRequestsContent />
    </RoleGuard>
  );
}
