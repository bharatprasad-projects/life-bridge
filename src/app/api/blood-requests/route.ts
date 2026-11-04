
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
];

async function verifyPatient(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Authentication required.");
  }

  const decoded = await adminAuth.verifyIdToken(authorization.slice(7));

  const userSnapshot = await adminDb
    .collection("users")
    .doc(decoded.uid)
    .get();

  if (!userSnapshot.exists) {
    throw new Error("User account not found.");
  }

  const profile = userSnapshot.data();

  if (
    profile?.role !== "user" ||
    profile?.accountStatus === "blocked"
  ) {
    throw new Error("Only active patient accounts can submit requests.");
  }

  if (!decoded.email || !decoded.email_verified) {
    throw new Error(
      "Please verify your account email before requesting blood."
    );
  }

  return {
    uid: decoded.uid,
    email: decoded.email,
    name: String(profile?.name || decoded.name || "Patient"),
  };
}

/**
 * Validates YYYY-MM-DD without timezone conversion.
 * Also rejects dates that are earlier than today's date in India.
 */
function isValidRequiredDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const calendarDate = new Date(
    Date.UTC(year, month - 1, day)
  );

  // Validate the actual calendar date.
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return false;
  }

  // Get today's date in India, independent of server timezone.
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const today = `${todayParts.find((part) => part.type === "year")?.value}-${todayParts.find((part) => part.type === "month")?.value}-${todayParts.find((part) => part.type === "day")?.value}`;

  return value >= today;
}

export async function POST(request: NextRequest) {
  try {
    const patient = await verifyPatient(request);

    const body = await request.json();

    const bloodBankId = String(body.bloodBankId || "").trim();
    const bloodGroup = String(body.bloodGroup || "").trim();
    const phone = String(body.phone || "").trim();
    const requiredDate = String(body.requiredDate || "").trim();
    const reason = String(body.reason || "").trim();
    const units = Number(body.units);

    // Required fields
    if (!bloodBankId || !bloodGroup || !phone || !requiredDate) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 }
      );
    }

    // Blood group validation
    if (!BLOOD_GROUPS.includes(bloodGroup)) {
      return NextResponse.json(
        { error: "Select a valid blood group." },
        { status: 400 }
      );
    }

    // Units validation
    if (!Number.isInteger(units) || units < 1 || units > 20) {
      return NextResponse.json(
        { error: "Units must be between 1 and 20." },
        { status: 400 }
      );
    }

    // Phone validation
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit phone number." },
        { status: 400 }
      );
    }

    // Date validation
    if (!isValidRequiredDate(requiredDate)) {
      return NextResponse.json(
        {
          error:
            "Enter a valid required date. The date must be today or a future date.",
        },
        { status: 400 }
      );
    }

    // Find selected blood bank
    const bankSnapshot = await adminDb
      .collection("bloodBanks")
      .doc(bloodBankId)
      .get();

    if (!bankSnapshot.exists) {
      return NextResponse.json(
        { error: "Blood bank not found." },
        { status: 404 }
      );
    }

    const bank = bankSnapshot.data();

    if (bank?.status !== "active") {
      return NextResponse.json(
        {
          error:
            "This blood bank is not currently accepting requests.",
        },
        { status: 400 }
      );
    }

    if (!bank.hospitalId) {
      return NextResponse.json(
        {
          error:
            "This blood bank is not correctly linked to a hospital.",
        },
        { status: 400 }
      );
    }

    // Create blood request
    const requestRef = adminDb.collection("bloodRequests").doc();

    await requestRef.set({
      patientId: patient.uid,
      patientName: patient.name,
      patientEmail: patient.email,
      patientPhone: phone,

      bloodBankId,
      hospitalId: bank.hospitalId,

      hospitalName: bank.hospitalName || "",
      bloodBankName: bank.bloodBankName || "",
      bloodBankPhone: bank.phone || "",
      bloodBankAddress: bank.address || "",
      bloodBankCity: bank.city || "",
      bloodBankDistrict: bank.district || "",
      bloodBankState: bank.state || "",

      bloodGroup,
      units,
      requiredDate,
      reason,

      status: "pending",
      emailStatus: "not_sent",

      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your blood request has been submitted successfully.",
        requestId: requestRef.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Patient blood request error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to submit request.";

    const status = message.includes("Authentication required")
      ? 401
      : message.includes("not found")
        ? 404
        : message.includes("Only active") ||
            message.includes("verify your account")
          ? 403
          : 500;

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
