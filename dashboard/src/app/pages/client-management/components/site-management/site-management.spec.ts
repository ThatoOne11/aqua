import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteManagement } from './site-management';

describe('SiteManagement', () => {
  let component: SiteManagement;
  let fixture: ComponentFixture<SiteManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
