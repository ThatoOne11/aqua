import { inject, Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { setItem, clearItem } from '@core/store/session.store';
import { SupabaseClientService } from '../supabase-client.service';
import { AuthConstants } from '@core/constants/auth.constants';
import { AuthTokenResponsePassword, Session } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { AccountRoutePaths } from '@core/constants/routes.constants';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseClientService);
  private router = inject(Router);

  public async loginWithSupabaseClient(
    email: string,
    password: string
  ): Promise<AuthTokenResponsePassword> {
    const credentials = { email, password };
    const authTokenResponsePassword =
      await this.supabase.supabaseClient.auth.signInWithPassword(credentials);
    if (authTokenResponsePassword.error) {
      return authTokenResponsePassword;
    }

    this.setAuthToken(authTokenResponsePassword.data.session);
    return authTokenResponsePassword;
  }

  public async loginWithInvitationLink() {
    const { error } = await this.supabase.supabaseClient.auth.initialize();
    const session = await this.supabase.supabaseClient.auth.getSession();
    this.setAuthToken(session.data.session!);
    if (error) {
      throw new Error(error.message);
    }
    return session.data.session;
  }

  public async refreshToken(refreshToken: string): Promise<void> {
    const currentSession = { refresh_token: refreshToken };
    const authTokenResponse =
      await this.supabase.supabaseClient.auth.refreshSession(currentSession);
    if (
      authTokenResponse.error ||
      authTokenResponse.data == null ||
      authTokenResponse.data.session == null
    ) {
      console.error('Failed to refresh token:', authTokenResponse.error);
      return;
    }

    this.clearAuthToken();
    this.setAuthToken(authTokenResponse.data.session);
  }

  private setAuthToken(session: Session): void {
    try {
      setItem(AuthConstants.ACCESS_TOKEN_KEY, session.access_token);
      setItem(AuthConstants.REFRESH_TOKEN_KEY, session.refresh_token);

      const decoded = jwtDecode<{ user_role?: string; display_name?: string }>(
        session.access_token
      );
      if (decoded.user_role) {
        setItem(AuthConstants.USER_ROLE, decoded.user_role);
      }
      if (decoded.display_name) {
        setItem(AuthConstants.DISPLAY_NAME, decoded.display_name);
      }
    } catch (exception) {
      console.error('Failed to decode JWT:', exception);
    }
  }

  private clearAuthToken(): void {
    clearItem(AuthConstants.ACCESS_TOKEN_KEY);
    clearItem(AuthConstants.REFRESH_TOKEN_KEY);
    clearItem(AuthConstants.USER_ROLE);
  }

  public async requestPasswordReset(email: string): Promise<void> {
    const { error } =
      await this.supabase.supabaseClient.auth.resetPasswordForEmail(email);

    if (error) {
      throw new Error(error.message);
    }
  }

  public async setPassword(password: string): Promise<void> {
    const { error } = await this.supabase.supabaseClient.auth.updateUser({
      password: password,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  public async initialiseSession(): Promise<void> {
    const { data, error } =
      await this.supabase.supabaseClient.auth.getSession();
    if (error) {
      console.error(`Session initialisation failed: ${error.message}`);
      throw new Error(error.message);
    }
    if (data.session) {
      this.setAuthToken(data.session);
    }
  }

  public async signOut(): Promise<void> {
    await this.supabase.supabaseClient.auth.signOut();
    this.clearAuthToken();
    this.router.navigate([AccountRoutePaths.LOGIN]);
  }

  public async getAuthenticatedUser() {
    const { data, error } =
      await this.supabase.supabaseClient.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    return data.session?.user;
  }

  public async getUserId() {
    const user = await this.getAuthenticatedUser();
    return user!.id;
  }
}
