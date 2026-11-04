
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

function serializeDate(value: any): string | null {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === "string" ? value : null;
}

export async function GET(request: NextRequest) {
  // Access request headers outside try/catch.
  // This allows Next.js to handle prerendering interruptions.
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const decoded = await adminAuth.verifyIdToken(
      authorization.slice(7)
    );

    if (decoded.admin !== true) {
      return NextResponse.json(
        { error: "Admin permission required." },
        { status: 403 }
      );
    }

    const [
      usersCount,
      hospitalsCount,
      banksCount,
      requestsCount,
      applicationsCount,
      pendingApplicationsCount,
      recentApplicationsSnapshot,
      recentRequestsSnapshot,
    ] = await Promise.all([
      adminDb.collection("users").count().get(),

      adminDb.collection("users")
        .where("role", "==", "hospital")
        .count()
        .get(),

      adminDb.collection("bloodBanks").count().get(),

      adminDb.collection("bloodRequests").count().get(),

      adminDb.collection("hospitalApplications").count().get(),

      adminDb.collection("hospitalApplications")
        .where("status", "==", "pending")
        .count()
        .get(),

      adminDb.collection("hospitalApplications")
        .orderBy("submittedAt", "desc")
        .limit(5)
        .get(),

      adminDb.collection("bloodRequests")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get(),
    ]);

    const recentApplications = recentApplicationsSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        hospitalName:
          data.hospitalName ||
          data.bloodBankName ||
          "Unnamed hospital",
        email: data.email || "",
        city: data.city || "",
        district: data.district || "",
        status: data.status || "pending",
        submittedAt: serializeDate(data.submittedAt),
      };
    });

    const recentRequests = recentRequestsSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        patientName: data.patientName || "Unknown patient",
        bloodGroup: data.bloodGroup || "Unknown",
        units: Number(data.units || 0),
        bloodBankName: data.bloodBankName || "Unknown blood bank",
        status: data.status || "pending",
        createdAt: serializeDate(data.createdAt),
      };
    });

    return NextResponse.json({
      success: true,

      statistics: {
        users: usersCount.data().count,
        hospitals: hospitalsCount.data().count,
        bloodBanks: banksCount.data().count,
        bloodRequests: requestsCount.data().count,
        applications: applicationsCount.data().count,
        pendingApplications: pendingApplicationsCount.data().count,
      },

      recentApplications,
      recentRequests,
    });

  } catch (error) {
    console.error("Admin overview error:", error);

    return NextResponse.json(
      { error: "Unable to load admin dashboard." },
      { status: 500 }
    );
  }
}
