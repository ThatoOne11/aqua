import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataValidationBlock } from './data-validation-block';

describe('DataValidationBlock', () => {
  let component: DataValidationBlock;
  let fixture: ComponentFixture<DataValidationBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataValidationBlock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataValidationBlock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
