import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Navbar } from '@core/components/navbar/navbar';
import { AuthService } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-account-setup-issue',
  imports: [MatButtonModule, MatIconModule, Navbar],
  templateUrl: './account-setup-issue.html',
  styleUrl: './account-setup-issue.scss',
})
export class AccountSetupIssue {
  authService = inject(AuthService);

  protected async logout() {
    await this.authService.signOut();
  }
}
