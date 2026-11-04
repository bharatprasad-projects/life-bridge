"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";
import HospitalBloodRequests from "@/components/HospitalBloodRequests";

import {
  Building2,
  Droplet,
  Plus,
  MapPin,
  RefreshCw,
  CheckCircle2,
  Loader2,
  X,
  Activity,
  ArrowDown,
} from "lucide-react";

const BLOOD_GROUPS = [
  { key: "A_POSITIVE", label: "A+" },
  { key: "A_NEGATIVE", label: "A-" },
  { key: "B_POSITIVE", label: "B+" },
  { key: "B_NEGATIVE", label: "B-" },
  { key: "AB_POSITIVE", label: "AB+" },
  { key: "AB_NEGATIVE", label: "AB-" },
  { key: "O_POSITIVE", label: "O+" },
  { key: "O_NEGATIVE", label: "O-" },
];

type BloodBank = {
  id: string;
  hospitalName?: string;
  bloodBankName: string;
  bloodBankType: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  status: string;
  inventory: Record<string, number>;
  inventoryUpdatedAt?: string | null;
};

const initialForm = {
  bloodBankName: "",
  bloodBankType: "Hospital Blood Bank",
  phone: "",
  address: "",
  city: "",
  district: "",
  state: "Kerala",
  pincode: "",
  latitude: "",
  longitude: "",
  operatingHours: "",
  emergencyContact: "",
  services: ["Blood Storage", "Blood Issue"],
  inventory: {
    A_POSITIVE: 0,
    A_NEGATIVE: 0,
    B_POSITIVE: 0,
    B_NEGATIVE: 0,
    AB_POSITIVE: 0,
    AB_NEGATIVE: 0,
    O_POSITIVE: 0,
    O_NEGATIVE: 0,
  },
};

