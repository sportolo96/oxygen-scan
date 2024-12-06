import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { FhirObservation } from '../models/FhirObservation'

@Injectable({
  providedIn: 'root',
})
export class ObservationService {
  public createObservation(
    userid: string,
    timestamp: string,
    measurementType: string,
    code: string,
    displayText: string,
    value: number,
    unit: string
  ): FhirObservation {
    return {
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: code,
            display: displayText,
          },
        ],
        text: displayText,
      },
      subject: {
        reference: `Patient/${userid}`,
      },
      valueQuantity: {
        value: value,
        unit: unit,
        system: 'http://unitsofmeasure.org',
        code: unit,
      },
      effectiveDateTime: timestamp,
    };
  }
}
