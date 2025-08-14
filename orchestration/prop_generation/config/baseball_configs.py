"""
Baseball Prop Configurations using Auto-Registration System

To add a new stat:
1. Just add a function with @register_baseball_stat decorator
2. That's it! No need to update stats_arr or types manually

Example:
@register_baseball_stat
def walks_config() -> PropConfig:
    return PropConfig(...)
"""

from generator.base import (
    DataScope,
    FeatureDefinition,
    ModelType,
    PropConfig,
)
from generator.registry import register_baseball_stat, baseball_registry


@register_baseball_stat
def home_runs_config() -> PropConfig:
    """Home runs configuration"""
    return PropConfig(
        stat_name="home_runs",
        target_field="homeRuns",
        display_name="Home Runs",
        features=[
            FeatureDefinition("at_bats", "atBats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "sluggingPct", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "battingAvg", DataScope.PLAYER),
            FeatureDefinition(
                "opp_home_runs_allowed", "homeRunsAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_pitching_strikeouts",
                "pitchingStrikeouts",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_pitching_walks", "pitchingWalks", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def doubles_config() -> PropConfig:
    """Doubles configuration"""
    return PropConfig(
        stat_name="doubles",
        target_field="doubles",
        display_name="Doubles",
        features=[
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("at_bats", "atBats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "sluggingPct", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "battingAvg", DataScope.PLAYER),
            FeatureDefinition(
                "opp_doubles_allowed", "doublesAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_pitching_strikeouts",
                "pitchingStrikeouts",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_pitching_walks", "pitchingWalks", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def hits_config() -> PropConfig:
    """Hits configuration"""
    return PropConfig(
        stat_name="hits",
        target_field="hits",
        display_name="Hits",
        features=[
            FeatureDefinition("at_bats", "atBats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "sluggingPct", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "battingAvg", DataScope.PLAYER),
            FeatureDefinition("opp_hits_allowed", "hitsAllowed", DataScope.OPPONENT),
            FeatureDefinition(
                "opp_pitching_strikeouts",
                "pitchingStrikeouts",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_pitching_walks", "pitchingWalks", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def triples_config() -> PropConfig:
    """Triples configuration"""
    return PropConfig(
        stat_name="triples",
        target_field="triples",
        display_name="Triples",
        features=[
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("at_bats", "atBats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "sluggingPct", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "battingAvg", DataScope.PLAYER),
            FeatureDefinition(
                "opp_triples_allowed", "triplesAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition(
                "opp_pitching_strikeouts",
                "pitchingStrikeouts",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_pitching_walks", "pitchingWalks", DataScope.OPPONENT
            ),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def rbis_config() -> PropConfig:
    """RBI configuration"""
    return PropConfig(
        stat_name="rbis",
        target_field="rbis",
        display_name="RBIs",
        features=[
            FeatureDefinition("at_bats", "atBats", DataScope.PLAYER),
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("home_runs", "homeRuns", DataScope.PLAYER),
            FeatureDefinition("at_bats", "atBats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "sluggingPct", DataScope.PLAYER),
            FeatureDefinition("team_runs", "runs", DataScope.TEAM),
            FeatureDefinition(
                "opp_pitching_strikeouts",
                "pitchingStrikeouts",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_pitching_walks", "pitchingWalks", DataScope.OPPONENT
            ),
            FeatureDefinition("opp_runs_allowed", "runsAllowed", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def strikeouts_config() -> PropConfig:
    """Strikeouts (batter) configuration"""
    return PropConfig(
        stat_name="strikeouts",
        target_field="strikeouts",
        display_name="Strikeouts",
        features=[
            FeatureDefinition("at_bats", "atBats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "sluggingPct", DataScope.PLAYER),
            FeatureDefinition(
                "opp_pitching_strikeouts",
                "pitchingStrikeouts",
                DataScope.OPPONENT,
            ),
            FeatureDefinition("opp_strikes", "strikes", DataScope.OPPONENT),
            FeatureDefinition(
                "opp_pitches_thrown", "pitchesThrown", DataScope.OPPONENT
            ),
            FeatureDefinition("opp_hits_allowed", "hitsAllowed", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def pitching_strikeouts_config() -> PropConfig:
    """Pitching strikeouts configuration"""
    return PropConfig(
        stat_name="pitching_strikeouts",
        target_field="pitchingStrikeouts",
        display_name="Pitching Strikeouts",
        features=[
            FeatureDefinition("innings_pitched", "inningsPitched", DataScope.PLAYER),
            FeatureDefinition("pitches_thrown", "pitchesThrown", DataScope.PLAYER),
            FeatureDefinition("strikes", "strikes", DataScope.PLAYER),
            FeatureDefinition("opp_strikeouts", "strikeouts", DataScope.OPPONENT),
            FeatureDefinition("opp_batting_avg", "battingAvg", DataScope.OPPONENT),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def pitches_thrown_config() -> PropConfig:
    """Pitches thrown configuration"""
    return PropConfig(
        stat_name="pitches_thrown",
        target_field="pitchesThrown",
        display_name="Pitches Thrown",
        features=[
            FeatureDefinition("innings_pitched", "inningsPitched", DataScope.PLAYER),
            FeatureDefinition(
                "pitching_strikeouts", "pitchingStrikeouts", DataScope.PLAYER
            ),
            FeatureDefinition("strikes", "strikes", DataScope.PLAYER),
            FeatureDefinition("pitching_walks", "pitchingWalks", DataScope.PLAYER),
            FeatureDefinition("hits_allowed", "hitsAllowed", DataScope.PLAYER),
            FeatureDefinition("opp_ops", "ops", DataScope.OPPONENT),
            FeatureDefinition("opp_runs", "runs", DataScope.OPPONENT),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def earned_runs_config() -> PropConfig:
    """Earned runs configuration"""
    return PropConfig(
        stat_name="earned_runs",
        target_field="earnedRuns",
        display_name="Earned Runs",
        features=[
            FeatureDefinition("innings_pitched", "inningsPitched", DataScope.PLAYER),
            FeatureDefinition("hits_allowed", "hitsAllowed", DataScope.PLAYER),
            FeatureDefinition("pitching_walks", "pitchingWalks", DataScope.PLAYER),
            FeatureDefinition("home_runs_allowed", "homeRunsAllowed", DataScope.PLAYER),
            FeatureDefinition("opp_runs", "runs", DataScope.OPPONENT),
            FeatureDefinition("opp_ops", "ops", DataScope.OPPONENT),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def hits_allowed_config() -> PropConfig:
    """Pitching hits configuration"""
    return PropConfig(
        stat_name="hits_allowed",
        target_field="hits_allowed",
        display_name="Hits Allowed",
        features=[
            FeatureDefinition("innings_pitched", "inningsPitched", DataScope.PLAYER),
            FeatureDefinition("pitches_thrown", "pitchesThrown", DataScope.PLAYER),
            FeatureDefinition(
                "pitching_strikeouts", "pitchingStrikeouts", DataScope.PLAYER
            ),
            FeatureDefinition("opp_batting_avg", "battingAvg", DataScope.OPPONENT),
            FeatureDefinition("opp_slugging_pct", "sluggingPct", DataScope.OPPONENT),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def pitching_walks_config() -> PropConfig:
    """Pitching walks configuration"""
    return PropConfig(
        stat_name="pitching_walks",
        target_field="pitchingWalks",
        display_name="Pitching Walks",
        features=[
            FeatureDefinition("innings_pitched", "inningsPitched", DataScope.PLAYER),
            FeatureDefinition("pitches_thrown", "pitchesThrown", DataScope.PLAYER),
            FeatureDefinition("balls", "balls", DataScope.PLAYER),
            FeatureDefinition("opp_walks", "walks", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def runs_config() -> PropConfig:
    """Runs configuration"""
    return PropConfig(
        stat_name="runs",
        target_field="runs",
        display_name="Runs",
        features=[
            FeatureDefinition("at_bats", "atBats", DataScope.PLAYER),
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("home_runs", "homeRuns", DataScope.PLAYER),
            FeatureDefinition("ops", "ops", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "battingAvg", DataScope.PLAYER),
            FeatureDefinition("opp_hits_allowed", "hitsAllowed", DataScope.OPPONENT),
            FeatureDefinition(
                "opp_pitching_strikeouts",
                "pitchingStrikeouts",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_pitching_walks", "pitchingWalks", DataScope.OPPONENT
            ),
            FeatureDefinition("opp_runs_allowed", "runsAllowed", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def hits_runs__rbis_config() -> PropConfig:
    """Hits+Runs+ RBIs configuration"""
    return PropConfig(
        stat_name="hits_runs_rbis",
        target_field="hitsRunsRbis",
        display_name="Hits+Runs+RBIs",
        features=[
            FeatureDefinition("at_bats", "atBats", DataScope.PLAYER),
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("ops", "ops", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "battingAvg", DataScope.PLAYER),
            FeatureDefinition("opp_hits_allowed", "hitsAllowed", DataScope.OPPONENT),
            FeatureDefinition(
                "opp_pitching_strikeouts",
                "pitchingStrikeouts",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_pitching_walks", "pitchingWalks", DataScope.OPPONENT
            ),
            FeatureDefinition("opp_runs_allowed", "runsAllowed", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


def stolen_bases_config() -> PropConfig:
    """Stolen bases configuration"""
    return PropConfig(
        stat_name="stolen_bases",
        target_field="stolenBases",
        display_name="Stolen Bases",
        features=[
            FeatureDefinition("walks", "walks", DataScope.PLAYER),
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("at_bats", "atBats", DataScope.PLAYER),
            FeatureDefinition("caught_stealing", "caughtStealing", DataScope.PLAYER),
            FeatureDefinition("obp", "obp", DataScope.PLAYER),
            FeatureDefinition(
                "opp_pitching_caught_stealing",
                "pitchingCaughtStealing",
                DataScope.OPPONENT,
            ),
            FeatureDefinition(
                "opp_stolen_bases_allowed", "stolenBasesAllowed", DataScope.OPPONENT
            ),
            FeatureDefinition("opp_pickoffs", "pickoffs", DataScope.OPPONENT),
            FeatureDefinition("opp_earned_runs", "earnedRuns", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


def get_baseball_prop_configs() -> dict[str, PropConfig]:
    """Get all baseball prop configurations (auto-generated from registered stats)"""
    return baseball_registry.get_configs()


def get_baseball_stats_list() -> list[str]:
    """Get list of all baseball stats (auto-generated from registered stats)"""
    return baseball_registry.get_stats_list()


# Validate all configurations at import time
baseball_registry.validate_all_configs()
