import {
  Component,
  inject,
  OnInit,
  signal,
  Signal,
  computed,
} from '@angular/core';
import { ClientTile } from '../client-tile/client-tile';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ClientManagementService } from '@client-management/services/client-management.service';
import { ClientSummaryView } from '@client-management/models/dtos/client-summary-view.model';
import { PageTitleComponent } from '@shared-components/page-title/page-title.component';
import { AuthService } from '@core/services/auth/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-management-view-all',
  imports: [
    ClientTile,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    PageTitleComponent,
    FormsModule,
  ],
  templateUrl: './client-management-view-all.html',
  styleUrl: './client-management-view-all.scss',
  standalone: true,
})
export class ClientManagementViewAll implements OnInit {
  private router = inject(Router);
  private clientManagementService = inject(ClientManagementService);
  private authService = inject(AuthService);
  protected clients = signal<ClientSummaryView[]>([]);
  protected loading = signal(true);
  protected user_id!: string;
  protected searchQuery = '';

  public async ngOnInit() {
    this.user_id = await this.authService.getUserId();

    this.loadClients();
  }

  protected filteredClients() {
    const query = this.searchQuery.toLowerCase();
    if (!query) return this.clients();

    return this.clients().filter((client) =>
      client.clientName.toLowerCase().includes(query)
    );
  }

  protected filteredPinnedClients() {
    return this.filteredClients().filter((c) => c.isPinned);
  }

  private async loadClients() {
    try {
      await this.refreshClients();
    } catch (e) {
      console.error('Error loading clients:', e);
      this.clients.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  protected async togglePinClient(clientId: string) {
    if (
      this.clients().filter((c) => c.clientId === clientId && c.isPinned)
        .length > 0
    ) {
      await this.clientManagementService.deletePinnedClient(
        clientId,
        this.user_id
      );
    } else {
      await this.clientManagementService.createPinnedClient(
        clientId,
        this.user_id
      );
    }

    await this.refreshClients();
  }

  protected async refreshClients() {
    const result = await this.clientManagementService.getUserClients();
    this.clients.set(result);
  }

  protected navigateToAddClient() {
    this.router.navigate(['/client-management/add']);
  }

  protected navigateToViewClient(id: string) {
    this.router.navigate(['/client-management/dashboard/' + id]);
  }
}
