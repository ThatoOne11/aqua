import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientManagementViewAll } from './client-management-view-all';

describe('ClientManagementViewAll', () => {
  let component: ClientManagementViewAll;
  let fixture: ComponentFixture<ClientManagementViewAll>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientManagementViewAll],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientManagementViewAll);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
