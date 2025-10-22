import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

type UploaderItem = {
  file: File;
  status: 'queued' | 'uploading' | 'done' | 'error';
  message?: string;
};

@Component({
  selector: 'app-file-uploader',
  imports: [CommonModule, MatIconModule],
  templateUrl: './file-uploader.html',
  styleUrl: './file-uploader.scss',
})
export class FileUploader {
  @Input() accept = '.csv';
  @Input() multiple = false;

  /** Emits files that passed validation */
  @Output() filesSelected = new EventEmitter<File[]>();

  /** Simple state using signals */
  readonly dragOver = signal(false);
  readonly items = signal<UploaderItem[]>([]);

  // ---- Drag & drop handling ----
  @HostListener('dragover', ['$event'])
  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(false);
  }

  @HostListener('drop', ['$event'])
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(false);
    if (!e.dataTransfer?.files?.length) return;
    this.handleFiles(e.dataTransfer.files);
  }

  // ---- File input ----
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.handleFiles(input.files);
    input.value = ''; // allow re-selecting same file
  }

  // ---- Core logic ----
  private handleFiles(list: FileList) {
    const files = Array.from(list);
    const valid = files.filter((f) => this.isCsv(f));
    const invalid = files.filter((f) => !this.isCsv(f));

    // Add valid files to items
    const newItems: UploaderItem[] = valid.map((file) => ({
      file,
      status: 'uploading',
    }));
    if (this.multiple) {
      this.items.update((prev) => [...prev, ...newItems]);
    } else {
      this.items.set(newItems);
    }

    // Surface any invalids
    if (invalid.length) {
      const note = invalid.map((f) => f.name).join(', ');
      this.items.update((prev) => [
        ...prev,
        ...invalid.map((file) => ({
          file,
          status: 'error' as const,
          message: 'Only .csv files are supported',
        })),
      ]);
      console.warn('Rejected non-CSV files:', note);
    }

    if (valid.length) this.filesSelected.emit(valid);
    this.items.update((prev) =>
      prev.map((p) => (p.status === 'uploading' ? { ...p, status: 'done' } : p))
    );
  }

  remove(index: number) {
    const updatedFiles = this.items().filter((_, i) => i !== index);
    this.items.set(updatedFiles);
    this.filesSelected.emit(updatedFiles.map((f) => f.file));
  }

  public clear() {
    this.items.set([]);
    this.filesSelected.emit([]);
  }

  private isCsv(f: File) {
    const nameOk = f.name.toLowerCase().endsWith('.csv');
    const typeOk = (f.type || '').includes('csv') || f.type === ''; // browsers differ
    return nameOk || typeOk;
  }

  displayName(f: File) {
    // Shorten long names a bit for the pill
    const max = 60;
    return f.name.length > max ? f.name.slice(0, max - 3) + '...' : f.name;
  }
}
