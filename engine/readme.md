# Engine
Engine is the workhorse behind Risk League. Engine manages and updates historical sports statistics data, generate props using machine learning, and updates props, parlays, and matches based on live sports games. 

## Prop generation
Prop generation is handled in each sports respective directory due to the varying nature of stats in different sports. For more information check out [prop_generation.md](./prop_generation.md).

## Statistics Data Mining
Every morning scripts are ran to get data from the previous day games. The is done in the `update_stats.py` scripts for each respective sports directory. We currently (subject to change) use [nba_api](https://github.com/swar/nba_api) for NBA data and [MLB-StatsAPI](https://github.com/toddrob99/MLB-StatsAPI) for MLB stats. Updating the historical stats is necessary to maintain the integrity of our machine learning models.