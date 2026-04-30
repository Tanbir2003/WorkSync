import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load service account key
const serviceAccountPath = resolve(__dirname, "serviceAccountKey.json");

let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
  }
} catch (err) {
  console.error(
    "❌ Could not load Firebase credentials."
  );
  console.error(
    "   Please provide FIREBASE_SERVICE_ACCOUNT env var or serviceAccountKey.json file."
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
