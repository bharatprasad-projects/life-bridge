
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Activity,
  CheckCircle2,
  Clock,
  Droplet,
  Loader2,
  Mail,
  RefreshCw,
  XCircle,
} from "lucide-react";

type RequestStatus = "pending" | "confirmed" | "rejected";

type BloodRequest = {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  bloodBankId: string;
  bloodBankName: string;
  hospitalName?: string;
  bloodGroup: string;
  units: number;
  requiredDate: string;
  reason?: string;
  response?: string;
  status: RequestStatus;
  emailStatus?: string;
  createdAt?: string | null;
};

type Filter = "all" | RequestStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All requests" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
];

function formatBloodGroup(value: string) {
  return value
    .replace("_POSITIVE", "+")
    .replace("_NEGATIVE", "-");
}

function formatDate(value?: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function HospitalBloodRequests() {
  const { user } = useAuth();

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load blood requests.");
      }

      setRequests(data.requests || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load blood requests."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const pendingCount = requests.filter(
    (request) => request.status === "pending"
  ).length;

  const confirmedCount = requests.filter(
    (request) => request.status === "confirmed"
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "rejected"
  ).length;

  const filteredRequests = useMemo(() => {
    if (filter === "all") return requests;

    return requests.filter((request) => request.status === filter);
  }, [requests, filter]);

  async function updateRequest(
    requestId: string,
    status: "confirmed" | "rejected"
  ) {
    if (!user) return;

    const action = status === "confirmed" ? "confirm" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${action} this blood request?`
      )
    ) {
      return;
    }

    try {
      setProcessingId(requestId);
      setError("");
      setSuccess("");

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
        throw new Error(data.error || "Unable to update the request.");
      }

      setSuccess(data.message || "Request updated successfully.");

      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the request."
      );
    } finally {
      setProcessingId("");
    }
  }

  return (
    <section
      id="blood-requests"
      className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
              <Droplet size={21} />
            </div>

            <div>
              <h3 className="text-lg font-black">
                Patient Blood Requests
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Review and manage requests sent to your blood banks.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadRequests}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh requests
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 border-b border-gray-100 p-5 sm:grid-cols-3">
        <RequestStat
          label="Pending requests"
          value={pendingCount}
          icon={<Clock size={20} />}
          color="amber"
        />

        <RequestStat
          label="Confirmed requests"
          value={confirmedCount}
          icon={<CheckCircle2 size={20} />}
          color="green"
        />

        <RequestStat
          label="Rejected requests"
          value={rejectedCount}
          icon={<Activity size={20} />}
          color="red"
        />
      </div>

      {error && (
        <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          {success}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-gray-100 p-5">
        {FILTERS.map((item) => (
          <button
            type="button"
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              filter === item.value
                ? "bg-red-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item.label}
            {item.value === "pending" && pendingCount > 0
              ? ` (${pendingCount})`
              : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 size={19} className="animate-spin" />
          Loading patient requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center px-5 text-center">
          <div className="mb-4 rounded-2xl bg-red-50 p-4 text-red-500">
            <Droplet size={32} />
          </div>

          <h4 className="font-bold">No requests found</h4>

          <p className="mt-2 max-w-sm text-sm text-gray-500">
            {filter === "pending"
              ? "You have no pending patient requests."
              : "Requests matching this filter will appear here."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredRequests.map((request) => (
            <article key={request.id} className="p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-red-50 px-3 py-1.5 text-lg font-black text-red-600">
                      {formatBloodGroup(request.bloodGroup)}
                    </span>

                    <RequestStatusBadge status={request.status} />
                  </div>

                  <h4 className="mt-4 text-lg font-bold text-gray-900">
                    {request.patientName || "Patient"}
                  </h4>

                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <p>{request.patientEmail}</p>
                    <p>{request.patientPhone}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <p>
                      <span className="text-gray-500">Units:</span>{" "}
                      <strong>{request.units}</strong>
                    </p>

                    <p>
                      <span className="text-gray-500">Required:</span>{" "}
                      <strong>{request.requiredDate}</strong>
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 lg:min-w-64">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Requested blood bank
                  </p>

                  <p className="mt-2 font-bold text-gray-900">
                    {request.bloodBankName || "Blood bank"}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Request ID: {request.id}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Submitted: {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>

              {request.reason && (
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                  <strong>Additional information:</strong>{" "}
                  {request.reason}
                </div>
              )}

              {request.status === "pending" ? (
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-gray-700">
                      Message to patient (optional)
                    </span>

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
                      placeholder="Enter a response for the patient..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-500"
                    />
                  </label>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() =>
                        updateRequest(request.id, "confirmed")
                      }
                      disabled={processingId === request.id}
                      className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {processingId === request.id ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={17} />
                      )}
                      Confirm & email patient
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateRequest(request.id, "rejected")
                      }
                      disabled={processingId === request.id}
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle size={17} />
                      Reject request
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 text-sm text-gray-500">
                  {request.status === "confirmed" ? (
                    <>
                      <Mail size={16} />
                      Patient email status:{" "}
                      <strong>{request.emailStatus || "unknown"}</strong>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      This request was rejected.
                    </>
                  )}

                  {request.response && (
                    <p className="w-full">
                      Hospital response: {request.response}
                    </p>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function RequestStat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "amber" | "green" | "red";
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}
