from typing import TypeVar, Any, Protocol
import warnings
import numpy as np
import pandas as pd
from sklearn.linear_model import PoissonRegressor, Ridge
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import StandardScaler

from prop_generation.generator.base import GameStats, ModelType, PropConfig, PropGenerator
from prop_generation.generator.features import FeatureExtractor


class StatsDict(Protocol):
    """Protocol for objects that support dictionary-like access"""
    def __getitem__(self, key: str) -> Any: ...


PlayerStatsType = TypeVar("PlayerStatsType", bound=StatsDict)
TeamStatsType = TypeVar("TeamStatsType", bound=StatsDict)

BIAS = 0.2


def round_prop(value: float) -> float:
    """Round prop value to appropriate precision"""
    if value < 10:
        return round(value * 2) / 2
    else:
        return round(value)


class BasePropGenerator(PropGenerator[PlayerStatsType, TeamStatsType]):
    """Base implementation of prop generation logic"""

    def __init__(self):
        self.feature_extractor = FeatureExtractor[PlayerStatsType, TeamStatsType]()

    def generate_prop(
        self, config: PropConfig, game_data: GameStats[PlayerStatsType, TeamStatsType]
    ) -> float:
        """Generate a prop line using ML model"""

        feature_df = self.extract_features(config, game_data)

        x_values = feature_df[[f.name for f in config.features]]
        y_values = feature_df[config.target_field]

        model = self.create_model(config.model_type, config.model_params)
        
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=RuntimeWarning, module="sklearn")
            model.fit(x_values, y_values)

        prediction_features = self.extract_prediction_features(
            config, game_data, feature_df
        )

        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=RuntimeWarning, module="sklearn")
            predicted_value = float(model.predict(prediction_features)[0])

        sd = float(np.std(y_values, ddof=1))
        final_prop = predicted_value + BIAS * sd

        if np.isnan(final_prop) or np.isinf(final_prop):
            return 0.0

        return round_prop(final_prop)

    def create_model(self, model_type: ModelType, params: dict[str, Any]) -> Pipeline:
        """Create sklearn model pipeline"""

        if model_type == ModelType.RIDGE:
            estimator = Ridge(alpha=params.get("alpha", 1))
        elif model_type == ModelType.POISSON:
            estimator = PoissonRegressor(alpha=params.get("alpha", 1))
        else:
            raise ValueError(f"Unknown model type: {model_type}")

        return make_pipeline(StandardScaler(), estimator)

    def extract_features(
        self, config: PropConfig, game_data: GameStats[PlayerStatsType, TeamStatsType]
    ) -> pd.DataFrame:
        """Extract all features including target variable"""

        feature_df = self.feature_extractor.build_feature_dataframe(
            config.features, game_data
        )

        target_values = [
            game[config.target_field] for game in game_data.player_stats_list
        ]
        feature_df[config.target_field] = target_values

        return feature_df

    def extract_prediction_features(
        self,
        config: PropConfig,
        game_data: GameStats[PlayerStatsType, TeamStatsType],
        training_data: pd.DataFrame,
    ) -> pd.DataFrame:
        """Extract features for next game prediction"""

        return self.feature_extractor.build_prediction_features(
            config.features, game_data, training_data
        )
