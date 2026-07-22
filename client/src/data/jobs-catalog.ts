/**
 * Generated sample job catalog for Global Jobs International.
 * Mandatory roles appear in every country; additional roles expand realism.
 */

export type JobListing = {
  id: string;
  title: string;
  country: string;
  countryCode: string;
  city: string;
  employer: string;
  salaryMonthly: number;
  currency: string;
  salaryLabel: string;
  visaSponsorship: boolean;
  accommodation: boolean;
  medicalInsurance: boolean;
  contractDuration: string;
  workingHours: string;
  description: string;
  benefits: string[];
  requirements: string[];
  vacancies: number;
  applicationDeadline: string;
  status: 'Open' | 'Closed';
  category: string;
  experience: string;
  logo: string;
  logoColor: string;
};

export const MANDATORY_JOB_TITLES = [
  'Factory Worker',
  'Driver',
  'Teacher',
  'Farmer',
  'Cleaner',
  'Nurse',
  'Caregiver',
] as const;

/** Additional roles required in every country alongside the mandatory seven. */
export const UNIVERSAL_EXTRA_JOB_TITLES = [
  'Chef',
  'Welder',
  'Electrician',
  'Plumber',
  'Construction Worker',
  'Warehouse Worker',
  'Hotel Staff',
  'Security Guard',
  'Machine Operator',
  'Accountant',
  'IT Support',
  'Software Engineer',
  'Mechanical Engineer',
  'Civil Engineer',
  'Sales Representative',
  'Marketing Officer',
  'Receptionist',
  'Office Assistant',
  'Truck Driver',
  'Forklift Operator',
  'Babysitter',
  'Housekeeper',
  'Agricultural Technician',
  'Food Production Worker',
  'Logistics Coordinator',
  'Customer Service',
] as const;

export const REQUIRED_EVERY_COUNTRY_JOBS = [
  ...MANDATORY_JOB_TITLES,
  ...UNIVERSAL_EXTRA_JOB_TITLES,
] as const;

const SHARED_EXTRA_JOBS = [
  { title: 'Warehouse Associate', category: 'Manufacturing', experience: 'Entry level' },
  { title: 'Production Operator', category: 'Manufacturing', experience: '1+ years' },
  { title: 'Machine Operator', category: 'Manufacturing', experience: '2+ years' },
  { title: 'Forklift Operator', category: 'Manufacturing', experience: '1+ years' },
  { title: 'Quality Inspector', category: 'Manufacturing', experience: '2+ years' },
  { title: 'Packaging Assistant', category: 'Manufacturing', experience: 'Entry level' },
  { title: 'Construction Worker', category: 'Construction', experience: '1+ years' },
  { title: 'Electrician', category: 'Construction', experience: '3+ years' },
  { title: 'Plumber', category: 'Construction', experience: '2+ years' },
  { title: 'Welder', category: 'Construction', experience: '2+ years' },
  { title: 'Carpenter', category: 'Construction', experience: '2+ years' },
  { title: 'Chef', category: 'Hospitality', experience: '3+ years' },
  { title: 'Cook', category: 'Hospitality', experience: '1+ years' },
  { title: 'Waiter / Waitress', category: 'Hospitality', experience: 'Entry level' },
  { title: 'Hotel Receptionist', category: 'Hospitality', experience: '1+ years' },
  { title: 'Housekeeper', category: 'Hospitality', experience: 'Entry level' },
  { title: 'Bartender', category: 'Hospitality', experience: '1+ years' },
  { title: 'Doctor', category: 'Healthcare', experience: 'Licensed' },
  { title: 'Pharmacist', category: 'Healthcare', experience: 'Licensed' },
  { title: 'Laboratory Technician', category: 'Healthcare', experience: '2+ years' },
  { title: 'Physiotherapist', category: 'Healthcare', experience: 'Licensed' },
  { title: 'Dental Assistant', category: 'Healthcare', experience: '1+ years' },
  { title: 'Accountant', category: 'Office', experience: '2+ years' },
  { title: 'Administrative Assistant', category: 'Office', experience: '1+ years' },
  { title: 'Customer Service Representative', category: 'Office', experience: '1+ years' },
  { title: 'Sales Representative', category: 'Office', experience: '1+ years' },
  { title: 'IT Support Technician', category: 'Technology', experience: '2+ years' },
  { title: 'Software Developer', category: 'Technology', experience: '2+ years' },
  { title: 'Truck Driver', category: 'Transport', experience: '2+ years' },
  { title: 'Delivery Driver', category: 'Transport', experience: '1+ years' },
  { title: 'Bus Driver', category: 'Transport', experience: '2+ years' },
  { title: 'Logistics Coordinator', category: 'Transport', experience: '2+ years' },
  { title: 'Greenhouse Worker', category: 'Agriculture', experience: 'Entry level' },
  { title: 'Fruit Picker', category: 'Agriculture', experience: 'Entry level' },
  { title: 'Dairy Farm Assistant', category: 'Agriculture', experience: '1+ years' },
  { title: 'Security Guard', category: 'Security', experience: '1+ years' },
  { title: 'CCTV Operator', category: 'Security', experience: '1+ years' },
  { title: 'Primary School Teacher', category: 'Education', experience: 'Licensed' },
  { title: 'Teaching Assistant', category: 'Education', experience: 'Entry level' },
] as const;

type DestinationCountry = {
  name: string;
  code: string;
  currency: string;
  cities: string[];
  specialties: string[];
  salaryFactor: number;
};

