"""
Football Prop Configurations using Auto-Registration System

Example:
@register_football_stat
def walks_config() -> PropConfig:
    return PropConfig(...)
"""

from prop_generation.generator.base import (
    DataScope,
    FeatureDefinition,
    ModelType,
    PropConfig,
)
from prop_generation.generator.registry import football_registry, register_football_stat

ELIGIBILITY_THRESHOLDS = {
    "QB": {
        "passing_yards": 0.5,  # Starting QBs should generate props
        "passing_touchdowns": 0.5,
        "passing_rushing_touchdowns": 0.5,
        "passing_interceptions": 0.5,  # Lower threshold for interceptions
        "completions": 0.5,  # Starting QBs
        "passing_attempts": 0.5,  # Starting QBs
        "rushing_yards": 0.3,  # Mobile QBs
    },
    "RB": {
        "rushing_yards": 0.4,  # Primary and backup RBs
        "rushing_touchdowns": 0.3,  # TDs are less frequent
        "receiving_yards": 0.2,  # Pass-catching RBs
        "rushing_attempts": 0.4,  # Primary and backup RBs
        "rushing_long": 0.3,  # RBs with rushing opportunities
    },
    "WR": {
        "receiving_yards": 0.3,  # WR1, WR2, some WR3s
        "receiving_touchdowns": 0.2,  # TDs are less frequent
        "receiving_rushing_touchdowns": 0.2,
        "receiving_long": 0.25,  # WRs with receiving opportunities
        "receptions": 0.3,  # WR1, WR2, some WR3s
    },
    "TE": {
        "receiving_yards": 0.25,  # Pass-catching TEs
        "receiving_touchdowns": 0.2,
        "receiving_rushing_touchdowns": 0.2,
        "receiving_long": 0.2,  # Pass-catching TEs
        "receptions": 0.25,  # Pass-catching TEs
    },
    "K": {
        "field_goals_made": 0.5,  # Most active kickers
    },
    "PK": {
        "field_goals_made": 0.5,  # Most active kickers
    },
}

SAMPLE_SIZE = 22  # ~1.3 seasons - captures diverse game situations while exponential decay keeps predictions recent-focused
MIN_LINE_FOR_UNDER = 4.5


