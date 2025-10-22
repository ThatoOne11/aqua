import { inject, Injectable } from '@angular/core';
import { UserForClient } from '@client-management/models/dtos/user-for-client.model';
import { User } from '@client-management/models/dtos/user.model';
import { UserSupabaseService } from '@core/services/supabase/users.supabase.service';

@Injectable({
  providedIn: 'root',
})
export class UserHelper {
  private userSupabaseService = inject(UserSupabaseService);

  public async getValidationErrorsForAddingUser(
    usersToBeAdded: User[],
    usersLinkedToClient: User[],
    newEmailAddress: string
  ): Promise<{ isValid: boolean; errorMessage: string }> {
    const alreadyAdded = usersToBeAdded.some(
      (u) => u.email === newEmailAddress
    );
    const alreadyLinkedToClient = usersLinkedToClient.some(
      (u) => u.email === newEmailAddress
    );
    if (alreadyAdded) {
      return {
        isValid: false,
        errorMessage: `A user with email "${newEmailAddress}" already exists.`,
      };
    }
    if (alreadyLinkedToClient) {
      return {
        isValid: false,
        errorMessage: `A user with email "${newEmailAddress}" is already linked to the client.`,
      };
    }
    const existingUsers =
      await this.userSupabaseService.isEmailAddressLinkedToActiveClient([
        newEmailAddress,
      ]);
    if (existingUsers.length > 0) {
      return {
        isValid: false,
        errorMessage: `A user with email "${newEmailAddress}" is already linked to a client.`,
      };
    }
    const nonClientRoleUsers =
      await this.userSupabaseService.isEmailLinkedToNonClientRole([
        newEmailAddress,
      ]);

    if (nonClientRoleUsers.length > 0) {
      return {
        isValid: false,
        errorMessage: `The email "${newEmailAddress}" is linked to a non client account type and cannot be added to a client.`,
      };
    }
    return {
      isValid: true,
      errorMessage: '',
    };
  }

  public async getValidationErrorsForAddingUserOnClient(
    usersToBeAdded: UserForClient[],
    usersLinkedToClient: UserForClient[],
    newEmailAddress: string
  ): Promise<{ isValid: boolean; errorMessage: string }> {
    const usersToBeAddedAsUsers: User[] = usersToBeAdded.map((u) => ({
      id: u.userId,
      email: u.email,
      display_name: u.displayName,
    }));

    const usersLinkedToClientAsUsers: User[] = usersLinkedToClient.map((u) => ({
      id: u.userId,
      email: u.email,
      display_name: u.displayName,
    }));
    return await this.getValidationErrorsForAddingUser(
      usersToBeAddedAsUsers,
      usersLinkedToClientAsUsers,
      newEmailAddress
    );
  }
}
