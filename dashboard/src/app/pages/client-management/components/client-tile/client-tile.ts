import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { ClientManagementService } from '@client-management/services/client-management.service';
import { ConfirmDialog } from '@shared-components/confirmation-dialog/confirmation-dialog';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-client-tile',
  imports: [MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './client-tile.html',
  styleUrl: './client-tile.scss',
  standalone: true,
})
export class ClientTile {
  @Input() numberOfAlerts: number = 0;
  @Input() numberOfUsers: number = 0;
  @Input() numberOfSites: number = 0;
  @Input() clientName: string = '';
  @Input() isPinned: boolean = false;
  @Input({ required: true }) clientId: string = '';
  @Output() togglePinned = new EventEmitter<string>();

  private clientManagementService = inject(ClientManagementService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  onPinToggle() {
    this.togglePinned.emit(this.clientId);
  }

  protected navigateToClientSettings(): void {
    this.router.navigate(['/client-management/settings/' + this.clientId]);
  }

  protected async archiveClient(): Promise<void> {
    const shouldArchiveClient = await firstValueFrom(
      this.dialog
        .open(ConfirmDialog, {
          data: {
            title: 'Archive Client',
            message: `Are you sure you want to archive client '${this.clientName}'?`,
          },
        })
        .afterClosed()
    );
    if (!shouldArchiveClient) return;
    await this.clientManagementService.archiveClient(this.clientId);
    location.reload();
  }
}
