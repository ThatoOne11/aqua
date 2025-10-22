import {
  Component,
  Input,
  inject,
  signal,
  OnChanges,
  SimpleChanges,
  computed,
  OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { SiteService } from '@client-management/services/site.service';
import { Site } from '@client-management/models/dtos/site.model';
import { UserForClient } from '@client-management/models/dtos/user-for-client.model';
import { DialogAddUserToSite } from '../dialogs/dialog-add-user-to-site/dialog-add-user-to-site';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '@shared-components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-site-management',
  standalone: true,
  imports: [MatCheckboxModule, MatButtonModule],
  templateUrl: './site-management.html',
  styleUrl: './site-management.scss',
})
export class SiteManagement implements OnChanges, OnInit {
  @Input({ required: true }) clientId: string = '';
  @Input() clientUsers: UserForClient[] = [];

  protected sites = signal<Site[]>([]);
  protected loading = signal<boolean>(true);

  protected siteUserSelections: { [siteId: string]: string[] } = {};

  private siteService = inject(SiteService);
  private dialog = inject(MatDialog);

  async ngOnInit() {
    await this.loadSites();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['clientId'] && this.clientId) {
      await this.loadSites();
    }
  }

  private async loadSites() {
    this.loading.set(true);

    const loadedSites = await this.siteService.getSitesWithUsersByClient(
      this.clientId
    );
    loadedSites.forEach((s) => (s.isExpanded = false));
    this.sites.set(loadedSites);
    this.loading.set(false);
  }

  protected onUserSiteChecked(
    completed: boolean,
    userId: string,
    siteId: string
  ) {
    if (completed) {
      if (!this.siteUserSelections[siteId])
        this.siteUserSelections[siteId] = [];
      if (!this.siteUserSelections[siteId].includes(userId))
        this.siteUserSelections[siteId].push(userId);
    } else {
      this.siteUserSelections[siteId] =
        this.siteUserSelections[siteId]?.filter((id) => id !== userId) ?? [];
      if (this.siteUserSelections[siteId]?.length === 0)
        delete this.siteUserSelections[siteId];
    }
  }

  protected isAddUserEnabled(siteId: string): boolean {
    const site = this.sites().find((s) => s.id === siteId);
    return (
      this.clientUsers.length >
      (site?.user_site_mapping.map((m) => m.user_id) ?? []).length
    );
  }

  protected isDeleteEnabled(siteId: string): boolean {
    return (this.siteUserSelections[siteId]?.length ?? 0) > 0;
  }

  protected toggleSite(site: Site) {
    site.isExpanded = !site.isExpanded;
    this.sites.update((list) => [...list]);
  }

  protected async addUsersToSite(siteId: string) {
    const site = this.sites().find((s) => s.id === siteId);
    const dialogRef = this.dialog.open(DialogAddUserToSite, {
      data: {
        siteId,
        siteName: site?.name,
        users: this.clientUsers,
        usersOnTheSite: site?.user_site_mapping.map((m) => m.user_id) ?? [],
      },
      autoFocus: false,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result?.userAdded) await this.refreshSiteUsers(siteId);
  }

  protected async deleteUsersFromSite(siteId: string) {
    const userIds = this.siteUserSelections[siteId] ?? [];
    if (!userIds.length)
      return console.warn(`No users selected for site ${siteId}`);

    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialog, {
          data: {
            title: 'Confirm Delete',
            message: `Are you sure you want to remove ${userIds.length} user(s) from this site?`,
          },
        })
        .afterClosed()
    );

    if (!confirmed) return;

    try {
      await this.siteService.deleteUsersFromSite(siteId, userIds);
      delete this.siteUserSelections[siteId];
      await this.refreshSiteUsers(siteId);
    } catch (err) {
      console.error('Error deleting users from site:', err);
    }
  }

  private async refreshSiteUsers(siteId: string) {
    const allSites = await this.siteService.getSitesWithUsersByClient(
      this.clientId
    );

    const expandedMap = new Map(this.sites().map((s) => [s.id, s.isExpanded]));

    allSites.forEach((s) => (s.isExpanded = expandedMap.get(s.id) ?? false));

    this.sites.set(allSites);
  }
}
