import { TelegramGroup } from '../interfaces/telegram-group.interface';

export const dummyGroups: TelegramGroup[] = [
  {
    id: '1',
    name: 'Rome Pizza Lovers',
    chatId: '-1001234567890',
    city: 'Rome',
    type: 'supergroup',
  },
  {
    id: '2',
    name: 'Milan Food Community',
    chatId: '-1001234567891',
    city: 'Milan',
    type: 'supergroup',
  },
  {
    id: '3',
    name: 'Naples Pizza Group',
    chatId: '-1001234567892',
    city: 'Naples',
    type: 'supergroup',
  },
  {
    id: '4',
    name: 'Florence Food Enthusiasts',
    chatId: '-1001234567893',
    city: 'Florence',
    type: 'supergroup',
  },
  {
    id: '5',
    name: 'Venice Culinary Arts',
    chatId: '-1001234567894',
    city: 'Venice',
    type: 'supergroup',
  },
  {
    id: '6',
    name: 'Rome Food Events',
    chatId: '-1001234567895',
    city: 'Rome',
    type: 'supergroup',
  },
  {
    id: '7',
    name: 'Milan Restaurant Reviews',
    chatId: '-1001234567896',
    city: 'Milan',
    type: 'supergroup',
  },
  {
    id: '8',
    name: 'Turin Food Network',
    chatId: '-1001234567897',
    city: 'Turin',
    type: 'supergroup',
  },
  {
    id: '9',
    name: 'Bologna Pasta Lovers',
    chatId: '-1001234567898',
    city: 'Bologna',
    type: 'supergroup',
  },
  {
    id: '10',
    name: 'Sicily Italian Cuisine',
    chatId: '-1001234567899',
    city: 'Palermo',
    type: 'supergroup',
  },
];

// Dummy city data
export interface CityData {
  id: string;
  name: string;
  venues: string[];
}

export const dummyCityData: CityData[] = [
  {
    id: '1',
    name: 'Rome',
    venues: [
      'Colosseum Square',
      'Vatican Gardens',
      'Trevi Fountain Plaza',
      'Roman Forum Hall',
    ],
  },
  {
    id: '2',
    name: 'Milan',
    venues: [
      'Duomo Square',
      'Navigli District',
      'Brera Art Gallery',
      'San Siro Stadium',
    ],
  },
  {
    id: '3',
    name: 'Naples',
    venues: [
      'Piazza del Plebiscito',
      "Castel dell'Ovo",
      'Port of Naples',
      'Naples Underground',
    ],
  },
  {
    id: '4',
    name: 'Florence',
    venues: [
      'Piazza della Signoria',
      'Ponte Vecchio',
      'Boboli Gardens',
      'Uffizi Gallery',
    ],
  },
  {
    id: '5',
    name: 'Venice',
    venues: [
      "St. Mark's Square",
      'Grand Canal',
      'Rialto Bridge',
      'Murano Island',
    ],
  },
  {
    id: '6',
    name: 'Turin',
    venues: [
      'Piazza Castello',
      'National Cinema Museum',
      'Royal Palace',
      'Mole Antonelliana',
    ],
  },
  {
    id: '7',
    name: 'Bologna',
    venues: [
      'Piazza Maggiore',
      'Two Towers',
      'Archiginnasio',
      'Quadrilatero Market',
    ],
  },
  {
    id: '8',
    name: 'Palermo',
    venues: [
      'Teatro Massimo',
      'Quattro Canti',
      'Palermo Cathedral',
      'Ballarò Market',
    ],
  },
];
