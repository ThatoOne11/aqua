import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientTile } from './client-tile';

describe('ClientTile', () => {
  let component: ClientTile;
  let fixture: ComponentFixture<ClientTile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientTile],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientTile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
