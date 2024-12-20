import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {User} from '../models/User';
import {ImageService} from "./image.service";
import {AuthService} from "./auth.service";
import {AngularFireAuth} from "@angular/fire/compat/auth";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  collectionName = 'Users';

  constructor(private afs: AngularFirestore, private imageService: ImageService, private authService: AuthService, private afAuth: AngularFireAuth) {
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

  async delete(userId: string): Promise<void> {
    try {
      const subCollections = ['Observations'];

      for (const subCollection of subCollections) {
        await this.deleteSubCollection(userId, subCollection);
      }

      await this.afs.collection('Users').doc(userId).delete();
      console.log(`User ${userId} deleted.`);
    } catch (error) {
      console.error(`Error during user delete process: ${error.message}`);
    }
  }

  async deleteSubCollection(userId: string, subcollectionName: string): Promise<void> {
    try {
      const subCollectionRef = this.afs.collection(`Users/${userId}/${subcollectionName}`);
      const snapshot = await subCollectionRef.get().toPromise();

      const deletePromises = snapshot?.docs.map(doc => doc.ref.delete()) || [];
      await Promise.all(deletePromises);

      console.log(`SubCollection ${subcollectionName} deleted.`);
    } catch (error) {
      console.error(`Error during delete process: ${error.message}`);
    }
  }
}