/** 100+ hiring destinations with local currency and specialty roles. */
export const hiringCountries: DestinationCountry[] = [
  { name: 'United States', code: 'us', currency: 'USD', cities: ['Houston', 'Chicago', 'Phoenix'], specialties: ['Delivery Driver', 'Hotel Receptionist', 'Security Guard', 'Warehouse Associate'], salaryFactor: 1.15 },
  { name: 'Canada', code: 'ca', currency: 'CAD', cities: ['Toronto', 'Vancouver', 'Calgary'], specialties: ['Truck Driver', 'Welder', 'Carpenter', 'Fruit Picker', 'Construction Worker'], salaryFactor: 1.05 },
  { name: 'Australia', code: 'au', currency: 'AUD', cities: ['Sydney', 'Melbourne', 'Perth'], specialties: ['Mining Worker', 'Livestock Worker', 'Farm Supervisor', 'Electrician', 'Mechanic'], salaryFactor: 1.12 },
  { name: 'United Kingdom', code: 'gb', currency: 'GBP', cities: ['London', 'Manchester', 'Birmingham'], specialties: ['Care Assistant', 'NHS Nurse', 'Hotel Staff', 'Teaching Assistant'], salaryFactor: 0.95 },
  { name: 'Germany', code: 'de', currency: 'EUR', cities: ['Berlin', 'Munich', 'Hamburg'], specialties: ['Mechanical Technician', 'CNC Operator', 'Industrial Electrician', 'Warehouse Associate'], salaryFactor: 1 },
  { name: 'Ireland', code: 'ie', currency: 'EUR', cities: ['Dublin', 'Cork', 'Galway'], specialties: ['Care Assistant', 'IT Support Technician', 'Hotel Receptionist'], salaryFactor: 1.02 },
  { name: 'Qatar', code: 'qa', currency: 'QAR', cities: ['Doha', 'Al Rayyan', 'Al Wakrah'], specialties: ['Construction Worker', 'Electrician', 'Plumber', 'Security Guard'], salaryFactor: 2.6 },
  { name: 'United Arab Emirates', code: 'ae', currency: 'AED', cities: ['Dubai', 'Abu Dhabi', 'Sharjah'], specialties: ['Hotel Receptionist', 'Office Administrator', 'Sales Assistant', 'Customer Service Representative'], salaryFactor: 2.5 },
  { name: 'Saudi Arabia', code: 'sa', currency: 'SAR', cities: ['Riyadh', 'Jeddah', 'Dammam'], specialties: ['Heavy Equipment Operator', 'Welder', 'Nurse', 'Construction Worker'], salaryFactor: 2.45 },
  { name: 'France', code: 'fr', currency: 'EUR', cities: ['Paris', 'Lyon', 'Marseille'], specialties: ['Chef', 'Hospitality Supervisor', 'Caregiver'], salaryFactor: 0.98 },
  { name: 'Netherlands', code: 'nl', currency: 'EUR', cities: ['Amsterdam', 'Rotterdam', 'Utrecht'], specialties: ['Greenhouse Worker', 'Warehouse Associate', 'Logistics Coordinator'], salaryFactor: 1.04 },
  { name: 'Belgium', code: 'be', currency: 'EUR', cities: ['Brussels', 'Antwerp', 'Ghent'], specialties: ['Warehouse Associate', 'Nurse', 'Truck Driver'], salaryFactor: 1.01 },
  { name: 'Spain', code: 'es', currency: 'EUR', cities: ['Madrid', 'Barcelona', 'Valencia'], specialties: ['Hotel Receptionist', 'Chef', 'Agricultural Worker'], salaryFactor: 0.88 },
  { name: 'Italy', code: 'it', currency: 'EUR', cities: ['Milan', 'Rome', 'Turin'], specialties: ['Caregiver', 'Factory Worker', 'Hotel Staff'], salaryFactor: 0.9 },
  { name: 'Portugal', code: 'pt', currency: 'EUR', cities: ['Lisbon', 'Porto', 'Faro'], specialties: ['Tourism Assistant', 'Caregiver', 'Construction Worker'], salaryFactor: 0.82 },
  { name: 'Poland', code: 'pl', currency: 'PLN', cities: ['Warsaw', 'Krakow', 'Gdansk'], specialties: ['Warehouse Associate', 'Factory Worker', 'Truck Driver'], salaryFactor: 3.2 },
  { name: 'Sweden', code: 'se', currency: 'SEK', cities: ['Stockholm', 'Gothenburg', 'Malmo'], specialties: ['Nurse', 'Warehouse Associate', 'IT Support Technician'], salaryFactor: 8.5 },
  { name: 'Norway', code: 'no', currency: 'NOK', cities: ['Oslo', 'Bergen', 'Trondheim'], specialties: ['Fish Processor', 'Nurse', 'Construction Worker'], salaryFactor: 9.2 },
  { name: 'Denmark', code: 'dk', currency: 'DKK', cities: ['Copenhagen', 'Aarhus', 'Odense'], specialties: ['Caregiver', 'Warehouse Associate', 'Cleaner'], salaryFactor: 6.1 },
  { name: 'Finland', code: 'fi', currency: 'EUR', cities: ['Helsinki', 'Tampere', 'Turku'], specialties: ['Nurse', 'Cleaner', 'IT Support Technician'], salaryFactor: 1.03 },
  { name: 'Switzerland', code: 'ch', currency: 'CHF', cities: ['Zurich', 'Geneva', 'Basel'], specialties: ['Nurse', 'Hotel Receptionist', 'Caregiver'], salaryFactor: 1.1 },
  { name: 'Austria', code: 'at', currency: 'EUR', cities: ['Vienna', 'Salzburg', 'Graz'], specialties: ['Hospitality Staff', 'Caregiver', 'Factory Worker'], salaryFactor: 1 },
  { name: 'Czech Republic', code: 'cz', currency: 'CZK', cities: ['Prague', 'Brno', 'Ostrava'], specialties: ['Factory Worker', 'Warehouse Associate', 'Driver'], salaryFactor: 18 },
  { name: 'Hungary', code: 'hu', currency: 'HUF', cities: ['Budapest', 'Debrecen', 'Szeged'], specialties: ['Factory Worker', 'Warehouse Associate', 'Driver'], salaryFactor: 280 },
  { name: 'Romania', code: 'ro', currency: 'RON', cities: ['Bucharest', 'Cluj-Napoca', 'Timisoara'], specialties: ['Factory Worker', 'Driver', 'Construction Worker'], salaryFactor: 3.8 },
  { name: 'Greece', code: 'gr', currency: 'EUR', cities: ['Athens', 'Thessaloniki', 'Heraklion'], specialties: ['Hotel Receptionist', 'Waiter / Waitress', 'Caregiver'], salaryFactor: 0.8 },
  { name: 'Turkey', code: 'tr', currency: 'TRY', cities: ['Istanbul', 'Ankara', 'Izmir'], specialties: ['Factory Worker', 'Hotel Staff', 'Driver'], salaryFactor: 24 },
  { name: 'Japan', code: 'jp', currency: 'JPY', cities: ['Tokyo', 'Osaka', 'Nagoya'], specialties: ['Factory Worker', 'Caregiver', 'Hotel Staff'], salaryFactor: 110 },
  { name: 'South Korea', code: 'kr', currency: 'KRW', cities: ['Seoul', 'Busan', 'Incheon'], specialties: ['Factory Worker', 'Nurse', 'Language Teacher'], salaryFactor: 1050 },
  { name: 'Singapore', code: 'sg', currency: 'SGD', cities: ['Singapore'], specialties: ['Nurse', 'Hotel Receptionist', 'IT Support Technician'], salaryFactor: 1.2 },
  { name: 'Malaysia', code: 'my', currency: 'MYR', cities: ['Kuala Lumpur', 'Penang', 'Johor Bahru'], specialties: ['Factory Worker', 'Hotel Staff', 'Nurse'], salaryFactor: 3.5 },
  { name: 'Thailand', code: 'th', currency: 'THB', cities: ['Bangkok', 'Chiang Mai', 'Phuket'], specialties: ['Hotel Receptionist', 'Chef', 'Tour Guide'], salaryFactor: 28 },
  { name: 'Vietnam', code: 'vn', currency: 'VND', cities: ['Ho Chi Minh City', 'Hanoi', 'Da Nang'], specialties: ['Factory Worker', 'English Teacher', 'Hotel Staff'], salaryFactor: 19000 },
  { name: 'Philippines', code: 'ph', currency: 'PHP', cities: ['Manila', 'Cebu', 'Davao'], specialties: ['Call Center Agent', 'Nurse', 'Teacher'], salaryFactor: 45 },
  { name: 'Indonesia', code: 'id', currency: 'IDR', cities: ['Jakarta', 'Surabaya', 'Bali'], specialties: ['Hotel Staff', 'Factory Worker', 'Teacher'], salaryFactor: 12000 },
  { name: 'India', code: 'in', currency: 'INR', cities: ['Bengaluru', 'Mumbai', 'Hyderabad'], specialties: ['Software Developer', 'Nurse', 'Customer Service Representative'], salaryFactor: 65 },
  { name: 'China', code: 'cn', currency: 'CNY', cities: ['Shanghai', 'Shenzhen', 'Beijing'], specialties: ['Factory Worker', 'English Teacher', 'Logistics Coordinator'], salaryFactor: 5.5 },
  { name: 'Hong Kong', code: 'hk', currency: 'HKD', cities: ['Hong Kong'], specialties: ['Nurse', 'Hotel Receptionist', 'Caregiver'], salaryFactor: 6.2 },
  { name: 'Taiwan', code: 'tw', currency: 'TWD', cities: ['Taipei', 'Kaohsiung', 'Taichung'], specialties: ['Factory Worker', 'English Teacher', 'Engineer'], salaryFactor: 25 },
  { name: 'New Zealand', code: 'nz', currency: 'NZD', cities: ['Auckland', 'Wellington', 'Christchurch'], specialties: ['Farm Worker', 'Nurse', 'Construction Worker'], salaryFactor: 1.2 },
  { name: 'South Africa', code: 'za', currency: 'ZAR', cities: ['Johannesburg', 'Cape Town', 'Durban'], specialties: ['Security Guard', 'Nurse', 'Driver'], salaryFactor: 14 },
  { name: 'Egypt', code: 'eg', currency: 'EGP', cities: ['Cairo', 'Alexandria', 'Giza'], specialties: ['Hotel Staff', 'Teacher', 'Nurse'], salaryFactor: 28 },
  { name: 'Morocco', code: 'ma', currency: 'MAD', cities: ['Casablanca', 'Rabat', 'Marrakech'], specialties: ['Hotel Staff', 'Factory Worker', 'Call Center Agent'], salaryFactor: 8 },
  { name: 'Kenya', code: 'ke', currency: 'KES', cities: ['Nairobi', 'Mombasa', 'Kisumu'], specialties: ['Nurse', 'Teacher', 'Driver', 'Caregiver'], salaryFactor: 95 },
  { name: 'Nigeria', code: 'ng', currency: 'NGN', cities: ['Lagos', 'Abuja', 'Port Harcourt'], specialties: ['Nurse', 'Driver', 'Customer Service Representative'], salaryFactor: 950 },
  { name: 'Ghana', code: 'gh', currency: 'GHS', cities: ['Accra', 'Kumasi', 'Takoradi'], specialties: ['Nurse', 'Teacher', 'Driver'], salaryFactor: 9 },
  { name: 'Uganda', code: 'ug', currency: 'UGX', cities: ['Kampala', 'Entebbe', 'Jinja'], specialties: ['Nurse', 'Teacher', 'Caregiver'], salaryFactor: 2800 },
  { name: 'Tanzania', code: 'tz', currency: 'TZS', cities: ['Dar es Salaam', 'Arusha', 'Mwanza'], specialties: ['Hotel Staff', 'Driver', 'Nurse'], salaryFactor: 1900 },
  { name: 'Ethiopia', code: 'et', currency: 'ETB', cities: ['Addis Ababa', 'Dire Dawa', 'Hawassa'], specialties: ['Nurse', 'Teacher', 'Factory Worker'], salaryFactor: 42 },
  { name: 'Rwanda', code: 'rw', currency: 'RWF', cities: ['Kigali', 'Butare', 'Gisenyi'], specialties: ['Nurse', 'Teacher', 'Hospitality Staff'], salaryFactor: 950 },
  { name: 'Zambia', code: 'zm', currency: 'ZMW', cities: ['Lusaka', 'Ndola', 'Kitwe'], specialties: ['Mine Worker', 'Driver', 'Nurse'], salaryFactor: 16 },
  { name: 'Zimbabwe', code: 'zw', currency: 'USD', cities: ['Harare', 'Bulawayo', 'Mutare'], specialties: ['Nurse', 'Teacher', 'Driver'], salaryFactor: 0.55 },
  { name: 'Brazil', code: 'br', currency: 'BRL', cities: ['Sao Paulo', 'Rio de Janeiro', 'Brasilia'], specialties: ['Factory Worker', 'Nurse', 'Hotel Staff'], salaryFactor: 4 },
  { name: 'Mexico', code: 'mx', currency: 'MXN', cities: ['Mexico City', 'Guadalajara', 'Monterrey'], specialties: ['Factory Worker', 'Customer Service Representative', 'Driver'], salaryFactor: 15 },
  { name: 'Argentina', code: 'ar', currency: 'ARS', cities: ['Buenos Aires', 'Cordoba', 'Rosario'], specialties: ['Teacher', 'Nurse', 'Hospitality Staff'], salaryFactor: 700 },
  { name: 'Chile', code: 'cl', currency: 'CLP', cities: ['Santiago', 'Valparaiso', 'Concepcion'], specialties: ['Mining Worker', 'Nurse', 'Teacher'], salaryFactor: 700 },
  { name: 'Colombia', code: 'co', currency: 'COP', cities: ['Bogota', 'Medellin', 'Cali'], specialties: ['Customer Service Representative', 'Nurse', 'Teacher'], salaryFactor: 3200 },
  { name: 'Peru', code: 'pe', currency: 'PEN', cities: ['Lima', 'Arequipa', 'Cusco'], specialties: ['Hotel Staff', 'Tour Guide', 'Nurse'], salaryFactor: 2.8 },
  { name: 'Costa Rica', code: 'cr', currency: 'CRC', cities: ['San Jose', 'Liberia', 'Limon'], specialties: ['Hotel Staff', 'Tour Guide', 'Nurse'], salaryFactor: 420 },
  { name: 'Panama', code: 'pa', currency: 'USD', cities: ['Panama City', 'Colon', 'David'], specialties: ['Logistics Coordinator', 'Hotel Staff', 'Nurse'], salaryFactor: 0.75 },
  { name: 'Jamaica', code: 'jm', currency: 'JMD', cities: ['Kingston', 'Montego Bay', 'Ocho Rios'], specialties: ['Hotel Staff', 'Nurse', 'Chef'], salaryFactor: 115 },
  { name: 'Trinidad and Tobago', code: 'tt', currency: 'TTD', cities: ['Port of Spain', 'San Fernando'], specialties: ['Nurse', 'Oil Field Worker', 'Teacher'], salaryFactor: 5 },
  { name: 'Bahrain', code: 'bh', currency: 'BHD', cities: ['Manama', 'Riffa', 'Muharraq'], specialties: ['Nurse', 'Hotel Receptionist', 'Construction Worker'], salaryFactor: 0.3 },
  { name: 'Kuwait', code: 'kw', currency: 'KWD', cities: ['Kuwait City', 'Hawalli', 'Salmiya'], specialties: ['Nurse', 'Driver', 'Cleaner', 'Teacher'], salaryFactor: 0.25 },
  { name: 'Oman', code: 'om', currency: 'OMR', cities: ['Muscat', 'Salalah', 'Sohar'], specialties: ['Nurse', 'Construction Worker', 'Driver'], salaryFactor: 0.3 },
  { name: 'Jordan', code: 'jo', currency: 'JOD', cities: ['Amman', 'Irbid', 'Aqaba'], specialties: ['Nurse', 'Teacher', 'Hotel Staff'], salaryFactor: 0.55 },
  { name: 'Lebanon', code: 'lb', currency: 'USD', cities: ['Beirut', 'Tripoli', 'Sidon'], specialties: ['Nurse', 'Teacher', 'Hotel Staff'], salaryFactor: 0.6 },
  { name: 'Israel', code: 'il', currency: 'ILS', cities: ['Tel Aviv', 'Jerusalem', 'Haifa'], specialties: ['Caregiver', 'Nurse', 'Software Developer'], salaryFactor: 3 },
  { name: 'Pakistan', code: 'pk', currency: 'PKR', cities: ['Karachi', 'Lahore', 'Islamabad'], specialties: ['Nurse', 'Teacher', 'IT Support Technician'], salaryFactor: 180 },
  { name: 'Bangladesh', code: 'bd', currency: 'BDT', cities: ['Dhaka', 'Chittagong', 'Sylhet'], specialties: ['Factory Worker', 'Nurse', 'Teacher'], salaryFactor: 85 },
  { name: 'Sri Lanka', code: 'lk', currency: 'LKR', cities: ['Colombo', 'Kandy', 'Galle'], specialties: ['Hotel Staff', 'Nurse', 'Teacher'], salaryFactor: 230 },
  { name: 'Nepal', code: 'np', currency: 'NPR', cities: ['Kathmandu', 'Pokhara', 'Lalitpur'], specialties: ['Nurse', 'Teacher', 'Hospitality Staff'], salaryFactor: 95 },
  { name: 'Afghanistan', code: 'af', currency: 'AFN', cities: ['Kabul', 'Herat', 'Mazar-i-Sharif'], specialties: ['Teacher', 'Nurse', 'Driver'], salaryFactor: 55 },
  { name: 'Ukraine', code: 'ua', currency: 'UAH', cities: ['Kyiv', 'Lviv', 'Odesa'], specialties: ['IT Support Technician', 'Nurse', 'Driver'], salaryFactor: 28 },
  { name: 'Russia', code: 'ru', currency: 'RUB', cities: ['Moscow', 'Saint Petersburg', 'Kazan'], specialties: ['Factory Worker', 'Driver', 'Teacher'], salaryFactor: 70 },
  { name: 'Kazakhstan', code: 'kz', currency: 'KZT', cities: ['Almaty', 'Astana', 'Shymkent'], specialties: ['Oil Field Worker', 'Nurse', 'Driver'], salaryFactor: 360 },
  { name: 'Uzbekistan', code: 'uz', currency: 'UZS', cities: ['Tashkent', 'Samarkand', 'Bukhara'], specialties: ['Teacher', 'Nurse', 'Factory Worker'], salaryFactor: 9000 },
  { name: 'Azerbaijan', code: 'az', currency: 'AZN', cities: ['Baku', 'Ganja', 'Sumqayit'], specialties: ['Oil Field Worker', 'Nurse', 'Driver'], salaryFactor: 1.3 },
  { name: 'Georgia', code: 'ge', currency: 'GEL', cities: ['Tbilisi', 'Batumi', 'Kutaisi'], specialties: ['Hotel Staff', 'Teacher', 'Driver'], salaryFactor: 2 },
  { name: 'Armenia', code: 'am', currency: 'AMD', cities: ['Yerevan', 'Gyumri', 'Vanadzor'], specialties: ['IT Support Technician', 'Nurse', 'Teacher'], salaryFactor: 300 },
  { name: 'Albania', code: 'al', currency: 'ALL', cities: ['Tirana', 'Durres', 'Vlore'], specialties: ['Hotel Staff', 'Caregiver', 'Construction Worker'], salaryFactor: 75 },
  { name: 'Serbia', code: 'rs', currency: 'RSD', cities: ['Belgrade', 'Novi Sad', 'Nis'], specialties: ['Factory Worker', 'Driver', 'IT Support Technician'], salaryFactor: 85 },
  { name: 'Croatia', code: 'hr', currency: 'EUR', cities: ['Zagreb', 'Split', 'Dubrovnik'], specialties: ['Hotel Staff', 'Chef', 'Nurse'], salaryFactor: 0.85 },
  { name: 'Slovenia', code: 'si', currency: 'EUR', cities: ['Ljubljana', 'Maribor', 'Koper'], specialties: ['Factory Worker', 'Nurse', 'Logistics Coordinator'], salaryFactor: 0.95 },
  { name: 'Slovakia', code: 'sk', currency: 'EUR', cities: ['Bratislava', 'Kosice', 'Zilina'], specialties: ['Factory Worker', 'Warehouse Associate', 'Driver'], salaryFactor: 0.9 },
  { name: 'Bulgaria', code: 'bg', currency: 'BGN', cities: ['Sofia', 'Plovdiv', 'Varna'], specialties: ['Factory Worker', 'Hotel Staff', 'Driver'], salaryFactor: 1.5 },
  { name: 'Lithuania', code: 'lt', currency: 'EUR', cities: ['Vilnius', 'Kaunas', 'Klaipeda'], specialties: ['Warehouse Associate', 'Driver', 'Nurse'], salaryFactor: 0.88 },
  { name: 'Latvia', code: 'lv', currency: 'EUR', cities: ['Riga', 'Daugavpils', 'Liepaja'], specialties: ['Warehouse Associate', 'Driver', 'Nurse'], salaryFactor: 0.86 },
  { name: 'Estonia', code: 'ee', currency: 'EUR', cities: ['Tallinn', 'Tartu', 'Narva'], specialties: ['IT Support Technician', 'Warehouse Associate', 'Nurse'], salaryFactor: 0.92 },
  { name: 'Iceland', code: 'is', currency: 'ISK', cities: ['Reykjavik', 'Akureyri'], specialties: ['Fish Processor', 'Hotel Staff', 'Nurse'], salaryFactor: 110 },
  { name: 'Malta', code: 'mt', currency: 'EUR', cities: ['Valletta', 'Sliema', 'St Julians'], specialties: ['Hotel Staff', 'Customer Service Representative', 'Nurse'], salaryFactor: 0.9 },
  { name: 'Cyprus', code: 'cy', currency: 'EUR', cities: ['Nicosia', 'Limassol', 'Larnaca'], specialties: ['Hotel Staff', 'Nurse', 'Caregiver'], salaryFactor: 0.9 },
  { name: 'Luxembourg', code: 'lu', currency: 'EUR', cities: ['Luxembourg City', 'Esch-sur-Alzette'], specialties: ['Finance Officer', 'Nurse', 'IT Support Technician'], salaryFactor: 1.2 },
  { name: 'Mauritius', code: 'mu', currency: 'MUR', cities: ['Port Louis', 'Curepipe', 'Grand Baie'], specialties: ['Hotel Staff', 'Chef', 'Nurse'], salaryFactor: 35 },
  { name: 'Seychelles', code: 'sc', currency: 'SCR', cities: ['Victoria', 'Beau Vallon'], specialties: ['Hotel Staff', 'Chef', 'Dive Instructor'], salaryFactor: 10 },
  { name: 'Fiji', code: 'fj', currency: 'FJD', cities: ['Suva', 'Nadi', 'Lautoka'], specialties: ['Hotel Staff', 'Tour Guide', 'Nurse'], salaryFactor: 1.7 },
  { name: 'Papua New Guinea', code: 'pg', currency: 'PGK', cities: ['Port Moresby', 'Lae'], specialties: ['Mine Worker', 'Nurse', 'Driver'], salaryFactor: 2.8 },
  { name: 'Cambodia', code: 'kh', currency: 'KHR', cities: ['Phnom Penh', 'Siem Reap', 'Sihanoukville'], specialties: ['Hotel Staff', 'English Teacher', 'Factory Worker'], salaryFactor: 3100 },
  { name: 'Laos', code: 'la', currency: 'LAK', cities: ['Vientiane', 'Luang Prabang', 'Pakse'], specialties: ['Hotel Staff', 'Teacher', 'Tour Guide'], salaryFactor: 15000 },
  { name: 'Myanmar', code: 'mm', currency: 'MMK', cities: ['Yangon', 'Mandalay', 'Naypyidaw'], specialties: ['Factory Worker', 'Teacher', 'Hotel Staff'], salaryFactor: 1600 },
  { name: 'Mongolia', code: 'mn', currency: 'MNT', cities: ['Ulaanbaatar', 'Erdenet'], specialties: ['Mine Worker', 'Driver', 'Nurse'], salaryFactor: 2500 },
  { name: 'Botswana', code: 'bw', currency: 'BWP', cities: ['Gaborone', 'Francistown'], specialties: ['Mine Worker', 'Nurse', 'Teacher'], salaryFactor: 10 },
  { name: 'Namibia', code: 'na', currency: 'NAD', cities: ['Windhoek', 'Walvis Bay', 'Swakopmund'], specialties: ['Mine Worker', 'Hotel Staff', 'Nurse'], salaryFactor: 14 },
  { name: 'Senegal', code: 'sn', currency: 'XOF', cities: ['Dakar', 'Thies', 'Saint-Louis'], specialties: ['Hotel Staff', 'Teacher', 'Nurse'], salaryFactor: 480 },
  { name: 'Ivory Coast', code: 'ci', currency: 'XOF', cities: ['Abidjan', 'Bouake', 'Yamoussoukro'], specialties: ['Factory Worker', 'Driver', 'Nurse'], salaryFactor: 480 },
  { name: 'Cameroon', code: 'cm', currency: 'XAF', cities: ['Douala', 'Yaounde', 'Bafoussam'], specialties: ['Nurse', 'Teacher', 'Driver'], salaryFactor: 480 },
  { name: 'Algeria', code: 'dz', currency: 'DZD', cities: ['Algiers', 'Oran', 'Constantine'], specialties: ['Oil Field Worker', 'Nurse', 'Teacher'], salaryFactor: 100 },
  { name: 'Tunisia', code: 'tn', currency: 'TND', cities: ['Tunis', 'Sfax', 'Sousse'], specialties: ['Hotel Staff', 'Nurse', 'Call Center Agent'], salaryFactor: 2.4 },
];

