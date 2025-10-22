import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientManagementSettingClient } from './client-management-settings-client';

describe('ClientManagementSettingClient', () => {
  let component: ClientManagementSettingClient;
  let fixture: ComponentFixture<ClientManagementSettingClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientManagementSettingClient],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientManagementSettingClient);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
