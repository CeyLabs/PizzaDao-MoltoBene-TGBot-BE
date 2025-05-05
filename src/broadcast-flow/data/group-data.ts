import { TelegramGroup } from '../interfaces/telegram-group.interface';

export const dummyGroups: TelegramGroup[] = [
  {
    id: '1',
    name: 'PizzaDao Testnet - Super Group',
    chatId: '-1002418974575',
    type: 'supergroup',
  },
  {
    id: '2',
    name: 'PizzaDao Testnet - Sub Group',
    chatId: '-1002324184659',
    city: 'Colombo',
    type: 'subgroup',
  },
  {
    id: '3',
    name: 'PizzaDao Testnet - Galle',
    chatId: '-1002630593822',
    city: 'Galle',
    type: 'subgroup',
  },
];
