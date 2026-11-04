
import "server-only";

import fs from "node:fs";
import path from "node:path";

import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "life-bridge-6e646";

function getServiceAccount() {
  const envCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  let credentials: any;

  if (envCredentials) {
    try {
      credentials = JSON.parse(envCredentials);
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY contains invalid JSON."
      );
    }
  } else if (process.env.NODE_ENV !== "production") {
    const localPath = path.join(
      process.cwd(),
      "serviceAccountKey.json"
    );

    if (!fs.existsSync(localPath)) {
      throw new Error(
        "Firebase credentials missing. Configure FIREBASE_SERVICE_ACCOUNT_KEY."
      );
    }

    credentials = JSON.parse(
      fs.readFileSync(localPath, "utf8")
    );
  } else {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is missing. Add it to Vercel Environment Variables."
    );
  }

  if (credentials.project_id !== PROJECT_ID) {
    throw new Error(
      `Wrong Firebase Admin project: ${credentials.project_id}`
    );
  }

  if (credentials.private_key) {
    credentials.private_key =
      credentials.private_key.replace(/\\n/g, "\n");
  }

  return credentials;
}

const existingApp = getApps().find(
  (app) => app.name === "[DEFAULT]"
);

const adminApp =
  existingApp ||
  initializeApp({
    credential: cert(getServiceAccount()),
    projectId: PROJECT_ID,
  });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
