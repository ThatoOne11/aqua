import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CertificateOfAnalysisService } from '@data-management/services/certificate-of-analysis-service';
import { MatButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  ActionButtonModel,
  ReviewStepModel,
} from '@data-management/models/review-steps/review-step-model';
import { ReviewStepsEnum } from '@data-management/models/review-steps/review-steps';
import { ReviewStepService } from '@data-management/services/review-step-service';
import { UploadDetails } from './upload-details/upload-details';
import { ReviewAlerts } from './review-alerts/review-alerts';
import { UploadConfirmation } from './upload-confirmation/upload-confirmation';
import { CoaUploadViewModel } from '@data-management/models/review-upload/coa-details.model';
import { EditedReadings } from '@data-management/models/review-upload/edited-reading';
import { MatDialog } from '@angular/material/dialog';
import { AlertModel } from '@data-management/models/review-alerts/reviewed-alert.model';
import { ReadingAlertsService } from '@data-management/services/alerts-service';
import { User } from '@client-management/models/dtos/user.model';
import { CoaExportButtonComponent } from '@shared-components/coa-export-button/coa-export-button.component';
import { UploadConfirmService } from '@data-management/services/upload-confirm.service';
import { ToastService } from '@core/services/toast.service';
import { ChangeLog } from './upload-confirmation/change-log/change-log';
import { ChangeLogDialog } from './upload-details/change-log-dialog/change-log-dialog';
import { firstValueFrom } from 'rxjs';
import { SupabaseClientService } from '@core/services/supabase-client.service';
import { LoaderService } from '@core/services/loading.service';

