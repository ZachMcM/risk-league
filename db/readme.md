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
pg_dump -Fc "postgresql://postgres:<PASSWORD>@localhost:5432/postgres?sslmode=disable" > ./db/initial.dump
```

This can then be restored later with
```
pg_restore -d "postgresql://postgres:<PASSWORD>@localhost:5432/postgres?sslmode=disable" ./db/initial.dump
```