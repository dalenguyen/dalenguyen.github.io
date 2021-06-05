import { TestBed } from '@angular/core/testing';

import { IsOwnerGuard } from './is-owner.guard';

describe('IsOwnerGuard', () => {
  let guard: IsOwnerGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(IsOwnerGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
