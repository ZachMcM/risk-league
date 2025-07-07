# Database

## How to save a new initial data instance

Not losing the current historical sports data is very important. Such data is hard to recover as mining APIs and scraping websites can take very long due to rate limits. To save a point in the current historical sports data first clear non stat related tables.

```
DELETE FROM users;
DELETE FROM matches;
DELETE FROM match_users;
DELETE FROM match_messages;
DELETE FROM parlays;
DELETE FROM parlay_picks;
DELETE FROM props;
```

Then execute this command in the root dir
```
pg_dump --data-only "postgresql://postgres:<PASSWORD>@localhost:5432/postgres?sslmode=disable" > ./db/initial.sql
```

This can then be restored later with
```
psql "<DATABASE_URL>" -f ./db/initial.sql
```