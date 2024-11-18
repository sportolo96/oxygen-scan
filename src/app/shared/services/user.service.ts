import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {User} from '../models/User';
import {ImageService} from "./image.service";
import {DataService} from "./data.service";
import {AuthService} from "./auth.service";
import {AngularFireAuth} from "@angular/fire/compat/auth";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  collectionName = 'Users';

  constructor(private afs: AngularFirestore, private imageService: ImageService, private dataService: DataService, private authService: AuthService, private afAuth: AngularFireAuth) {
  }

  create(user: User): Promise<void> {
    return this.afs
      .collection<User>(this.collectionName)
      .doc(user.uid)
      .set(user);
  }

  getAll() {
    return this.afs.collection<User>(this.collectionName).valueChanges();
  }

  getById(id: string) {
    return this.afs.collection<User>(this.collectionName).doc(id).valueChanges();
  }

  update(user: User) {
    return this.afs.collection<User>(this.collectionName).doc(user.uid).set(user);
  }

  delete(id: string) {
    return this.afs.collection<User>(this.collectionName).doc(id).delete();
  }
}
