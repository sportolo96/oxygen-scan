import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  hasProfilePicture: boolean;
}
