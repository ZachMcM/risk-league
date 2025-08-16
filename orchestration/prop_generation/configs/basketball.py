"""
Basketball Prop Configurations using Auto-Registration System

Example:
@register_basketball_stat
def fgm_config() -> PropConfig:
    return PropConfig(...)
"""

from prop_generation.generator.base import DataScope, FeatureDefinition, ModelType, PropConfig
from prop_generation.generator.registry import basketball_registry, register_basketball_stat


@register_basketball_stat
def points_config() -> PropConfig:
    """Points configuration"""
    return PropConfig(
        stat_name="points",
        target_field="points",
        display_name="Points",
        features=[
            FeatureDefinition("minutes", "minutes", DataScope.PLAYER),
            FeatureDefinition(
                "field_goals_attempted", "fieldGoalsAttempted", DataScope.PLAYER
            ),
            FeatureDefinition(
                "three_points_attempted", "threePointsAttempted", DataScope.PLAYER
            ),
            FeatureDefinition("field_goals_made", "fieldGoalsMade", DataScope.PLAYER),
            FeatureDefinition("three_points_made", "threePointsMade", DataScope.PLAYER),
            FeatureDefinition("true_shooting_pct", "trueShootingPct", DataScope.PLAYER),
            FeatureDefinition("pace", "pace", DataScope.TEAM),
            FeatureDefinition("usage_rate", "usageRate", DataScope.PLAYER),
            FeatureDefinition(
                "opp_defensive_rating", "defensiveRating", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "team_offensive_rating", "offensiveRating", DataScope.TEAM
            ),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_basketball_stat
def rebounds_config() -> PropConfig:
    """Rebounds configuration"""
    return PropConfig(
        stat_name="rebounds",
        target_field="rebounds",
        display_name="Rebounds",
        features=[
            FeatureDefinition("minutes", "minutes", DataScope.PLAYER),
            FeatureDefinition("rebounds_pct", "reboundsPct", DataScope.PLAYER),
            FeatureDefinition(
                "opp_field_goals_made", "fieldGoalsMade", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "team_field_goals_made", "fieldGoalsMade", DataScope.TEAM
            ),
            FeatureDefinition("pace", "pace", DataScope.TEAM),
            FeatureDefinition("opp_pace", "pace", DataScope.OPPONENT),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_basketball_stat
def assists_config() -> PropConfig:
    """Assists configuration"""
    return PropConfig(
        stat_name="assists",
        target_field="assists",
        display_name="Assists",
        features=[
            FeatureDefinition("minutes", "minutes", DataScope.PLAYER),
            FeatureDefinition("assists_pct", "assistsPct", DataScope.PLAYER),
            FeatureDefinition(
                "team_field_goals_made", "fieldGoalsMade", DataScope.TEAM
            ),
            FeatureDefinition("usage_rate", "usageRate", DataScope.PLAYER),
            FeatureDefinition(
                "team_offensive_rating", "offensiveRating", DataScope.TEAM
            ),
            FeatureDefinition(
                "opp_defensive_rating", "defensiveRating", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_basketball_stat
def three_pointers_made_config() -> PropConfig:
    """Three pointers made configuration"""
    return PropConfig(
        stat_name="three_pointers_made",
        target_field="threePointersMade",
        display_name="Three Pointers Made",
        features=[
            FeatureDefinition("minutes", "minutes", DataScope.PLAYER),
            FeatureDefinition(
                "team_offensive_rating", "offensiveRating", DataScope.TEAM
            ),
            FeatureDefinition("pace", "pace", DataScope.TEAM),
            FeatureDefinition(
                "opp_defensive_rating", "defensiveRating", DataScope.OPPONENT
            ),
            FeatureDefinition("usage_rate", "usageRate", DataScope.PLAYER),
            FeatureDefinition(
                "three_pointers_attempted", "threePointersAttempted", DataScope.PLAYER
            ),
            FeatureDefinition("three_pct", "threePct", DataScope.PLAYER),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_basketball_stat
def blocks_config() -> PropConfig:
    """Blocks configuration"""
    return PropConfig(
        stat_name="blocks",
        target_field="blocks",
        display_name="Blocks",
        features=[
            FeatureDefinition("minutes", "minutes", DataScope.PLAYER),
            FeatureDefinition("blocks_pct", "blocksPct", DataScope.PLAYER),
            FeatureDefinition("opp_pace", "pace", DataScope.OPPONENT),
            FeatureDefinition(
                "opp_offensive_rating", "offensiveRating", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "team_defensive_rating", "defensiveRating", DataScope.TEAM
            ),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_basketball_stat
def steals_config() -> PropConfig:
    """Steals configuration"""
    return PropConfig(
        stat_name="steals",
        target_field="steals",
        display_name="Steals",
        features=[
            FeatureDefinition("minutes", "minutes", DataScope.PLAYER),
            FeatureDefinition(
                "team_defensive_rating", "defensiveRating", DataScope.TEAM
            ),
            FeatureDefinition(
                "opp_offensive_rating", "offensiveRating", DataScope.OPPONENT
            ),
            FeatureDefinition("opp_pace", "pace", DataScope.OPPONENT),
            FeatureDefinition("steals_pct", "stealsPct", DataScope.PLAYER),
            FeatureDefinition("opp_turnovers", "turnovers", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_basketball_stat
def turnovers_config() -> PropConfig:
    """Turnovers configuration"""
    return PropConfig(
        stat_name="turnovers",
        target_field="turnovers",
        display_name="Turnovers",
        features=[
            FeatureDefinition("minutes", "minutes", DataScope.PLAYER),
            FeatureDefinition("usage_rate", "usageRate", DataScope.PLAYER),
            FeatureDefinition(
                "team_offensive_rating", "offensiveRating", DataScope.TEAM
            ),
            FeatureDefinition(
                "opp_defensive_rating", "defensiveRating", DataScope.OPPONENT
            ),
            FeatureDefinition("opp_steals", "steals", DataScope.OPPONENT),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_basketball_stat
def points_rebounds_assists_config() -> PropConfig:
    """Pts+Rebs+Asts configuration"""
    return PropConfig(
        stat_name="points_rebounds_assists",
        target_field="pointsReboundsAssists",
        display_name="Pts+Rebs+Asts",
        features=[
            FeatureDefinition("minutes", "minutes", DataScope.PLAYER),
            FeatureDefinition("rebounds_pct", "reboundsPct", DataScope.PLAYER),
            FeatureDefinition("assists_pct", "assistsPct", DataScope.PLAYER),
            FeatureDefinition(
                "opp_field_goals_made", "fieldGoalsMade", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "field_goals_attempted", "fieldGoalsAttempted", DataScope.PLAYER
            ),
            FeatureDefinition(
                "three_points_attempted", "threePointsAttempted", DataScope.PLAYER
            ),
            FeatureDefinition(
                "team_field_goals_made", "fieldGoalsMade", DataScope.TEAM
            ),
            FeatureDefinition("pace", "pace", DataScope.TEAM),
            FeatureDefinition("opp_pace", "pace", DataScope.OPPONENT),
            FeatureDefinition(
                "team_offensive_rating", "offensiveRating", DataScope.TEAM
            ),
            FeatureDefinition("field_goals_made", "fieldGoalsMade", DataScope.PLAYER),
            FeatureDefinition("three_points_made", "threePointsMade", DataScope.PLAYER),
            FeatureDefinition("true_shooting", "trueShootingPct", DataScope.PLAYER),
            FeatureDefinition("usage_rate", "usageRate", DataScope.PLAYER),
            FeatureDefinition(
                "opp_defensive_rating", "defensiveRating", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_basketball_stat
def points_rebounds_config() -> PropConfig:
    """Pts+Rebs configuration"""
    return PropConfig(
        stat_name="points_rebounds",
        target_field="pointsRebounds",
        display_name="Pts+Rebs",
        features=[
            FeatureDefinition("minutes", "minutes", DataScope.PLAYER),
            FeatureDefinition("rebounds_pct", "reboundsPct", DataScope.PLAYER),
            FeatureDefinition(
                "opp_field_goals_made", "fieldGoalsMade", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "field_goals_attempted", "fieldGoalsAttempted", DataScope.PLAYER
            ),
            FeatureDefinition(
                "three_points_attempted", "threePointsAttempted", DataScope.PLAYER
            ),
            FeatureDefinition(
                "team_field_goals_made", "fieldGoalsMade", DataScope.TEAM
            ),
            FeatureDefinition("pace", "pace", DataScope.TEAM),
            FeatureDefinition("opp_pace", "pace", DataScope.OPPONENT),
            FeatureDefinition(
                "team_offensive_rating", "offensiveRating", DataScope.TEAM
            ),
            FeatureDefinition("field_goals_made", "fieldGoalsMade", DataScope.PLAYER),
            FeatureDefinition("three_points_made", "threePointsMade", DataScope.PLAYER),
            FeatureDefinition("true_shooting", "trueShootingPct", DataScope.PLAYER),
            FeatureDefinition("usage_rate", "usageRate", DataScope.PLAYER),
            FeatureDefinition(
                "opp_defensive_rating", "defensiveRating", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_basketball_stat
def points_assists_config() -> PropConfig:
    """Pts+Asts configuration"""
    return PropConfig(
        stat_name="points_assists",
        target_field="pointsAssists",
        display_name="Pts+Asts",
        features=[
            FeatureDefinition("minutes", "minutes", DataScope.PLAYER),
            FeatureDefinition("rebounds_pct", "reboundsPct", DataScope.PLAYER),
            FeatureDefinition(
                "field_goals_attempted", "fieldGoalsAttempted", DataScope.PLAYER
            ),
            FeatureDefinition(
                "three_points_attempted", "threePointsAttempted", DataScope.PLAYER
            ),
            FeatureDefinition(
                "team_field_goals_made", "fieldGoalsMade", DataScope.TEAM
            ),
            FeatureDefinition("pace", "pace", DataScope.TEAM),
            FeatureDefinition("opp_pace", "pace", DataScope.OPPONENT),
            FeatureDefinition(
                "team_offensive_rating", "offensiveRating", DataScope.TEAM
            ),
            FeatureDefinition("assists_pct", "assistsPct", DataScope.PLAYER),
            FeatureDefinition("field_goals_made", "fieldGoalsMade", DataScope.PLAYER),
            FeatureDefinition("three_points_made", "threePointsMade", DataScope.PLAYER),
            FeatureDefinition("true_shooting", "trueShootingPct", DataScope.PLAYER),
            FeatureDefinition("usage_rate", "usageRate", DataScope.PLAYER),
            FeatureDefinition(
                "opp_defensive_rating", "defensiveRating", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_basketball_stat
def rebounds_assists_config() -> PropConfig:
    """Rebs+Asts configuration"""
    return PropConfig(
        stat_name="rebounds_assists",
        target_field="reboundsAssists",
        display_name="Rebs+Asts",
        features=[
            FeatureDefinition("minutes", "minutes", DataScope.PLAYER),
            FeatureDefinition("rebounds_pct", "reboundsPct", DataScope.PLAYER),
            FeatureDefinition(
                "team_field_goals_made", "fieldGoalsMade", DataScope.TEAM
            ),
            FeatureDefinition("pace", "pace", DataScope.TEAM),
            FeatureDefinition("opp_pace", "pace", DataScope.OPPONENT),
            FeatureDefinition(
                "team_offensive_rating", "offensiveRating", DataScope.TEAM
            ),
            FeatureDefinition("usage_rate", "usageRate", DataScope.PLAYER),
            FeatureDefinition(
                "opp_defensive_rating", "defensiveRating", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


def get_basketball_prop_configs() -> dict[str, PropConfig]:
    """Get all basketball prop configurations (auto-generated from registered stats)"""
    return basketball_registry.get_configs()


def get_basketball_stats_list() -> list[str]:
    """Get list of all basketball stats (auto-generated from registered stats)"""
    return basketball_registry.get_stats_list()


# Validate all configurations at import time
basketball_registry.validate_all_configs()
