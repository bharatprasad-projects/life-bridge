
"use client";

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
  Share2,
  AlertCircle,
} from "lucide-react";

import { bloodBanks } from "@/data/blood-banks";

const groups = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
] as const;

export default function BloodBankDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const bank = bloodBanks.find((item) => item.id === id);

  if (!bank) {
    return (
      <main className="min-h-screen bg-[#f7f7f8] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full">
          <Hospital size={50} className="mx-auto text-gray-300" />

          <h1 className="text-xl font-bold mt-4">
            Blood bank not found
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            This blood bank does not exist in our records.
          </p>

          <Link
            href="/search"
            className="inline-block mt-6 bg-red-600 text-white rounded-xl px-6 py-3 font-bold text-sm"
          >
            Back to Search
          </Link>
        </div>
      </main>
    );
  }

  const totalUnits = Object.values(bank.units).reduce(
    (total, units) => total + units,
    0
  );

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${bank.latitude},${bank.longitude}`;

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-[#202124] pb-12">

      {/* HEADER */}
      <header className="bg-white px-5 py-5 flex items-center justify-between sticky top-0 z-30 border-b">

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="p-2 bg-gray-100 rounded-full"
          >
            <ArrowLeft size={21} />
          </Link>

          <div>
            <h1 className="font-black text-lg">
              Blood Bank Details
            </h1>
            <p className="text-xs text-gray-500">
              Hospital information
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: bank.name,
                text: `Blood bank details: ${bank.name}`,
                url: window.location.href,
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          className="p-3 bg-gray-100 rounded-full"
        >
          <Share2 size={19} />
        </button>

      </header>

      {/* BANK PROFILE */}
      <section className="px-5 mt-5">

        <div className="bg-white rounded-3xl overflow-hidden border border-gray-100">

          <div className="h-48 bg-gradient-to-br from-red-100 to-rose-50 flex items-center justify-center relative">
            <Hospital size={95} className="text-red-300" />

            <span className="absolute bottom-4 left-4 bg-white text-green-700 px-3 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm">
              <ShieldCheck size={15} />
              {bank.verified ? "Verified Blood Bank" : "Verification Pending"}
            </span>
          </div>

          <div className="p-5">

            <h2 className="text-2xl font-black">
              {bank.name}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              {bank.type}
            </p>

            <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
              <MapPin size={17} className="text-red-600 shrink-0" />
              {bank.address}, {bank.city}
            </div>

            <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
              <Navigation size={17} className="text-red-600" />
              {bank.distance} km away
            </div>

            <div className="flex items-center gap-2 mt-3 text-sm">
              <Clock
                size={17}
                className={bank.open ? "text-green-600" : "text-gray-400"}
              />
              <span className={bank.open ? "text-green-700 font-semibold" : "text-gray-500"}>
                {bank.open ? "Currently listed as open" : "Currently listed as closed"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">

              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-red-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold"
              >
                <Navigation size={17} />
                Directions
              </a>

              {bank.phone ? (
                <a
                  href={`tel:${bank.phone}`}
                  className="border rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold"
                >
                  <Phone size={17} />
                  Call Now
                </a>
              ) : (
                <button
                  disabled
                  className="border rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold text-gray-400"
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
      <section className="px-5 mt-6">

        <div className="bg-white rounded-3xl border border-gray-100 p-5">

          <div className="flex justify-between items-center">

            <div>
              <h2 className="font-black text-lg">
                Blood Availability
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Blood group-wise inventory
              </p>
            </div>

            <div className="bg-red-50 p-3 rounded-2xl">
              <Droplet size={25} className="text-red-600" />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">

            <div className="bg-green-50 rounded-2xl p-4">
              <p className="text-xs text-green-700">
                Total listed units*
              </p>
              <h3 className="text-3xl font-black text-green-800 mt-1">
                {totalUnits}
              </h3>
            </div>

            <div className="bg-red-50 rounded-2xl p-4">
              <p className="text-xs text-red-700">
                Blood groups
              </p>
              <h3 className="text-3xl font-black text-red-800 mt-1">
                {groups.filter((g) => bank.units[g] > 0).length}/8
              </h3>
            </div>

          </div>

          <div className="mt-7">

            <h3 className="font-bold mb-4">
              Available Blood Groups
            </h3>

            <div className="grid grid-cols-2 gap-3">

              {groups.map((group) => {

                const units = bank.units[group];
                const available = units > 0;

                return (
                  <div
                    key={group}
                    className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between"
                  >

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                        <Droplet size={22} className="text-red-600" />
                      </div>

                      <div>
                        <h4 className="font-black text-lg">
                          {group}
                        </h4>

                        <p className={`text-[11px] font-semibold ${
                          available ? "text-green-600" : "text-gray-400"
                        }`}>
                          {available ? "Listed available" : "Not listed"}
                        </p>
                      </div>

                    </div>

                    <div className="text-right">
                      <p className="font-black text-xl">
                        {units}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Units*
                      </p>
                    </div>

                  </div>
                );
              })}

            </div>
          </div>

          <div className="mt-5 flex gap-2 items-start bg-orange-50 rounded-xl p-3">
            <AlertCircle size={17} className="text-orange-600 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-800 leading-relaxed">
              Demonstration inventory only. Confirm actual stock,
              blood component and compatibility with authorized professionals.
            </p>
          </div>

        </div>
      </section>

      {/* LOCATION */}
      <section className="px-5 mt-6">

        <div className="bg-white rounded-3xl border border-gray-100 p-5">

          <h2 className="font-black text-lg">
            Location & Address
          </h2>

          <div className="flex gap-3 mt-4">

            <div className="bg-red-50 p-3 rounded-xl h-fit">
              <MapPin className="text-red-600" />
            </div>

            <div>
              <h3 className="font-bold text-sm">
                {bank.name}
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                {bank.address}, {bank.city}, Kerala
              </p>

              <p className="text-xs text-gray-400 mt-2">
                {bank.latitude}, {bank.longitude}
              </p>
            </div>

          </div>

          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 block text-center bg-gray-100 rounded-xl py-3 font-bold text-sm"
          >
            Open in Google Maps →
          </a>

        </div>
      </section>

      {/* BLOOD REQUEST */}
      <section className="px-5 mt-6">

        <div className="bg-[#251c2c] text-white rounded-3xl p-6">

          <div className="flex items-center gap-2">
            <Heart size={22} className="text-red-400" />
            <span className="text-xs font-bold text-purple-200">
              NEED BLOOD?
            </span>
          </div>

          <h2 className="text-xl font-black mt-3">
            Submit a Blood Request
          </h2>

          <p className="text-sm text-gray-300 mt-2">
            Submit your requirement and contact the blood bank
            to confirm availability.
          </p>

          <Link
            href={`/requests?hospitalId=${bank.id}`}
            className="mt-5 inline-flex items-center gap-2 bg-red-600 px-5 py-3 rounded-xl text-sm font-bold"
          >
            Request Blood
            <ChevronRight size={17} />
          </Link>

        </div>
      </section>

      <footer className="text-center px-5 py-8">
        <p className="text-xs text-gray-400">
          Life Bridge – The Network Behind Every Lifeline.
        </p>
      </footer>

    </main>
  );
}
