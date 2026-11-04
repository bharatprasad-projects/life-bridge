import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function verifyAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Authentication required.");
  }

  const token = authorization.slice(7);
  const decoded = await adminAuth.verifyIdToken(token);

  if (decoded.admin !== true) {
    throw new Error("Admin permission required.");
  }

  return decoded;
}

// GET: Fetch all hospital applications
export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const snapshot = await adminDb
      .collection("hospitalApplications")
      .orderBy("submittedAt", "desc")
      .get();

    const applications = snapshot.docs.map((document) => {
      const data = document.data();

      return {
        id: document.id,
        ...data,
        submittedAt: data.submittedAt?.toDate
          ? data.submittedAt.toDate().toISOString()
          : null,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate().toISOString()
          : null,
        reviewedAt: data.reviewedAt?.toDate
          ? data.reviewedAt.toDate().toISOString()
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Admin application listing error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to load applications.";

    const status = message.includes("Admin permission")
      ? 403
      : message.includes("Authentication required")
        ? 401
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

// PATCH: Approve or reject a hospital application
export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const body = await request.json();
    const { applicationId, decision } = body;

    if (
      typeof applicationId !== "string" ||
      !applicationId.trim() ||
      !["approved", "rejected"].includes(decision)
    ) {
      return NextResponse.json(
        { error: "Invalid application decision." },
        { status: 400 }
      );
    }

    const applicationRef = adminDb
      .collection("hospitalApplications")
      .doc(applicationId);

    const applicationSnapshot = await applicationRef.get();

    if (!applicationSnapshot.exists) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    const application = applicationSnapshot.data();

    if (application?.status !== "pending") {
      return NextResponse.json(
        { error: "This application has already been reviewed." },
        { status: 409 }
      );
    }

    // Use the application UID when available.
    const userId = application.uid || applicationId;
    const userRef = adminDb.collection("users").doc(userId);

    await adminDb.runTransaction(async (transaction) => {
      const currentApplication = await transaction.get(applicationRef);

      if (!currentApplication.exists) {
        throw new Error("Application not found.");
      }

      if (currentApplication.data()?.status !== "pending") {
        throw new Error("This application has already been reviewed.");
      }

      transaction.update(applicationRef, {
        status: decision,
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: admin.uid,
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (decision === "approved") {
        transaction.set(
          userRef,
          {
            role: "hospital",
            accountStatus: "approved",
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        transaction.set(
          userRef,
          {
            accountStatus: "rejected",
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    });

    return NextResponse.json({
      success: true,
      message:
        decision === "approved"
          ? "Hospital approved successfully."
          : "Application rejected successfully.",
    });
  } catch (error) {
    console.error("Hospital application review error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update application.";

    const status = message.includes("Admin permission")
      ? 403
      : message.includes("Authentication required")
        ? 401
        : message.includes("not found")
          ? 404
          : message.includes("already been reviewed")
            ? 409
            : 500;

    return NextResponse.json({ error: message }, { status });
  }
}