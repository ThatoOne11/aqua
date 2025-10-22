import { UserForClient } from '@client-management/models/dtos/user-for-client.model';
import { AlertForClient } from '@client-management/models/dtos/alert-for-client.model';

export class Client {
  channel: string;
  users: UserForClient[];
  alerts: AlertForClient[];
  //   sites: number;

  constructor(
    channel: string,
    users: UserForClient[],
    alerts: AlertForClient[]
  ) {
    this.channel = channel;
    this.users = users;
    this.alerts = alerts;
  }
}
