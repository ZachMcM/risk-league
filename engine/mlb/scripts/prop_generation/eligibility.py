from shared.my_types import MetricStats
from sqlalchemy import Engine, or_, select
from mlb.my_types import Stat
from shared.tables import t_mlb_games, t_mlb_player_stats, t_players
from shared.utils import db_response_to_json
import sys
from datetime import datetime
from mlb.constants import min_num_stats
import numpy as np

_metric_stats_cache: dict[tuple[str, str], MetricStats] = {}


def get_metric_stats(
    engine: Engine, metric: Stat, position: str, use_postseason: bool
) -> MetricStats:
    cache_key = (metric, position)
    if cache_key in _metric_stats_cache:
        return _metric_stats_cache[cache_key]

    def build_stmt(game_type_filter, season_filter):
        if position == "Pitcher" or position == "Two-Way Player":
            position_clause = t_players.c.position.in_(["Pitcher", "Two-Way Player"])
        else:
            position_clause = t_players.c.position != "Pitcher"

        return (
            select(getattr(t_mlb_player_stats.c, metric))
            .select_from(
                t_mlb_player_stats.join(
                    t_mlb_games, t_mlb_player_stats.c.game_id == t_mlb_games.c.id
                ).join(t_players, t_mlb_player_stats.c.player_id == t_players.c.id)
            )
            .where(*game_type_filter)
            .where(position_clause)
            .where(*season_filter)
            .where(t_mlb_player_stats.c.player_id.is_not(None))
        )

    try:
        with engine.connect() as conn:
            season = str(datetime.now().year)

            # Primary filters
            game_type = "P" if use_postseason else "R"
            stmt = build_stmt(
                [t_mlb_games.c.game_type == game_type],
                [t_mlb_player_stats.c.season == season],
            )

            result = conn.execute(stmt).fetchall()
            if len(result) < min_num_stats:
                if use_postseason:
                    # Combine regular and playoffs for current season
                    game_type_filter = [
                        or_(
                            t_mlb_games.c.game_type == "R",
                            t_mlb_games.c.game_type == "P",
                        )
                    ]
                    season_filter = [t_mlb_player_stats.c.season == season]
                else:
                    game_type_filter = [t_mlb_games.c.game_type == "R"]
                    season_filter = [
                        or_(
                            t_mlb_player_stats.c.season == season,
                            t_mlb_player_stats.c.season == str(datetime.now().year),
                        )
                    ]

                stmt = build_stmt(game_type_filter, season_filter)
                result = conn.execute(stmt).fetchall()

            stats = db_response_to_json(result, metric)
            metric_stats = {"mean": np.mean(stats), "sd": np.std(stats)}
            _metric_stats_cache[cache_key] = metric_stats
            return metric_stats

    except Exception as e:
        print(f"⚠️ Error getting stats for metric {metric}, {e}")
        sys.exit(1)
