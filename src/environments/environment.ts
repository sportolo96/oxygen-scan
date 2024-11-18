// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import firebase from "firebase/compat/app";

export const environment = {
  production: false,
  hostUrl: 'http://localhost:4200',
  firebase: {
    apiKey: "AIzaSyBGG9ZYgCFTNadDAyAhi5gU-Q-KCrUesdg",
    authDomain: "oxygenscan-3ea1f.firebaseapp.com",
    projectId: "oxygenscan-3ea1f",
    storageBucket: "oxygenscan-3ea1f.firebasestorage.app",
    messagingSenderId: "273414852387",
    appId: "1:273414852387:web:f2e74ada98856bba8f4696",
    measurementId: "G-S102GBM9G4"
  }
};