const logoColors = ['#0052CC', '#0F766E', '#B45309', '#0369A1', '#DC2626', '#1D4ED8', '#047857', '#7C2D12'];

const employerPrefixes = ['Global', 'Pacific', 'Northern', 'Summit', 'Horizon', 'Unity', 'Prime', 'Atlas', 'Crest', 'Harbor'];
const employerSuffixes = ['Staffing', 'Partners', 'Industries', 'Care Group', 'Logistics', 'Services', 'Works', 'Hospitality'];

const roleMetaDefaults: Record<string, { category: string; experience: string; baseMonthly: number }> = {
  Chef: { category: 'Hospitality', experience: '3+ years', baseMonthly: 3400 },
  Welder: { category: 'Construction', experience: '2+ years', baseMonthly: 3600 },
  Electrician: { category: 'Construction', experience: '3+ years', baseMonthly: 3900 },
  Plumber: { category: 'Construction', experience: '2+ years', baseMonthly: 3500 },
  'Construction Worker': { category: 'Construction', experience: '1+ years', baseMonthly: 3000 },
  'Warehouse Worker': { category: 'Manufacturing', experience: 'Entry level', baseMonthly: 2700 },
  'Hotel Staff': { category: 'Hospitality', experience: '1+ years', baseMonthly: 2800 },
  'Security Guard': { category: 'Security', experience: '1+ years', baseMonthly: 2600 },
  'Machine Operator': { category: 'Manufacturing', experience: '2+ years', baseMonthly: 3200 },
  Accountant: { category: 'Office', experience: '2+ years', baseMonthly: 3800 },
  'IT Support': { category: 'Technology', experience: '2+ years', baseMonthly: 3600 },
  'Software Engineer': { category: 'Technology', experience: '2+ years', baseMonthly: 5200 },
  'Mechanical Engineer': { category: 'Engineering', experience: '3+ years', baseMonthly: 4800 },
  'Civil Engineer': { category: 'Engineering', experience: '3+ years', baseMonthly: 4700 },
  'Sales Representative': { category: 'Office', experience: '1+ years', baseMonthly: 3100 },
  'Marketing Officer': { category: 'Office', experience: '2+ years', baseMonthly: 3400 },
  Receptionist: { category: 'Office', experience: '1+ years', baseMonthly: 2700 },
  'Office Assistant': { category: 'Office', experience: 'Entry level', baseMonthly: 2500 },
  'Truck Driver': { category: 'Transport', experience: '2+ years', baseMonthly: 3300 },
  'Forklift Operator': { category: 'Manufacturing', experience: '1+ years', baseMonthly: 2900 },
  Babysitter: { category: 'Care Services', experience: '1+ years', baseMonthly: 2400 },
  Housekeeper: { category: 'Hospitality', experience: 'Entry level', baseMonthly: 2300 },
  'Agricultural Technician': { category: 'Agriculture', experience: '2+ years', baseMonthly: 3000 },
  'Food Production Worker': { category: 'Manufacturing', experience: 'Entry level', baseMonthly: 2600 },
  'Logistics Coordinator': { category: 'Transport', experience: '2+ years', baseMonthly: 3500 },
  'Customer Service': { category: 'Office', experience: '1+ years', baseMonthly: 2800 },
};

