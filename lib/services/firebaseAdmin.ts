// fiebase admin sdk
import * as admin from 'firebase-admin';
import firebaseapp from 'firebase/app';
import 'firebase/auth';
import * as status from 'http-status';
import * as StandardError from 'standard-error';

import { config } from '../config';
const environment = 'production';

// firebase admin initialization
const firebaseConfig = {
  type: config.FIREBASE_ADMIN_TYPE,
  project_id: config.FIREBASE_ADMIN_PROJECT_ID,
  private_key_id: config.FIREBASE_ADMIN_PRIVATE_KEY_ID,
  private_key: config.FIREBASE_ADMIN_PRIVATE_KEY,
  client_email: config.FIREBASE_ADMIN_CLIENT_EMAIL,
  client_id: config.FIREBASE_ADMIN_CLIENT_ID,
  auth_uri: config.FIREBASE_ADMIN_AUTH_URI,
  token_uri: config.FIREBASE_ADMIN_TOKEN_URI,
  auth_provider_x509_cert_url: config.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: config.FIREBASE_ADMIN_CLIENT_X509_CERT_URL
};
const adminAccountConfig = firebaseConfig as admin.ServiceAccount;
admin.initializeApp({
  credential: admin.credential.cert(adminAccountConfig)
});

// firebase initialization
const firebaseUserConfig = {
  apiKey: config.FIREBASE_USER_API_KEY,
  authDomain: config.FIREBASE_USER_AUTH_DOMAIN,
  projectId: config.FIREBASE_USER_PROJECT_ID,
  storageBucket: config.FIREBASE_USER_STROAGE_BUCKET,
  messagingSenderId: config.FIREBASE_USER_MESSAGING_SENDER_ID,
  appId: config.FIREBASE_USER_APP_ID
};
firebaseapp.initializeApp(firebaseUserConfig);
const auth = firebaseapp.auth();
if (config.NODE_ENV !== environment) {
  auth.useEmulator(`http://localhost:${config.FIREBASE_EMULATOR_AUTH_PORT}`);
}

class FirebaseAdminService {
   createUser = async ( name: { first: string, last: string } , email: string, password: string ) => {
    try {
      const firebaseUser = {
        displayName: `${name.first} ${name.last}`,
        email,
        password,
        emailVerified: false,
      };
      const firebaseAuthUser = await admin.auth().createUser(firebaseUser);
      return firebaseAuthUser;
     } catch (err) {
      throw new StandardError({ message: err.message, code: status.CONFLICT });
     }
   }

   createCustomToken = async (uid: string) => {
    try {
      const token = await admin.auth().createCustomToken(uid);
      return token;
    } catch (err) {
      throw new StandardError({ message: err.message, code: status.CONFLICT });
    }
   }

   verifyIdToken = async (idToken: string) => {
    try {
      const firebaseUser = await admin.auth().verifyIdToken(idToken);
      return firebaseUser;
    } catch (err) {
      throw new StandardError({ message: err.message, code: status.CONFLICT });
    }
   }

   signInUser = async ( email: string, password: string) => {
     try {
      const firebaseUser = await auth.signInWithEmailAndPassword(email, password);
      return firebaseUser;
     } catch (err) {
      throw new StandardError({ message: err.message, code: status.CONFLICT });
     }
   }

   updateUserPassword = async ( uid: string, password: string) => {
    try {
     const firebaseUser = await admin.auth().updateUser(uid, { password });
     return firebaseUser;
    } catch (err) {
     throw new StandardError({ message: err.message, code: status.CONFLICT });
    }
  }

  deleteUser = async ( uid: string, ) => {
    try {
     await admin.auth().deleteUser(uid);
     return { message: 'user deleted' };
    } catch (err) {
     throw new StandardError({ message: err.message, code: status.CONFLICT });
    }
  }

  sendPushNotifications = async ({ tokens, title, body }) => {
    try {
      const message = { notification: { title, body } };
      return await admin.messaging().sendToDevice(tokens, message);
     } catch (err) {
      throw new StandardError({ message: err.message, code: status.CONFLICT });
     }
  }
}

export const firebaseService = new FirebaseAdminService();
