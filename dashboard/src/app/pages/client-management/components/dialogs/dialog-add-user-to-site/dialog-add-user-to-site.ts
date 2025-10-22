import { Component, Inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserForClient } from '@client-management/models/dtos/user-for-client.model';
import { ClientManagementFormGroupBuilder } from '@client-management/models/form-group/client-management-form-group-builder';
import { SiteService } from '@client-management/services/site.service';
import { MatSelectModule } from '@angular/material/select';
import { single } from 'rxjs';

@Component({
  selector: 'app-dialog-add-user-to-site',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatSelectModule,
  ],
  templateUrl: './dialog-add-user-to-site.html',
  styleUrl: './dialog-add-user-to-site.scss',
  standalone: true,
})
export class DialogAddUserToSite {
  protected clientManagementFormGroupBuilder!: ClientManagementFormGroupBuilder;
  protected usersControl = new FormControl<UserForClient[]>([]);
  protected users = signal<UserForClient[]>([]);
  readonly searchTermControl = new FormControl<string>('');

  constructor(
    private dialogRef: MatDialogRef<DialogAddUserToSite>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      siteId: string;
      siteName: string;
      users: UserForClient[];
      usersOnTheSite: string[];
    },
    private siteService: SiteService
  ) {
    this.users.set(
      data.users.filter((u) => !data.usersOnTheSite.includes(u.userId))
    );
  }

  protected getUserDisplayName = (selectedUserId: string): string => {
    const selectedUser = this.data.users.find(
      (u) => u.userId == selectedUserId
    );
    return selectedUser ? selectedUser.displayName : '';
  };

  protected async addUsersToSite() {
    const users = this.usersControl.value;

    await this.siteService.addUsersToSite(
      this.data.siteId,
      users?.map((u) => u.userId) ?? []
    );

    this.dialogRef.close({ userAdded: true });
  }

  protected closeDialog() {
    this.dialogRef.close();
  }

  userName(user: UserForClient): string {
    return (
      this.users().find((x) => x.userId === user.userId)?.displayName ??
      user.userId
    );
  }

  formatUserNames(ids: UserForClient[] | null): string {
    return (ids ?? []).map((id) => this.userName(id)).join(', ');
  }

  filteredUsers(): UserForClient[] {
    // TODO: Filter on search
    return this.users();
  }
}
