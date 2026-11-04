
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Droplet,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const bloodGroups = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
];

export default function DonorRegistrationPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [lastDonation, setLastDonation] = useState("");
  const [available, setAvailable] = useState("yes");
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSuccess(false);

    const user = auth.currentUser;

    if (!user) {
      setError("Please login before registering as a donor.");
      return;
    }

    if (!consent) {
      setError("Please accept the privacy consent.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    if (new Date(dateOfBirth) >= new Date()) {
      setError("Please enter a valid date of birth.");
      return;
    }

    if (
      lastDonation &&
      new Date(lastDonation) > new Date()
    ) {
      setError("Last donation date cannot be in the future.");
      return;
    }

    try {
      setLoading(true);

      await setDoc(
        doc(db, "donors", user.uid),
        {
          uid: user.uid,
          name: name.trim(),
          email: user.email ?? "",
          phone,
          bloodGroup,
          dateOfBirth,
          district,
          city,
          lastDonationDate: lastDonation || null,
          availableToDonate: available === "yes",
          consent: true,
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSuccess(true);

    } catch (err) {
      console.error("Donor registration error:", err);

      setError(
        "Registration failed. Please check your connection and Firebase permissions."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!auth.currentUser) {
    return (
      <main className="min-h-screen bg-[#f7f7f8] flex items-center justify-center p-6">

        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm">

          <div className="bg-red-50 rounded-2xl p-5 inline-block">
            <Heart size={45} className="text-red-600" />
          </div>

          <h1 className="text-2xl font-black mt-5">
            Become a Lifesaver
          </h1>

          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Please login to your Life Bridge account before
            registering as a blood donor.
          </p>

          <Link
            href="/login"
            className="block bg-red-600 text-white rounded-xl py-4 mt-6 font-bold"
          >
            Login to Continue
          </Link>

          <Link
            href="/"
            className="block text-gray-500 text-sm mt-5"
          >
            Back to Home
          </Link>

        </div>

      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#f7f7f8] flex items-center justify-center p-6">

        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm">

          <div className="bg-green-50 rounded-full p-5 inline-block">
            <CheckCircle size={55} className="text-green-600" />
          </div>

          <h1 className="text-2xl font-black mt-5">
            Registration Submitted!
          </h1>

          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Thank you for volunteering. Your donor profile
            has been submitted and is awaiting review.
          </p>

          <div className="bg-green-50 rounded-xl p-4 mt-6 text-left">
            <p className="text-sm font-bold text-green-800">
              Your blood group
            </p>
            <p className="text-2xl font-black text-green-700 mt-1">
              {bloodGroup}
            </p>
          </div>

          <Link
            href="/"
            className="block bg-red-600 text-white rounded-xl py-4 mt-6 font-bold"
          >
            Back to Home
          </Link>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] pb-12 text-[#202124]">

      {/* HEADER */}
      <header className="bg-white px-5 py-5 flex items-center gap-3 sticky top-0 z-30 border-b">

        <Link
          href="/"
          className="p-2 bg-gray-100 rounded-full"
        >
          <ArrowLeft size={21} />
        </Link>

        <div>
          <h1 className="font-black text-lg">
            Donor Registration
          </h1>
          <p className="text-xs text-gray-500">
            Become a Life Bridge donor
          </p>
        </div>

      </header>

      {/* HERO */}
      <section className="px-5 mt-5">

        <div className="bg-[#9f1239] rounded-3xl p-6 text-white relative overflow-hidden">

          <div className="relative z-10 max-w-[80%]">

            <p className="text-xs font-bold tracking-widest text-red-200">
              BE SOMEONE'S HOPE
            </p>

            <h2 className="text-2xl font-black mt-3">
              Your Blood Can Save Lives.
            </h2>

            <p className="text-sm text-red-100 mt-3">
              Join our donor network and help connect
              people with the support they need.
            </p>

          </div>

          <Heart
            size={110}
            fill="white"
            className="absolute right-[-15px] bottom-[-15px] opacity-20"
          />

        </div>

      </section>

      {/* REGISTRATION FORM */}
      <section className="px-5 mt-6">

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-6"
        >

          <div>
            <h2 className="font-black text-xl">
              Personal Information
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Enter your details to create your donor profile.
            </p>
          </div>

          {/* NAME */}
          <div>
            <label className="text-sm font-bold block mb-2">
              Full Name
            </label>

            <div className="flex items-center gap-3 border rounded-xl px-4 py-3">
              <User size={19} className="text-gray-400" />

              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="outline-none flex-1 text-sm min-w-0"
              />
            </div>
          </div>

          {/* PHONE */}
          <div>
            <label className="text-sm font-bold block mb-2">
              Phone Number
            </label>

            <div className="flex items-center gap-3 border rounded-xl px-4 py-3">
              <Phone size={19} className="text-gray-400" />

              <span className="text-sm text-gray-500">
                +91
              </span>

              <input
                required
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, ""))
                }
                placeholder="10-digit mobile number"
                className="outline-none flex-1 text-sm min-w-0"
              />
            </div>
          </div>

          {/* BLOOD GROUP */}
          <div>
            <label className="text-sm font-bold block mb-3">
              Select Blood Group
            </label>

            <div className="grid grid-cols-4 gap-3">

              {bloodGroups.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setBloodGroup(group)}
                  className={`rounded-xl py-3 font-bold border transition ${
                    bloodGroup === group
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  {group}
                </button>
              ))}

            </div>

            {!bloodGroup && (
              <p className="text-xs text-gray-400 mt-2">
                Select your blood group.
              </p>
            )}
          </div>

          {/* DATE OF BIRTH */}
          <div>
            <label className="text-sm font-bold block mb-2">
              Date of Birth
            </label>

            <div className="flex items-center gap-3 border rounded-xl px-4 py-3">
              <Calendar size={19} className="text-gray-400" />

              <input
                required
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="outline-none flex-1 text-sm bg-transparent"
              />
            </div>
          </div>

          {/* LOCATION */}
          <div>

            <h3 className="font-black text-lg mb-4">
              Your Location
            </h3>

            <div className="space-y-4">

              <div>
                <label className="text-sm font-bold block mb-2">
                  District
                </label>

                <div className="flex items-center gap-3 border rounded-xl px-4 py-3">
                  <MapPin size={19} className="text-gray-400" />

                  <input
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Enter your district"
                    className="outline-none flex-1 text-sm min-w-0"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold block mb-2">
                  City / Town
                </label>

                <div className="flex items-center gap-3 border rounded-xl px-4 py-3">
                  <MapPin size={19} className="text-gray-400" />

                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter your city or town"
                    className="outline-none flex-1 text-sm min-w-0"
                  />
                </div>
              </div>

            </div>

          </div>

          {/* DONATION HISTORY */}
          <div>

            <h3 className="font-black text-lg mb-2">
              Donation History
            </h3>

            <p className="text-xs text-gray-500 mb-3">
              When did you last donate blood?
            </p>

            <div className="flex items-center gap-3 border rounded-xl px-4 py-3">
              <Calendar size={19} className="text-gray-400" />

              <input
                type="date"
                value={lastDonation}
                onChange={(e) => setLastDonation(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="outline-none flex-1 text-sm bg-transparent"
              />
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Leave blank if you have never donated.
            </p>

          </div>

          {/* AVAILABILITY */}
          <div>

            <h3 className="font-black text-lg mb-3">
              Donation Availability
            </h3>

            <div className="space-y-3">

              <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  value="yes"
                  checked={available === "yes"}
                  onChange={() => setAvailable("yes")}
                  className="accent-red-600 w-4 h-4"
                />

                <div>
                  <p className="font-bold text-sm">
                    Willing to be contacted
                  </p>
                  <p className="text-xs text-gray-500">
                    I am open to receiving donation requests.
                  </p>
                </div>

              </label>

              <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  value="no"
                  checked={available === "no"}
                  onChange={() => setAvailable("no")}
                  className="accent-red-600 w-4 h-4"
                />

                <div>
                  <p className="font-bold text-sm">
                    Not available currently
                  </p>
                  <p className="text-xs text-gray-500">
                    Do not contact me for now.
                  </p>
                </div>

              </label>

            </div>

          </div>

          {/* CONSENT */}
          <div className="bg-gray-50 rounded-2xl p-4">

            <label className="flex items-start gap-3 cursor-pointer">

              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="accent-red-600 w-5 h-5 mt-0.5"
              />

              <span className="text-xs text-gray-600 leading-relaxed">
                I consent to Life Bridge storing my donor
                registration information and using my contact
                details to communicate about relevant blood
                donation opportunities. I understand that my
                details will not be publicly displayed.
              </span>

            </label>

          </div>

          {/* ERROR */}
          {error && (
            <div className="bg-red-50 text-red-700 rounded-xl p-4 flex gap-2 text-sm">
              <AlertCircle size={19} className="shrink-0" />
              {error}
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading || !bloodGroup}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2 transition"
          >

            {loading ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Heart size={19} />
                Register as Donor
              </>
            )}

          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheck size={15} />
            Your personal information is protected.
          </div>

        </form>

      </section>

      <footer className="text-center py-8 px-5">
        <p className="text-xs text-gray-400">
          Life Bridge – The Network Behind Every Lifeline.
        </p>
      </footer>

    </main>
  );
}
