
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Phone,
  Clock,
  ShieldCheck,
  Droplet,
  Hospital,
  ChevronRight,
  Heart,
  AlertCircle,
  Share2,
  Loader2,
} from "lucide-react";

const groups = [
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
  hospitalId: string;
  hospitalName: string;
  bloodBankName: string;
  bloodBankType: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  phone: string;
  operatingHours: string;
  latitude: number | null;
  longitude: number | null;
  inventory: Record<string, number>;
  status: string;
};

function BloodBankDetailsContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [bank, setBank] = useState<BloodBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadBloodBank() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/public/homepage-data", {
          cache: "no-store",
        });

        const responseText = await response.text();

        if (!responseText.trim()) {
          throw new Error("The server returned an empty response.");
        }

        const data = JSON.parse(responseText);

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to load blood bank details.");
        }

        const banks = Array.isArray(data.bloodBanks)
          ? data.bloodBanks
          : [];

        const found = banks.find(
          (item: Record<string, unknown>) => String(item.id) === String(id)
        );

        if (!found) {
          if (active) {
            setBank(null);
            setError("This blood bank listing could not be found.");
          }
          return;
        }

        const inventory =
          found.inventory && typeof found.inventory === "object"
            ? (found.inventory as Record<string, unknown>)
            : {};

        const mappedBank: BloodBank = {
          id: String(found.id || ""),
          hospitalId: String(found.hospitalId || ""),
          hospitalName: String(found.hospitalName || ""),
          bloodBankName: String(
            found.bloodBankName || found.name || "Blood Bank"
          ),
          bloodBankType: String(
            found.bloodBankType || found.type || "Blood Bank"
          ),
          address: String(found.address || ""),
          city: String(found.city || ""),
          district: String(found.district || ""),
          state: String(found.state || ""),
          pincode: String(found.pincode || ""),
          phone: String(found.phone || ""),
          operatingHours: String(found.operatingHours || ""),
          latitude:
            found.latitude !== undefined &&
            found.latitude !== null &&
            Number.isFinite(Number(found.latitude))
              ? Number(found.latitude)
              : null,
          longitude:
            found.longitude !== undefined &&
            found.longitude !== null &&
            Number.isFinite(Number(found.longitude))
              ? Number(found.longitude)
              : null,
          inventory: Object.fromEntries(
            Object.entries(inventory).map(([key, value]) => [
              key,
              Number(value) || 0,
            ])
          ),
          status: String(found.status || "active"),
        };

        if (active) {
          setBank(mappedBank);
        }
      } catch (err) {
        console.error("Blood bank details error:", err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load blood bank details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBloodBank();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f8]">
        <div className="text-center">
          <Loader2
            size={38}
            className="mx-auto animate-spin text-red-600"
          />
          <p className="mt-4 text-sm text-gray-500">
            Loading blood bank details...
          </p>
        </div>
      </main>
    );
  }

  if (!bank) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f8] px-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <Hospital size={50} className="mx-auto text-gray-300" />

          <h1 className="mt-5 text-xl font-black">
            Blood Bank Not Found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error || "This blood bank does not exist in our records."}
          </p>

          <Link
            href="/search"
            className="mt-6 inline-flex rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white"
          >
            Back to Search
          </Link>
        </div>
      </main>
    );
  }

  const totalUnits = groups.reduce(
    (total, group) => total + Number(bank.inventory[group.key] || 0),
    0
  );

  const availableGroups = groups.filter(
    (group) => Number(bank.inventory[group.key] || 0) > 0
  );

  const location = [
    bank.address,
    bank.city,
    bank.district,
    bank.state,
    bank.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const mapQuery =
    bank.latitude !== null && bank.longitude !== null
      ? `${bank.latitude},${bank.longitude}`
      : location || bank.bloodBankName;

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const bloodBankName = bank.bloodBankName;

  function shareDetails() {
    if (navigator.share) {
      navigator.share({
        title: bloodBankName,
        text: `Blood bank details: ${bloodBankName}`,
        url: window.location.href,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] pb-12 text-[#202124]">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-5 py-5">
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="rounded-full bg-gray-100 p-2"
            aria-label="Back to search"
          >
            <ArrowLeft size={21} />
          </Link>

          <div>
            <h1 className="text-lg font-black">
              Blood Bank Details
            </h1>
            <p className="text-xs text-gray-500">
              Hospital information
            </p>
          </div>
        </div>

        <button
          onClick={shareDetails}
          className="rounded-full bg-gray-100 p-3"
          aria-label="Share blood bank"
        >
          <Share2 size={19} />
        </button>
      </header>

      {/* BANK PROFILE */}
      <section className="mt-5 px-5">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
          <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-red-100 to-rose-50">
            <Hospital size={95} className="text-red-300" />

            <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-green-700 shadow-sm">
              <ShieldCheck size={15} />
              Verified Blood Bank
            </span>
          </div>

          <div className="p-5">
            <h2 className="text-2xl font-black">
              {bank.bloodBankName}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {bank.bloodBankType}
            </p>

            {bank.hospitalName && (
              <p className="mt-2 text-sm font-semibold text-gray-700">
                {bank.hospitalName}
              </p>
            )}

            <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
              <MapPin size={17} className="mt-0.5 shrink-0 text-red-600" />
              <span>{location || "Location not provided"}</span>
            </div>

            {bank.operatingHours && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <Clock size={17} className="text-green-600" />
                {bank.operatingHours}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white"
              >
                <Navigation size={17} />
                Directions
              </a>

              {bank.phone ? (
                <a
                  href={`tel:${bank.phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold"
                >
                  <Phone size={17} />
                  Call Now
                </a>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold text-gray-400"
                >
                  <Phone size={17} />
                  Contact unavailable
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* INVENTORY */}
      <section className="mt-6 px-5">
        <div className="rounded-3xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">
                Blood Availability
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Blood group-wise inventory
              </p>
            </div>

            <div className="rounded-2xl bg-red-50 p-3">
              <Droplet size={25} className="text-red-600" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-green-50 p-4">
              <p className="text-xs text-green-700">
                Total listed units
              </p>
              <h3 className="mt-1 text-3xl font-black text-green-800">
                {totalUnits}
              </h3>
            </div>

            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs text-red-700">
                Available blood groups
              </p>
              <h3 className="mt-1 text-3xl font-black text-red-800">
                {availableGroups.length}/8
              </h3>
            </div>
          </div>

          <div className="mt-7">
            <h3 className="mb-4 font-bold">
              Available Blood Groups
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {groups.map((group) => {
                const units = Number(bank.inventory[group.key] || 0);
                const available = units > 0;

                return (
                  <div
                    key={group.key}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                        <Droplet size={22} className="text-red-600" />
                      </div>

                      <div>
                        <h4 className="text-lg font-black">
                          {group.label}
                        </h4>
                        <p
                          className={`text-[11px] font-semibold ${
                            available ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          {available ? "Listed available" : "Not listed"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-black">{units}</p>
                      <p className="text-[10px] text-gray-400">Units</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-orange-50 p-3">
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-orange-600" />
            <p className="text-xs leading-relaxed text-orange-800">
              Inventory information is provided by the registered blood
              bank. Always confirm current stock, blood components and
              clinical compatibility with authorised professionals.
            </p>
          </div>
        </div>
      </section>

      {/* LOCATION */}
      <section className="mt-6 px-5">
        <div className="rounded-3xl border border-gray-100 bg-white p-5">
          <h2 className="text-lg font-black">
            Location & Address
          </h2>

          <div className="mt-4 flex gap-3">
            <div className="h-fit rounded-xl bg-red-50 p-3">
              <MapPin className="text-red-600" />
            </div>

            <div>
              <h3 className="text-sm font-bold">
                {bank.bloodBankName}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {location || "Address not provided"}
              </p>
            </div>
          </div>

          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 block rounded-xl bg-gray-100 py-3 text-center text-sm font-bold"
          >
            Open in Google Maps →
          </a>
        </div>
      </section>

      {/* BLOOD REQUEST */}
      <section className="mt-6 px-5">
        <div className="rounded-3xl bg-[#251c2c] p-6 text-white">
          <div className="flex items-center gap-2">
            <Heart size={22} className="text-red-400" />
            <span className="text-xs font-bold text-purple-200">
              NEED BLOOD?
            </span>
          </div>

          <h2 className="mt-3 text-xl font-black">
            Submit a Blood Request
          </h2>

          <p className="mt-2 text-sm text-gray-300">
            Submit your requirement and contact the blood bank to
            confirm availability.
          </p>

          <Link
            href={`/requests?bloodBankId=${bank.id}`}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold"
          >
            Request Blood
            <ChevronRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="px-5 py-8 text-center">
        <p className="text-xs text-gray-400">
          Life Bridge – The Network Behind Every Lifeline.
        </p>
      </footer>
    </main>
  );
}

export default function BloodBankDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f7f7f8]">
          <div className="text-center">
            <Loader2
              size={38}
              className="mx-auto animate-spin text-red-600"
            />
            <p className="mt-4 text-sm text-gray-500">
              Loading blood bank details...
            </p>
          </div>
        </main>
      }
    >
      <BloodBankDetailsContent />
    </Suspense>
  );
}
