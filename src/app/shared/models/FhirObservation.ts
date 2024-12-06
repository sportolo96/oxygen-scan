export interface FhirObservation {
  resourceType: string;
  status: string;
  category: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  subject: {
    reference: string;
  };
  valueQuantity: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  effectiveDateTime: string;
}
