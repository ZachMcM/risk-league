# Risk League Local Setup Documentation

## Database Setup
```
docker run --name postgres-local -e POSTGRES_PASSWORD=<PASSWORD> -p 5432:5432 -d postgres:latest
```

Add to `.env` in server
```
DATABASE_URL="postgresql://postgres:<PASSWORD>@localhost:5432/riskleague?sslmode=disable"
```

### Running The Redis Server
```
redis-server
```

### Running The Server In Dev Mode (Nodemon)
To run the backend server without transpiling into JS with the build command simply run
```
cd client
npm run dev
```

### Running the Expo Simulator
```
cd client
npm run start
```

### Setting up virtual python environments
```
python -m venv .venv
```

Activate
```
source .venv/bin/activate
```

Deactivate
```
deactivate
```

Install packages
```
pip install -e .
```

### Adding starter data to local database
Seeding teams
```
cd orchestration
python -m seed.insert_teams MLB NFL NBA NCAABB NCAAFB
```

Seeding players
```
cd orchestration
python -m cron.update_rosters MLB NFL NBA NCAABB NCAAFB
```

Seeding games and stats
```
cd orchestration
python -m seed.process_games <LEAGUE> <START_DATE> <END_DATE>
```

References