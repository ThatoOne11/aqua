export class SupabaseException extends Error {
  public readonly title?: string;

  constructor(title: string, message: string) {
    super(message);
    this.name = 'SupabaseException';
    this.title = title;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
