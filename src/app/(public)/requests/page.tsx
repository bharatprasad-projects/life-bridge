
"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Droplet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const BLOOD_GROUPS = [
  { value: "A_POSITIVE", label: "A+" },
  { value: "A_NEGATIVE", label: "A-" },
  { value: "B_POSITIVE", label: "B+" },
  { value: "B_NEGATIVE", label: "B-" },
  { value: "AB_POSITIVE", label: "AB+" },
  { value: "AB_NEGATIVE", label: "AB-" },
  { value: "O_POSITIVE", label: "O+" },
  { value: "O_NEGATIVE", label: "O-" },
];

type Bank = {
  id: string;
  bloodBankName: string;
  hospitalName?: string;
  address: string;
  city: string;
  district: string;
  state: string;
  phone: string;
  status?: string;
};

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function RequestForm() {
  const searchParams = useSearchParams();
  const bloodBankId = searchParams.get("bloodBankId") || "";

  const { user, profile, loading: authLoading } = useAuth();

  const [bank, setBank] = useState<Bank | null>(null);
  const [bankLoading, setBankLoading] = useState(true);

  const [bloodGroup, setBloodGroup] = useState("A_POSITIVE");
  const [units, setUnits] = useState("1");
  const [phone, setPhone] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBank() {
      if (!bloodBankId) {
        setError("No blood bank was selected. Please select a blood bank first.");
        setBankLoading(false);
        return;
      }

      try {
        setBankLoading(true);
        setError("");

        const response = await fetch("/api/public/homepage-data", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load blood bank.");
        }

        const found = (data.bloodBanks || []).find(
          (item: Bank) => item.id === bloodBankId
        );

        if (!found) {
          throw new Error("Blood bank not found or no longer available.");
        }

        if (!cancelled) {
          setBank(found);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load blood bank."
          );
        }
      } finally {
        if (!cancelled) {
          setBankLoading(false);
        }
      }
    }

    loadBank();

    return () => {
      cancelled = true;
    };
  }, [bloodBankId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!user) {
      setError("Please log in before submitting a blood request.");
      return;
    }

    if (!bloodBankId || !bank) {
      setError("Please select a valid blood bank.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      setError("Please enter a valid 10-digit contact phone number.");
      return;
    }

    const unitCount = Number(units);

    if (!Number.isInteger(unitCount) || unitCount < 1 || unitCount > 20) {
      setError("Please enter a number of units between 1 and 20.");
      return;
    }

    if (!requiredDate) {
      setError("Please select when you need the blood.");
      return;
    }

    if (requiredDate < getLocalDate()) {
      setError("The required date cannot be in the past.");
      return;
    }

    try {
      setSubmitting(true);

      const token = await user.getIdToken();

      const response = await fetch("/api/blood-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bloodBankId,
          bloodGroup,
          units: unitCount,
          phone: phone.trim(),
          requiredDate,
          reason: reason.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || `Request failed with status ${response.status}.`
        );
      }

      setSuccess(
        `Your blood request has been submitted successfully. Request ID: ${
          data.requestId || "Submitted"
        }`
      );

      setPhone("");
      setReason("");
      setRequiredDate("");
      setUnits("1");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || bankLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="animate-spin text-red-600" />
          Loading request form...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-5">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <Droplet className="mx-auto mb-4 text-red-600" size={40} />
          <h1 className="text-2xl font-black">Login required</h1>

          <p className="mt-2 text-sm text-gray-500">
            Please log in to submit a blood request.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-red-600 px-6 py-3 font-bold text-white"
          >
            Login to continue
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href={bloodBankId ? `/blood-banks/${bloodBankId}` : "/search"}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-red-600"
        >
          <ArrowLeft size={17} />
          Back
        </Link>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <Droplet size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-black">Request Blood</h1>
              <p className="text-sm text-gray-500">
                Submit your request to the selected blood bank.
              </p>
            </div>
          </div>

          {bank && (
            <div className="mb-6 rounded-xl bg-gray-50 p-4">
              <p className="font-bold">{bank.bloodBankName}</p>

              <p className="mt-1 text-sm text-gray-500">
                {bank.hospitalName}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {bank.address}, {bank.city}, {bank.district}
              </p>

              {bank.status &&
                bank.status.toLowerCase() !== "active" && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    This listing may not currently be active. The server will
                    verify availability when you submit.
                  </p>
                )}
            </div>
          )}

          <div className="mb-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
            Requesting as{" "}
            <strong>
              {profile?.name || user.displayName || "Patient"}
            </strong>
            <br />
            Email: <strong>{user.email}</strong>
          </div>

          {success && (
            <div
              role="status"
              className="mb-5 flex gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-700"
            >
              <CheckCircle2 size={19} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-5 flex gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={19} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Blood group
              </span>

              <select
                value={bloodGroup}
                onChange={(event) => setBloodGroup(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-red-500"
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Number of units
              </span>

              <input
                type="number"
                min="1"
                max="20"
                required
                value={units}
                onChange={(event) => setUnits(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Contact phone number
              </span>

              <input
                type="tel"
                inputMode="numeric"
                required
                pattern="[0-9]{10}"
                maxLength={10}
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="10-digit phone number"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                When do you need the blood?
              </span>

              <input
                type="date"
                required
                min={getLocalDate()}
                value={requiredDate}
                onChange={(event) => setRequiredDate(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Additional information (optional)
              </span>

              <textarea
                rows={3}
                maxLength={1000}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Add any relevant information"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
              />
            </label>

            <button
              type="submit"
              disabled={submitting || !bank}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <Loader2 size={18} className="animate-spin" />
              )}

              {submitting ? "Submitting..." : "Submit Blood Request"}
            </button>

            <p className="text-center text-xs text-gray-400">
              Your request will be sent to the selected blood bank for
              confirmation.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function BloodRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-gray-500">
          Loading request form...
        </div>
      }
    >
      <RequestForm />
    </Suspense>
  );
}