@register_football_stat
def passing_yards_config() -> PropConfig:
    """Passing Yards configuration"""
    return PropConfig(
        stat_name="passing_yards",
        display_name="Passing Yards",
        features=[
            FeatureDefinition("completions", "completions", DataScope.PLAYER),
            FeatureDefinition("passing_attempts", "passing_attempts", DataScope.PLAYER),
            FeatureDefinition("passer_rating", "passer_rating", DataScope.PLAYER),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_completions_allowed", "completions_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "passing_touchdowns", "passing_touchdowns", DataScope.PLAYER
            ),
            FeatureDefinition(
                "opp_passing_touchdowns_allowed",
                "passing_touchdowns_allowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition("team_first_downs", "first_downs", DataScope.TEAM),
            FeatureDefinition(
                "passing_interceptions", "passing_interceptions", DataScope.PLAYER
            ),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_football_stat
def receiving_yards_config() -> PropConfig:
    """Receiving Yards configuration"""
    return PropConfig(
        stat_name="receiving_yards",
        display_name="Receiving Yards",
        features=[
            FeatureDefinition("receptions", "receptions", DataScope.PLAYER),
            FeatureDefinition(
                "receiving_touchdowns", "receiving_touchdowns", DataScope.PLAYER
            ),
            FeatureDefinition("passing_yards", "passing_yards", DataScope.TEAM),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_completions_allowed", "completions_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_passing_touchdowns_allowed",
                "passing_touchdowns_allowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "passing_touchdowns", "passing_touchdowns", DataScope.TEAM
            ),
            FeatureDefinition("team_first_downs", "first_downs", DataScope.TEAM),
            FeatureDefinition(
                "passing_interceptions", "passing_interceptions", DataScope.PLAYER
            ),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_football_stat
def rushing_yards_config() -> PropConfig:
    """Rushing Yards configuration"""
    return PropConfig(
        stat_name="rushing_yards",
        display_name="Rushing Yards",
        features=[
            FeatureDefinition("rushing_long", "rushing_long", DataScope.PLAYER),
            FeatureDefinition("rushing_attempts", "rushing_attempts", DataScope.PLAYER),
            FeatureDefinition(
                "opp_rushing_yards_allowed", "rushing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_rushing_touchdowns_allowed",
                "rushing_touchdowns_allowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "rushing_touchdowns", "rushing_touchdowns", DataScope.PLAYER
            ),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_football_stat
def field_goals_made_config() -> PropConfig:
    """Field Goals Made configuration"""
    return PropConfig(
        stat_name="field_goals_made",
        display_name="Field Goals Made",
        features=[
            FeatureDefinition("team_turnovers", "turnovers", DataScope.TEAM),
            FeatureDefinition("team_total_yards", "total_yards", DataScope.TEAM),
            FeatureDefinition("opp_blocked_kicks", "blocked_kicks", DataScope.OPPONENT),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_rushing_yards_allowed", "rushing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "field_goals_attempted", "field_goals_attempted", DataScope.PLAYER
            ),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_football_stat
def receiving_touchdowns_config() -> PropConfig:
    """Receiving Touchdowns configuration"""
    return PropConfig(
        stat_name="receiving_touchdowns",
        display_name="Receiving Touchdowns",
        features=[
            FeatureDefinition("receptions", "receptions", DataScope.PLAYER),
            FeatureDefinition("receiving_yards", "receiving_yards", DataScope.PLAYER),
            FeatureDefinition("team_passing_yards", "passing_yards", DataScope.TEAM),
            FeatureDefinition(
                "team_passing_touchdowns", "passing_touchdowns", DataScope.TEAM
            ),
            FeatureDefinition(
                "opp_passing_touchdowns_allowed",
                "passing_touchdowns_allowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passing_yards_allowed", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_football_stat
def passing_touchdowns_config() -> PropConfig:
    """Passing Touchdowns configuration"""
    return PropConfig(
        stat_name="passing_touchdowns",
        display_name="Passing Touchdowns",
        features=[
            FeatureDefinition("completions", "completions", DataScope.PLAYER),
            FeatureDefinition("passing_yards", "passing_yards", DataScope.PLAYER),
            FeatureDefinition("passing_attempts", "passing_attempts", DataScope.PLAYER),
            FeatureDefinition("passer_rating", "passer_rating", DataScope.PLAYER),
            FeatureDefinition(
                "opp_passing_touchdowns_allowed",
                "passing_touchdowns_allowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "passing_interceptions", "passing_interceptions", DataScope.PLAYER
            ),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_football_stat
def passing_interceptions_config() -> PropConfig:
    """Passing Interceptions configuration"""
    return PropConfig(
        stat_name="passing_interceptions",
        display_name="Passing Interceptions",
        features=[
            FeatureDefinition("passing_attempts", "passing_attempts", DataScope.PLAYER),
            FeatureDefinition("completions", "completions", DataScope.PLAYER),
            FeatureDefinition("passer_rating", "passer_rating", DataScope.PLAYER),
            FeatureDefinition(
                "opp_defense_interceptions",
                "defense_interceptions",
                DataScope.OPPONENT,
            ),
            FeatureDefinition("team_turnovers", "turnovers", DataScope.TEAM),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_football_stat
def rushing_touchdowns_config() -> PropConfig:
    """Rushing Touchdowns configuration"""
    return PropConfig(
        stat_name="rushing_touchdowns",
        display_name="Rushing Touchdowns",
        features=[
            FeatureDefinition("rushing_attempts", "rushing_attempts", DataScope.PLAYER),
            FeatureDefinition("rushing_yards", "rushing_yards", DataScope.PLAYER),
            FeatureDefinition("rushing_long", "rushing_long", DataScope.PLAYER),
            FeatureDefinition(
                "opp_rushing_touchdowns_allowed",
                "rushing_touchdowns_allowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_rushing_yards_allowed", "rushing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition("team_rushing_yards", "rushing_yards", DataScope.TEAM),
            FeatureDefinition(
                "team_rushing_touchdowns", "rushing_touchdowns", DataScope.TEAM
            ),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_football_stat
def receiving_rushing_touchdowns_config() -> PropConfig:
    """Receiving+Rushing Touchdowns configuration"""
    return PropConfig(
        stat_name="receiving_rushing_touchdowns",
        display_name="Receiving+Rushing TDs",
        features=[
            FeatureDefinition("rushing_attempts", "rushing_attempts", DataScope.PLAYER),
            FeatureDefinition("rushing_yards", "rushing_yards", DataScope.PLAYER),
            FeatureDefinition("receptions", "receptions", DataScope.PLAYER),
            FeatureDefinition("receiving_yards", "receiving_yards", DataScope.PLAYER),
            FeatureDefinition(
                "rushing_touchdowns", "rushing_touchdowns", DataScope.PLAYER
            ),
            FeatureDefinition(
                "receiving_touchdowns", "receiving_touchdowns", DataScope.PLAYER
            ),
            FeatureDefinition(
                "opp_rushing_touchdowns_allowed",
                "rushing_touchdowns_allowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_passing_touchdowns_allowed",
                "passing_touchdowns_allowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_rushing_yards_allowed", "rushing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passing_yards_allowed", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_football_stat
def passing_rushing_touchdowns_config() -> PropConfig:
    """Passing+Rushing Touchdowns configuration"""
    return PropConfig(
        stat_name="passing_rushing_touchdowns",
        display_name="Passing+Rushing TDs",
        features=[
            FeatureDefinition("passing_attempts", "passing_attempts", DataScope.PLAYER),
            FeatureDefinition("completions", "completions", DataScope.PLAYER),
            FeatureDefinition("passing_yards", "passing_yards", DataScope.PLAYER),
            FeatureDefinition("rushing_attempts", "rushing_attempts", DataScope.PLAYER),
            FeatureDefinition("rushing_yards", "rushing_yards", DataScope.PLAYER),
            FeatureDefinition(
                "passing_touchdowns", "passing_touchdowns", DataScope.PLAYER
            ),
            FeatureDefinition(
                "rushing_touchdowns", "rushing_touchdowns", DataScope.PLAYER
            ),
            FeatureDefinition("passer_rating", "passer_rating", DataScope.PLAYER),
            FeatureDefinition(
                "opp_passing_touchdowns_allowed",
                "passing_touchdowns_allowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_rushing_touchdowns_allowed",
                "rushing_touchdowns_allowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_rushing_yards_allowed", "rushing_yards_allowed", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_football_stat
def completions_config() -> PropConfig:
    """Completions configuration"""
    return PropConfig(
        stat_name="completions",
        display_name="Completions",
        features=[
            FeatureDefinition("passing_attempts", "passing_attempts", DataScope.PLAYER),
            FeatureDefinition("passing_yards", "passing_yards", DataScope.PLAYER),
            FeatureDefinition("passer_rating", "passer_rating", DataScope.PLAYER),
            FeatureDefinition(
                "passing_touchdowns", "passing_touchdowns", DataScope.PLAYER
            ),
            FeatureDefinition(
                "opp_completions_allowed", "completions_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "passing_interceptions", "passing_interceptions", DataScope.PLAYER
            ),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_football_stat
def passing_attempts_config() -> PropConfig:
    """Passing Attempts configuration"""
    return PropConfig(
        stat_name="passing_attempts",
        display_name="Passing Attempts",
        features=[
            FeatureDefinition("completions", "completions", DataScope.PLAYER),
            FeatureDefinition("passing_yards", "passing_yards", DataScope.PLAYER),
            FeatureDefinition("passer_rating", "passer_rating", DataScope.PLAYER),
            FeatureDefinition(
                "passing_touchdowns", "passing_touchdowns", DataScope.PLAYER
            ),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_completions_allowed", "completions_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "passing_interceptions", "passing_interceptions", DataScope.PLAYER
            ),
            FeatureDefinition("team_first_downs", "first_downs", DataScope.TEAM),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_football_stat
def rushing_attempts_config() -> PropConfig:
    """Rushing Attempts configuration"""
    return PropConfig(
        stat_name="rushing_attempts",
        display_name="Rushing Attempts",
        features=[
            FeatureDefinition("rushing_yards", "rushing_yards", DataScope.PLAYER),
            FeatureDefinition("rushing_long", "rushing_long", DataScope.PLAYER),
            FeatureDefinition(
                "rushing_touchdowns", "rushing_touchdowns", DataScope.PLAYER
            ),
            FeatureDefinition(
                "opp_rushing_yards_allowed", "rushing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_rushing_touchdowns_allowed",
                "rushing_touchdowns_allowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition("team_rushing_yards", "rushing_yards", DataScope.TEAM),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_football_stat
def rushing_long_config() -> PropConfig:
    """Rushing Long configuration"""
    return PropConfig(
        stat_name="rushing_long",
        display_name="Rushing Long",
        features=[
            FeatureDefinition("rushing_attempts", "rushing_attempts", DataScope.PLAYER),
            FeatureDefinition("rushing_yards", "rushing_yards", DataScope.PLAYER),
            FeatureDefinition(
                "rushing_touchdowns", "rushing_touchdowns", DataScope.PLAYER
            ),
            FeatureDefinition(
                "opp_rushing_yards_allowed", "rushing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition("team_rushing_yards", "rushing_yards", DataScope.TEAM),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_football_stat
def receiving_long_config() -> PropConfig:
    """Receiving Long configuration"""
    return PropConfig(
        stat_name="receiving_long",
        display_name="Receiving Long",
        features=[
            FeatureDefinition("receptions", "receptions", DataScope.PLAYER),
            FeatureDefinition("receiving_yards", "receiving_yards", DataScope.PLAYER),
            FeatureDefinition(
                "receiving_touchdowns", "receiving_touchdowns", DataScope.PLAYER
            ),
            FeatureDefinition("passing_yards", "passing_yards", DataScope.TEAM),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_completions_allowed", "completions_allowed", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_football_stat
def receptions_config() -> PropConfig:
    """Receptions configuration"""
    return PropConfig(
        stat_name="receptions",
        display_name="Receptions",
        features=[
            FeatureDefinition("receiving_yards", "receiving_yards", DataScope.PLAYER),
            FeatureDefinition(
                "receiving_touchdowns", "receiving_touchdowns", DataScope.PLAYER
            ),
            FeatureDefinition("passing_yards", "passing_yards", DataScope.TEAM),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passing_yards_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_completions_allowed", "completions_allowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_passing_touchdowns_allowed",
                "passing_touchdowns_allowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "passing_touchdowns", "passing_touchdowns", DataScope.TEAM
            ),
            FeatureDefinition("team_first_downs", "first_downs", DataScope.TEAM),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


def get_football_prop_configs() -> dict[str, PropConfig]:
    """Get all football prop configurations (auto-generated from registered stats)"""
    return football_registry.get_configs()


def get_football_stats_list() -> list[str]:
    """Get list of all football stats (auto-generated from registered stats)"""
    return football_registry.get_stats_list()


# Validate all configurations at import time
football_registry.validate_all_configs()
