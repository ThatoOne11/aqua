import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { EditedReadings } from '@data-management/models/review-upload/edited-reading';

@Component({
  selector: 'app-change-log-dialog',
  imports: [MatIconModule, CommonModule, MatButtonModule, MatDialogModule],
  templateUrl: './change-log-dialog.html',
  styleUrl: './change-log-dialog.scss',
  standalone: true,
})
export class ChangeLogDialog {
  editedReadings: EditedReadings;

  constructor(
    private dialogRef: MatDialogRef<ChangeLogDialog>,
    @Inject(MAT_DIALOG_DATA) data: { editedReadings: EditedReadings }
  ) {
    this.editedReadings = data.editedReadings;
  }

  protected isEditedReadingsEmpty(): boolean {
    return Object.values(this.editedReadings).every((arr) => arr.length === 0);
  }

  protected onConfirm() {
    this.dialogRef.close(true);
  }

  protected onCancel() {
    this.dialogRef.close(false);
  }
}
