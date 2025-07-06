from typing import TypeVar

import numpy as np
import pandas as pd
from shared.constants import bias
from shared.utils import round_prop
from sklearn.base import BaseEstimator
from sklearn.linear_model import PoissonRegressor, Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from shared.prop_generation.base import GameData, ModelType, PropConfig, PropGenerator
from shared.prop_generation.features import FeatureExtractor

PlayerStatsType = TypeVar("PlayerStatsType")
TeamStatsType = TypeVar("TeamStatsType")


class BasePropGenerator(PropGenerator[PlayerStatsType, TeamStatsType]):
    """Base implementation of prop generation logic"""

    def __init__(self):
        self.feature_extractor = FeatureExtractor[PlayerStatsType, TeamStatsType]()

    def generate_prop(
        self, config: PropConfig, game_data: GameData[PlayerStatsType, TeamStatsType]
    ) -> float:
        """Generate a prop line using ML model"""

        # Extract features for training
        feature_df = self.extract_features(config, game_data)

        # Prepare training data
        x_values = feature_df[[f.name for f in config.features]]
        y_values = feature_df[config.target_field]

        # Create and train model
        model = self.create_model(config.model_type, config.model_params)
        model.fit(x_values, y_values)

        # Extract prediction features
        prediction_features = self.extract_prediction_features(
            config, game_data, feature_df
        )

        # Make prediction
        predicted_value = model.predict(prediction_features)[0]

        # Apply bias and standard deviation adjustment
        sd = np.std(y_values, ddof=1)
        final_prop = predicted_value + bias * sd

        # Handle invalid predictions
        if np.isnan(final_prop) or np.isinf(final_prop):
            return 0.0

        return round_prop(final_prop)

    def create_model(self, model_type: ModelType, params: dict) -> BaseEstimator:
        """Create sklearn model pipeline"""

        if model_type == ModelType.RIDGE:
            estimator = Ridge(alpha=params.get("alpha", 1))
        elif model_type == ModelType.POISSON:
            estimator = PoissonRegressor(alpha=params.get("alpha", 1))
        else:
            raise ValueError(f"Unknown model type: {model_type}")

        return make_pipeline(StandardScaler(), estimator)

    def extract_features(
        self, config: PropConfig, game_data: GameData[PlayerStatsType, TeamStatsType]
    ) -> pd.DataFrame:
        """Extract all features including target variable"""

        # Build feature DataFrame
        feature_df = self.feature_extractor.build_feature_dataframe(
            config.features, game_data
        )

        # Add target variable
        target_values = [
            getattr(game, config.target_field) for game in game_data.player_games
        ]
        feature_df[config.target_field] = target_values

        return feature_df

    def extract_prediction_features(
        self,
        config: PropConfig,
        game_data: GameData[PlayerStatsType, TeamStatsType],
        training_data: pd.DataFrame,
    ) -> pd.DataFrame:
        """Extract features for next game prediction"""

        return self.feature_extractor.build_prediction_features(
            config.features, game_data, training_data
        )
