
const path = require("path");

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    throw new Error("Please provide the administrator email.");
  }

  console.log("1. Loading service account...");

  const serviceAccount = require(
    path.join(__dirname, "..", "serviceAccountKey.json")
  );

  if (!serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error("Invalid service account credentials.");
  }

  console.log("2. Initializing Firebase Admin...");

  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  console.log("3. Connecting to Firebase Authentication...");

  const auth = getAuth();
  const db = getFirestore();

  console.log("4. Finding administrator account...");

  const user = await auth.getUserByEmail(email);

  console.log("5. Assigning administrator permissions...");

  const existingClaims = user.customClaims || {};

  await auth.setCustomUserClaims(user.uid, {
    ...existingClaims,
    admin: true,
  });

  console.log("6. Updating Firestore profile...");

  await db.collection("users").doc(user.uid).set(
    {
      uid: user.uid,
      name: user.displayName || "",
      email: user.email,
      photoURL: user.photoURL || "",
      role: "admin",
      accountStatus: "active",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log("");
  console.log("==================================");
  console.log(" ADMIN ACCOUNT CREATED SUCCESSFULLY");
  console.log("==================================");
  console.log("Email:", user.email);
  console.log("UID:", user.uid);
  console.log("Role: admin");
  console.log("Custom claim: admin = true");
}

makeAdmin().catch((error) => {
  console.error("ADMIN SETUP FAILED:");
  console.error(error);
  process.exit(1);
});
