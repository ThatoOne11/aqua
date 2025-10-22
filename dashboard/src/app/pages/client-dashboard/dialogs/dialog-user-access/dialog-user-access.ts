import { Component, inject, OnInit, signal, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { UserClientService } from '../../services/user-client-service';

interface DialogData {
  clientId: string;
  clientName: string;
}

@Component({
  selector: 'app-dialog-user-access',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatListModule],
  templateUrl: './dialog-user-access.html',
  styleUrl: './dialog-user-access.scss',
})
export class DialogUserAccess implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private userClientService: UserClientService
  ) {}

  protected clientUsers = signal<{ display_name: string }[]>([]);

  async ngOnInit(): Promise<void> {
    const clientUsers = await this.userClientService.getClientUsers(
      this.data.clientId
    );
    this.clientUsers.set(clientUsers ?? []);
  }
}
