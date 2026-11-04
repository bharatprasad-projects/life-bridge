
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const BLOOD_GROUPS = [
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
] as const;

async function verifyHospital(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Authentication required.");
  }

  const token = authorization.slice(7);
  const decoded = await adminAuth.verifyIdToken(token);

  const userSnapshot = await adminDb
    .collection("users")
    .doc(decoded.uid)
    .get();

  if (!userSnapshot.exists) {
    throw new Error("Hospital account not found.");
  }

  const profile = userSnapshot.data();

  if (
    profile?.role !== "hospital" ||
    profile?.accountStatus !== "approved"
  ) {
    throw new Error("Your hospital account is not approved.");
  }

  return decoded;
}

function errorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Something went wrong.";

  console.error("Hospital blood bank API error:", error);

  const status = message.includes("Authentication required")
    ? 401
    : message.includes("not approved") ||
        message.includes("not found")
      ? 403
      : 500;

  return NextResponse.json({ error: message }, { status });
}

// GET: Return listings belonging to the signed-in hospital.
export async function GET(request: NextRequest) {
  try {
    const hospital = await verifyHospital(request);

    const snapshot = await adminDb
      .collection("bloodBanks")
      .where("hospitalId", "==", hospital.uid)
      .get();

    const bloodBanks = snapshot.docs.map((document) => {
      const data = document.data();

      return {
        id: document.id,
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : null,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate().toISOString()
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      bloodBanks,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST: Create and immediately publish a blood bank.
export async function POST(request: NextRequest) {
  try {
    const hospital = await verifyHospital(request);
    const body = await request.json();

    const requiredFields = [
      "bloodBankName",
      "phone",
      "address",
      "city",
      "district",
      "state",
      "pincode",
      "bloodBankType",
    ];

    for (const field of requiredFields) {
      if (
        typeof body[field] !== "string" ||
        !body[field].trim()
      ) {
        return NextResponse.json(
          { error: `${field} is required.` },
          { status: 400 }
        );
      }
    }

    if (!/^\d{10}$/.test(body.phone.trim())) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit phone number." },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(body.pincode.trim())) {
      return NextResponse.json(
        { error: "Enter a valid 6-digit pincode." },
        { status: 400 }
      );
    }

    const rawInventory =
      body.inventory && typeof body.inventory === "object"
        ? body.inventory
        : {};

    const inventory: Record<string, number> = {};

    for (const group of BLOOD_GROUPS) {
      const value = Number(rawInventory[group] ?? 0);

      if (!Number.isInteger(value) || value < 0 || value > 100000) {
        return NextResponse.json(
          { error: `Invalid inventory value for ${group}.` },
          { status: 400 }
        );
      }

      inventory[group] = value;
    }

    const hospitalSnapshot = await adminDb
      .collection("hospitalApplications")
      .doc(hospital.uid)
      .get();

    const hospitalData = hospitalSnapshot.data();

    const bloodBankData = {
      hospitalId: hospital.uid,
      hospitalName: hospitalData?.hospitalName || "",
      bloodBankName: body.bloodBankName.trim(),
      bloodBankType: body.bloodBankType.trim(),
      phone: body.phone.trim(),
      email: hospitalData?.email || hospital.email || "",
      address: body.address.trim(),
      city: body.city.trim(),
      district: body.district.trim(),
      state: body.state.trim(),
      pincode: body.pincode.trim(),
      latitude:
        body.latitude === "" || body.latitude == null
          ? null
          : Number(body.latitude),
      longitude:
        body.longitude === "" || body.longitude == null
          ? null
          : Number(body.longitude),
      operatingHours: body.operatingHours?.trim() || "Contact for timings",
      emergencyContact: body.emergencyContact?.trim() || "",
      services: Array.isArray(body.services)
        ? body.services.filter(
            (service: unknown) => typeof service === "string"
          )
        : [],
      inventory,
      status: "active",
      inventoryUpdatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (
      (bloodBankData.latitude !== null &&
        (!Number.isFinite(bloodBankData.latitude) ||
          bloodBankData.latitude < -90 ||
          bloodBankData.latitude > 90)) ||
      (bloodBankData.longitude !== null &&
        (!Number.isFinite(bloodBankData.longitude) ||
          bloodBankData.longitude < -180 ||
          bloodBankData.longitude > 180))
    ) {
      return NextResponse.json(
        { error: "Invalid map coordinates." },
        { status: 400 }
      );
    }

    const documentRef = adminDb.collection("bloodBanks").doc();

    await documentRef.set(bloodBankData);

    return NextResponse.json(
      {
        success: true,
        message: "Blood bank published successfully.",
        bloodBankId: documentRef.id,
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
