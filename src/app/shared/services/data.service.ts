import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {Data} from '../models/Data';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  collectionName = 'Data';

  constructor(private afs: AngularFirestore) {
  }

  getAll() {
    return this.afs.collection<Data>(this.collectionName).valueChanges();
  }

  getByEmail(email: string){
    return this.afs.collection<Data>(this.collectionName, ref => ref.where('email', '==', email).orderBy('date', 'asc')).valueChanges();
  }

  create(data: Data) {
    return this.afs.collection<Data>(this.collectionName).add(data);
  }

  async deleteById(uid: string) {
    const batch = this.afs.firestore.batch(); // Új batch write

    try {
      const querySnapshot = await lastValueFrom(
        this.afs.collection<Data>(this.collectionName, ref_1 => ref_1.where('uid', '==', uid).orderBy('date', 'asc'))
          .get()
      );
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      return await batch.commit();
    } catch (error) {
      console.error('Hiba történt a törlés során:', error);
      throw error;
    }
  }

}
