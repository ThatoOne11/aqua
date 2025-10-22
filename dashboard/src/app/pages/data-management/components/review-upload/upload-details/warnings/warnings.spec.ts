import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Warnings } from './warnings';

describe('Warnings', () => {
  let component: Warnings;
  let fixture: ComponentFixture<Warnings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Warnings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Warnings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
