export class ClientSummaryView {
  clientId: string;
  clientName: string;
  numberOfUsers: number;
  numberOfAlerts: number;
  numberOfSites: number;
  isPinned: boolean;

  constructor(
    clientId: string,
    clientName: string,
    numberOfUsers: number,
    numberOfAlerts: number,
    numberOfSites: number,
    isPinned: boolean
  ) {
    this.clientId = clientId;
    this.clientName = clientName;
    this.numberOfUsers = numberOfUsers;
    this.numberOfAlerts = numberOfAlerts;
    this.numberOfSites = numberOfSites;
    this.isPinned = isPinned;
  }
}
