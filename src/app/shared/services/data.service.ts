import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {Data} from '../models/Data';

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

}
