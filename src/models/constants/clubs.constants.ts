export const PL_CLUBS = [
    'Arsenal',
    'Aston Villa',
    'Bournemouth',
    'Brentford',
    'Brighton and Hove Albion',
    'Burnley',
    'Chelsea',
    'Crystal Palace',
    'Everton',
    'Fulham',
    'Leeds United',
    'Liverpool',
    'Manchester City',
    'Manchester United',
    'Newcastle United',
    'Nottingham Forest',
    'Sunderland',
    'Tottenham Hotspur',
    'West Ham United',
    'Wolverhampton Wanderers'
  ] as const;
  
  export const CLUB_SYNONYMS: Record<string, string> = {
    // Arsenal
    'arsenal': 'arsenal',
    
    // Aston Villa
    'villa': 'aston villa',
    'aston villa': 'aston villa',
    
    // Bournemouth
    'bournemouth': 'bournemouth',
    'the cherries': 'bournemouth',
    
    // Brentford
    'brentford': 'brentford',
    
    // Brighton & Hove Albion
    'brighton': 'brighton and hove albion',
    'brighton & hove albion': 'brighton and hove albion',
    'brighton and hove albion': 'brighton and hove albion',
    'albion': 'brighton and hove albion',
    
    // Burnley
    'burnley': 'burnley',
    'the clarets': 'burnley',
    
    // Chelsea
    'chelsea': 'chelsea',
    
    // Crystal Palace
    'crystal palace': 'crystal palace',
    'palace': 'crystal palace',
    
    // Everton
    'everton': 'everton',
    'toffees': 'everton',
    
    // Fulham
    'fulham': 'fulham',
    
    // Leeds United
    'leeds': 'leeds united',
    'leeds united': 'leeds united',
    
    // Liverpool
    'liverpool': 'liverpool',
    'the reds': 'liverpool',
    
    // Manchester City
    'man city': 'manchester city',
    'city': 'manchester city',
    'manchester city': 'manchester city',
    
    // Manchester United
    'man utd': 'manchester united',
    'man united': 'manchester united',
    'united': 'manchester united',
    'manchester united': 'manchester united',
    
    // Newcastle United
    'newcastle': 'newcastle united',
    'the magpies': 'newcastle united',
    'newcastle united': 'newcastle united',
    
    // Nottingham Forest
    'forest': 'nottingham forest',
    'nottingham forest': 'nottingham forest',
    
    // Sunderland
    'sunderland': 'sunderland',
    'the black cats': 'sunderland',
    
    // Tottenham Hotspur
    'spurs': 'tottenham hotspur',
    'tottenham': 'tottenham hotspur',
    'tottenham hotspur': 'tottenham hotspur',
    'the lilywhites': 'tottenham hotspur',
    
    // West Ham United
    'west ham': 'west ham united',
    'the hammers': 'west ham united',
    'west ham united': 'west ham united',
    
    // Wolverhampton Wanderers
    'wolves': 'wolverhampton wanderers',
    'wolverhampton': 'wolverhampton wanderers',
    'wolverhampton wanderers': 'wolverhampton wanderers'
  };