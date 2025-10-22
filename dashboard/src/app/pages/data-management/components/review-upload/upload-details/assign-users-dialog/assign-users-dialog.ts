import { Component, inject, Inject, Input, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '@client-management/models/dtos/user.model';
import { UserSupabaseService } from '@core/services/supabase/users.supabase.service';
import { UserHelper } from 'src/app/shared/services/user-helper.service';

@Component({
  selector: 'app-assign-users-dialog',
  imports: [
    MatChipsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './assign-users-dialog.html',
  styleUrl: './assign-users-dialog.scss',
  standalone: true,
})
export class AssignUsersDialog {
  @Input({ required: true }) clientId: string | undefined;

  private formBuilder = inject(FormBuilder);

  protected users = signal<User[]>([]);
  protected existingUsers = signal<User[]>([]);
  protected errorMessage = signal<string | null>(null);
  protected usersControl = new FormControl<User[]>([]);
  protected userFormGroup!: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<AssignUsersDialog>,
    private userSupabaseService: UserSupabaseService,
    private userHelper: UserHelper,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      siteId: string;
      siteName: string;
      clientName: string;
      existingClientUsers: User[];
      currentSelectedUsers: User[];
    }
  ) {
    this.setupUsersControl(data.existingClientUsers, data.currentSelectedUsers);
  }

  protected async addNewUser() {
    const newUser: User = this.userFormGroup.getRawValue();
    const validationResult =
      await this.userHelper.getValidationErrorsForAddingUser(
        this.users(),
        this.data.existingClientUsers,
        newUser.email
      );
    if (!validationResult.isValid) {
      this.errorMessage.set(validationResult.errorMessage);
      return;
    }
    this.users.update((users) => [...users, newUser]);
    this.userFormGroup.reset({
      display_name: null,
      email: null,
    });
    this.errorMessage.set(null);
  }

  protected removeUser(userToRemove: User) {
    this.users.update((users) =>
      users.filter(
        (u) =>
          !(
            u.email === userToRemove.email &&
            u.display_name === userToRemove.display_name
          )
      )
    );

    if (userToRemove.id) {
      this.usersControl.setValue(
        (this.usersControl.value ?? []).filter(
          (u) =>
            !(
              u.email === userToRemove.email &&
              u.display_name === userToRemove.display_name
            )
        )
      );
    }
  }

  protected formatUserNames(ids: User[] | null): string {
    return (ids ?? []).map((id) => this.userName(id)).join(', ');
  }

  protected filteredUsers(): User[] {
    return this.existingUsers();
  }

  protected save() {
    this.dialogRef.close(this.users());
  }

  protected close() {
    this.dialogRef.close();
  }

  private setupUsersControl(
    existingClientUsers: User[],
    currentSelectedUsers: User[]
  ) {
    this.userFormGroup = this.buildAddUserForm();
    this.existingUsers.set(existingClientUsers);

    this.handleCurrentSelectedUsers(existingClientUsers, currentSelectedUsers);

    this.usersControl.valueChanges.subscribe((selected) => {
      const selectedUsers = selected ?? [];
      this.users.update((current) => {
        const stillSelected = current.filter(
          (u) => selectedUsers.some((s) => s.id === u.id) || u.id === ''
        );
        const newlySelected = selectedUsers.filter(
          (s) => !current.some((u) => u.id === s.id)
        );
        return [...stillSelected, ...newlySelected];
      });
    });
  }

  private handleCurrentSelectedUsers(
    existingClientUsers: User[],
    currentSelectedUsers: User[]
  ) {
    this.users.set(currentSelectedUsers);

    const preselected = currentSelectedUsers.filter((c) =>
      existingClientUsers.some((e) => e.email === c.email)
    );
    this.usersControl.setValue(preselected);
  }

  private userName(user: User): string {
    return (
      this.existingUsers().find((x) => x.id === user.id)?.display_name ??
      user.id
    );
  }

  private buildAddUserForm(): FormGroup {
    return this.formBuilder.group({
      id: [''],
      display_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }
}
