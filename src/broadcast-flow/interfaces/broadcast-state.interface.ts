import { BroadcastMessage } from './broadcast-message.interface';

export interface BroadcastState {
  step: string;
  message: BroadcastMessage;
}
