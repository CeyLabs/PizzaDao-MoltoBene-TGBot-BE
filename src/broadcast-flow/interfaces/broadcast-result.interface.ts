export interface BroadcastResult {
  success: boolean;
  message: string;
  groupCount: number;
  failedGroups?: string[];
  errorDetails?: Record<string, string>;
}
