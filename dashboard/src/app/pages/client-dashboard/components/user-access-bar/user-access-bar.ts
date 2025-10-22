import {
  Component,
  inject,
  input,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { getItem } from '@core/store/session.store';
import { AuthConstants } from '@core/constants/auth.constants';
import { Roles } from '@core/constants/auth.role.constants';
import { MatDialog } from '@angular/material/dialog';
import { DialogUserAccess } from '../../dialogs/dialog-user-access/dialog-user-access';

@Component({
  selector: 'app-user-access-bar',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule],
  templateUrl: './user-access-bar.html',
  styleUrl: './user-access-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAccessBarComponent {
  clientId = input.required<string>();
  clientName = input.required<string>();

  constructor(private dialog: MatDialog) {}

  private router = inject(Router);

  private userRole = signal<string | null>(
    getItem(AuthConstants.USER_ROLE) ?? null
  );

  protected isClient = computed(() => this.userRole() === Roles.CLIENT);

  protected buttonLabel = computed(() =>
    this.userRole() === Roles.CLIENT ? 'User Access' : 'Settings'
  );

  protected navigateToViewClients(): void {
    this.router.navigate(['/client-management']);
  }

  protected userBarAction(): void {
    if (this.userRole() === Roles.CLIENT) {
      this.dialog.open(DialogUserAccess, {
        data: {
          clientId: this.clientId(),
          clientName: this.clientName(),
          autoFocus: false,
        },
      });
    } else {
      this.router.navigate(['/client-management/settings/' + this.clientId()]);
    }
  }
}