const mandatoryMeta: Record<
  (typeof MANDATORY_JOB_TITLES)[number],
  { category: string; experience: string; baseMonthly: number }
> = {
  'Factory Worker': { category: 'Manufacturing', experience: 'Entry level', baseMonthly: 2800 },
  Driver: { category: 'Transport', experience: '1+ years', baseMonthly: 3000 },
  Teacher: { category: 'Education', experience: 'Licensed', baseMonthly: 3600 },
  Farmer: { category: 'Agriculture', experience: 'Entry level', baseMonthly: 2500 },
  Cleaner: { category: 'Hospitality', experience: 'Entry level', baseMonthly: 2300 },
  Nurse: { category: 'Healthcare', experience: 'Licensed', baseMonthly: 4200 },
  Caregiver: { category: 'Care Services', experience: '1+ years', baseMonthly: 3100 },
};

const specialtyBaseMonthly: Record<string, number> = {
  'Mining Worker': 4800,
  'Livestock Worker': 2900,
  'Farm Supervisor': 3400,
  Mechanic: 3600,
  'Care Assistant': 3000,
  'NHS Nurse': 4300,
  'Hotel Staff': 2700,
  'Mechanical Technician': 3900,
  'CNC Operator': 3700,
  'Industrial Electrician': 4100,
  'Heavy Equipment Operator': 4000,
  'Office Administrator': 3200,
  'Sales Assistant': 2800,
  'Language Teacher': 3400,
  'Call Center Agent': 2600,
  'English Teacher': 3300,
  'Fish Processor': 3000,
  'Agricultural Worker': 2500,
  'Hospitality Supervisor': 3400,
  'Tourism Assistant': 2700,
  'Tour Guide': 2600,
  'Oil Field Worker': 4500,
  'Mine Worker': 4600,
  'Finance Officer': 4200,
  'Dive Instructor': 3200,
  'Hospitality Staff': 2700,
  Engineer: 4500,
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function salaryFor(title: string, factor: number, currency: string) {
  const mandatory = mandatoryMeta[title as keyof typeof mandatoryMeta];
  const universal = roleMetaDefaults[title];
  const base =
    mandatory?.baseMonthly ??
    universal?.baseMonthly ??
    specialtyBaseMonthly[title] ??
    3000;
  const amount = Math.round((base * factor) / 10) * 10;
  return {
    salaryMonthly: amount,
    salaryLabel: `${currency} ${amount.toLocaleString()}/month`,
  };
}

function buildEmployer(countryIndex: number, roleIndex: number, title: string) {
  const prefix = employerPrefixes[(countryIndex + roleIndex) % employerPrefixes.length];
  const suffix = employerSuffixes[(countryIndex * 3 + roleIndex) % employerSuffixes.length];
  const name = `${prefix} ${suffix}`;
  const logo = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return {
    employer: name,
    logo,
    logoColor: logoColors[(countryIndex + roleIndex) % logoColors.length],
    titleHint: title,
  };
}

function uniqueTitlesForCountry(country: DestinationCountry): { title: string; category: string; experience: string }[] {
  const titles = new Map<string, { title: string; category: string; experience: string }>();

  for (const title of REQUIRED_EVERY_COUNTRY_JOBS) {
    const meta =
      mandatoryMeta[title as keyof typeof mandatoryMeta] ||
      roleMetaDefaults[title] || {
        category: 'General',
        experience: '1+ years',
        baseMonthly: 3000,
      };
    titles.set(title, { title, category: meta.category, experience: meta.experience });
  }

  for (const specialty of country.specialties) {
    if (!titles.has(specialty)) {
      titles.set(specialty, {
        title: specialty,
        category: 'Specialized',
        experience: '1+ years',
      });
    }
  }

  for (const extra of SHARED_EXTRA_JOBS) {
    if (titles.size >= 42) break;
    if (!titles.has(extra.title)) {
      titles.set(extra.title, { ...extra });
    }
  }

  return [...titles.values()].slice(0, 42);
}

function generateCatalog(): JobListing[] {
  const deadline = '2026-09-30';
  const jobs: JobListing[] = [];

  hiringCountries.forEach((country, countryIndex) => {
    const roles = uniqueTitlesForCountry(country);
    roles.forEach((role, roleIndex) => {
      const city = country.cities[roleIndex % country.cities.length];
      const pay = salaryFor(role.title, country.salaryFactor, country.currency);
      const company = buildEmployer(countryIndex, roleIndex, role.title);
      const open = roleIndex % 11 !== 0;

      jobs.push({
        id: `${country.code}-${slugify(role.title)}-${roleIndex + 1}`,
        title: role.title,
        country: country.name,
        countryCode: country.code,
        city,
        employer: company.employer,
        salaryMonthly: pay.salaryMonthly,
        currency: country.currency,
        salaryLabel: pay.salaryLabel,
        visaSponsorship: true,
        accommodation: roleIndex % 3 !== 2,
        medicalInsurance: roleIndex % 4 !== 3,
        contractDuration: roleIndex % 2 === 0 ? '24 months' : '12 months',
        workingHours: '40–48 hours / week',
        description: `Join ${company.employer} in ${city}, ${country.name} as a ${role.title}. This international placement includes structured onboarding, verified employer screening, and relocation guidance through Global Jobs International.`,
        benefits: [
          'Verified international employer',
          pay.salaryLabel,
          country.specialties.includes(role.title) ? 'High-demand specialty role' : 'Stable long-term placement',
          'Candidate support through visa stages',
        ],
        requirements: [
          role.experience === 'Licensed' ? 'Valid professional license / certificate' : `${role.experience} relevant experience`,
          'Valid passport or passport application in progress',
          'Ability to relocate internationally',
          'Clear background check',
        ],
        vacancies: 3 + ((countryIndex + roleIndex) % 12),
        applicationDeadline: deadline,
        status: open ? 'Open' : 'Closed',
        category: role.category,
        experience: role.experience,
        logo: company.logo,
        logoColor: company.logoColor,
      });
    });
  });

  return jobs;
}

export const allJobs: JobListing[] = generateCatalog();

export const jobCatalogStats = {
  totalJobs: allJobs.length,
  openJobs: allJobs.filter((job) => job.status === 'Open').length,
  totalCountries: hiringCountries.length,
  totalEmployers: new Set(allJobs.map((job) => job.employer)).size,
  jobsAddedToday: 128,
  applicationsSubmitted: 18420,
  interviewsScheduled: 48000,
  successfulPlacements: 1200000,
  applicants: 3500000,
};

export function getJobById(id: string) {
  return allJobs.find((job) => job.id === id) ?? null;
}

export function getJobsByCountry(countryName: string | null | undefined) {
  if (!countryName) return allJobs;
  return allJobs.filter((job) => job.country.toLowerCase() === countryName.toLowerCase());
}

export function searchJobs(filters: {
  country?: string;
  title?: string;
  category?: string;
  experience?: string;
  salaryMin?: number;
  visaSponsorship?: boolean;
  accommodation?: boolean;
}) {
  return allJobs.filter((job) => {
    if (filters.country && job.country !== filters.country) return false;
    if (filters.title && !job.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
    if (filters.category && job.category !== filters.category) return false;
    if (filters.experience && job.experience !== filters.experience) return false;
    if (typeof filters.salaryMin === 'number' && job.salaryMonthly < filters.salaryMin) return false;
    if (filters.visaSponsorship && !job.visaSponsorship) return false;
    if (filters.accommodation && !job.accommodation) return false;
    return true;
  });
}

export const featuredDestinationNames = [
  'United States',
  'Canada',
  'Australia',
  'United Kingdom',
  'Germany',
  'Ireland',
  'Qatar',
  'United Arab Emirates',
  'Saudi Arabia',
] as const;

export function getFeaturedJobs(limit = 9): JobListing[] {
  const picks: JobListing[] = [];
  for (const country of featuredDestinationNames) {
    for (const title of MANDATORY_JOB_TITLES) {
      const match = allJobs.find(
        (job) => job.country === country && job.title === title && job.status === 'Open',
      );
      if (match) {
        picks.push(match);
        break;
      }
    }
    if (picks.length >= limit) break;
  }
  return picks.slice(0, limit);
}

export const searchJobTitles = [...new Set(allJobs.map((job) => job.title))].sort();
export const searchCategories = [...new Set(allJobs.map((job) => job.category))].sort();
export const searchExperienceLevels = [...new Set(allJobs.map((job) => job.experience))].sort();
export const searchCountryNames = hiringCountries.map((country) => country.name);
