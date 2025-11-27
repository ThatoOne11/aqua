import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UserForClient } from '@client-management/models/dtos/user-for-client.model';
import { AgGrid } from '@shared-components/ag-grid/ag-grid';
import { getCurrentClientColDefs as GetCurrentClientColDefs } from '@client-management/models/column-defintions/current-clients-colum-definition';
import { ColDef } from 'ag-grid-community';
import { AlertForClient } from '@client-management/models/dtos/alert-for-client.model';
import { ClientManagementFormGroupBuilder } from '@client-management/models/form-group/client-management-form-group-builder';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ClientManagementService } from '@client-management/services/client-management.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { PageTitleComponent } from '@shared-components/page-title/page-title.component';
import { SiteManagement } from '../site-management/site-management';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialog } from '@shared-components/error-dialog/error-dialog';
import { ClientSupabaseService } from '@core/services/supabase/clients.supabase.service';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '@shared-components/confirmation-dialog/confirmation-dialog';
import { AlertManagement } from '../alert-management/alert-management';
import { Client } from '@client-management/models/dtos/client.model';
import { LoaderService } from '@core/services/loading.service';
import { UserHelper } from 'src/app/shared/services/user-helper.service';

@Component({
  selector: 'app-client-management-settings-client',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    AgGrid,
    MatAutocompleteModule,
    PageTitleComponent,
    SiteManagement,
    AlertManagement,
  ],
  templateUrl: './client-management-settings-client.html',
  styleUrl: './client-management-settings-client.scss',
  standalone: true,
})
export class ClientManagementSettingClient implements OnInit {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private clientManagementService = inject(ClientManagementService);
  private dialog = inject(MatDialog);
  private clientSupabaseService = inject(ClientSupabaseService);
  private loaderService = inject(LoaderService);
  private userHelper = inject(UserHelper);

  protected clientId: string;
  protected client!: Client;

  protected isSubmitting = signal<boolean>(false);
  protected isEditClient: boolean = false;
  protected isClientAndUserDetails: boolean = true;
  protected isSiteDetails: boolean = false;
  protected isAlertSettings: boolean = false;
  protected currentClientColDefs!: ColDef[];
  protected currentUserRowData = signal<UserForClient[]>([]);
  protected currentAlertRowData = signal<AlertForClient[]>([]);
  protected isEmailAlreadyPresent: boolean = false;
  protected hasChanges: boolean = false;

  protected clientManagementFormGroupBuilder!: ClientManagementFormGroupBuilder;
  protected clientFormGroup!: FormGroup;
  protected userFormGroup!: FormGroup;

  constructor() {
    this.clientId = this.activatedRoute.snapshot.paramMap.get('id')!;
    this.createFormGroups();
  }

  public async ngOnInit() {
    if (this.clientId) {
      this.isEditClient = true;
      await this.setCurrentClient();
    }
    this.currentClientColDefs = GetCurrentClientColDefs(
      !this.isEditClient,
      (userToRemove: UserForClient) => this.removeUser(userToRemove)
    );
  }

  protected async setCurrentClient() {
    this.client = await this.clientManagementService.getClient(this.clientId);
    this.currentUserRowData.set(this.client.users);
    this.currentAlertRowData.set(this.client.alerts);
    this.clientFormGroup.get('channel')?.setValue(this.client.channel);
  }

  protected showClientAndUserDetails() {
    this.isClientAndUserDetails = true;
    this.isAlertSettings = false;
    this.isSiteDetails = false;
  }

  protected showAlertSettings() {
    this.isClientAndUserDetails = false;
    this.isAlertSettings = true;
    this.isSiteDetails = false;
  }

  protected showSiteDetails() {
    this.isClientAndUserDetails = false;
    this.isAlertSettings = false;
    this.isSiteDetails = true;
  }

  protected async addUser() {
    this.hasChanges = true;
    const { displayName, email } = this.userFormGroup.value;
    this.isEmailAlreadyPresent = this.currentUserRowData().some(
      (u) => u.email.toLowerCase() === email?.toLowerCase()
    );
    if (this.isEmailAlreadyPresent) {
      return;
    }

    const existingClientUsers = this.client ? this.client.users : [];

    const validationResult =
      await this.userHelper.getValidationErrorsForAddingUserOnClient(
        this.currentUserRowData(),
        existingClientUsers,
        email
      );
    if (!validationResult.isValid) {
      this.dialog.open(ErrorDialog, {
        data: {
          title: 'Unable to add user',
          message:
            'The user cannot be added to this client due to the following reason: ' +
            validationResult.errorMessage,
        },
      });
      return;
    }

    var newUser = new UserForClient('', displayName, email);
    this.currentUserRowData.set([...this.currentUserRowData(), newUser]);
    this.userFormGroup.reset({
      displayName: null,
      email: null,
    });
  }

  protected async removeUser(userToRemove: UserForClient) {
    this.hasChanges = true;
    const shouldRemoveUser = await firstValueFrom(
      this.dialog
        .open(ConfirmDialog, {
          data: {
            title: 'Remove User',
            message: `Are you sure you want to remove user '${userToRemove.email}'?`,
          },
        })
        .afterClosed()
    );
    if (!shouldRemoveUser) return;
    this.currentUserRowData.set(
      this.currentUserRowData().filter((user) => user !== userToRemove)
    );
  }