function HospitalDashboardContent() {
  const { user, profile } = useAuth();

  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(initialForm);

  const loadBloodBanks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await user.getIdToken();

      const response = await fetch("/api/hospital/blood-banks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load blood banks.");
      }

      setBloodBanks(data.bloodBanks || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load blood banks."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBloodBanks();
  }, [loadBloodBanks]);

  const totalUnits = bloodBanks.reduce((total, bank) => {
    return (
      total +
      Object.values(bank.inventory || {}).reduce(
        (sum, units) => sum + Number(units || 0),
        0
      )
    );
  }, 0);

  function updateField(name: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function updateInventory(group: string, value: string) {
    setForm((previous) => ({
      ...previous,
      inventory: {
        ...previous.inventory,
        [group]: Math.max(0, Number(value) || 0),
      },
    }));
  }

  function toggleService(service: string) {
    setForm((previous) => ({
      ...previous,
      services: previous.services.includes(service)
        ? previous.services.filter((item) => item !== service)
        : [...previous.services, service],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = await user.getIdToken();

      const response = await fetch("/api/hospital/blood-banks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to publish blood bank.");
      }

      setSuccess(data.message || "Blood bank published successfully.");
      setForm(initialForm);
      setShowForm(false);

      await loadBloodBanks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to publish blood bank."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] pb-12 text-gray-900">
      {/* HEADER */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-600 p-3 text-white">
              <Droplet size={22} fill="white" />
            </div>

            <div>
              <h1 className="text-xl font-black">
                Life<span className="text-red-600">Bridge</span>
              </h1>
              <p className="text-xs text-gray-500">Hospital Portal</p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadBloodBanks}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        {/* INTRO */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-xs font-bold tracking-widest text-red-600">
              HOSPITAL MANAGEMENT
            </p>

            <h2 className="text-3xl font-black">
              Welcome, {profile?.name || "Hospital"}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Manage your blood bank listings and blood availability.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                document.getElementById("blood-requests")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 font-bold text-red-600 hover:bg-red-50"
            >
              <ArrowDown size={18} />
              Blood Requests
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setShowForm(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white shadow-lg shadow-red-100 hover:bg-red-700"
            >
              <Plus size={19} />
              Add Blood Bank
            </button>
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {/* STATISTICS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Building2 size={22} />}
            label="My Blood Banks"
            value={bloodBanks.length}
          />

          <StatCard
            icon={<Droplet size={22} />}
            label="Available Blood Units"
            value={totalUnits}
          />

          <StatCard
            icon={<Activity size={22} />}
            label="Active Listings"
            value={bloodBanks.filter((bank) => bank.status === "active").length}
          />
        </div>

        {/* PATIENT BLOOD REQUESTS */}
        <div className="mb-8">
          <HospitalBloodRequests />
        </div>

        {/* BLOOD BANK LISTINGS */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <h3 className="font-bold">My Blood Bank Listings</h3>

            <p className="mt-1 text-xs text-gray-500">
              Your published blood banks are visible to Life Bridge users.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 size={19} className="animate-spin" />
              Loading your listings...
            </div>
          ) : bloodBanks.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <div className="mb-4 rounded-2xl bg-red-50 p-4 text-red-500">
                <Building2 size={34} />
              </div>

              <h4 className="font-bold">No blood banks added yet</h4>

              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Add your first blood bank to make its details and blood
                availability available on Life Bridge.
              </p>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white"
              >
                Add Your First Blood Bank
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {bloodBanks.map((bank) => {
                const units = Object.values(bank.inventory || {}).reduce(
                  (sum, value) => sum + Number(value || 0),
                  0
                );

                return (
                  <div
                    key={bank.id}
                    className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-red-50 p-3 text-red-600">
                        <Building2 size={23} />
                      </div>

                      <div>
                        <h4 className="font-bold">{bank.bloodBankName}</h4>

                        <p className="mt-1 text-sm text-gray-500">
                          {bank.bloodBankType}
                        </p>

                        <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={13} />
                          {bank.city}, {bank.district}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                        {bank.status}
                      </span>

                      <span className="rounded-xl bg-gray-50 px-3 py-2 text-sm font-semibold">
                        {units} units
                      </span>

                      <a
                        href={`/blood-banks/${bank.id}`}
                        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
                      >
                        View listing
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ADD BLOOD BANK MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5">
          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-5">
              <div>
                <h3 className="text-lg font-black">Add Blood Bank</h3>

                <p className="mt-1 text-xs text-gray-500">
                  Complete the details to publish your listing.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full p-2 hover:bg-gray-100"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-5">
              <FormSection title="Blood Bank Information">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput
                    label="Blood Bank Name"
                    required
                    value={form.bloodBankName}
                    onChange={(value) => updateField("bloodBankName", value)}
                    placeholder="Enter blood bank name"
                  />

                  <FormSelect
                    label="Blood Bank Type"
                    value={form.bloodBankType}
                    onChange={(value) => updateField("bloodBankType", value)}
                    options={[
                      "Hospital Blood Bank",
                      "Government Blood Bank",
                      "Private Blood Bank",
                      "Standalone Blood Bank",
                    ]}
                  />
                </div>
              </FormSection>

              <FormSection title="Contact Information">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput
                    label="Contact Number"
                    required
                    value={form.phone}
                    onChange={(value) => updateField("phone", value)}
                    placeholder="10-digit phone number"
                    inputType="tel"
                  />

                  <FormInput
                    label="Emergency Contact"
                    value={form.emergencyContact}
                    onChange={(value) =>
                      updateField("emergencyContact", value)
                    }
                    placeholder="Optional emergency number"
                  />
                </div>

                <FormInput
                  label="Operating Hours"
                  value={form.operatingHours}
                  onChange={(value) => updateField("operatingHours", value)}
                  placeholder="Example: 24 hours"
                />
              </FormSection>

              <FormSection title="Location Details">
                <FormInput
                  label="Street Address"
                  required
                  value={form.address}
                  onChange={(value) => updateField("address", value)}
                  placeholder="Building, street and locality"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput
                    label="City"
                    required
                    value={form.city}
                    onChange={(value) => updateField("city", value)}
                    placeholder="City"
                  />

                  <FormInput
                    label="District"
                    required
                    value={form.district}
                    onChange={(value) => updateField("district", value)}
                    placeholder="District"
                  />

                  <FormInput
                    label="State"
                    required
                    value={form.state}
                    onChange={(value) => updateField("state", value)}
                    placeholder="State"
                  />

                  <FormInput
                    label="Pincode"
                    required
                    value={form.pincode}
                    onChange={(value) => updateField("pincode", value)}
                    placeholder="6-digit pincode"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput
                    label="Latitude (optional)"
                    value={form.latitude}
                    onChange={(value) => updateField("latitude", value)}
                    placeholder="Example: 9.4981"
                    inputType="number"
                  />

                  <FormInput
                    label="Longitude (optional)"
                    value={form.longitude}
                    onChange={(value) => updateField("longitude", value)}
                    placeholder="Example: 76.3388"
                    inputType="number"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  Map coordinates help users find the nearest blood bank. You
                  can add them later if you do not have them now.
                </p>
              </FormSection>

              <FormSection title="Available Blood Inventory">
                <p className="mb-4 text-xs text-gray-500">
                  Enter the current number of available units for each group.
                  Use zero if none are available.
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {BLOOD_GROUPS.map((group) => (
                    <label key={group.key}>
                      <span className="mb-2 block text-sm font-bold">
                        {group.label}
                      </span>

                      <input
                        type="number"
                        min="0"
                        max="100000"
                        value={
                          form.inventory[
                            group.key as keyof typeof form.inventory
                          ]
                        }
                        onChange={(event) =>
                          updateInventory(group.key, event.target.value)
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-red-500"
                      />
                    </label>
                  ))}
                </div>
              </FormSection>

              <FormSection title="Services">
                <div className="flex flex-wrap gap-2">
                  {[
                    "Blood Collection",
                    "Blood Storage",
                    "Blood Testing",
                    "Blood Issue",
                    "Component Separation",
                    "Emergency Service",
                  ].map((service) => {
                    const selected = form.services.includes(service);

                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                          selected
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-gray-200 bg-white text-gray-600"
                        }`}
                      >
                        {selected ? "✓ " : "+ "}
                        {service}
                      </button>
                    );
                  })}
                </div>
              </FormSection>

              <div className="rounded-xl bg-green-50 p-4 text-xs leading-5 text-green-800">
                Your blood bank listing will become publicly visible as soon as
                it is submitted. Please enter accurate details and keep
                inventory updated.
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}

                  {submitting ? "Publishing..." : "Publish Blood Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 inline-flex rounded-xl bg-red-50 p-3 text-red-600">
        {icon}
      </div>

      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-100 p-5">
      <h4 className="font-bold">{title}</h4>
      {children}
    </section>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  inputType = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  inputType?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-600">*</span>}
      </span>

      <input
        type={inputType}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-500"
      />
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-500"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export default function HospitalDashboardPage() {
  return (
    <RoleGuard allowedRoles={["hospital"]}>
      <HospitalDashboardContent />
    </RoleGuard>
  );
}