import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {AngularFireStorage, AngularFireUploadTask} from "@angular/fire/compat/storage";

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  constructor(private storage: AngularFireStorage) {}

  deleteImage(url: string): Observable<any> {
    return this.storage.ref(url).delete();
  }

  uploadImage(path: string, data: any): AngularFireUploadTask {
    return this.storage.upload(path, data);
  }

  getImage(url: string): Observable<any> {
    return this.storage.ref(url).getDownloadURL();
  }
}
