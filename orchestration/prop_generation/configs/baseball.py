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

SAMPLE_SIZE = 40  # ~25% of season - captures opponent diversity and historical significance

MIN_LINE_FOR_UNDER = 4.5

# Exponential decay rate for recency weighting
# Higher values = stronger recency bias, lower effective sample size
# Recommended: 0.06 (effective sample ~22 games from the 40 game window)
DECAY_RATE = 0.06

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
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "slugging_pct", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "batting_avg", DataScope.PLAYER),
            FeatureDefinition("opp_home_runs_allowed", "home_runs_allowed", DataScope.OPPONENT),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("opp_pitching_walks", "pitching_walks", DataScope.OPPONENT),
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
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "slugging_pct", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "batting_avg", DataScope.PLAYER),
            FeatureDefinition("opp_doubles_allowed", "doubles_allowed", DataScope.OPPONENT),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("opp_pitching_walks", "pitching_walks", DataScope.OPPONENT),
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
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "slugging_pct", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "batting_avg", DataScope.PLAYER),
            FeatureDefinition("opp_hits_allowed", "hits_allowed", DataScope.OPPONENT),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("opp_pitching_walks", "pitching_walks", DataScope.OPPONENT),
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
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "slugging_pct", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "batting_avg", DataScope.PLAYER),
            FeatureDefinition("opp_triples_allowed", "triples_allowed", DataScope.OPPONENT),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("opp_pitching_walks", "pitching_walks", DataScope.OPPONENT),
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
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("home_runs", "home_runs", DataScope.PLAYER),
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "slugging_pct", DataScope.PLAYER),
            FeatureDefinition("team_runs", "runs", DataScope.TEAM),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("opp_pitching_walks", "pitching_walks", DataScope.OPPONENT),
            FeatureDefinition("opp_runs_allowed", "runs_allowed", DataScope.OPPONENT),
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
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "slugging_pct", DataScope.PLAYER),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("opp_strikes", "strikes", DataScope.OPPONENT),
            FeatureDefinition("opp_pitches_thrown", "pitches_thrown", DataScope.OPPONENT),
            FeatureDefinition("opp_hits_allowed", "hits_allowed", DataScope.OPPONENT),
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
            FeatureDefinition("innings_pitched", "innings_pitched", DataScope.PLAYER),
            FeatureDefinition("pitches_thrown", "pitches_thrown", DataScope.PLAYER),
            FeatureDefinition("strikes", "strikes", DataScope.PLAYER),
            FeatureDefinition("opp_strikeouts", "strikeouts", DataScope.OPPONENT),
            FeatureDefinition("opp_batting_avg", "batting_avg", DataScope.OPPONENT),
            FeatureDefinition("opp_slugging_pct", "slugging_pct", DataScope.OPPONENT)
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
            FeatureDefinition("innings_pitched", "innings_pitched", DataScope.PLAYER),
            FeatureDefinition("pitching_strikeouts", "pitching_strikeouts", DataScope.PLAYER),
            FeatureDefinition("strikes", "strikes", DataScope.PLAYER),
            FeatureDefinition("pitching_walks", "pitching_walks", DataScope.PLAYER),
            FeatureDefinition("hits_allowed", "hits_allowed", DataScope.PLAYER),
            FeatureDefinition("opp_ops", "ops", DataScope.OPPONENT),
            FeatureDefinition("opp_runs", "runs", DataScope.OPPONENT),
            FeatureDefinition("opp_strikeouts", "strikeouts", DataScope.OPPONENT),
            FeatureDefinition("opp_batting_avg", "batting_avg", DataScope.OPPONENT),
            FeatureDefinition("opp_slugging_pct", "slugging_pct", DataScope.OPPONENT)
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
            FeatureDefinition("innings_pitched", "innings_pitched", DataScope.PLAYER),
            FeatureDefinition("hits_allowed", "hits_allowed", DataScope.PLAYER),
            FeatureDefinition("pitching_walks", "pitching_walks", DataScope.PLAYER),
            FeatureDefinition("home_runs_allowed", "home_runs_allowed", DataScope.PLAYER),
            FeatureDefinition("opp_runs", "runs", DataScope.OPPONENT),
            FeatureDefinition("opp_ops", "ops", DataScope.OPPONENT),
            FeatureDefinition("opp_strikeouts", "strikeouts", DataScope.OPPONENT),
            FeatureDefinition("opp_batting_avg", "batting_avg", DataScope.OPPONENT),
            FeatureDefinition("opp_slugging_pct", "slugging_pct", DataScope.OPPONENT)
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
            FeatureDefinition("innings_pitched", "innings_pitched", DataScope.PLAYER),
            FeatureDefinition("pitches_thrown", "pitches_thrown", DataScope.PLAYER),
            FeatureDefinition("pitching_strikeouts", "pitching_strikeouts", DataScope.PLAYER),
            FeatureDefinition("opp_batting_avg", "batting_avg", DataScope.OPPONENT),
            FeatureDefinition("opp_slugging_pct", "slugging_pct", DataScope.OPPONENT),
            FeatureDefinition("opp_strikeouts", "strikeouts", DataScope.OPPONENT),
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
            FeatureDefinition("innings_pitched", "innings_pitched", DataScope.PLAYER),
            FeatureDefinition("pitches_thrown", "pitches_thrown", DataScope.PLAYER),
            FeatureDefinition("opp_walks", "walks", DataScope.OPPONENT),
            FeatureDefinition("opp_obp", "on_base_percentage", DataScope.OPPONENT)
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
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("home_runs", "home_runs", DataScope.PLAYER),
            FeatureDefinition("ops", "ops", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "batting_avg", DataScope.PLAYER),
            FeatureDefinition("opp_hits_allowed", "hits_allowed", DataScope.OPPONENT),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("opp_pitching_walks", "pitching_walks", DataScope.OPPONENT),
            FeatureDefinition("opp_runs_allowed", "runs_allowed", DataScope.OPPONENT),
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
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("ops", "ops", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "batting_avg", DataScope.PLAYER),
            FeatureDefinition("opp_hits_allowed", "hits_allowed", DataScope.OPPONENT),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT),
            FeatureDefinition("opp_pitching_walks", "pitching_walks", DataScope.OPPONENT),
            FeatureDefinition("opp_runs_allowed", "runs_allowed", DataScope.OPPONENT),
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
            FeatureDefinition("walks", "walks", DataScope.PLAYER),
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("caught_stealing", "caught_stealing", DataScope.PLAYER),
            FeatureDefinition("obp", "obp", DataScope.PLAYER),
            FeatureDefinition("opp_pitching_caught_stealing", "pitching_caught_stealing", DataScope.OPPONENT),
            FeatureDefinition("opp_stolen_bases_allowed", "stolen_bases_allowed", DataScope.OPPONENT),
            FeatureDefinition("opp_earned_runs", "earned_runs", DataScope.OPPONENT),
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