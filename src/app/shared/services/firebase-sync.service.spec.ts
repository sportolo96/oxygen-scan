import { TestBed } from '@angular/core/testing';

import { FirebaseSyncService } from './firebase-sync.service';

describe('FirebaseSyncService', () => {
  let service: FirebaseSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirebaseSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
