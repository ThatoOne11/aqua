import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadBlock } from './upload-block';

describe('UploadBlock', () => {
  let component: UploadBlock;
  let fixture: ComponentFixture<UploadBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadBlock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadBlock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
