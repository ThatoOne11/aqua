import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-view-coa-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink],

  template: `
    <button
      matIconButton
      [routerLink]="['/client-management/dashboard', clientId]"
      [queryParams]="{ coaId }"
    >
      <mat-icon class="material-symbols-outlined filled-symbol"
        >visibility</mat-icon
      >
    </button>
  `,
})
export class ViewCoaDashboard implements ICellRendererAngularComp {
  /** Use as a regular Angular component */
  @Input() clientId!: string;
  @Input() coaId!: string;
  htmlId!: string;

  agInit(
    params: ICellRendererParams & { clientId?: string; coaId?: string }
  ): void {
    this.clientId =
      params.clientId ?? (params.data?.clientId as string) ?? this.clientId;

    this.coaId = params.coaId ?? (params.data?.id as string) ?? this.coaId;

    this.htmlId = `export-button-${this.coaId}`;
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params);
    return true;
  }
}
