import { AppOptions, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { cert } from "firebase-admin/app";

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set");
}

// Parse the base64 encoded service account once
const serviceAccount = JSON.parse(
  Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, "base64").toString()
);

// Initialize Firebase Admin
const firebaseAdminConfig: AppOptions = {
  credential: cert({
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key,
    projectId: serviceAccount.project_id,
  }),
};

const app = initializeApp(firebaseAdminConfig);

// Pre-initialized Firestore instance
export const firestore = getFirestore(app);

// Export the service account for other uses
export { serviceAccount };

// Helper to get project ID from service account
export const getProjectId = (): string => {
  return serviceAccount.project_id;
};
