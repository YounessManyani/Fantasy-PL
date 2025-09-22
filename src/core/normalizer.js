// src/core/normalizer.js

export function stripAccents(str) {
  return (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeName(str) {
  let normalized = stripAccents((str || "").toLowerCase());
  normalized = normalized
    .replace(/[^a-z0-9\s.\-']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized;
}

// Club name synonyms mapping
const CLUB_SYNONYMS = {
  spurs: "tottenham hotspur",
  tottenham: "tottenham hotspur",
  "man utd": "manchester united",
  "man united": "manchester united",
  "man city": "manchester city",
  wolves: "wolverhampton wanderers",
  forest: "nottingham forest",
  brighton: "brighton and hove albion",
  leicester: "leicester city",
  "west ham": "west ham united",
};

export function normalizeClub(str) {
  const normalized = normalizeName(str);
  return CLUB_SYNONYMS[normalized] || normalized;
}

// Premier League 2025/2026 – common player name aliases
export const PLAYER_ALIASES = {
  // Goalkeepers
  "vicario": "guglielmo vicario",
  "dubravka": "martin dubravka",
  "alisson": "alisson becker",
  "ederson": "ederson moraes",
  "onana": "andre onana",
  "areola": "alphonse areola",
  "neto": "norberto murara neto",
  "donnarumma": "gianluigi donnarumma",   // new signing:contentReference[oaicite:2]{index=2}
  "ramsdale": "aaron ramsdale",           // moved to Newcastle:contentReference[oaicite:3]{index=3}
  "lammens": "senne lammens",             // new Man United keeper:contentReference[oaicite:4]{index=4}
  "hermansen": "mads hermansen",          // West Ham keeper:contentReference[oaicite:5]{index=5}
  "perri": "lucas perri",                 // Leeds keeper:contentReference[oaicite:6]{index=6}
  "roefs": "robin roefs",                 // Sunderland keeper:contentReference[oaicite:7]{index=7}
  "fabianski": "lukasz fabianski",        // West Ham keeper:contentReference[oaicite:8]{index=8}

  // Defenders
  "taa": "trent alexander-arnold",
  "trent": "trent alexander-arnold",
  "robertson": "andrew robertson",
  "vvd": "virgil van dijk",
  "virgil": "virgil van dijk",
  "dias": "ruben dias",
  "saliba": "william saliba",
  "gabriel": "gabriel magalhaes",
  "cancelo": "joao cancelo",
  "hincapie": "piero hincapie",           // Arsenal’s new centre-back:contentReference[oaicite:9]{index=9}
  "burn": "dan burn",
  "schar": "fabian schar",
  "justin": "james justin",
  "guehi": "marc guehi",
  "chilwell": "ben chilwell",
  "porro": "pedro porro",
  "ait nouri": "rayan ait-nouri",
  "hato": "jorrel hato",                  // Chelsea defender:contentReference[oaicite:10]{index=10}
  "leoni": "giovanni leoni",              // Liverpool defender:contentReference[oaicite:11]{index=11}
  "thiaw": "malick thiaw",                // Newcastle defender:contentReference[oaicite:12]{index=12}
  "lindelof": "victor lindelof",          // Aston Villa defender:contentReference[oaicite:13]{index=13}
  "krejci": "ladislav krejci",            // Wolves defender:contentReference[oaicite:14]{index=14}
  "mosquera": "cristhian mosquera",       // Arsenal defender:contentReference[oaicite:15]{index=15}
  "ugochukwu": "lesley ugochukwu",        // Burnley midfielder/defender:contentReference[oaicite:16]{index=16}
  "geertruida": "lutsharel geertruida",   // Sunderland defender:contentReference[oaicite:17]{index=17}
  "masuaku": "arthur masuaku",            // Sunderland defender:contentReference[oaicite:18]{index=18}

  // Midfielders
  "jota": "diogo jota",
  "gakpo": "cody gakpo",
  "mbeumo": "bryan mbeumo",
  "bruno": "bruno fernandes",
  "kdb": "kevin de bruyne",
  "martinelli": "gabriel martinelli",
  "wirtz": "florian wirtz",               // Liverpool’s star No 10:contentReference[oaicite:19]{index=19}
  "palmer": "cole palmer",
  "paqueta": "lucas paqueta",
  "rice": "declan rice",                  // reliable mid-price option:contentReference[oaicite:20]{index=20}
  "elanga": "anthony elanga",            // Newcastle winger:contentReference[oaicite:21]{index=21}
  "ndiaye": "iliman ndiaye",              // Everton’s talisman:contentReference[oaicite:22]{index=22}
  "anderson": "elliot anderson",          // Nottingham Forest midfielder:contentReference[oaicite:23]{index=23}
  "reijnders": "tijjani reijnders",       // Manchester City’s new midfielder:contentReference[oaicite:24]{index=24}
  "arias": "jhon arias",                  // Wolves’ Colombian playmaker:contentReference[oaicite:25]{index=25}
  "simons": "xavi simons",                // Spurs midfielder:contentReference[oaicite:26]{index=26}
  "bakwa": "dilane bakwa",                // Nottingham Forest midfielder:contentReference[oaicite:27]{index=27}
  "ndoye": "dan ndoye",                   // Forest midfielder:contentReference[oaicite:28]{index=28}
  "kalimuendo": "arnaud kalimuendo",      // Forest forward/midfielder:contentReference[oaicite:29]{index=29}
  "palhinha": "joao palhinha",            // Spurs midfielder:contentReference[oaicite:30]{index=30}
  "dibling": "tyler dibling",             // Everton midfielder:contentReference[oaicite:31]{index=31}
  "fernandes": "mateus fernandes",        // West Ham midfielder:contentReference[oaicite:32]{index=32}
  "stach": "anton stach",                 // Leeds midfielder:contentReference[oaicite:33]{index=33}
  "magassa": "soungoutou magassa",        // West Ham midfielder:contentReference[oaicite:34]{index=34}
  "rohl": "merlin rohl",                  // Everton midfielder:contentReference[oaicite:35]{index=35}
  "luiz": "douglas luiz",                 // Forest midfielder:contentReference[oaicite:36]{index=36}
  "xhaka": "granit xhaka",                // Sunderland midfielder:contentReference[oaicite:37]{index=37}

  // Forwards
  "haaland": "erling haaland",
  "nunez": "darwin nunez",
  "jesus": "gabriel jesus",
  "cunha": "matheus cunha",
  "wood": "chris wood",
  "joao pedro": "joao pedro",
  "johnson": "brennan johnson",
  "watkins": "ollie watkins",
  "isak": "alexander isak",
  "toney": "ivan toney",
  "solanke": "dominic solanke",
  "ferguson": "evan ferguson",
  "gyokeres": "viktor gyokeres",          // Arsenal’s new striker:contentReference[oaicite:38]{index=38}:contentReference[oaicite:39]{index=39}
  "ekitike": "hugo ekitike",              // Liverpool striker:contentReference[oaicite:40]{index=40}:contentReference[oaicite:41]{index=41}
  "sesko": "benjamin sesko",              // Man Utd striker:contentReference[oaicite:42]{index=42}
  "woltemade": "nick woltemade",          // Newcastle striker:contentReference[oaicite:43]{index=43}
  "kolo muani": "randal kolo muani",      // Spurs striker:contentReference[oaicite:44]{index=44}
  "brobbey": "brian brobbey",             // Sunderland forward:contentReference[oaicite:45]{index=45}
  "arokodare": "tolu arokodare",          // Wolves forward:contentReference[oaicite:46]{index=46}
  "broja": "armando broja",               // Burnley striker:contentReference[oaicite:47]{index=47}
  "calvert-lewin": "dominic calvert-lewin", // Leeds striker:contentReference[oaicite:48]{index=48}
  "wilson": "callum wilson",              // West Ham forward:contentReference[oaicite:49]{index=49}
  "uche": "christantus uche",             // Crystal Palace striker:contentReference[oaicite:50]{index=50}
  "mateta": "jean-philippe mateta",       // Crystal Palace forward:contentReference[oaicite:51]{index=51}
  "larsen": "jorgen strand larsen"        // Wolves forward:contentReference[oaicite:52]{index=52}
};

