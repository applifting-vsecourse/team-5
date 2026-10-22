export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  from: string;
  user?: string;
  pass?: string;
}
