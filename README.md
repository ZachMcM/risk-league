# Risk League Docs

## How To Setup Database Locally
```
docker run --name local-postgres -e POSTGRES_PASSWORD=<PASSWORD> -p 5432:5432 -d postgres
```

Add to `.env`
```
DATABASE_URL="postgresql://postgres:<PASSWORD>@localhost:5432/postgres?sslmode=disable"
```

Run in your shell of choice in the root directory
```
dbmate up
```

## Starting The Database Locally
```
docker start local-postgres
```

## Installing Dependencies
```
pip install requirements.txt
```

## Initing The Database

```
# Teams
python init_nba_teams.py

# Players
python init_nba_players.py

# Games
python init_nba_games.py

# Player Stats
python init_nba_player_stats.py
```

## Running The API Server

### Generating Types
If `api/src/db/schema.d.ts` does not exist run this command
```
npm run codegen
```

### Running The Server In Dev Mode (Nodemon)
To run the API server without transpiling into JS with the build command simply run
```
npm run dev
```

### Running The Redis Server
```
redis-server
```

### Running the Expo Simulator

```
npm run start
```