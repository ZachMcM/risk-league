# Risk League Docs

## How To Setup Database Locally
```
docker run --name local-postgres -e POSTGRES_PASSWORD=<PASSWORD> -p 5432:5432 -d postgres
```

## Starting The Database Locally
```
docker start local-postgres
```

Add to `.env`
```
DATABASE_URL="postgresql://postgres:<PASSWORD>@localhost:5432/postgres?sslmode=disable"
```

Run in your shell of choice in the root directory
```
dbmate up
```

## Loading Initial Data
After running `dbmate up`, load the initial data dump:
```
psql "postgresql://postgres:<PASSWORD>@localhost:5432/postgres?sslmode=disable" -f db/initial_data.sql
```

## Installing Dependencies
```
pip install requirements.txt
```

## Install Engine
```
cd engine
pip install -e .
```

## Codegen Tables for SqlAlchemy
If `engine/shared/tables.py` does not exist run this command
```
cd engine
sqlacodegen --generator tables "<DATABASE_URL>" > shared/tables.py
```

## Running The Backend Server

### Generating Types
If `server/src/db/schema.d.ts` does not exist run this command
```
cd server
npm run codegen
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