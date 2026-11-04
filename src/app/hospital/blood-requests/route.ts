
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendBloodRequestConfirmationEmail } from "@/lib/mailer";

async function verifyHospital(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Authentication required.");
  }

  const decoded = await adminAuth.verifyIdToken(
    authorization.slice(7)
  );

  const userSnapshot = await adminDb
    .collection("users")
    .doc(decoded.uid)
    .get();

  const profile = userSnapshot.data();

  if (
    !userSnapshot.exists ||
    profile?.role !== "hospital" ||
    profile?.accountStatus !== "approved"
  ) {
    throw new Error("Hospital account is not approved.");
  }

  return decoded;
}

function errorResponse(error: unknown) {
  console.error("Hospital blood requests API error:", error);

  const message =
    error instanceof Error ? error.message : "Something went wrong.";

  const status = message.includes("Authentication required")
    ? 401
    : message.includes("not approved")
      ? 403
      : 500;

  return NextResponse.json({ error: message }, { status });
}

function serializeRequest(document: FirebaseFirestore.QueryDocumentSnapshot) {
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
    respondedAt: data.respondedAt?.toDate
      ? data.respondedAt.toDate().toISOString()
      : null,
  };
}

// GET: Load requests sent to this hospital.
export async function GET(request: NextRequest) {
  try {
    const hospital = await verifyHospital(request);

    const snapshot = await adminDb
      .collection("bloodRequests")
      .where("hospitalId", "==", hospital.uid)
      .get();

    const requests = snapshot.docs
      .map(serializeRequest)
      .sort((a, b) =>
        String(b.createdAt || "").localeCompare(
          String(a.createdAt || "")
        )
      );

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// PATCH: Confirm or reject a patient request.
export async function PATCH(request: NextRequest) {
  try {
    const hospital = await verifyHospital(request);
    const body = await request.json();

    const requestId = String(body.requestId || "").trim();
    const status = String(body.status || "").trim();
    const response = String(body.response || "").trim();

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required." },
        { status: 400 }
      );
    }

    if (!["confirmed", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid request status." },
        { status: 400 }
      );
    }

    const requestRef = adminDb
      .collection("bloodRequests")
      .doc(requestId);

    let requestData: FirebaseFirestore.DocumentData | undefined;

    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(requestRef);

      if (!snapshot.exists) {
        throw new Error("Blood request not found.");
      }

      const data = snapshot.data()!;

      if (data.hospitalId !== hospital.uid) {
        throw new Error("You cannot manage this request.");
      }

      if (data.status !== "pending") {
        throw new Error("This request has already been processed.");
      }

      requestData = data;

      transaction.update(requestRef, {
        status,
        response,
        respondedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        emailStatus:
          status === "confirmed" ? "sending" : "not_required",
      });
    });

    let emailStatus = status === "confirmed"
      ? "failed"
      : "not_required";

    if (status === "confirmed" && requestData) {
      try {
        await sendBloodRequestConfirmationEmail({
          patientName: requestData.patientName || "Patient",
          patientEmail: requestData.patientEmail,
          bloodGroup: requestData.bloodGroup,
          units: requestData.units,
          bloodBankName: requestData.bloodBankName,
          hospitalName: requestData.hospitalName,
          phone: requestData.bloodBankPhone || "",
          address: requestData.bloodBankAddress || "",
          city: requestData.bloodBankCity || "",
          district: requestData.bloodBankDistrict || "",
          state: requestData.bloodBankState || "",
          requestId,
          response,
        });

        emailStatus = "sent";
      } catch (emailError) {
        console.error("Confirmation email failed:", emailError);
      }
    }

    await requestRef.update({
      emailStatus,
      emailUpdatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message:
        status === "confirmed"
          ? emailStatus === "sent"
            ? "Request confirmed and patient email sent successfully."
            : "Request confirmed, but the patient email could not be sent."
          : "Blood request rejected successfully.",
      emailStatus,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
