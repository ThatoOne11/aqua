import { Component, Input } from '@angular/core';
import { ValidationMessage } from '@data-management/models/validation-block/validation-messages.model';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-data-validation-block',
  imports: [NgxSkeletonLoaderModule, MatIconModule],
  templateUrl: './data-validation-block.html',
  styleUrl: './data-validation-block.scss',
})
export class DataValidationBlock {
  @Input() coaId: string | undefined;
  @Input() validationMessages: ValidationMessage[] | undefined;
}
