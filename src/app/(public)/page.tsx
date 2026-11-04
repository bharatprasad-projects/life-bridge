
"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";

import {
  Heart,
  Search,
  Hospital,
  Droplet,
  ArrowRight,
  MapPin,
  Bell,
  ShieldCheck,
  Activity,
  Plus,
  Home,
  UserRound,
  Clock,
  Loader2,
} from "lucide-react";

type HospitalItem = {
  id: string;
  hospitalName: string;
  city: string;
  district: string;
  state: string;
  bloodBankCount: number;
};

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
  inventory: Record<string, number>;
  inventoryUpdatedAt: string | null;
};

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

export default function HomePage() {
  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHomepageData() {
      try {
        const response = await fetch("/api/public/homepage-data", {
          cache: "no-store",
        });

        // Read as text first, so an empty or HTML response
        // does not cause an Unexpected end of JSON error.
        const responseText = await response.text();

        if (!responseText.trim()) {
          throw new Error(
            `Homepage API returned an empty response (HTTP ${response.status}).`
          );
        }

        let data: {
          success?: boolean;
          error?: string;
          hospitals?: HospitalItem[];
          bloodBanks?: BloodBank[];
          debug?: {
            totalApplications: number;
            approvedHospitals: number;
            totalBloodBanks: number;
            activeBloodBanks: number;
          };
        };

        try {
          data = JSON.parse(responseText);
        } catch {
          console.error("Homepage API returned non-JSON:", responseText);
          throw new Error(
            `Homepage API returned an invalid response (HTTP ${response.status}). Check the terminal.`
          );
        }

        if (!response.ok) {
          throw new Error(
            data.error || `Homepage API failed (HTTP ${response.status}).`
          );
        }

        if (active) {
          setHospitals(data.hospitals || []);
          setBloodBanks(data.bloodBanks || []);
          setLoadError("");

          console.log("Life Bridge homepage data:", data.debug);
        }
      } catch (error) {
        console.error("Homepage loading error:", error);

        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load homepage data."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHomepageData();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f7f8] pb-28 text-[#202124]">

      <header className="bg-white px-5 pb-5 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-red-600 p-2 text-white">
                <Droplet size={24} fill="white" />
              </div>

              <h1 className="text-2xl font-black tracking-tight">
                Life<span className="text-red-600">Bridge</span>
              </h1>
            </div>

            <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={15} className="text-red-600" />
              Alappuzha, Kerala
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            <UserMenu />
          </div>
        </div>

        <Link
          href="/search"
          className="mt-6 flex items-center gap-3 rounded-2xl bg-gray-100 px-4 py-4"
        >
          <Search size={21} className="text-gray-500" />
          <span className="text-sm text-gray-500">
            Search blood banks, blood groups...
          </span>
        </Link>
      </header>

      {/* BLOOD GROUPS */}
      <section className="bg-white px-5 pb-6 pt-3">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Find Blood</h2>
          <Link href="/search" className="text-xs font-bold text-red-600">
            View all →
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
            (group) => (
              <Link
                href={
                  group === "All"
                    ? "/search"
                    : `/search?group=${encodeURIComponent(group)}`
                }
                key={group}
                className={`flex h-[76px] min-w-[67px] flex-col items-center justify-center gap-1 rounded-2xl border ${
                  group === "All"
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-gray-100 bg-gray-50 text-gray-700"
                }`}
              >
                <Droplet size={23} />
                <span className="text-sm font-bold">{group}</span>
              </Link>
            )
          )}
        </div>
      </section>

      {/* EMERGENCY BANNER */}
      <section className="mt-5 px-5">
        <div className="relative overflow-hidden rounded-3xl bg-[#9f1239] p-6 text-white">
          <div className="relative z-10 max-w-[75%]">
            <span className="text-xs font-bold tracking-widest text-red-200">
              EVERY SECOND MATTERS
            </span>

            <h2 className="mt-2 text-2xl font-black leading-tight">
              Someone Needs
              <br />
              Your Blood Today.
            </h2>

            <p className="mt-2 text-sm text-red-100">
              Your donation could save a life.
            </p>

            <Link
              href="/donate"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-red-700"
            >
              Become a Donor
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="absolute bottom-[-20px] right-[-10px] opacity-20">
            <Heart size={175} fill="white" />
          </div>
          <div className="absolute right-6 top-5 opacity-80">
            <Droplet size={45} fill="#fecaca" />
          </div>
        </div>
      </section>

      {/* VERIFIED HOSPITALS */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between px-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">Verified Hospitals</h2>
              <ShieldCheck size={19} className="text-green-600" />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Hospitals approved by Life Bridge
            </p>
          </div>

          <Link href="/hospitals" className="text-sm font-bold text-red-600">
            See all →
          </Link>
        </div>

        {loading ? (
          <LoadingState label="Loading verified hospitals..." />
        ) : hospitals.length === 0 ? (
          <EmptyState
            icon={<Hospital size={30} />}
            title="No verified hospitals yet"
            description="Approved hospitals will appear here."
          />
        ) : (
          <div className="flex gap-4 overflow-x-auto px-5 pb-4">
            {hospitals.map((hospital) => (
              <div
                key={hospital.id}
                className="min-w-[255px] max-w-[255px] rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-2xl bg-green-50 p-3 text-green-700">
                    <Hospital size={27} />
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-bold text-green-700">
                    <ShieldCheck size={12} />
                    VERIFIED
                  </span>
                </div>

                <h3 className="font-bold">{hospital.hospitalName}</h3>

                <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin size={13} />
                  {[hospital.city, hospital.district, hospital.state]
                    .filter(Boolean)
                    .join(", ") || "Location not provided"}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-500">Blood bank listings</p>
                    <p className="mt-1 text-lg font-black">
                      {hospital.bloodBankCount}
                    </p>
                  </div>
                  <span className="rounded-xl bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
                    Approved
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BLOOD BANKS */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between px-5">
          <div>
            <h2 className="text-xl font-black">Blood Banks Near You</h2>
            <p className="mt-1 text-xs text-gray-500">
              Published blood bank listings
            </p>
          </div>
          <Link href="/search" className="text-sm font-bold text-red-600">
            See all →
          </Link>
        </div>

        {loading ? (
          <LoadingState label="Loading blood banks..." />
        ) : bloodBanks.length === 0 ? (
          <EmptyState
            icon={<Droplet size={30} />}
            title="No blood banks published yet"
            description="Blood banks added by approved hospitals will appear here."
          />
        ) : (
          <div className="flex gap-4 overflow-x-auto px-5 pb-4">
            {bloodBanks.map((bank) => {
              const totalUnits = Object.values(bank.inventory || {}).reduce(
                (sum, units) => sum + Number(units || 0),
                0
              );

              const availableGroups = BLOOD_GROUPS.filter(
                (group) => Number(bank.inventory?.[group.key] || 0) > 0
              );

              return (
                <Link
                  href={`/blood-banks/${bank.id}`}
                  key={bank.id}
                  className="min-w-[275px] max-w-[275px] overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="relative flex h-36 items-center justify-center bg-red-50">
                    <Hospital size={65} className="text-red-300" />
                    <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-green-700">
                      <ShieldCheck size={13} />
                      HOSPITAL LISTED
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="text-base font-bold">{bank.bloodBankName}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {bank.bloodBankType}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <MapPin size={14} />
                      {[bank.city, bank.district].filter(Boolean).join(", ")}
                    </div>

                    {bank.operatingHours && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={14} />
                        {bank.operatingHours}
                      </div>
                    )}

                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Available units
                        </span>
                        <span className="text-xl font-black text-green-700">
                          {totalUnits}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {availableGroups.length > 0 ? (
                          availableGroups.map((group) => (
                            <span
                              key={group.key}
                              className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700"
                            >
                              {group.label}: {bank.inventory[group.key]}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">
                            No available units reported
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">
                          View blood bank
                        </span>
                        <span className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* DONOR CAMPAIGN */}
      <section className="mt-6 px-5">
        <div className="flex items-center justify-between rounded-3xl bg-[#252036] p-6 text-white">
          <div className="max-w-[70%]">
            <p className="text-xs font-bold tracking-widest text-purple-300">
              BE A LIFESAVER
            </p>
            <h2 className="mt-2 text-xl font-black">
              Become a Blood Donor
            </h2>
            <p className="mt-2 text-xs text-gray-300">
              One donation can make a meaningful difference.
            </p>
            <Link
              href="/donate"
              className="mt-4 inline-block rounded-full border border-white px-4 py-2 text-xs font-bold"
            >
              Register Now →
            </Link>
          </div>
          <Heart size={65} className="text-red-400" fill="#f87171" />
        </div>
      </section>

      {/* EXPLORE */}
      <section className="mt-8 px-5">
        <h2 className="mb-4 text-xl font-black">Explore Life Bridge</h2>
        <div className="grid grid-cols-2 gap-3">
          <ExploreCard
            icon={<Heart size={25} />}
            title="Donate Blood"
            desc="Register as a donor"
            href="/donate"
          />
          <ExploreCard
            icon={<Activity size={25} />}
            title="Blood Requests"
            desc="Find people in need"
            href="/requests"
          />
          <ExploreCard
            icon={<Hospital size={25} />}
            title="Hospitals"
            desc="Explore verified centres"
            href="/hospitals"
          />
          <ExploreCard
            icon={<Plus size={25} />}
            title="Emergency"
            desc="Urgent blood requirements"
            href="/requests"
          />
        </div>
      </section>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-xl justify-around py-3">
          <Link href="/" className="flex flex-col items-center gap-1 text-xs font-bold text-red-600">
            <Home size={23} />
            Home
          </Link>
          <Link href="/search" className="flex flex-col items-center gap-1 text-xs text-gray-400">
            <Search size={23} />
            Search
          </Link>
          <Link href="/donate" className="flex flex-col items-center gap-1 text-xs text-gray-400">
            <Heart size={23} />
            Donate
          </Link>
          <Link href="/hospitals" className="flex flex-col items-center gap-1 text-xs text-gray-400">
            <Hospital size={23} />
            Hospitals
          </Link>
          <Link href="/account" className="flex flex-col items-center gap-1 text-xs text-gray-400">
            <UserRound size={23} />
            Account
          </Link>
        </div>
      </nav>

      {loadError && (
        <p className="px-5 pb-5 text-center text-xs text-red-600">
          {loadError}
        </p>
      )}
    </main>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="mx-5 flex min-h-36 items-center justify-center gap-3 rounded-2xl bg-white text-sm text-gray-500">
      <Loader2 size={20} className="animate-spin" />
      {label}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-5 flex min-h-44 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white px-5 text-center">
      <div className="mb-3 rounded-xl bg-red-50 p-3 text-red-500">
        {icon}
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-gray-500">{description}</p>
    </div>
  );
}

function ExploreCard({
  icon,
  title,
  desc,
  href,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-gray-100 bg-white p-5 transition hover:shadow-md"
    >
      <div className="mb-3 text-red-600">{icon}</div>
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="mt-1 text-xs text-gray-500">{desc}</p>
    </Link>
  );
}
