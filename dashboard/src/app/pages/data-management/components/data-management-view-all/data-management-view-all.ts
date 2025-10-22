import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { PageTitleComponent } from '@shared-components/page-title/page-title.component';
import { UploadBlock } from './upload-block/upload-block';
import { DataValidationBlock } from './data-validation-block/data-validation-block';
import { ValidationMessage } from '@data-management/models/validation-block/validation-messages.model';
import { CoaWarningsService } from '@data-management/services/coa-warnings.service';
import { mapCoaWarningsToMessages } from '@data-management/mappers/warning-mapper';
import { ImportHistory } from './import-history/import-history';

@Component({
  selector: 'app-data-management-view-all',
  imports: [
    PageTitleComponent,
    MatButton,
    RouterLink,
    UploadBlock,
    DataValidationBlock,
    ImportHistory,
  ],
  templateUrl: './data-management-view-all.html',
  styleUrl: './data-management-view-all.scss',
  standalone: true,
})
export class DataManagementViewAll {
  protected coaWarningsService = inject(CoaWarningsService);

  validationMessages = signal<ValidationMessage[] | undefined>(undefined);
  coaId = signal<string | undefined>(undefined);

  protected shouldShowValidationsBlock() {
    return (this.validationMessages()?.length ?? 0) > 0;
  }

  protected canReviewUpload(): boolean {
    return (
      !!this.coaId() &&
      !this.validationMessages()?.find((v) => v.type === 'ERROR')
    );
  }

  protected setUploadedCoaId(coaId?: string) {
    this.coaId.set(coaId);
  }

  protected setValidationErrors(errors?: string[]) {
    this.coaId.set(undefined);
    const errorMessages: ValidationMessage[] =
      errors?.map((e) => ({
        message: e,
        type: 'ERROR',
      })) ?? [];

    this.validationMessages.set(errorMessages);
  }

  protected async handleSuccessfulUpload(coaId: string) {
    this.setUploadedCoaId(coaId);
    // Set validation success messages
    const validationSuccessMessages = [
      'Data format validation',
      'Parameter naming consistency',
      'Existing client validation',
    ];
    const successMessages: ValidationMessage[] = validationSuccessMessages.map(
      (e) => ({
        message: e,
        type: 'SUCCESS',
      })
    );

    // Fetch and set warnings
    try {
      const warnings = await this.coaWarningsService.getCoaWarnings(coaId);
      successMessages.push(...mapCoaWarningsToMessages(warnings));
      // Set review CSV Warning
      successMessages.push({ message: 'Review CSV', type: 'WARN' });
    } catch (e) {
      console.error(e);
      successMessages.push({
        message: 'Failed to load warnings. Try again or contact support',
        type: 'ERROR',
      });
    }

    this.validationMessages.set(successMessages);
  }
}
