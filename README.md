# Risk League Local Setup Documentation

## Database Setup
```
docker run --name local-postgres -e POSTGRES_PASSWORD=<PASSWORD> -p 5432:5432 -d postgres
```

## Starting The Database
```
docker start local-postgres
```

Add to `.env`
```
DATABASE_URL="postgresql://postgres:<PASSWORD>@localhost:5432/postgres?sslmode=disable"
```

Run in your shell of choice in the root directory
```
dbmate up -u "<DATABASE_URL>"
```

## Installing Dependencies
```
pip install requirements.txt
```

## Engine Setup

### Setup up virtual environment
```
cd engine
python -m venv .venv
```
### Activate virtual environment
```
source .venv/bin/activate
```
### Install Packages
```
pip install -e .
```

## Codegen Tables for SqlAlchemy
If `engine/shared/tables.py` does not exist run this command
```
cd engine
sqlacodegen --schemas public "<DATABASE_URL>" > shared/tables.py
```
> [!IMPORTANT]
> `--schema public` is necessary if running against production neon codebase or else sqlacodegen won't find the schema

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