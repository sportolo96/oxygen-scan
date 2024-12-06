import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { FhirObservation } from '../models/FhirObservation'
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private syncSubject: BehaviorSubject<void> = new BehaviorSubject<void>(null);
  storage = new Storage();

  constructor(
  ) {}

  async init() {
    await this.storage.create();
  }

  async saveObservationData(userId: string, observationData: FhirObservation[]) {
    let observations: FhirObservation[] = await this.storage.get(userId);
    if (!observations) {
      observations = [];
    }

    for (const observation of observationData) {
      observations.push(observation);
    }

    await this.storage.set(userId, observations);
    this.syncSubject.next();
  }

  async getObservationData(userId: string): Promise<FhirObservation[]> {
    return await this.storage.get(userId);
  }

  async clearStorage() {
    await this.storage.clear();
  }

  get syncTrigger() {
    return this.syncSubject.asObservable();
  }
}
