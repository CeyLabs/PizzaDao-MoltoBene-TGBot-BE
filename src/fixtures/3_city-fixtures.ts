import { Knex } from 'knex';
import { ICountry } from 'src/modules/country/country.interface';

const tableName = 'city';

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex(tableName).count();
  if (Number(count) > 0) return;

  // Fetch country IDs
  const countries = await knex<ICountry>('country').select('id', 'name');

  // Map country names to their IDs
  const countryMap = Object.fromEntries(countries.map((country) => [country.name, country.id]));

  // Insert cities with their group IDs
  await knex(tableName).insert([
    {
      name: 'Charleston',
      country_id: countryMap['USA SC'],
      group_id: -4229697154,
    },
    {
      name: 'Dallas',
      country_id: countryMap['USA TX'],
      group_id: -1001907291709,
    },
    {
      name: 'Casablanca',
      country_id: countryMap['Morocco'],
      group_id: -1002470321076,
    },
    {
      name: 'Phnom Penh',
      country_id: countryMap['Cambodia'],
      group_id: -1001737654306,
    },
    {
      name: 'Hong Kong',
      country_id: countryMap['China'],
      group_id: -1001641358817,
    },
    {
      name: 'Moscow',
      country_id: countryMap['Russia'],
      group_id: -1001829076795,
    },
    {
      name: 'Saskatoon',
      country_id: countryMap['Canada Saskatchewan'],
      group_id: -4194533116,
    },
    {
      name: 'Tampa',
      country_id: countryMap['USA FL'],
      group_id: -885831381,
    },
    {
      name: 'Maui',
      country_id: countryMap['USA HI'],
      group_id: -4003337981,
    },
    {
      name: 'Seattle',
      country_id: countryMap['USA WA'],
      group_id: -1001916230034,
    },
    {
      name: 'León',
      country_id: countryMap['Nicaragua'],
      group_id: -4149218550,
    },
    {
      name: 'Paris',
      country_id: countryMap['France'],
      group_id: -1001946927318,
    },
    {
      name: 'Rotterdam',
      country_id: countryMap['Netherlands'],
      group_id: -4251606841,
    },
    {
      name: 'Vennesla',
      country_id: countryMap['Norway'],
      group_id: -1002120606152,
    },
    {
      name: 'Lulea',
      country_id: countryMap['Sweden'],
      group_id: -4215212072,
    },
    {
      name: 'Genoa',
      country_id: countryMap['Italy'],
      group_id: -1002284026910,
    },
    {
      name: 'Kinshasa',
      country_id: countryMap['DRC'],
      group_id: -1002146983053,
    },
    {
      name: 'Cairo',
      country_id: countryMap['Egypt'],
      group_id: -1001627172846,
    },
    {
      name: 'Lilongwe',
      country_id: countryMap['Malawi'],
      group_id: null,
    },
    {
      name: 'Rabat',
      country_id: countryMap['Morocco'],
      group_id: -1002224824541,
    },
    {
      name: 'Bandar Seri Begawan',
      country_id: countryMap['Brunei'],
      group_id: -4224607411,
    },
    {
      name: 'Bali',
      country_id: countryMap['Indonesia'],
      group_id: -1001966967326,
    },
    {
      name: 'Baguio',
      country_id: countryMap['Philippines'],
      group_id: -4723597037,
    },
    {
      name: 'Boracay',
      country_id: countryMap['Philippines'],
      group_id: -4619352405,
    },
    {
      name: 'Davao City',
      country_id: countryMap['Philippines'],
      group_id: -4693310676,
    },
    {
      name: 'Vigan/Ilocos',
      country_id: countryMap['Philippines'],
      group_id: -4616815765,
    },
    {
      name: 'Da Nang',
      country_id: countryMap['Vietnam'],
      group_id: -4247375805,
    },
    {
      name: 'Uvita',
      country_id: countryMap['Costa Rica'],
      group_id: -1002190072225,
    },
    {
      name: 'Mazar-i-Sharif',
      country_id: countryMap['Afghanistan'],
      group_id: -1002068411229,
    },
    {
      name: 'Stockton',
      country_id: countryMap['USA CA'],
      group_id: null,
    },
    {
      name: 'Lansing',
      country_id: countryMap['USA MI'],
      group_id: null,
    },
    {
      name: 'Tunis',
      country_id: countryMap['Tunisia'],
      group_id: -4289532966,
    },
    {
      name: 'Shenzhen',
      country_id: countryMap['China'],
      group_id: -4007649839,
    },
    {
      name: 'Osaka',
      country_id: countryMap['Japan'],
      group_id: -1002446555351,
    },
    {
      name: 'Islamabad',
      country_id: countryMap['Pakistan'],
      group_id: -1002110262683,
    },
    {
      name: 'Lahore',
      country_id: countryMap['Pakistan'],
      group_id: -1002041002336,
    },
    {
      name: 'Cincinnati',
      country_id: countryMap['USA OH'],
      group_id: -1001544278711,
    },
    {
      name: 'Porto Alegre',
      country_id: countryMap['Brazil'],
      group_id: -1001941064612,
    },
    {
      name: 'Thimphu',
      country_id: countryMap['Bhutan'],
      group_id: -4714850826,
    },
    {
      name: 'Ho Chi Minh City',
      country_id: countryMap['Vietnam'],
      group_id: -985230103,
    },
    {
      name: 'Bitola',
      country_id: countryMap['Macedonia'],
      group_id: -1001951960129,
    },
    {
      name: 'Krakow',
      country_id: countryMap['Poland'],
      group_id: -1002335823638,
    },
    {
      name: 'Nomad',
      country_id: countryMap['Earth'],
      group_id: -1002102576417,
    },
    {
      name: 'Dubai',
      country_id: countryMap['UAE'],
      group_id: -1001929523548,
    },
    {
      name: 'Acapulco',
      country_id: countryMap['Mexico'],
      group_id: -4223054946,
    },
    {
      name: 'Puerto Vallarta',
      country_id: countryMap['Mexico'],
      group_id: -4225399724,
    },
    {
      name: 'Fort Myers',
      country_id: countryMap['USA FL'],
      group_id: -904886377,
    },
    {
      name: 'Palm Beach',
      country_id: countryMap['USA FL'],
      group_id: -1002411901188,
    },
    {
      name: 'Savannah',
      country_id: countryMap['USA GA'],
      group_id: -1002255315006,
    },
    {
      name: 'Indianapolis',
      country_id: countryMap['USA IN'],
      group_id: null,
    },
    {
      name: 'Baton Rouge',
      country_id: countryMap['USA LA'],
      group_id: -4285617154,
    },
    {
      name: 'St. Louis',
      country_id: countryMap['USA MO'],
      group_id: -1002128385877,
    },
    {
      name: 'Perth',
      country_id: countryMap['Australia'],
      group_id: -4056409912,
    },
    {
      name: 'La Plata',
      country_id: countryMap['Argentina'],
      group_id: -4143607793,
    },
    {
      name: 'Puerto Varas',
      country_id: countryMap['Chile'],
      group_id: -4103351674,
    },
    {
      name: 'Arauca',
      country_id: countryMap['Colombia'],
      group_id: null,
    },
    {
      name: 'Mayapo',
      country_id: countryMap['Colombia'],
      group_id: null,
    },
    {
      name: 'Nice',
      country_id: countryMap['France'],
      group_id: -4127767316,
    },
    {
      name: 'Gibraltar',
      country_id: countryMap['Gibraltar'],
      group_id: -4155802557,
    },
    {
      name: 'Stockholm',
      country_id: countryMap['Sweden'],
      group_id: -1001865471383,
    },
    {
      name: 'Geneva',
      country_id: countryMap['Switzerland'],
      group_id: -4009814166,
    },
    {
      name: 'New Brunswick',
      country_id: countryMap['Canada New Brunswick'],
      group_id: null,
    },
    {
      name: 'Newfoundland Labrador',
      country_id: countryMap['Canada Newfoundland Labrador'],
      group_id: null,
    },
    {
      name: 'Prince Edward Island',
      country_id: countryMap['Canada Prince Edward Island'],
      group_id: null,
    },
    {
      name: 'Christchurch',
      country_id: countryMap['New Zealand'],
      group_id: -1002517947975,
    },
    {
      name: 'Macao',
      country_id: countryMap['China'],
      group_id: -1002045836834,
    },
    {
      name: 'Yiwu',
      country_id: countryMap['China'],
      group_id: -4281112662,
    },
    {
      name: 'Yunnan',
      country_id: countryMap['China'],
      group_id: -1002214631321,
    },
    {
      name: 'Vientiane',
      country_id: countryMap['Laos'],
      group_id: -4266471410,
    },
    {
      name: 'Genting',
      country_id: countryMap['Malaysia'],
      group_id: -1002201765268,
    },
    {
      name: 'Koror',
      country_id: countryMap['Palau'],
      group_id: -4148277582,
    },
    {
      name: 'Paramaribo',
      country_id: countryMap['Suriname'],
      group_id: -4054026131,
    },
    {
      name: 'Varna',
      country_id: countryMap['Bulgaria'],
      group_id: -1001877106043,
    },
    {
      name: 'Vilnius',
      country_id: countryMap['Lithuania'],
      group_id: -1002138914876,
    },
    {
      name: 'Belgrade',
      country_id: countryMap['Serbia'],
      group_id: -4115881809,
    },
    {
      name: 'Nassau',
      country_id: countryMap['Bahamas'],
      group_id: -1002159345662,
    },
    {
      name: 'Victoria',
      country_id: countryMap['Canada British Columbia'],
      group_id: -1002197679519,
    },
    {
      name: 'Tucson',
      country_id: countryMap['USA AZ'],
      group_id: -4255207920,
    },
    {
      name: 'Sacramento',
      country_id: countryMap['USA CA'],
      group_id: -1001768777703,
    },
    {
      name: 'Breckenridge',
      country_id: countryMap['USA CO'],
      group_id: -4788254827,
    },
    {
      name: 'Lafayette',
      country_id: countryMap['USA LA'],
      group_id: -4211761931,
    },
    {
      name: 'College Park',
      country_id: countryMap['USA MD'],
      group_id: -4749340620,
    },
    {
      name: 'Jackson',
      country_id: countryMap['USA MS'],
      group_id: -4100252645,
    },
    {
      name: 'Laconia',
      country_id: countryMap['USA NH'],
      group_id: -4790229162,
    },
    {
      name: 'Toledo',
      country_id: countryMap['USA OH'],
      group_id: -1001980057729,
    },
    {
      name: 'Williamsburg',
      country_id: countryMap['USA VA'],
      group_id: -1002030215131,
    },
    {
      name: 'Córdoba',
      country_id: countryMap['Argentina'],
      group_id: -1001513047765,
    },
    {
      name: 'Salvador Bahia',
      country_id: countryMap['Brazil'],
      group_id: -1001908831891,
    },
    {
      name: 'Quito',
      country_id: countryMap['Ecuador'],
      group_id: -1002206636065,
    },
    {
      name: 'Innsbruck',
      country_id: countryMap['Austria'],
      group_id: -4190383454,
    },
    {
      name: 'Brussels',
      country_id: countryMap['Belgium'],
      group_id: -1002144615446,
    },
    {
      name: 'Oulu',
      country_id: countryMap['Finland'],
      group_id: -4126476907,
    },
    {
      name: 'Montpellier',
      country_id: countryMap['France'],
      group_id: -4127767316,
    },
    {
      name: 'Nuremberg',
      country_id: countryMap['Germany'],
      group_id: -4234318107,
    },
    {
      name: 'Venice',
      country_id: countryMap['Italy'],
      group_id: -4140011980,
    },
    {
      name: 'Kongsberg',
      country_id: countryMap['Norway'],
      group_id: -4066227113,
    },
    {
      name: 'Svalbard',
      country_id: countryMap['Norway'],
      group_id: -4614244864,
    },
    {
      name: 'Lund',
      country_id: countryMap['Sweden'],
      group_id: -4069141800,
    },
    {
      name: 'Lugano',
      country_id: countryMap['Switzerland'],
      group_id: -4156776645,
    },
    {
      name: 'Cambridge',
      country_id: countryMap['UK'],
      group_id: -1002248433290,
    },
    {
      name: 'Bruges',
      country_id: countryMap['Belgium'],
      group_id: -1002296133545,
    },
    {
      name: 'Colombo',
      country_id: countryMap['Sri Lanka'],
      group_id: -1002537156394,
    },
    {
      name: 'Galle',
      country_id: countryMap['Sri Lanka'],
      group_id: null,
    },
    {
      name: 'Kandy',
      country_id: countryMap['Sri Lanka'],
      group_id: null,
    },
  ]);
}
