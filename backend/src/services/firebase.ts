import { AppOptions, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { cert } from "firebase-admin/app";

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set");
}

const serviceAccount = JSON.parse(
  Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, "base64").toString()
);

const firebaseAdminConfig: AppOptions = {
  credential: cert({
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key,
    projectId: serviceAccount.project_id,
  }),
};

const app = initializeApp(firebaseAdminConfig);

export const firestore = getFirestore(app);

export { serviceAccount };

export const getProjectId = (): string => {
  return serviceAccount.project_id;
};
