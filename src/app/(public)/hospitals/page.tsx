
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  Building2,
  MapPin,
  Phone,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Droplet,
  Loader2,
} from "lucide-react";

import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function HospitalRegistrationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    hospitalName: "",
    bloodBankName: "",
    registrationNumber: "",
    contactPerson: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    state: "Kerala",
    pincode: "",
    bloodBankType: "Hospital Blood Bank",
    services: ["Blood Collection", "Blood Storage"],
  });

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
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

    setError("");
    setSuccess(false);

    if (!user) {
      router.push("/login");
      return;
    }

    if (form.services.length === 0) {
      setError("Please select at least one hospital service.");
      return;
    }

    setSubmitting(true);

    try {
      const applicationRef = doc(
        db,
        "hospitalApplications",
        user.uid
      );

      const existingApplication = await getDoc(applicationRef);

      if (existingApplication.exists()) {
        setError(
          "An application already exists for this account. Contact the administrator for assistance."
        );
        return;
      }

      await setDoc(applicationRef, {
        uid: user.uid,

        hospitalName: form.hospitalName.trim(),
        bloodBankName: form.bloodBankName.trim(),
        registrationNumber: form.registrationNumber.trim(),

        contactPerson: form.contactPerson.trim(),
        email: user.email || "",
        phone: form.phone.trim(),

        address: form.address.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        state: form.state,
        pincode: form.pincode.trim(),

        bloodBankType: form.bloodBankType,
        services: form.services,

        status: "pending",
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);
    } catch (err) {
      console.error("Hospital registration error:", err);

      setError(
        "Unable to submit your application. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-red-600" size={32} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center shadow-sm">
          <Building2 size={45} className="mx-auto text-red-600" />

          <h1 className="mt-5 text-2xl font-black text-gray-900">
            Hospital Registration
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Please sign in with your Google account before registering
            your hospital.
          </p>

          <Link
            href="/login"
            className="mt-7 inline-flex rounded-xl bg-red-600 px-6 py-3 font-bold text-white"
          >
            Continue with Google
          </Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-5 py-10">
        <div className="max-w-lg w-full rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={42} className="text-green-600" />
          </div>

          <h1 className="mt-6 text-2xl font-black text-gray-900">
            Application Submitted!
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Your hospital registration has been submitted successfully.
            Our Life Bridge administration team will review your
            application.
          </p>

          <div className="mt-7 rounded-2xl bg-yellow-50 p-5 text-left">
            <p className="font-bold text-yellow-800">
              Application status: Pending
            </p>
            <p className="mt-1 text-sm text-yellow-700">
              Hospital dashboard access will be available after
              administrative approval.
            </p>
          </div>

          <Link
            href="/"
            className="mt-7 inline-flex rounded-xl bg-red-600 px-6 py-3 font-bold text-white"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-gray-900 pb-12">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-xl bg-red-600 p-2 text-white">
              <Droplet size={23} fill="white" />
            </div>

            <span className="text-xl font-black">
              Life<span className="text-red-600">Bridge</span>
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600"
          >
            <ArrowLeft size={17} />
            Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 pt-8">
        {/* INTRO */}
        <div className="overflow-hidden rounded-3xl bg-[#a31235] p-7 text-white sm:p-9">
          <div className="flex items-center gap-2 text-red-100">
            <Building2 size={20} />
            <span className="text-xs font-bold tracking-widest">
              HOSPITAL PARTNERSHIP
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black sm:text-4xl">
            Register Your Hospital
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-red-100">
            Join Life Bridge and help connect patients with blood banks
            and essential blood services.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-red-100">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={16} />
              Verified hospital network
            </span>

            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              Admin-reviewed applications
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-6">
          {/* ACCOUNT */}
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <SectionHeading
              icon={<ShieldCheck size={21} />}
              title="Account Information"
              description="Your Google account is associated with this application."
            />

            <div className="mt-6 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500">
                REGISTERED GOOGLE ACCOUNT
              </p>

              <div className="mt-2 flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="h-10 w-10 rounded-full"
                  />
                )}

                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {user.displayName || "Hospital representative"}
                  </p>

                  <p className="break-all text-xs text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* HOSPITAL DETAILS */}
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <SectionHeading
              icon={<Building2 size={21} />}
              title="Hospital Details"
              description="Enter the official details of your institution."
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField label="Hospital Name" required>
                <input
                  name="hospitalName"
                  value={form.hospitalName}
                  onChange={handleChange}
                  placeholder="Enter hospital name"
                  required
                  className="input-field"
                />
              </FormField>

              <FormField label="Blood Bank Name" required>
                <input
                  name="bloodBankName"
                  value={form.bloodBankName}
                  onChange={handleChange}
                  placeholder="Enter blood bank name"
                  required
                  className="input-field"
                />
              </FormField>

              <FormField label="Registration / Licence Number" required>
                <input
                  name="registrationNumber"
                  value={form.registrationNumber}
                  onChange={handleChange}
                  placeholder="Official registration number"
                  required
                  className="input-field"
                />
              </FormField>

              <FormField label="Blood Bank Type" required>
                <select
                  name="bloodBankType"
                  value={form.bloodBankType}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option>Hospital Blood Bank</option>
                  <option>Government Blood Bank</option>
                  <option>Private Blood Bank</option>
                  <option>Standalone Blood Bank</option>
                </select>
              </FormField>
            </div>
          </section>

          {/* CONTACT */}
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <SectionHeading
              icon={<Phone size={21} />}
              title="Contact Information"
              description="Details of the authorised hospital representative."
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField label="Contact Person" required>
                <input
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  placeholder="Representative name"
                  required
                  className="input-field"
                />
              </FormField>

              <FormField label="Email Address">
                <input
                  value={user.email || ""}
                  disabled
                  className="input-field cursor-not-allowed bg-gray-100"
                />
              </FormField>

              <FormField label="Phone Number" required>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  required
                  className="input-field"
                />
              </FormField>
            </div>
          </section>

          {/* LOCATION */}
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <SectionHeading
              icon={<MapPin size={21} />}
              title="Hospital Location"
              description="Provide the complete registered address."
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField label="Full Address" required full>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Building, street and locality"
                  rows={3}
                  required
                  className="input-field resize-none"
                />
              </FormField>

              <FormField label="City / Town" required>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City or town"
                  required
                  className="input-field"
                />
              </FormField>

              <FormField label="District" required>
                <input
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder="District"
                  required
                  className="input-field"
                />
              </FormField>

              <FormField label="State" required>
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </FormField>

              <FormField label="PIN Code" required>
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="6-digit PIN code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  inputMode="numeric"
                  required
                  className="input-field"
                />
              </FormField>
            </div>
          </section>

          {/* SERVICES */}
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <SectionHeading
              icon={<Droplet size={21} />}
              title="Available Services"
              description="Select the services provided by your blood bank."
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Blood Collection",
                "Blood Storage",
                "Blood Component Separation",
                "Blood Testing",
                "Emergency Blood Supply",
                "Blood Donation Camps",
              ].map((service) => (
                <label
                  key={service}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition ${
                    form.services.includes(service)
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-gray-100 bg-gray-50 text-gray-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.services.includes(service)}
                    onChange={() => toggleService(service)}
                    className="h-4 w-4 accent-red-600"
                  />

                  <span className="font-medium">{service}</span>
                </label>
              ))}
            </div>
          </section>

          {/* ERROR */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* SUBMIT */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-green-600" />

              <p className="text-xs leading-5 text-gray-500">
                I confirm that the information submitted is accurate and
                that I am authorised to submit this application on behalf
                of the hospital. I understand that approval is subject
                to administrative verification.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-4 font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  Submit Hospital Application
                  <CheckCircle2 size={19} />
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-gray-400">
              Your application will remain pending until reviewed.
            </p>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .input-field {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          padding: 13px 14px;
          font-size: 14px;
          color: #202124;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-field:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.08);
        }

        .input-field::placeholder {
          color: #9ca3af;
        }
      `}</style>
    </main>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-red-50 p-3 text-red-600">
        {icon}
      </div>

      <div>
        <h2 className="text-lg font-black text-gray-900">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>

      {children}
    </div>
  );
}
