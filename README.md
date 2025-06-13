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

## Prop Generation
We utilize statistical concepts like linear regression and the normal (gaussian) distribution in order to create the props

### Prop Eligibility
  - Players must average more than `minutes_threshold` mpg over their last `n_games` games
  - Check if player meets position average for the specific stat
    - If the player does not meet position average threshold we check if they meet a randomized value derived from the normal distribution of the position average with some constant applied

### Linear Regression
  - We use relevant stats as the x value and the target stat as the y value and create a best fit line with a linear regression model
  - We then input the averages for our x values and predict the next value
  - Once we have the predicted next value we use a truncated normal distribution with a max sigma of `max_sigma` to get the actual line

## Running The API Server

### Generating Types
If `api/src/db/schema.d.t` does not exist run this command
```
npm run codegen
```

### Running The Server In Dev Mode (Nodemon)
To run the API server without transpiling into JS with the build command simply run
```
npm run dev
```