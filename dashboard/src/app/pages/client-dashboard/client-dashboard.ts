import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserClientService } from './services/user-client-service';
import { AuthService } from '@core/services/auth/auth.service';
import { ClientManagementService } from '@client-management/services/client-management.service';
import { UserAccessBarComponent } from './components/user-access-bar/user-access-bar';
import { DataVisualizationComponent } from './components/data-visualization/data-visualization';
import { PageTitleComponent } from '@shared-components/page-title/page-title.component';
import { CertificateOfAnalysisService } from '@data-management/services/certificate-of-analysis-service';
import { FilterParams } from './models/filters/filters.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    UserAccessBarComponent,
    DataVisualizationComponent,
    PageTitleComponent,
  ],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userClientService = inject(UserClientService);
  private authService = inject(AuthService);
  private clientManagementService = inject(ClientManagementService);
  private coaService = inject(CertificateOfAnalysisService);

  protected clientName = signal<string>('');
  protected clientId = signal<string>('');
  protected readonly coaFilters = signal<Partial<FilterParams> | null>(null);

  async ngOnInit(): Promise<void> {
    const clientIdFromRoute = this.route.snapshot.params['id'];
    const coaId = this.route.snapshot.queryParams['coaId'];

    if (coaId) {
      const coaDetails = await this.coaService.getCoaDetails(coaId);
      if (
        coaDetails &&
        coaDetails.first_sample_dt &&
        coaDetails.last_sample_dt
      ) {
        this.coaFilters.set({
          p_site_ids: [coaDetails.site_id!],
          p_start: new Date(coaDetails.first_sample_dt).toISOString(),
          p_end: new Date(coaDetails.last_sample_dt).toISOString(),
        });
      }
    }

    if (!clientIdFromRoute) {
      const userId = await this.authService.getUserId();
      const clientData = await this.userClientService.getClientDetailsForUser(
        userId
      );

      if (clientData) {
        this.clientName.set(clientData.clientName);
        this.clientId.set(clientData.clientId);
      }
    } else {
      this.clientId.set(clientIdFromRoute);
      const clientData = await this.clientManagementService.getClient(
        clientIdFromRoute
      );
      this.clientName.set(clientData.channel);
    }
  }
}
