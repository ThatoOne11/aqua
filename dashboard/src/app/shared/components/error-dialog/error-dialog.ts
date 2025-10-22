import { Component, Inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-error-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './error-dialog.html',
  styleUrl: './error-dialog.scss',
})
export class ErrorDialog {
  constructor(
    private dialogRef: MatDialogRef<ErrorDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: { title: string; message: string }
  ) {
    if (!this.data.title || this.data.title == '') {
      this.data.title = 'Something went wrong';
    }
    if (!this.data.message || this.data.message == '') {
      this.data.message = 'An unexpected error occurred';
    }
  }

  protected onConfirm() {
    this.dialogRef.close(true);
  }

  protected onCancel() {
    this.dialogRef.close(false);
  }
}
