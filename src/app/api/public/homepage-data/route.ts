
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    // Read hospital applications and blood bank listings.
    const [hospitalSnapshot, bloodBankSnapshot] = await Promise.all([
      adminDb.collection("hospitalApplications").get(),
      adminDb.collection("bloodBanks").get(),
    ]);

    // Only hospitals whose applications have been approved.
    const approvedHospitals = hospitalSnapshot.docs.filter((document) => {
      const data = document.data();
      return data.status === "approved";
    });

    // Only active blood banks.
    const activeBloodBanks = bloodBankSnapshot.docs.filter((document) => {
      const data = document.data();
      return data.status === "active";
    });

    const bloodBanks = activeBloodBanks.map((document) => {
      const data = document.data();

      return {
        id: document.id,
        hospitalId: data.hospitalId || "",
        hospitalName: data.hospitalName || "",
        bloodBankName: data.bloodBankName || "",
        bloodBankType: data.bloodBankType || "",
        address: data.address || "",
        city: data.city || "",
        district: data.district || "",
        state: data.state || "",
        pincode: data.pincode || "",
        phone: data.phone || "",
        operatingHours: data.operatingHours || "",
        inventory: data.inventory || {},
        inventoryUpdatedAt: data.inventoryUpdatedAt?.toDate
          ? data.inventoryUpdatedAt.toDate().toISOString()
          : null,
      };
    });

    const hospitals = approvedHospitals.map((document) => {
      const data = document.data();

      const hospitalBloodBanks = bloodBanks.filter(
        (bank) => bank.hospitalId === document.id
      );

      return {
        id: document.id,
        hospitalName: data.hospitalName || "Hospital",
        city: data.city || "",
        district: data.district || "",
        state: data.state || "",
        bloodBankCount: hospitalBloodBanks.length,
      };
    });

    return NextResponse.json(
      {
        success: true,
        hospitals,
        bloodBanks,
        debug: {
          totalApplications: hospitalSnapshot.size,
          approvedHospitals: hospitals.length,
          totalBloodBanks: bloodBankSnapshot.size,
          activeBloodBanks: bloodBanks.length,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Homepage data API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load homepage data.",
      },
      { status: 500 }
    );
  }
}
