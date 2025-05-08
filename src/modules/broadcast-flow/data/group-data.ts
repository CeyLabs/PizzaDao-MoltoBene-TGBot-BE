import { TelegramGroup } from '../broadcast-flow.interface';

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

  // ✅ Add 72 more realistic dummy cities
  ...Array.from({ length: 72 }, (_, i) => ({
    id: `${i + 4}`,
    name: `PizzaDAO Group - City${i + 4}`,
    chatId: `-1002${1000000000 + i}`,
    city: `City${i + 4}`,
    type: 'subgroup' as const,
  })),
];
