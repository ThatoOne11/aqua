import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportHistory } from './import-history';

describe('ImportHistory', () => {
  let component: ImportHistory;
  let fixture: ComponentFixture<ImportHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