  protected async addClient() {
    const { channel } = this.clientFormGroup.value;
    const duplicateClient = await this.clientSupabaseService.getSameClientNames(
      channel
    );
    if (duplicateClient) {
      if (duplicateClient.archived == false) {
        this.informDuplicateActiveClient();
        return;
      }
      if (duplicateClient.archived) {
        const shouldReactivateClient =
          await this.confirmIfClientShouldBeReactivated(channel);
        if (shouldReactivateClient) {
          await this.runWithLoading(async () => {
            await this.clientSupabaseService.reactivateClient(
              duplicateClient.id
            );
            this.loaderService.loadingOn();
            const isSaved =
              await this.clientManagementService.saveClientChanges(
                duplicateClient.id,
                channel,
                this.currentUserRowData(),
                this.currentAlertRowData()
              );
            this.loaderService.loadingOff();
            if (isSaved) {
              this.toastService.show('Client changes saved');
              this.navigateToViewClient(duplicateClient.id);
            } else {
              this.toastService.show(
                'There was an error when attempting to save the client'
              );
            }
          });
        }
      }
    } else {
      if (this.isSubmitting()) {
        return;
      }
      this.isSubmitting.set(true);
      await this.runWithLoading(async () => {
        try {
          const createdClientId =
            await this.clientManagementService.addClientWithUsersAndAlerts(
              channel,
              this.currentUserRowData(),
              this.currentAlertRowData()
            );
          if (createdClientId == '') {
            this.toastService.show('Failed to add new client');
          } else {
            this.navigateToViewClient(createdClientId);
          }
          this.toastService.show('New client added');
        } catch (error) {
          console.error('Error adding client:', error);
          this.toastService.show('Failed to add new client');
        }
      });
    }
  }

  private informDuplicateActiveClient() {
    this.dialog.open(ErrorDialog, {
      data: {
        title: 'Duplicate client',
        message: 'An active client with the same name already exists',
      },
    });
  }

  private async confirmIfClientShouldBeReactivated(
    newClientName: string
  ): Promise<boolean> {
    const shouldReactivateClient = await firstValueFrom(
      this.dialog
        .open(ConfirmDialog, {
          data: {
            title: 'Confirm Reactivation',
            message: `Client ${newClientName} already exists, would you like to reactivate them?`,
          },
        })
        .afterClosed()
    );
    return shouldReactivateClient;
  }

  private async confirmIfEmailShouldBeReactivated(
    emailsToBeReactivated: string
  ): Promise<boolean> {
    const shouldReactivateEmails = await firstValueFrom(
      this.dialog
        .open(ConfirmDialog, {
          data: {
            title: 'Confirm Reactivation',
            message: `Email address(es) ${emailsToBeReactivated} is currently inactive for this client, would you like to reactivate them?`,
          },
        })
        .afterClosed()
    );
    return shouldReactivateEmails;
  }

  protected async saveClient() {
    if (this.isSubmitting()) {
      return;
    }
    const { channel } = this.clientFormGroup.value;

    const emailsToBeReactivated =
      await this.clientManagementService.inActiveEmailsLinkedToClient(
        this.clientId,
        this.currentUserRowData()
      );
    if (emailsToBeReactivated != '') {
      if (
        !(await this.confirmIfEmailShouldBeReactivated(emailsToBeReactivated))
      ) {
        return;
      }
    }
    const duplicateClient = await this.clientSupabaseService.getSameClientNames(
      channel
    );
    if (duplicateClient && duplicateClient.id != this.clientId) {
      this.informDuplicateActiveClient();
      return;
    }
    await this.runWithLoading(async () => {
      this.loaderService.loadingOn();
      const isSaved = await this.clientManagementService.saveClientChanges(
        this.clientId,
        channel,
        this.currentUserRowData(),
        this.currentAlertRowData()
      );
      this.loaderService.loadingOff();

      if (isSaved) {
        this.toastService.show('Client changes saved');
        await this.setCurrentClient();
      } else {
        this.toastService.show(
          'There was an error when attempting to save the client'
        );
      }
    });
  }

  private checkAndInformClientHaveMinimumUsers(): boolean {
    if (this.currentUserRowData().length == 0) {
      Promise.resolve().then(() => {
        this.dialog.open(ErrorDialog, {
          data: {
            title: 'No users present',
            message: 'A client must have at least one user linked to it.',
          },
        });
      });
      return true;
    }
    return false;
  }

  private async runWithLoading(task: () => Promise<void>) {
    this.isSubmitting.set(true);
    const { channel } = this.clientFormGroup.value;
    try {
      if (this.checkAndInformClientHaveMinimumUsers()) {
        return;
      }
      await task();
    } catch (error) {
      console.error('Error saving/adding client: ', error);
      this.toastService.show('Failed to save/add client');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected navigateToViewClient(clientId: string) {
    this.router.navigate(['/client-management/settings/' + clientId]);
  }

  protected navigateToViewClients() {
    this.router.navigate(['/client-management']);
  }

  private createFormGroups() {
    this.clientManagementFormGroupBuilder =
      new ClientManagementFormGroupBuilder(this.formBuilder);
    this.clientFormGroup =
      this.clientManagementFormGroupBuilder.buildAddClientForm();
    this.userFormGroup =
      this.clientManagementFormGroupBuilder.buildAddUserForm();
  }
}