@Component({
  selector: 'app-review-upload',
  imports: [
    CommonModule,
    MatIconModule,
    MatButton,
    UploadDetails,
    ReviewAlerts,
    UploadConfirmation,
  ],
  templateUrl: './review-upload.html',
  styleUrl: './review-upload.scss',
})
export class ReviewUpload implements OnInit {
  private reviewStepService = inject(ReviewStepService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private coaService = inject(CertificateOfAnalysisService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private alertsService = inject(ReadingAlertsService);
  private uploadConfirmService = inject(UploadConfirmService);
  private toastService = inject(ToastService);
  private loader = inject(LoaderService);

  private supabase = inject(SupabaseClientService).supabaseClient;

  protected editedReadings: EditedReadings = {};
  protected selectedUsersForSite: User[] = [];
  protected alerts = signal<AlertModel[]>([]);
  protected generatedAlerts = signal<AlertModel[]>([]);
  protected ReviewStepsEnum = ReviewStepsEnum;
  protected steps = signal<ReviewStepModel[]>([]);
  protected currentStep = signal<ReviewStepsEnum>(ReviewStepsEnum.UPLOAD);
  protected isProceedDisabled = signal<boolean>(true);
  isSubmitting = signal(false);

  // Data properties
  isLoading = true;
  error: string | null = null;
  coaDetails?: CoaUploadViewModel;
  coaId!: string;

  protected currentStepModel = computed(() => {
    return this.steps().find((s) => s.step === this.currentStep());
  });

  protected actionButtons = computed(() => {
    this.isSubmitting(); // Depend on the signal to re-evaluate
    return this.getActionButtons(this.currentStep());
  });

  async ngOnInit(): Promise<void> {
    this.steps.set(this.reviewStepService.getSteps());

    this.coaId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.coaId !== '') {
      await this.fetchData(this.coaId);
      const siteId = this.coaDetails?.details?.site_id ?? null;
      if (siteId) {
        try {
          this.selectedUsersForSite = await this.fetchMappedUsersForSite(
            siteId
          );
          this.cdr.markForCheck();
        } catch (e) {
          console.error('[ReviewUpload] fetchMappedUsersForSite failed', e);
          this.selectedUsersForSite = [];
        }
      }
    } else {
      this.error = 'No Certificate of Analysis ID found in URL.';
      this.isLoading = false;
    }

    const generatedAlerts = await this.alertsService.GenerateTriggeredAlerts(
      this.coaId!,
      this.coaDetails!.details!.client_id!
    );
    this.generatedAlerts.set(generatedAlerts);
    this.alerts.set(generatedAlerts);
  }

  async fetchData(coaId: string): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      this.coaDetails = await this.coaService.getCoaBundle(coaId);
      if (!this.coaDetails.details && this.coaDetails.readings.length === 0) {
        this.error = `No data found for CoA ID: "${coaId}"`;
      }
    } catch (err: any) {
      this.error =
        'An error occurred while fetching data. See the console for details.';
      console.error('[ReviewUploadComponent] Fetch error', err);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  protected nextStep(): void {
    // Logic to find the next step
    if (!this.isProceedDisabled()) {
      const nextStepEnum =
        this.currentStepModel()?.nextStep ?? this.currentStep();
      if (nextStepEnum !== undefined) {
        let nextStep = this.steps().find((s) => s.step === nextStepEnum);
        if (
          nextStep !== undefined &&
          nextStep.step === ReviewStepsEnum.ALERTS &&
          this.alerts().length === 0
        ) {
          nextStep = this.steps().find((s) => s.step === nextStep!.nextStep);
        }
        this.currentStep.set(nextStep?.step ?? nextStepEnum);
        this.isProceedDisabled.set(true);
        return;
      }

      this.currentStep.set(nextStepEnum);
      this.isProceedDisabled.set(true);
    }
  }

  protected previousStep(): void {
    let previousStepEnum = this.currentStepModel()?.previousStep;
    if (previousStepEnum !== undefined) {
      if (
        previousStepEnum === ReviewStepsEnum.ALERTS &&
        this.alerts().length === 0
      ) {
        previousStepEnum = this.steps().find(
          (s) => s.step === previousStepEnum
        )?.previousStep;
      }
      this.currentStep.set(previousStepEnum!);
    } else {
      this.router.navigate(['data-management']);
    }
  }

  protected nextStepTitle = computed(() => {
    const nextStepEnum = this.currentStepModel()?.nextStep;
    if (nextStepEnum !== undefined) {
      let nextStep = this.steps().find((s) => s.step === nextStepEnum);
      if (
        nextStep !== undefined &&
        nextStep.step === ReviewStepsEnum.ALERTS &&
        this.alerts().length === 0
      ) {
        nextStep = this.steps().find((s) => s.step === nextStep!.nextStep);
      }
      return nextStep?.title;
    }
    return undefined;
  });

  protected previousStepTitle = computed(() => {
    let previousStepEnum = this.currentStepModel()?.previousStep;
    if (previousStepEnum !== undefined) {
      if (
        previousStepEnum === ReviewStepsEnum.ALERTS &&
        this.alerts().length === 0
      ) {
        previousStepEnum = this.steps().find(
          (s) => s.step === previousStepEnum
        )?.previousStep;
      }
      return this.steps().find((s) => s.step === previousStepEnum)?.title;
    }
    return 'CSV Upload';
  });

  protected executeOptionAction(action?: () => void) {
    if (action) action();
  }

  protected onEditedReadings(updated: EditedReadings) {
    for (const [readingId, edits] of Object.entries(updated)) {
      this.editedReadings[readingId] = edits;
    }
    this.setProceedDisabled();
  }

  protected onEditedReadingsData(updated: any[]) {
    this.coaDetails!.readings = updated;
  }

  protected selectedUsersForSiteEvent(users: User[]) {
    this.selectedUsersForSite = users;
  }

  public getActionButtons(step: ReviewStepsEnum): ActionButtonModel[] {
    switch (step) {
      case ReviewStepsEnum.UPLOAD:
        return [
          {
            title: 'Accept',
            action: async () => {
              if (!this.isEditedReadingsEmpty()) {
                const confirmed = await firstValueFrom(
                  this.dialog
                    .open(ChangeLogDialog, {
                      autoFocus: false,
                      data: { editedReadings: this.editedReadings },
                    })
                    .afterClosed()
                );
                if (!confirmed) return;
              }

              const generatedAlerts =
                await this.alertsService.GenerateTriggeredAlertsWithEdits(
                  this.coaId!,
                  this.coaDetails!.details!.client_id!,
                  this.editedReadings
                );
              this.generatedAlerts.set(generatedAlerts);
              this.alerts.set(generatedAlerts);
              this.setProceedEnabled();
            },
            condition: true,
            buttonAppearance: 'filled',
          },
          {
            title: `Proceed`,
            action: () => this.nextStep(),
            condition: true,
            disabled: this.isProceedDisabled(),
            buttonAppearance: 'filled',
          },
        ];
      case ReviewStepsEnum.ALERTS:
        return [
          {
            title: 'Cancel',
            action: () => {
              this.alerts.set(
                this.alerts().map((alert) => ({
                  ...alert,
                  ignored: false,
                }))
              );
              this.setProceedDisabled();
            },
            condition: !!this.alerts().find((a) => a.ignored),
            buttonAppearance: 'outlined',
          },
          {
            title: `Ignore All (${this.alerts().length})`,
            condition: !!!this.alerts().find((a) => a.ignored),
            action: () => {
              this.alerts.set(
                this.alerts().map((alert) => ({
                  ...alert,
                  ignored: true,
                }))
              );
              this.setProceedEnabled();
            },
            buttonAppearance: 'filled',
          },
          {
            title: `Accept (${this.alerts().filter((a) => !a.ignored).length})`,
            action: () => this.setProceedEnabled(),
            condition: true,
            buttonAppearance: 'filled',
          },
          {
            title: `Proceed`,
            action: () => this.nextStep(),
            condition: true,
            disabled: this.isProceedDisabled(),
            buttonAppearance: 'filled',
          },
        ];
      case ReviewStepsEnum.CONFIRM:
        return [
          {
            title: 'Confirm Upload',
            action: () => this.submitUpload(),
            condition: true,
            disabled: this.isSubmitting(),
            buttonAppearance: 'filled',
          },
        ];
      default:
        return [];
    }
  }

  protected async submitUpload() {
    if (this.isSubmitting()) {
      return;
    }
    this.isSubmitting.set(true);
    this.loader.loadingOn();

    try {
      await this.uploadConfirmService.submitReviewedAnalysis(
        this.alerts(),
        this.editedReadings,
        this.coaDetails!.details!.coa_id,
        this.coaDetails!.details!.client_id,
        this.coaDetails!.details!.site_id,
        this.coaDetails!.details!.site_name,
        this.selectedUsersForSite
      );
      this.toastService.show('Upload confirmed and approved');
      this.router.navigate(['/data-management']);
    } catch (error) {
      console.error(error);
      this.toastService.show('Upload failed. Please try again.');
    } finally {
      this.loader.loadingOff();
      this.isSubmitting.set(false);
    }
  }

  private setProceedEnabled() {
    this.isProceedDisabled.set(false);
  }

  private setProceedDisabled() {
    this.isProceedDisabled.set(true);
  }

  private isEditedReadingsEmpty(): boolean {
    return Object.values(this.editedReadings).every((arr) => arr.length === 0);
  }

  updateAlerts($event: AlertModel[]) {
    this.alerts.set($event);
  }

  private async fetchMappedUsersForSite(siteId: string): Promise<User[]> {
    // 1) mapping rows
    const { data: mappings, error: mapErr } = await this.supabase
      .from('user_site_mapping')
      .select('user_id')
      .eq('site_id', siteId);
    if (mapErr) throw mapErr;

    const userIds = Array.from(
      new Set((mappings ?? []).map((m) => m.user_id))
    ).filter(Boolean);
    if (!userIds.length) return [];

    // 2) users by ids
    const { data: users, error: usersErr } = await this.supabase
      .from('users')
      .select('id, email, display_name')
      .in('id', userIds);
    if (usersErr) throw usersErr;

    // 3) normalize + dedupe by email
    const normalized = (users ?? []).map((u) => ({
      id: u.id,
      email: (u.email ?? '').trim(),
      display_name: u.display_name ?? u.email,
    })) as User[];

    return this.dedupeByEmail(normalized);
  }

  private dedupeByEmail(list: User[]): User[] {
    const seen = new Set<string>();
    const out: User[] = [];
    for (const u of list) {
      const key = (u.email ?? '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(u);
    }
    return out;
  }
}
