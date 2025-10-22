import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { mapCoaWarningsToMessages } from '@data-management/mappers/warning-mapper';
import { ValidationMessage } from '@data-management/models/validation-block/validation-messages.model';
import { CoaWarningsService } from '@data-management/services/coa-warnings.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AssignUsersDialog } from '../assign-users-dialog/assign-users-dialog';
import { User } from '@client-management/models/dtos/user.model';

@Component({
  selector: 'app-warnings',
  imports: [MatIconModule, MatButton],
  templateUrl: './warnings.html',
  styleUrl: './warnings.scss',
})
export class Warnings implements OnInit {
  @Input({ required: true }) coaId: string | undefined;
  @Input({ required: true }) clientId: string | undefined;
  @Input({ required: true }) clientName: string | undefined;
  @Input() currentSelectedUsers: User[] = [];
  @Output() selectedUsersForSite = new EventEmitter<User[]>();

  private coaWarningsService = inject(CoaWarningsService);
  private dialog = inject(MatDialog);

  isNewSite = signal<boolean>(false);
  newSiteId = signal<string | undefined>(undefined);
  newSiteName = signal<string | undefined>(undefined);
  validationWarnings = signal<ValidationMessage[]>([]);
  existingClientUsers: User[] = [];

  async ngOnInit(): Promise<void> {
    if (this.coaId) {
      try {
        const warnings = await this.coaWarningsService.getCoaWarnings(
          this.coaId
        );
        this.existingClientUsers = await this.coaWarningsService.getClientUsers(
          this.clientId!
        );
        if (warnings.is_new_site && warnings.site_id) {
          this.isNewSite.set(true);
          this.newSiteId.set(warnings.site_id);
          this.newSiteName.set(warnings.site_name!);
        }
        this.validationWarnings.set([...mapCoaWarningsToMessages(warnings)]);
      } catch (e) {
        console.error(e);
        this.validationWarnings.set([
          {
            message: 'Failed to load warnings. Try again or contact support',
            type: 'ERROR',
          },
        ]);
      }
    }
  }

  protected openAssignUsers() {
    this.dialog
      .open(AssignUsersDialog, {
        data: {
          siteId: this.newSiteId(),
          siteName: this.newSiteName(),
          clientName: this.clientName,
          existingClientUsers: this.existingClientUsers,
          currentSelectedUsers: this.currentSelectedUsers,
        },
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((result: User[] | undefined) => {
        if (result) {
          this.selectedUsersForSite.emit(result);
        }
      });
  }
}
