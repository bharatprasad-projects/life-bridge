
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  ArrowLeft,
  SlidersHorizontal,
  Droplet,
  ShieldCheck,
  Navigation,
  Clock,
  ChevronDown,
  Hospital,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const groups = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
] as const;

type BloodGroup = (typeof groups)[number];
type GroupFilter = "All" | BloodGroup;

const inventoryKeys: Record<BloodGroup, string> = {
  "A+": "A_POSITIVE",
  "A-": "A_NEGATIVE",
  "B+": "B_POSITIVE",
  "B-": "B_NEGATIVE",
  "AB+": "AB_POSITIVE",
  "AB-": "AB_NEGATIVE",
  "O+": "O_POSITIVE",
  "O-": "O_NEGATIVE",
};

type BloodBank = {
  id: string;
  name: string;
  hospitalName: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  units: Record<BloodGroup, number>;
  verified: boolean;
};

function getUnits(inventory: unknown): Record<BloodGroup, number> {
  const data =
    inventory && typeof inventory === "object"
      ? (inventory as Record<string, unknown>)
      : {};

  const result = {} as Record<BloodGroup, number>;

  for (const group of groups) {
    const value = data[inventoryKeys[group]] ?? data[group] ?? 0;
    const number = Number(value);

    result[group] =
      Number.isFinite(number) && number > 0 ? number : 0;
  }

  return result;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialGroup = searchParams.get("group");

  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GroupFilter>(
    groups.includes(initialGroup as BloodGroup)
      ? (initialGroup as BloodGroup)
      : "All"
  );

  const [sort, setSort] = useState("availability");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [banks, setBanks] = useState<BloodBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBloodBanks() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/public/homepage-data", {
        method: "GET",
        cache: "no-store",
      });

      const responseText = await response.text();

      let data: {
        success?: boolean;
        bloodBanks?: Record<string, unknown>[];
        error?: string;
      };

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "The server returned an invalid response. Check the API route and terminal."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load blood banks."
        );
      }

      const mappedBanks: BloodBank[] = (data.bloodBanks || []).map(
        (bank) => {
          const id = String(bank.id || "");

          return {
            id,
            name: String(bank.name || bank.bloodBankName || "Blood Bank"),
            hospitalName: String(bank.hospitalName || ""),
            type: String(bank.type || bank.bloodBankType || "Blood Bank"),
            address: String(bank.address || ""),
            city: String(bank.city || ""),
            state: String(bank.state || ""),
            pincode: String(bank.pincode || ""),
            phone: String(bank.phone || ""),
            latitude:
              Number.isFinite(Number(bank.latitude)) &&
              bank.latitude !== null &&
              bank.latitude !== undefined
                ? Number(bank.latitude)
                : null,
            longitude:
              Number.isFinite(Number(bank.longitude)) &&
              bank.longitude !== null &&
              bank.longitude !== undefined
                ? Number(bank.longitude)
                : null,
            units: getUnits(bank.inventory),
            verified: true,
          };
        }
      );

      setBanks(mappedBanks);
    } catch (err) {
      console.error("Search blood banks error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading blood banks."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBloodBanks();
  }, []);

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();

    const filtered = banks.filter((bank) => {
      const searchText = [
        bank.name,
        bank.hospitalName,
        bank.type,
        bank.address,
        bank.city,
        bank.state,
        bank.pincode,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search || searchText.includes(search);

      const matchesGroup =
        group === "All" || bank.units[group] > 0;

      const totalUnits = Object.values(bank.units).reduce(
        (total, units) => total + units,
        0
      );

      const matchesAvailable =
        !onlyAvailable || totalUnits > 0;

      return matchesSearch && matchesGroup && matchesAvailable;
    });

    return [...filtered].sort((a, b) => {
      const aUnits =
        group === "All"
          ? Object.values(a.units).reduce((x, y) => x + y, 0)
          : a.units[group];

      const bUnits =
        group === "All"
          ? Object.values(b.units).reduce((x, y) => x + y, 0)
          : b.units[group];

      if (sort === "availability") return bUnits - aUnits;
      if (sort === "name") return a.name.localeCompare(b.name);

      return 0;
    });
  }, [banks, query, group, sort, onlyAvailable]);

  function resetFilters() {
    setQuery("");
    setGroup("All");
    setOnlyAvailable(false);
    setSort("availability");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] pb-28 text-[#202124]">
      <header className="sticky top-0 z-30 bg-white px-5 pb-5 pt-7 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <Link href="/" className="rounded-full bg-gray-100 p-2">
            <ArrowLeft size={21} />
          </Link>

          <div>
            <h1 className="text-xl font-black">Find Blood</h1>
            <p className="text-xs text-gray-500">
              Discover active blood banks
            </p>
          </div>

          <button
            onClick={loadBloodBanks}
            disabled={loading}
            className="ml-auto rounded-xl bg-gray-100 p-3 text-gray-600"
            aria-label="Refresh blood banks"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-gray-100 px-4 py-4">
          <Search size={21} className="text-gray-500" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blood bank, hospital or location"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />

          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <MapPin size={16} className="text-red-600" />
          <span>All registered locations</span>
        </div>
      </header>

      <section className="px-5 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Select Blood Group</h2>

          <button
            onClick={() => setGroup("All")}
            className="text-xs font-bold text-red-600"
          >
            Clear
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => setGroup("All")}
            className={`rounded-xl border py-3 text-sm font-bold ${
              group === "All"
                ? "border-red-600 bg-red-600 text-white"
                : "border-gray-200 bg-white"
            }`}
          >
            All
          </button>

          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`rounded-xl border py-3 text-sm font-bold ${
                group === g
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-gray-200 bg-white"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-semibold"
          >
            <SlidersHorizontal size={17} />
            Filters
          </button>

          <div className="relative flex-1">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full appearance-none rounded-xl border bg-white px-4 py-3 text-sm font-semibold outline-none"
            >
              <option value="availability">Most available</option>
              <option value="name">Name A–Z</option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-3.5"
            />
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 space-y-4 rounded-2xl border bg-white p-5">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Show only blood banks with available stock
              </span>

              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="h-5 w-5 accent-red-600"
              />
            </label>

            <button
              onClick={resetFilters}
              className="text-sm font-bold text-red-600"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      <section className="mt-7 px-5">
        <div className="mb-4">
          <h2 className="text-xl font-black">
            Blood Banks to Explore
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            {loading ? "Loading listings..." : `${results.length} matching results`}
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center rounded-2xl bg-white p-10 text-gray-500">
            <Loader2 size={30} className="animate-spin text-red-600" />
            <p className="mt-3 text-sm">Loading active blood banks...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-700">{error}</p>

            <button
              onClick={loadBloodBanks}
              className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {results.map((bank) => {
              const units =
                group === "All"
                  ? Object.values(bank.units).reduce((a, b) => a + b, 0)
                  : bank.units[group];

              const location = [
                bank.address,
                bank.city,
                bank.state,
                bank.pincode,
              ]
                .filter(Boolean)
                .join(", ");

              const hasCoordinates =
                bank.latitude !== null && bank.longitude !== null;

              return (
                <article
                  key={bank.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="p-4">
                    <div className="flex gap-3">
                      <div className="flex h-[95px] w-[85px] shrink-0 items-center justify-center rounded-xl bg-red-50">
                        <Hospital size={40} className="text-red-400" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <h3 className="text-base font-bold">
                            {bank.name}
                          </h3>

                          <ShieldCheck
                            size={16}
                            className="text-green-600"
                          />
                        </div>

                        {bank.hospitalName && (
                          <p className="mt-1 text-xs font-medium text-gray-600">
                            {bank.hospitalName}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-gray-500">
                          {bank.type}
                        </p>

                        <p className="mt-2 flex items-start gap-1 text-xs text-gray-500">
                          <MapPin size={13} className="mt-0.5 shrink-0" />
                          <span>{location || "Location not provided"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <div>
                        <p className="text-xs text-gray-500">
                          {group === "All" ? "Total listed units" : `${group} units`}
                        </p>

                        <p className="text-xl font-black text-green-700">
                          {units}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-green-600">
                          ● Active listing
                        </p>

                        <p className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-400">
                          <Clock size={12} />
                          Confirm stock before visiting
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {hasCoordinates ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${bank.latitude},${bank.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold"
                        >
                          <Navigation size={16} />
                          Directions
                        </a>
                      ) : (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location || bank.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold"
                        >
                          <Navigation size={16} />
                          Directions
                        </a>
                      )}

                      <Link
                        href={`/blood-banks/${bank.id}`}
                        className="flex items-center justify-center rounded-xl bg-red-600 py-3 text-sm font-bold text-white"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}

            {results.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center">
                <Droplet
                  size={38}
                  className="mx-auto text-gray-300"
                />

                <h3 className="mt-4 font-bold">
                  No blood banks found
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Try another search or clear your filters.
                </p>

                <button
                  onClick={resetFilters}
                  className="mt-4 text-sm font-bold text-red-600"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        <p className="mt-5 text-[10px] text-gray-400">
          Inventory information is provided by registered blood banks.
          Always confirm current availability and clinical compatibility
          with the authorized blood bank.
        </p>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white">
        <div className="mx-auto flex max-w-xl justify-around py-3">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 text-xs text-gray-400"
          >
            <Hospital size={22} />
            Home
          </Link>

          <Link
            href="/search"
            className="flex flex-col items-center gap-1 text-xs font-bold text-red-600"
          >
            <Search size={22} />
            Search
          </Link>

          <Link
            href="/donate"
            className="flex flex-col items-center gap-1 text-xs text-gray-400"
          >
            <Droplet size={22} />
            Donate
          </Link>

          <Link
            href="/hospitals"
            className="flex flex-col items-center gap-1 text-xs text-gray-400"
          >
            <Hospital size={22} />
            Hospitals
          </Link>

          <Link
            href="/account"
            className="flex flex-col items-center gap-1 text-xs text-gray-400"
          >
            <MapPin size={22} />
            Account
          </Link>
        </div>
      </nav>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f7f7f8]">
          <p className="text-sm text-gray-500">Loading search...</p>
        </main>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
