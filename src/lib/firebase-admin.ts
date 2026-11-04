
import "server-only";

import fs from "node:fs";
import path from "node:path";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount() {
  const envCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  const credentials = envCredentials
    ? JSON.parse(envCredentials)
    : JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), "serviceAccountKey.json"),
          "utf8"
        )
      );

  if (credentials.project_id !== "life-bridge-6e646") {
    throw new Error(
      `Wrong Firebase Admin project: ${credentials.project_id}`
    );
  }

  return credentials;
}

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(getServiceAccount()),
        projectId: "life-bridge-6e646",
      });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
