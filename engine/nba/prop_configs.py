"""
NBA Prop Configurations using Auto-Registration System

To add a new stat:
1. Just add a function with @register_nba_stat decorator
2. That's it! No need to update stats_arr or types manually

Example:
@register_nba_stat
def fgm_config() -> PropConfig:
    return PropConfig(...)
"""

from shared.prop_generation.base import PropConfig, FeatureDefinition, DataScope, ModelType
from shared.prop_generation.registry import register_nba_stat, nba_registry

@register_nba_stat
def pts_config() -> PropConfig:
    """Points configuration"""
    return PropConfig(
        stat_name="pts",
        target_field="pts",
        features=[
            FeatureDefinition("min", "min", DataScope.PLAYER),
            FeatureDefinition("fga", "fga", DataScope.PLAYER),
            FeatureDefinition("three_pa", "three_pa", DataScope.PLAYER),
            FeatureDefinition("true_shooting", "true_shooting", DataScope.PLAYER),
            FeatureDefinition("pace", "pace", DataScope.TEAM),
            FeatureDefinition("usage_rate", "usage_rate", DataScope.PLAYER),
            FeatureDefinition("opp_def_rating", "def_rating", DataScope.OPPONENT_TEAM),
            FeatureDefinition("team_off_rating", "off_rating", DataScope.TEAM),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1}
    )

@register_nba_stat
def reb_config() -> PropConfig:
    """Rebounds configuration"""
    return PropConfig(
        stat_name="reb",
        target_field="reb",
        features=[
            FeatureDefinition("min", "min", DataScope.PLAYER),
            FeatureDefinition("reb_pct", "reb_pct", DataScope.PLAYER),
            FeatureDefinition("dreb_pct", "dreb_pct", DataScope.PLAYER),
            FeatureDefinition("oreb_pct", "oreb_pct", DataScope.PLAYER),
            FeatureDefinition("opp_fg_pct", "fgm", DataScope.OPPONENT_TEAM, "(fgm / fga) * 100 if fga > 0 else 0"),
            FeatureDefinition("opp_pace", "pace", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1}
    )

@register_nba_stat
def ast_config() -> PropConfig:
    """Assists configuration"""
    return PropConfig(
        stat_name="ast", 
        target_field="ast",
        features=[
            FeatureDefinition("min", "min", DataScope.PLAYER),
            FeatureDefinition("ast_pct", "ast_pct", DataScope.PLAYER),
            FeatureDefinition("ast_ratio", "ast_ratio", DataScope.PLAYER),
            FeatureDefinition("team_fg_pct", "fgm", DataScope.TEAM, "(fgm / fga) * 100 if fga > 0 else 0"),
            FeatureDefinition("usage_rate", "usage_rate", DataScope.PLAYER),
            FeatureDefinition("team_off_rating", "off_rating", DataScope.TEAM),
            FeatureDefinition("opp_def_rating", "def_rating", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1}
    )

@register_nba_stat
def three_pm_config() -> PropConfig:
    """Three pointers made configuration"""
    return PropConfig(
        stat_name="three_pm",
        target_field="three_pm", 
        features=[
            FeatureDefinition("min", "min", DataScope.PLAYER),
            FeatureDefinition("team_off_rating", "off_rating", DataScope.TEAM),
            FeatureDefinition("opp_def_rating", "def_rating", DataScope.OPPONENT_TEAM),
            FeatureDefinition("usage_rate", "usage_rate", DataScope.PLAYER),
            FeatureDefinition("three_pa", "three_pa", DataScope.PLAYER),
            FeatureDefinition("three_pct", "three_pm", DataScope.PLAYER, "(three_pm / three_pa) * 100 if three_pa > 0 else 0"),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1}
    )

@register_nba_stat
def blk_config() -> PropConfig:
    """Blocks configuration"""
    return PropConfig(
        stat_name="blk",
        target_field="blk",
        features=[
            FeatureDefinition("min", "min", DataScope.PLAYER),
            FeatureDefinition("pct_blk_a", "blk", DataScope.PLAYER),  # Special handling in generator
            FeatureDefinition("opp_pace", "pace", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_off_rating", "off_rating", DataScope.OPPONENT_TEAM),
            FeatureDefinition("team_def_rating", "def_rating", DataScope.TEAM),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1}
    )

@register_nba_stat
def stl_config() -> PropConfig:
    """Steals configuration"""
    return PropConfig(
        stat_name="stl",
        target_field="stl",
        features=[
            FeatureDefinition("min", "min", DataScope.PLAYER),
            FeatureDefinition("team_def_rating", "def_rating", DataScope.TEAM),
            FeatureDefinition("opp_off_rating", "off_rating", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_pace", "pace", DataScope.OPPONENT_TEAM),
            FeatureDefinition("pct_stl_a", "stl", DataScope.PLAYER),  # Special handling in generator
            FeatureDefinition("opp_tov", "tov", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_tov_ratio", "tov_ratio", DataScope.OPPONENT_TEAM),
            FeatureDefinition("opp_tov_pct", "tov_pct", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.POISSON,
        model_params={"alpha": 1}
    )

@register_nba_stat
def tov_config() -> PropConfig:
    """Turnovers configuration"""
    return PropConfig(
        stat_name="tov",
        target_field="tov",
        features=[
            FeatureDefinition("min", "min", DataScope.PLAYER),
            FeatureDefinition("usage_rate", "usage_rate", DataScope.PLAYER),
            FeatureDefinition("team_off_rating", "off_rating", DataScope.TEAM),
            FeatureDefinition("opp_def_rating", "def_rating", DataScope.OPPONENT_TEAM),
            FeatureDefinition("tov_ratio", "tov_ratio", DataScope.PLAYER),
            FeatureDefinition("opp_stl", "stl", DataScope.OPPONENT_TEAM),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 1}
    )

def get_nba_prop_configs() -> dict[str, PropConfig]:
    """Get all NBA prop configurations (auto-generated from registered stats)"""
    return nba_registry.get_configs()

def get_nba_stats_list() -> list[str]:
    """Get list of all NBA stats (auto-generated from registered stats)"""
    return nba_registry.get_stats_list()

# Validate all configurations at import time
nba_registry.validate_all_configs()