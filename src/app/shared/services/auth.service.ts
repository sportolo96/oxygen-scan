import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { User } from '../models/User';
import {AngularFirestore} from "@angular/fire/compat/firestore";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  collectionName = 'User';

  constructor(private auth: AngularFireAuth, private angularFirestore: AngularFirestore) { }

  login(email: string, password: string) {
    return this.auth.signInWithEmailAndPassword(email, password);
  }

  signup(email: string, password: string): Promise<firebase.auth.UserCredential> {
    return this.auth.createUserWithEmailAndPassword(email, password);
  }

  sendPasswordResetEmail(email: string): Promise<void> {
    return this.auth.sendPasswordResetEmail(email);
  }

  async sendVerificationEmail(): Promise<void | undefined> {
    return this.auth.currentUser.then((user) => {
      return user?.sendEmailVerification();
    });
  }

  isUserLoggedIn():  Observable<firebase.User | null> {
    return this.auth.user;
  }

  logout() {
    let promise = this.auth.signOut();

    localStorage.removeItem('user');
    localStorage.removeItem('averageMeasurementResult');
    localStorage.removeItem('profilePicture');

    return promise;
  }

  async delete(): Promise<void> {
    return this.auth.currentUser.then((user) => {
      user?.delete();
    });
  }

  update(user: User): Promise<void> {
    return this.angularFirestore
      .collection<User>(this.collectionName)
      .doc(user.uid)
      .set(user);
  }

  async checkPassword(password: string): Promise<boolean> {
    const user = await this.auth.currentUser;
    if (user) {
      const credential = firebase.auth.EmailAuthProvider.credential(user.email ?? '', password);
      try {
        await user.reauthenticateWithCredential(credential)
        return true;
      } catch (error) {
        console.error("Hiba történt a jelszó ellenőrzése során:", error);
        return false;
      }
    } else {
      console.error("Nincs bejelentkezett felhasználó.");
      return false;
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    const user = await this.auth.currentUser;
    if (user) {
      return user.updatePassword(newPassword);
    } else {
      throw new Error('Nincs bejelentkezett felhasználó.');
    }
  }
}
