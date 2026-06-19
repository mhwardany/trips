export const AIRLINES = [
  'EgyptAir', 'Emirates', 'Qatar Airways', 'Saudia', 'flydubai', 
  'Air Arabia', 'Jazeera Airways', 'Kuwait Airways', 'Turkish Airlines', 
  'Pegasus', 'Flynas', 'Etihad Airways', 'Oman Air', 'Gulf Air', 
  'Royal Jordanian', 'Middle East Airlines (MEA)'
];

export const HOTELS = [
  'Marriott', 'Hilton', 'Sheraton', 'Four Seasons', 'Mövenpick', 
  'Rotana', 'Radisson Blu', 'InterContinental', 'Novotel', 'Ibis',
  'Hyatt', 'Fairmont', 'Ritz-Carlton', 'St. Regis', 'Swissôtel',
  'Le Méridien', 'Crowne Plaza', 'Holiday Inn', 'Kempinski'
];

export const PLACES: Record<string, { food: string[]; attractions: string[] }> = {
  'Kuwait': {
    food: [
      'Maki', 'Slide Burger', 'Babel', 'Mais Alghanim', 'Freej Swaileh', 
      'Ayam Zaman', 'Cocoa Room', 'Street Al Maqas', 'San Ristorante', 
      'Dar Hamad', 'Al Boom Steak and Seafood', 'White Robata'
    ],
    attractions: [
      'Kuwait Towers', 'The Avenues Mall', 'Al Hamra Tower', 'Souq Al Mubarakiya', 
      'Sheikh Jaber Al-Ahmad Cultural Centre', 'Grand Mosque', 'Kuwait National Museum', 
      'Al Shaheed Park', 'Marina Mall', '360 Mall', 'Scientific Center'
    ]
  },
  'Egypt': {
    food: [
      'Abou El Sid', 'Sobhy Kaber', 'Koshary Abou Tarek', 'Andrea Mariouteya', 
      'Zooba', 'Pier 88', 'Sachi', 'Crimson', 'Kazaz', 'Kebdet El Prince'
    ],
    attractions: [
      'Giza Pyramids', 'Egyptian Museum', 'Khan el-Khalili', 'Salah El-Din Citadel', 
      'Cairo Tower', 'Al-Azhar Park', 'Karnak Temple', 'Valley of the Kings', 
      'Abu Simbel', 'Bibliotheca Alexandrina', 'Sharm El Sheikh', 'Hurghada'
    ]
  },
  'Saudi Arabia': {
    food: [
      'Al Baik', 'Najd Village', 'Al Romansiah', 'Myazu', 'Nozomi', 
      'San Carlo Cicchetti', 'LPM Restaurant', 'Roka', 'Section-B'
    ],
    attractions: [
      'Kingdom Centre Tower', 'Al Masmak Fortress', 'Boulevard Riyadh City', 
      'Diriyah', 'Al Balad (Jeddah)', 'Red Sea Mall', 'King Fahd\'s Fountain', 
      'AlUla', 'Edge of the World', 'Masjid al-Haram', 'Al-Masjid an-Nabawi'
    ]
  },
  'United Arab Emirates': {
    food: [
      'Zuma', 'Coya', 'Nusr-Et', 'LPM Restaurant', 'Al Fanar', 
      'Arabian Tea House', 'Pierchic', 'Ossiano', 'Ravi Restaurant'
    ],
    attractions: [
      'Burj Khalifa', 'Dubai Mall', 'Palm Jumeirah', 'Burj Al Arab', 
      'Dubai Frame', 'Museum of the Future', 'Global Village', 
      'Sheikh Zayed Grand Mosque', 'Louvre Abu Dhabi', 'Ferrari World'
    ]
  }
};

export function getSuggestions(category: string, country: string | undefined): string[] {
  if (category === 'flight') return AIRLINES;
  if (category === 'hotel') return HOTELS;
  
  if (country) {
    // Attempt to match country name flexibly
    const matchedCountry = Object.keys(PLACES).find(k => 
      country.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(country.toLowerCase())
    );
    
    if (matchedCountry) {
      if (category === 'food' || category === 'restaurants' || category === 'cafes') {
        return PLACES[matchedCountry].food;
      }
      if (category === 'entertainment' || category === 'attractions' || category === 'malls') {
        return PLACES[matchedCountry].attractions;
      }
    }
  }
  
  return [];
}
