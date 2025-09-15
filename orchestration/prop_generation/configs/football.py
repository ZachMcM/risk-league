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
    },
    "RB": {
        "rushing_yards": 0.4,  # Primary and backup RBs
        "rushing_touchdowns": 0.3,  # TDs are less frequent
        "receiving_yards": 0.2,  # Pass-catching RBs
    },
    "WR": {
        "receiving_yards": 0.3,  # WR1, WR2, some WR3s
        "receiving_touchdowns": 0.2,  # TDs are less frequent
        "receiving_rushing_touchdowns": 0.2,
    },
    "TE": {
        "receiving_yards": 0.25,  # Pass-catching TEs
        "receiving_touchdowns": 0.2,
        "receiving_rushing_touchdowns": 0.2,
    },
    "K": {
        "field_goals_made": 0.5,  # Most active kickers
    },
    "PK": {
        "field_goals_made": 0.5,  # Most active kickers
    },
}

SAMPLE_SIZE = 5
MIN_LINE_FOR_UNDER = 10


@register_football_stat
def passing_yards_config() -> PropConfig:
    """Passing Yards configuration"""
    return PropConfig(
        stat_name="passing_yards",
        display_name="Passing Yards",
        features=[
            FeatureDefinition("completions", "completions", DataScope.PLAYER),
            FeatureDefinition("passing_attempts", "passingAttempts", DataScope.PLAYER),
            FeatureDefinition("passer_rating", "passerRating", DataScope.PLAYER),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passingYardsAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_completions_allowed", "completionsAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "passing_touchdowns", "passingTouchdowns", DataScope.PLAYER
            ),
            FeatureDefinition(
                "opp_passing_touchdowns_allowed",
                "passingTouchdownsAllowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition("team_first_downs", "firstDowns", DataScope.TEAM),
            FeatureDefinition(
                "passing_interceptions", "passingInterceptions", DataScope.PLAYER
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
                "receiving_touchdowns", "receivingTouchdowns", DataScope.PLAYER
            ),
            FeatureDefinition("passing_yards", "passingYards", DataScope.TEAM),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passingYardsAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_completions_allowed", "completionsAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_passing_touchdowns_allowed",
                "passingTouchdownsAllowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "passing_touchdowns", "passingTouchdowns", DataScope.TEAM
            ),
            FeatureDefinition("team_first_downs", "firstDowns", DataScope.TEAM),
            FeatureDefinition(
                "passing_interceptions", "passingInterceptions", DataScope.PLAYER
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
            FeatureDefinition("rushing_long", "rushingLong", DataScope.PLAYER),
            FeatureDefinition("rushing_attempts", "rushingAttempts", DataScope.PLAYER),
            FeatureDefinition(
                "opp_rushing_yards_allowed", "rushingYardsAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_rushing_touchdowns_allowed",
                "rushingTouchdownsAllowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "rushing_touchdowns", "rushingTouchdowns", DataScope.PLAYER
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
            FeatureDefinition("team_total_yards", "totalYards", DataScope.TEAM),
            FeatureDefinition("opp_blocked_kicks", "blockedKicks", DataScope.OPPONENT),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passingYardsAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_rushing_yards_allowed", "rushingYardsAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "field_goals_attempted", "fieldGoalsAttempted", DataScope.PLAYER
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
            FeatureDefinition("receiving_yards", "receivingYards", DataScope.PLAYER),
            FeatureDefinition("team_passing_yards", "passingYards", DataScope.TEAM),
            FeatureDefinition(
                "team_passing_touchdowns", "passingTouchdowns", DataScope.TEAM
            ),
            FeatureDefinition(
                "opp_passing_touchdowns_allowed",
                "passingTouchdownsAllowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passingYardsAllowed", DataScope.OPPONENT
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
            FeatureDefinition("passing_yards", "passingYards", DataScope.PLAYER),
            FeatureDefinition("passing_attempts", "passingAttempts", DataScope.PLAYER),
            FeatureDefinition("passer_rating", "passerRating", DataScope.PLAYER),
            FeatureDefinition(
                "opp_passing_touchdowns_allowed",
                "passingTouchdownsAllowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passingYardsAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "passing_interceptions", "passingInterceptions", DataScope.PLAYER
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
            FeatureDefinition("passing_attempts", "passingAttempts", DataScope.PLAYER),
            FeatureDefinition("completions", "completions", DataScope.PLAYER),
            FeatureDefinition("passer_rating", "passerRating", DataScope.PLAYER),
            FeatureDefinition(
                "opp_defense_interceptions",
                "defenseInterceptions",
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
            FeatureDefinition("rushing_attempts", "rushingAttempts", DataScope.PLAYER),
            FeatureDefinition("rushing_yards", "rushingYards", DataScope.PLAYER),
            FeatureDefinition("rushing_long", "rushingLong", DataScope.PLAYER),
            FeatureDefinition(
                "opp_rushing_touchdowns_allowed",
                "rushingTouchdownsAllowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_rushing_yards_allowed", "rushingYardsAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition("team_rushing_yards", "rushingYards", DataScope.TEAM),
            FeatureDefinition(
                "team_rushing_touchdowns", "rushingTouchdowns", DataScope.TEAM
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
            FeatureDefinition("rushing_attempts", "rushingAttempts", DataScope.PLAYER),
            FeatureDefinition("rushing_yards", "rushingYards", DataScope.PLAYER),
            FeatureDefinition("receptions", "receptions", DataScope.PLAYER),
            FeatureDefinition("receiving_yards", "receivingYards", DataScope.PLAYER),
            FeatureDefinition(
                "rushing_touchdowns", "rushingTouchdowns", DataScope.PLAYER
            ),
            FeatureDefinition(
                "receiving_touchdowns", "receivingTouchdowns", DataScope.PLAYER
            ),
            FeatureDefinition(
                "opp_rushing_touchdowns_allowed",
                "rushingTouchdownsAllowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_passing_touchdowns_allowed",
                "passingTouchdownsAllowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_rushing_yards_allowed", "rushingYardsAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passingYardsAllowed", DataScope.OPPONENT
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
            FeatureDefinition("passing_attempts", "passingAttempts", DataScope.PLAYER),
            FeatureDefinition("completions", "completions", DataScope.PLAYER),
            FeatureDefinition("passing_yards", "passingYards", DataScope.PLAYER),
            FeatureDefinition("rushing_attempts", "rushingAttempts", DataScope.PLAYER),
            FeatureDefinition("rushing_yards", "rushingYards", DataScope.PLAYER),
            FeatureDefinition(
                "passing_touchdowns", "passingTouchdowns", DataScope.PLAYER
            ),
            FeatureDefinition(
                "rushing_touchdowns", "rushingTouchdowns", DataScope.PLAYER
            ),
            FeatureDefinition("passer_rating", "passerRating", DataScope.PLAYER),
            FeatureDefinition(
                "opp_passing_touchdowns_allowed",
                "passingTouchdownsAllowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_rushing_touchdowns_allowed",
                "rushingTouchdownsAllowed",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_passing_yards_allowed", "passingYardsAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_rushing_yards_allowed", "rushingYardsAllowed", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.POISSON,
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
