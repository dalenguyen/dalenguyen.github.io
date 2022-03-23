import { TestBed } from '@angular/core/testing';

import { JsonExporterService } from './json-exporter.service';

describe('JsonExporterService', () => {
  let service: JsonExporterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonExporterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
