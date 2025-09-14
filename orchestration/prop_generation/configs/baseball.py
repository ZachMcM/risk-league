"""
Baseball Prop Configurations using Auto-Registration System

Example:
@register_baseball_stat
def walks_config() -> PropConfig:
    return PropConfig(...)
"""

from prop_generation.generator.base import (
    DataScope,
    FeatureDefinition,
    ModelType,
    PropConfig,
)
from prop_generation.generator.registry import register_baseball_stat, baseball_registry


ELIGIBILITY_THRESHOLDS = {
    "stolen_bases": 1.5,
    "at_bats": 1.5
}

SAMPLE_SIZE = 20

MIN_LINE_FOR_UNDER = 5

PITCHING_STATS = [
    "pitching_strikeouts",
    "pitches_thrown",
    "earned_runs",
    "hits_allowed",
    "pitching_walks",
]
BATTING_STATS = [
    "home_runs",
    "doubles",
    "triples",
    "hits",
    "rbis",
    "strikeouts",
    "runs",
    "hits_runs_rbis",
    "stolen_bases",
]


@register_baseball_stat
def home_runs_config() -> PropConfig:
    """Home runs configuration"""
    return PropConfig(
        stat_name="home_runs",
        display_name="Home Runs",
        features=[
            FeatureDefinition("at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", DataScope.PLAYER),
            FeatureDefinition("batting_avg", DataScope.PLAYER),
            FeatureDefinition("home_runs_allowed", DataScope.OPPONENT),
            FeatureDefinition("pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("pitching_walks", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def doubles_config() -> PropConfig:
    """Doubles configuration"""
    return PropConfig(
        stat_name="doubles",
        display_name="Doubles",
        features=[
            FeatureDefinition("hits", DataScope.PLAYER),
            FeatureDefinition("at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", DataScope.PLAYER),
            FeatureDefinition("batting_avg", DataScope.PLAYER),
            FeatureDefinition("doubles_allowed", DataScope.OPPONENT),
            FeatureDefinition("pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("pitching_walks", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def hits_config() -> PropConfig:
    """Hits configuration"""
    return PropConfig(
        stat_name="hits",
        display_name="Hits",
        features=[
            FeatureDefinition("at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", DataScope.PLAYER),
            FeatureDefinition("batting_avg", DataScope.PLAYER),
            FeatureDefinition("hits_allowed", DataScope.OPPONENT),
            FeatureDefinition("pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("pitching_walks", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def triples_config() -> PropConfig:
    """Triples configuration"""
    return PropConfig(
        stat_name="triples",
        display_name="Triples",
        features=[
            FeatureDefinition("hits", DataScope.PLAYER),
            FeatureDefinition("at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", DataScope.PLAYER),
            FeatureDefinition("batting_avg", DataScope.PLAYER),
            FeatureDefinition("triples_allowed", DataScope.OPPONENT),
            FeatureDefinition("pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("pitching_walks", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def rbis_config() -> PropConfig:
    """RBI configuration"""
    return PropConfig(
        stat_name="rbis",
        display_name="RBIs",
        features=[
            FeatureDefinition("hits", DataScope.PLAYER),
            FeatureDefinition("home_runs", DataScope.PLAYER),
            FeatureDefinition("at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", DataScope.PLAYER),
            FeatureDefinition("runs", DataScope.TEAM),
            FeatureDefinition("pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("pitching_walks", DataScope.OPPONENT),
            FeatureDefinition("runs_allowed", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def strikeouts_config() -> PropConfig:
    """Batting Strikeouts configuration"""
    return PropConfig(
        stat_name="strikeouts",
        display_name="Batting Strikeouts",
        features=[
            FeatureDefinition("at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", DataScope.PLAYER),
            FeatureDefinition("pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("strikes", DataScope.OPPONENT),
            FeatureDefinition("pitches_thrown", DataScope.OPPONENT),
            FeatureDefinition("hits_allowed", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def pitching_strikeouts_config() -> PropConfig:
    """Pitching Strikeouts configuration"""
    return PropConfig(
        stat_name="pitching_strikeouts",
        display_name="Pitching Strikeouts",
        features=[
            FeatureDefinition("innings_pitched", DataScope.PLAYER),
            FeatureDefinition("pitches_thrown", DataScope.PLAYER),
            FeatureDefinition("strikes", DataScope.PLAYER),
            FeatureDefinition("strikeouts", DataScope.OPPONENT),
            FeatureDefinition("batting_avg", DataScope.OPPONENT),
            FeatureDefinition("slugging_pct", DataScope.OPPONENT)
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def pitches_thrown_config() -> PropConfig:
    """Pitches thrown configuration"""
    return PropConfig(
        stat_name="pitches_thrown",
        display_name="Pitches Thrown",
        features=[
            FeatureDefinition("innings_pitched", DataScope.PLAYER),
            FeatureDefinition("pitching_strikeouts", DataScope.PLAYER),
            FeatureDefinition("strikes", DataScope.PLAYER),
            FeatureDefinition("pitching_walks", DataScope.PLAYER),
            FeatureDefinition("hits_allowed", DataScope.PLAYER),
            FeatureDefinition("ops", DataScope.OPPONENT),
            FeatureDefinition("runs", DataScope.OPPONENT),
            FeatureDefinition("strikeouts", DataScope.OPPONENT),
            FeatureDefinition("batting_avg", DataScope.OPPONENT),
            FeatureDefinition("slugging_pct", DataScope.OPPONENT)
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def earned_runs_config() -> PropConfig:
    """Earned runs configuration"""
    return PropConfig(
        stat_name="earned_runs",
        display_name="Earned Runs",
        features=[
            FeatureDefinition("innings_pitched", DataScope.PLAYER),
            FeatureDefinition("hits_allowed", DataScope.PLAYER),
            FeatureDefinition("pitching_walks", DataScope.PLAYER),
            FeatureDefinition("home_runs_allowed", DataScope.PLAYER),
            FeatureDefinition("runs", DataScope.OPPONENT),
            FeatureDefinition("ops", DataScope.OPPONENT),
            FeatureDefinition("strikeouts", DataScope.OPPONENT),
            FeatureDefinition("batting_avg", DataScope.OPPONENT),
            FeatureDefinition("slugging_pct", DataScope.OPPONENT)
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def hits_allowed_config() -> PropConfig:
    """Hits Allowed configuration"""
    return PropConfig(
        stat_name="hits_allowed",
        display_name="Hits Allowed",
        features=[
            FeatureDefinition("innings_pitched", DataScope.PLAYER),
            FeatureDefinition("pitches_thrown", DataScope.PLAYER),
            FeatureDefinition("pitching_strikeouts", DataScope.PLAYER),
            FeatureDefinition("batting_avg", DataScope.OPPONENT),
            FeatureDefinition("slugging_pct", DataScope.OPPONENT),
            FeatureDefinition("strikeouts", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def pitching_walks_config() -> PropConfig:
    """Pitching walks configuration"""
    return PropConfig(
        stat_name="pitching_walks",
        display_name="Pitching Walks",
        features=[
            FeatureDefinition("innings_pitched", DataScope.PLAYER),
            FeatureDefinition("pitches_thrown", DataScope.PLAYER),
            FeatureDefinition("walks", DataScope.OPPONENT),
            FeatureDefinition("obp", DataScope.OPPONENT)
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def runs_config() -> PropConfig:
    """Runs configuration"""
    return PropConfig(
        stat_name="runs",
        display_name="Runs",
        features=[
            FeatureDefinition("at_bats", DataScope.PLAYER),
            FeatureDefinition("hits", DataScope.PLAYER),
            FeatureDefinition("home_runs", DataScope.PLAYER),
            FeatureDefinition("ops", DataScope.PLAYER),
            FeatureDefinition("batting_avg", DataScope.PLAYER),
            FeatureDefinition("hits_allowed", DataScope.OPPONENT),
            FeatureDefinition("pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("pitching_walks", DataScope.OPPONENT),
            FeatureDefinition("runs_allowed", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def hits_runs_rbis_config() -> PropConfig:
    """Hits+Runs+ RBIs configuration"""
    return PropConfig(
        stat_name="hits_runs_rbis",
        display_name="Hits+Runs+RBIs",
        features=[
            FeatureDefinition("at_bats", DataScope.PLAYER),
            FeatureDefinition("hits", DataScope.PLAYER),
            FeatureDefinition("ops", DataScope.PLAYER),
            FeatureDefinition("batting_avg", DataScope.PLAYER),
            FeatureDefinition("hits_allowed", DataScope.OPPONENT),
            FeatureDefinition("pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("pitching_walks", DataScope.OPPONENT),
            FeatureDefinition("runs_allowed", DataScope.OPPONENT),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1},
    )


@register_baseball_stat
def stolen_bases_config() -> PropConfig:
    """Stolen bases configuration"""
    return PropConfig(
        stat_name="stolen_bases",
        display_name="Stolen Bases",
        features=[
            FeatureDefinition("walks", DataScope.PLAYER),
            FeatureDefinition("hits", DataScope.PLAYER),
            FeatureDefinition("at_bats", DataScope.PLAYER),
            FeatureDefinition("caught_stealing", DataScope.PLAYER),
            FeatureDefinition("obp", DataScope.PLAYER),
            FeatureDefinition("pitching_caught_stealing", DataScope.OPPONENT),
            FeatureDefinition("stolen_bases_allowed", DataScope.OPPONENT),
            FeatureDefinition("earned_runs", DataScope.OPPONENT),
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