import { TelegramGroup } from '../interfaces/telegram-group.interface';
// import { Admin } from '../interfaces/admin.interface';
// import { CityData } from '../interfaces/city-data.interface';

const MAIN_GROUP_ID = -1002418974575;
const SUB_GROUP_ID = -1002324184659;

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
    type: 'supergroup',
  },
];

// // Dummy groups data with real group IDs
// export const dummyGroups: TelegramGroup[] = [
//   {
//     id: '1',
//     name: 'PizzaDao Testnet - Super Group',
//     chatId: '-1002418974575',
//     city: 'Global',
//     type: 'supergroup',
//   },
//   {
//     id: '2',
//     name: 'PizzaDao Testnet - Sub Group',
//     chatId: '-1002324184659',
//     city: 'Colombo',
//     type: 'supergroup',
//   },
//   {
//     id: '3',
//     name: 'Rome Pizza Lovers',
//     chatId: '-1001234567892',
//     city: 'Rome',
//     type: 'supergroup',
//   },
//   {
//     id: '4',
//     name: 'Milan Food Community',
//     chatId: '-1001234567893',
//     city: 'Milan',
//     type: 'supergroup',
//   },
//   {
//     id: '5',
//     name: 'Naples Pizza Group',
//     chatId: '-1001234567894',
//     city: 'Naples',
//     type: 'supergroup',
//   },
//   {
//     id: '6',
//     name: 'Florence Food Enthusiasts',
//     chatId: '-1001234567895',
//     city: 'Florence',
//     type: 'supergroup',
//   },
//   {
//     id: '7',
//     name: 'Venice Culinary Arts',
//     chatId: '-1001234567896',
//     city: 'Venice',
//     type: 'supergroup',
//   },
//   {
//     id: '8',
//     name: 'Turin Food Network',
//     chatId: '-1001234567897',
//     city: 'Turin',
//     type: 'supergroup',
//   },
//   {
//     id: '9',
//     name: 'Bologna Pasta Lovers',
//     chatId: '-1001234567898',
//     city: 'Bologna',
//     type: 'supergroup',
//   },
//   {
//     id: '10',
//     name: 'Sicily Italian Cuisine',
//     chatId: '-1001234567899',
//     city: 'Palermo',
//     type: 'supergroup',
//   },
// ];

// // Dummy city data
// export const dummyCityData: CityData[] = [
//   {
//     id: '1',
//     name: 'Global',
//     venues: ['Virtual Meeting', 'Online Conference', 'Global Headquarters'],
//   },
//   {
//     id: '2',
//     name: 'Colombo',
//     venues: [
//       'Colombo City Centre',
//       'Viharamahadevi Park',
//       'Dutch Hospital',
//       'Galle Face Green',
//     ],
//   },
//   {
//     id: '3',
//     name: 'Rome',
//     venues: [
//       'Colosseum Square',
//       'Vatican Gardens',
//       'Trevi Fountain Plaza',
//       'Roman Forum Hall',
//     ],
//   },
//   {
//     id: '4',
//     name: 'Milan',
//     venues: [
//       'Duomo Square',
//       'Navigli District',
//       'Brera Art Gallery',
//       'San Siro Stadium',
//     ],
//   },
//   {
//     id: '5',
//     name: 'Naples',
//     venues: [
//       'Piazza del Plebiscito',
//       "Castel dell'Ovo",
//       'Port of Naples',
//       'Naples Underground',
//     ],
//   },
//   {
//     id: '6',
//     name: 'Florence',
//     venues: [
//       'Piazza della Signoria',
//       'Ponte Vecchio',
//       'Boboli Gardens',
//       'Uffizi Gallery',
//     ],
//   },
//   {
//     id: '7',
//     name: 'Venice',
//     venues: [
//       "St. Mark's Square",
//       'Grand Canal',
//       'Rialto Bridge',
//       'Murano Island',
//     ],
//   },
//   {
//     id: '8',
//     name: 'Turin',
//     venues: [
//       'Piazza Castello',
//       'National Cinema Museum',
//       'Royal Palace',
//       'Mole Antonelliana',
//     ],
//   },
//   {
//     id: '9',
//     name: 'Bologna',
//     venues: [
//       'Piazza Maggiore',
//       'Two Towers',
//       'Archiginnasio',
//       'Quadrilatero Market',
//     ],
//   },
//   {
//     id: '10',
//     name: 'Palermo',
//     venues: [
//       'Teatro Massimo',
//       'Quattro Canti',
//       'Palermo Cathedral',
//       'Ballarò Market',
//     ],
//   },
// ];

// // Dummy admin data - with wildcard to match ANY user ID
// export const dummyAdmins: Admin[] = [
//   {
//     userId: 0, // This will be replaced dynamically to match any user ID
//     name: 'Super Admin',
//     role: 'super-admin',
//     cities: [
//       'Global',
//       'Colombo',
//       'Rome',
//       'Milan',
//       'Naples',
//       'Florence',
//       'Venice',
//       'Turin',
//       'Bologna',
//       'Palermo',
//     ],
//   },
//   {
//     userId: 987654321, // Another user ID for testing
//     name: 'Colombo Admin',
//     role: 'admin',
//     cities: ['Colombo'],
//   },
//   {
//     userId: 555555555, // Another user ID for testing
//     name: 'Italy Admin',
//     role: 'admin',
//     cities: ['Rome', 'Milan', 'Florence', 'Venice'],
//   },
// ];
