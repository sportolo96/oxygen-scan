import { Injectable } from '@angular/core';
import {AngularFirestore} from "@angular/fire/compat/firestore";
import { StorageService } from './storage.service';
import { FhirObservation } from '../models/FhirObservation';
import {NetworkStatusService} from "./network-status.service";

@Injectable({
  providedIn: 'root',
})
export class FirebaseSyncService {

  user: any;
  isOnline: boolean = false;

  constructor(
    private firestore: AngularFirestore,
    private storageService: StorageService,
    private networkStatusService: NetworkStatusService,
  ) {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.storageService.init()
    this.storageService.syncTrigger.subscribe(() => {
      this.syncOfflineData(this.isOnline);
    });

    this.networkStatusService.isOnline.subscribe((status) => {
      this.isOnline = status;
    });
  }

  public async syncOfflineData(isOnline = false) {
    const userId = this.user?.uid;

    if (!isOnline) {
      console.log('FirebaseSyncService', "We cannot sync data without network")
      return;
    }

    if (!userId) {
      console.log('FirebaseSyncService', "We cannot sync data without user")
      return;
    }

    const offlineData: FhirObservation[] = await this.storageService.getObservationData(userId);

    if (!offlineData || !offlineData.length) {
      console.log('FirebaseSyncService', "No local unsynced data")
    }

    if (offlineData && offlineData.length > 0) {
      for (const observation of offlineData) {
        try {
          await this.firestore.collection('Users').doc(userId).collection('Observations').add(observation);
          console.log('Data synced:', observation);
        } catch (error) {
          console.error('Error syncing data to Firebase:', error);
        }
      }
      await this.storageService.clearStorage();
      console.log('StorageCleared');
    }
  }
}
