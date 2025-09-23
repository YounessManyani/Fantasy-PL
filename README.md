# FPL API - Lean Architecture

A streamlined Fantasy Premier League API for parsing team text and providing transfer recommendations.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Run in development mode
npm run dev

# Or run in production mode
npm start
```

## 📁 Project Structure

```
src/
├── config/
│   └── index.js           # Unified configuration
│
├── core/
│   ├── dataLoader.js      # CSV data loading
│   ├── normalizer.js      # Text normalization utilities
│   └── playerStore.js     # In-memory player database
|   └── positionNormalize.js # Normalize positions names from various format
│
├── services/
│   ├── nameResolver.js    # Player name resolution (deterministic + LLM)
│   ├── teamParser.js      # Team text parsing
│   └── recommender.js     # Transfer recommendations
│
├── api/
│   ├── routes.js          # Express routes
│   ├── middleware.js      # Request validation & error handling
│   └── swagger.js         # API documentation
│
└── server.js              # Application entry point
```

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=8000
NODE_ENV=development

# Data
CSV_PATH=./data/fpl_player_statistics.csv

# LLM (Optional)
USE_LLM=1                    # Enable LLM resolution
LLM_PROVIDER=openai
OPENAI_API_KEY=your-key-here
LLM_MODEL=gpt-4o-mini
```

## 📡 API Endpoints

### Health Check

```http
GET /health
```

### Parse Team

```http
POST /parse-team
Content-Type: application/json

{
  "team_text": "Ramsdale, Walker, Saliba, Gabriel, Trippier, Rice, Odegaard, Saka, Haaland, Jesus, Watkins",
  "strict_mode": false,
  "include_suggestions": true,
  "use_llm": false
}
```

### Get Transfer Recommendations

```http
POST /recommend
Content-Type: application/json

{
  "team_text": "Raya,Romero,Calafiori , Chalobah, Doku , Enzo ,Gakpo,Semenyo,Kdus,JoaoPedro Chelsea,Haaland ",
  "bank": 0,
  "max_transfers": 1,
  "strict_mode": false,
  "use_llm": true
}
```

### List Players

```http
GET /players?position=FWD&limit=10
```

## 📊 Features

### Core Features

- **Team Parsing**: Convert text to player objects with fuzzy matching
- **Transfer Recommendations**: Find optimal transfers within budget
- **Player Database**: In-memory store with efficient indexing
- **Name Resolution**: Smart player name matching with optional LLM support

### Name Resolution Strategy

1. **Exact Match**: Check aliases and exact names
2. **Surname Match**: For single-word inputs
3. **Fuzzy Matching**: String similarity for close matches
4. **LLM Fallback**: Optional AI-powered resolution for difficult cases

### Validation Rules

- **Team Size**: Exactly 11 players
- **Formation**: 1 GK, 3-5 DEF, 2-5 MID, 1-3 FWD
- **Club Limit**: Maximum 3 players per club
- **Budget**: £100m total (for validation only)

## 🎯 Architecture Principles

### Single Responsibility

Each module has one clear purpose:

- `PlayerStore`: Data storage and indexing
- `NameResolver`: Name to player resolution
- `TeamParser`: Text to team conversion
- `Recommender`: Transfer optimization

### Clean Data Flow

```
CSV → PlayerStore → NameResolver → TeamParser → Recommender → API Response
```

### Performance Optimizations

- Single pass data loading
- Efficient indexes (name, surname, club, position)
- Result caching for name resolution
- Minimal data transformations

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linter
npm run lint
```

## 📝 API Documentation

Interactive API documentation available at:

```
http://localhost:8000/docs
```

OpenAPI specification:

```
http://localhost:8000/openapi.json
```

## 🔄 Key Improvements from Original

1. **40% Less Code**: Removed redundant modules and duplications
2. **Unified Services**: Single resolver, cleaner separation
3. **Simpler Configuration**: One config file with clear sections
4. **Better Performance**: Fewer transformations and indexes
5. **Clearer Architecture**: Obvious module responsibilities

## 🚦 Response Examples

### Successful Team Parse

```json
{
  "players": [
    {
      "name": "Erling Haaland",
      "club": "Manchester City",
      "position": "FWD",
      "price": 14.0,
      "score": 8.5
    }
  ],
  "unknown": [],
  "stats": {
    "total_value": 98.5,
    "formation": "4-4-2",
    "average_score": 5.4
  },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
```

### Transfer Recommendation

```json
{
  "success": true,
  "transfers": [
    {
      "out": { "name": "Player A", "price": 5.5 },
      "in": { "name": "Player B", "price": 6.0 },
      "gain": 1.5,
      "cost": 0.5
    }
  ],
  "explanation": "• Replace Player A with Player B\n  → Score improvement: +1.5",
  "impact": {
    "score_gain": 1.5,
    "cost": 0.5,
    "transfers_used": 1
  }
}
```

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 🛠️ Future Enhancements

- [ ] Add TypeScript for better type safety
- [ ] Implement comprehensive test suite
- [ ] Add database persistence option
- [ ] Add WebSocket for real-time updates
- [ ] Implement caching layer (Redis)
- [ ] Add more LLM providers (Anthropic, Ollama)
- [ ] Add rate limiting for API endpoints
- [ ] Implement user authentication
