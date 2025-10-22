import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EditedReadings } from '@data-management/models/review-upload/edited-reading';

@Component({
  selector: 'app-change-log',
  imports: [MatIconModule, CommonModule],
  templateUrl: './change-log.html',
  styleUrl: './change-log.scss',
  standalone: true,
})
export class ChangeLog {
  @Input({ required: true }) editedReadings!: EditedReadings;

  protected isEditedReadingsEmpty(): boolean {
    return Object.values(this.editedReadings).every((arr) => arr.length === 0);
  }
}
