import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FileUploader } from './file-uploader/file-uploader';
import { MatButton } from '@angular/material/button';
import { CertificateOfAnalysisService } from '@data-management/services/certificate-of-analysis-service';

@Component({
  selector: 'app-upload-block',
  imports: [FileUploader, MatButton],
  templateUrl: './upload-block.html',
  styleUrl: './upload-block.scss',
})
export class UploadBlock {
  @Output() fileUploadUpdate = new EventEmitter<string | undefined>();
  @Output() fileUploadErrorsEvent = new EventEmitter<string[]>();
  @Output() fileUploadSuccessEvent = new EventEmitter<string>();

  private coaService = inject(CertificateOfAnalysisService);
  private uploadedFile = signal<File | undefined>(undefined);

  isLoading = signal<boolean>(false);

  handleFileUploaded(files: File[]) {
    if (files.length !== 1) {
      // Currently only one file at a time is allowed
      this.uploadedFile.set(undefined);
    } else {
      this.uploadedFile.set(files[0]);
    }
    this.fileUploadUpdate.emit();
    this.fileUploadErrorsEvent.emit([]);
  }

  protected shouldShowActionButtons() {
    return !!this.uploadedFile();
  }

  protected async upload() {
    try {
      this.isLoading.set(true);
      const file = this.uploadedFile();
      if (file) {
        const response = await this.coaService.uploadCsv(file);
        if (response.ok) {
          this.fileUploadUpdate.emit(response.id);
          this.fileUploadSuccessEvent.emit(response.id);
        } else if (response.errors.length > 0) {
          this.fileUploadErrorsEvent.emit(response.errors);
        }
      }
    } catch (e) {
      console.error('Failed to upload', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected cancelUpload() {
    //TODO
  }
}
