/** Selection-first catalogs: countries, currencies, category icon maps */
export interface Country { name: string; ar: string; flag: string; currency: string }

export const COUNTRIES: Country[] = [
  { name: 'Kuwait', ar: 'الكويت', flag: '🇰🇼', currency: 'KWD' },
  { name: 'UAE', ar: 'الإمارات', flag: '🇦🇪', currency: 'AED' },
  { name: 'Saudi Arabia', ar: 'السعودية', flag: '🇸🇦', currency: 'SAR' },
  { name: 'Qatar', ar: 'قطر', flag: '🇶🇦', currency: 'QAR' },
  { name: 'Bahrain', ar: 'البحرين', flag: '🇧🇭', currency: 'BHD' },
  { name: 'Oman', ar: 'عُمان', flag: '🇴🇲', currency: 'OMR' },
  { name: 'Egypt', ar: 'مصر', flag: '🇪🇬', currency: 'EGP' },
  { name: 'Jordan', ar: 'الأردن', flag: '🇯🇴', currency: 'JOD' },
  { name: 'Turkey', ar: 'تركيا', flag: '🇹🇷', currency: 'TRY' },
  { name: 'UK', ar: 'بريطانيا', flag: '🇬🇧', currency: 'GBP' },
  { name: 'France', ar: 'فرنسا', flag: '🇫🇷', currency: 'EUR' },
  { name: 'Germany', ar: 'ألمانيا', flag: '🇩🇪', currency: 'EUR' },
  { name: 'Italy', ar: 'إيطاليا', flag: '🇮🇹', currency: 'EUR' },
  { name: 'Spain', ar: 'إسبانيا', flag: '🇪🇸', currency: 'EUR' },
  { name: 'USA', ar: 'أمريكا', flag: '🇺🇸', currency: 'USD' },
  { name: 'Morocco', ar: 'المغرب', flag: '🇲🇦', currency: 'MAD' },
  { name: 'Tunisia', ar: 'تونس', flag: '🇹🇳', currency: 'TND' },
  { name: 'Lebanon', ar: 'لبنان', flag: '🇱🇧', currency: 'USD' },
  { name: 'Switzerland', ar: 'سويسرا', flag: '🇨🇭', currency: 'CHF' },
  { name: 'Japan', ar: 'اليابان', flag: '🇯🇵', currency: 'JPY' },
  { name: 'Malaysia', ar: 'ماليزيا', flag: '🇲🇾', currency: 'MYR' },
  { name: 'Thailand', ar: 'تايلاند', flag: '🇹🇭', currency: 'THB' }
];

export const CURRENCIES = ['KWD','EGP','USD','EUR','AED','SAR','QAR','BHD','OMR','GBP','TRY','JOD','CHF','JPY','MAD','TND','MYR','THB'];

export const AIRLINES = ['EgyptAir','Kuwait Airways','Jazeera Airways','Emirates','flydubai','Qatar Airways','Etihad','Saudia','flynas','Turkish Airlines','Air Cairo','Nile Air','Gulf Air','Royal Jordanian'];

export const STORE_CATEGORIES: Record<string, string[]> = {
  'Clothes': ['Zara', 'H&M', 'American Eagle', 'Juicy Couture', 'Centrepoint', 'Max', 'Splash', 'Mango', 'LC Waikiki', 'Pull&Bear', 'Bershka', 'Defacto'],
  'Sports': ['Athlete\'s Foot', 'New Balance', 'Sun & Sand Sports', 'Nike', 'Adidas', 'Under Armour', 'Foot Locker'],
  'Electronics': ['X-cite', 'Eureka', 'Best Al-Yousifi', 'Virgin Megastore', 'Sharaf DG', 'Jarir Bookstore', 'Apple Store'],
  'Pharmacies': ['Boots', 'Royal Pharmacy', 'Nahdi', 'Watsons', 'Al-Dawaa'],
  'Beauty & Makeup': ['NYX', 'Sheglam', 'KIKO Milano', 'Sephora', 'MAC', 'Bath & Body Works', 'Victoria\'s Secret'],
  'Perfumes & Oud': ['Abdul Samad Al Qurashi', 'Arabian Oud', 'Ibrahim Al Qurashi', 'Rasasi', 'Ajmal', 'Al Majed For Oud', 'Diptyque', 'Jo Malone'],
  'Supermarkets': ['Carrefour', 'Lulu Hypermarket', 'Sultan Center', 'Trolley', 'Panda', 'Monoprix'],
  'Coffee & Dates': ['Al Ameed Coffee (بن العميد)', 'Bateel (بتيل)', 'Patchi', 'Al Rifai (الرفاعي)', 'Barn\'s', 'Half Million', 'Starbucks', 'Caribou Coffee']
};
