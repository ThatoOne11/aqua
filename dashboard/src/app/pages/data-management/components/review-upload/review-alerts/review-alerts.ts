import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  inject,
  signal,
  WritableSignal,
  output,
  effect,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ReactiveFormsModule,
  FormArray,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { PageTitleComponent } from '@shared-components/page-title/page-title.component';
import { FormatDatetimePipe } from '@core/pipes/format-datetime-pipe-pipe';
import { AlertModel } from '@data-management/models/review-alerts/reviewed-alert.model';
import { MatButton } from '@angular/material/button';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-review-alerts',
  standalone: true,
  imports: [
    PageTitleComponent,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormatDatetimePipe,
    MatButton,
  ],
  templateUrl: './review-alerts.html',
  styleUrl: './review-alerts.scss',
})
export class ReviewAlerts implements OnInit, OnDestroy {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) coaId!: string;
  @Input({ required: true }) clientId!: string;
  @Input({ required: true }) alerts: WritableSignal<AlertModel[]> = signal([]);
  alertsChangedEvent = output<AlertModel[]>();

  private fb = inject(FormBuilder);

  private destroy$ = new Subject<void>();

  form = this.fb.group({
    alertNotes: this.fb.array([]),
  });

  get notesFormArray(): FormArray<FormGroup> {
    return this.form.get('alertNotes') as FormArray<FormGroup>;
  }

  constructor() {
    effect(() => {
      this.alertsChangedEvent.emit(this.alerts());
    });
  }

  async ngOnInit(): Promise<void> {
    this.alerts.update(alerts => alerts.map(a => ({...a, note: a.note ?? a.comments ?? ''})));

    this.alerts().forEach((a) =>
      this.notesFormArray.push(
        this.fb.group({
          note: [a.note ?? '', Validators.maxLength(200)],
        })
      )
    );

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(
      (
        value: Partial<{
          alertNotes: unknown[];
        }>
      ) => {
        this.alerts.update((alerts) =>
          alerts.map((alert, $index) => {
            const alertNoteValue = value?.alertNotes?.[$index] as {
              note: string;
            };
            return {
              ...alert,
              note: (alertNoteValue.note as string) ?? alert.note,
            };
          })
        );
      }
    );
  }

  toggleIgnoreAlert(alertReadingResultId: string) {
    this.alerts.update((alerts) =>
      alerts.map((alert) =>
        alert.readingResultId === alertReadingResultId
          ? { ...alert, ignored: !alert.ignored }
          : alert
      )
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
