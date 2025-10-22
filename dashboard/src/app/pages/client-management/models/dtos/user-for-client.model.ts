export class UserForClient {
  userId: string;
  displayName: string;
  email: string;

  constructor(userId: string, displayName: string, email: string) {
    this.userId = userId;
    this.displayName = displayName;
    this.email = email;
  }
}
