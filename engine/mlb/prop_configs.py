"""
MLB Prop Configurations using Auto-Registration System

To add a new stat:
1. Just add a function with @register_mlb_stat decorator
2. That's it! No need to update stats_arr or types manually

Example:
@register_mlb_stat
def walks_config() -> PropConfig:
    return PropConfig(...)
"""

from shared.prop_generation.base import PropConfig, FeatureDefinition, DataScope, ModelType
from shared.prop_generation.registry import register_mlb_stat, mlb_registry

# =============================================================================
# MLB STAT CONFIGURATIONS - Auto-registered with decorators
# =============================================================================

@register_mlb_stat
def home_runs_config() -> PropConfig:
    """Home runs configuration"""
    return PropConfig(
        stat_name="home_runs",
        target_field="home_runs",
        features=[
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "slugging_pct", DataScope.PLAYER),
            FeatureDefinition("ops", "ops", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "batting_avg", DataScope.PLAYER),
            FeatureDefinition("opp_pitching_home_runs", "pitching_home_runs", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_pitching_walks", "pitching_walks", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1}
    )

@register_mlb_stat
def doubles_config() -> PropConfig:
    """Doubles configuration"""
    return PropConfig(
        stat_name="doubles",
        target_field="doubles",
        features=[
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "slugging_pct", DataScope.PLAYER),
            FeatureDefinition("ops", "ops", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "batting_avg", DataScope.PLAYER),
            FeatureDefinition("opp_pitching_hits", "pitching_hits", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_pitching_walks", "pitching_walks", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1}
    )

@register_mlb_stat
def hits_config() -> PropConfig:
    """Hits configuration"""
    return PropConfig(
        stat_name="hits",
        target_field="hits",
        features=[
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "slugging_pct", DataScope.PLAYER),
            FeatureDefinition("ops", "ops", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "batting_avg", DataScope.PLAYER),
            FeatureDefinition("opp_pitching_hits", "pitching_hits", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_pitching_walks", "pitching_walks", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1}
    )

@register_mlb_stat
def triples_config() -> PropConfig:
    """Triples configuration"""
    return PropConfig(
        stat_name="triples",
        target_field="triples",
        features=[
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "slugging_pct", DataScope.PLAYER),
            FeatureDefinition("ops", "ops", DataScope.PLAYER),
            FeatureDefinition("batting_avg", "batting_avg", DataScope.PLAYER),
            FeatureDefinition("opp_pitching_hits", "pitching_hits", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_pitching_walks", "pitching_walks", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1}
    )

@register_mlb_stat
def rbi_config() -> PropConfig:
    """RBI configuration"""
    return PropConfig(
        stat_name="rbi",
        target_field="rbi",
        features=[
            FeatureDefinition("hits", "hits", DataScope.PLAYER),
            FeatureDefinition("home_runs", "home_runs", DataScope.PLAYER),
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("slugging_pct", "slugging_pct", DataScope.PLAYER),
            FeatureDefinition("sac_flies", "sac_flies", DataScope.PLAYER),
            FeatureDefinition("team_runs", "runs", DataScope.TEAM),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1}
    )

@register_mlb_stat
def strikeouts_config() -> PropConfig:
    """Strikeouts (batter) configuration"""
    return PropConfig(
        stat_name="strikeouts",
        target_field="strikeouts",
        features=[
            FeatureDefinition("at_bats", "at_bats", DataScope.PLAYER),
            FeatureDefinition("ops", "ops", DataScope.PLAYER),
            FeatureDefinition("opp_pitching_strikeouts", "pitching_strikeouts", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_strikes", "strikes", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_pitches_thrown", "pitches_thrown", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_pitching_hits", "pitching_hits", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1}
    )

@register_mlb_stat
def pitching_strikeouts_config() -> PropConfig:
    """Pitching strikeouts configuration"""
    return PropConfig(
        stat_name="pitching_strikeouts",
        target_field="pitching_strikeouts",
        features=[
            FeatureDefinition("innings_pitched", "innings_pitched", DataScope.PLAYER),
            FeatureDefinition("pitches_thrown", "pitches_thrown", DataScope.PLAYER),
            FeatureDefinition("strikes", "strikes", DataScope.PLAYER),
            FeatureDefinition("opp_strikeouts", "strikeouts", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_batting_avg", "batting_avg", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1}
    )

@register_mlb_stat
def pitches_thrown_config() -> PropConfig:
    """Pitches thrown configuration"""
    return PropConfig(
        stat_name="pitches_thrown",
        target_field="pitches_thrown",
        features=[
            FeatureDefinition("innings_pitched", "innings_pitched", DataScope.PLAYER),
            FeatureDefinition("pitching_strikeouts", "pitching_strikeouts", DataScope.PLAYER),
            FeatureDefinition("pitching_walks", "pitching_walks", DataScope.PLAYER),
            FeatureDefinition("pitching_hits", "pitching_hits", DataScope.PLAYER),
            FeatureDefinition("opp_ops", "ops", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_slugging_pct", "slugging_pct", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_runs", "runs", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1}
    )

@register_mlb_stat
def earned_runs_config() -> PropConfig:
    """Earned runs configuration"""
    return PropConfig(
        stat_name="earned_runs",
        target_field="earned_runs",
        features=[
            FeatureDefinition("innings_pitched", "innings_pitched", DataScope.PLAYER),
            FeatureDefinition("pitching_hits", "pitching_hits", DataScope.PLAYER),
            FeatureDefinition("pitching_walks", "pitching_walks", DataScope.PLAYER),
            FeatureDefinition("pitching_home_runs", "pitching_home_runs", DataScope.PLAYER),
            FeatureDefinition("opp_runs", "runs", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_ops", "ops", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_slugging_pct", "slugging_pct", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1}
    )

@register_mlb_stat
def pitching_hits_config() -> PropConfig:
    """Pitching hits configuration"""
    return PropConfig(
        stat_name="pitching_hits",
        target_field="pitching_hits",
        features=[
            FeatureDefinition("innings_pitched", "innings_pitched", DataScope.PLAYER),
            FeatureDefinition("pitches_thrown", "pitches_thrown", DataScope.PLAYER),
            FeatureDefinition("pitching_strikeouts", "pitching_strikeouts", DataScope.PLAYER),
            FeatureDefinition("opp_batting_avg", "batting_avg", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_slugging_pct", "slugging_pct", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_ops", "ops", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1}
    )

@register_mlb_stat
def pitching_walks_config() -> PropConfig:
    """Pitching walks configuration"""
    return PropConfig(
        stat_name="pitching_walks",
        target_field="pitching_walks",
        features=[
            FeatureDefinition("innings_pitched", "innings_pitched", DataScope.PLAYER),
            FeatureDefinition("pitches_thrown", "pitches_thrown", DataScope.PLAYER),
            FeatureDefinition("balls", "balls", DataScope.PLAYER),
            FeatureDefinition("opp_on_base_pct", "on_base_pct", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_walks", "walks", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1}
    )

def get_mlb_prop_configs() -> dict[str, PropConfig]:
    """Get all MLB prop configurations (auto-generated from registered stats)"""
    return mlb_registry.get_configs()

def get_mlb_stats_list() -> list[str]:
    """Get list of all MLB stats (auto-generated from registered stats)"""
    return mlb_registry.get_stats_list()

# Validate all configurations at import time
mlb_registry.validate_all_configs()