import pandas as pd
from typing import Any, Generic, TypeVar
from base import DataScope, FeatureDefinition, GameData

PlayerStatsType = TypeVar("PlayerStatsType")
TeamStatsType = TypeVar("TeamStatsType")


def calculate_weighted_arithmetic_mean(values: list[float]) -> float:
    """Calculate weighted arithmetic mean with recent games weighted more heavily"""
    if not values:
        return 0.0

    n = len(values)
    if n == 1:
        return values[0]

    weights = [i + 1 for i in range(n)]
    weighted_sum = sum(v * w for v, w in zip(values, weights))
    total_weight = sum(weights)

    return weighted_sum / total_weight if total_weight > 0 else 0.0


class FeatureExtractor(Generic[PlayerStatsType, TeamStatsType]):
    """Handles feature extraction with scope-aware calculations"""

    def extract_feature_value(
        self,
        definition: FeatureDefinition,
        game_data: GameData[PlayerStatsType, TeamStatsType],
    ) -> list[float]:
        """Extract raw feature values based on scope and field"""

        if definition.scope == DataScope.PLAYER:
            source_data = game_data.player_games
        elif definition.scope == DataScope.TEAM:
            source_data = game_data.team_games
        elif definition.scope == DataScope.OPPONENT:
            source_data = game_data.prev_opponents_games
        else:
            raise ValueError(f"Unknown scope: {definition.scope}")

        values = []
        for game in source_data:
            try:
                value = getattr(game, definition.field)
                values.append(float(value) if value is not None else 0.0)
            except AttributeError:
                values.append(0.0)
        return values

    def extract_prediction_feature_value(
        self,
        definition: FeatureDefinition,
        game_data: GameData[PlayerStatsType, TeamStatsType],
        training_data: pd.DataFrame | None = None,
    ) -> float:
        """Extract feature value for prediction (uses weighted arithmetic mean)"""

        if definition.scope == DataScope.OPPONENT:
            source_data = game_data.curr_opponent_games

            values = [getattr(game, definition.field) for game in source_data]
            return calculate_weighted_arithmetic_mean(values)
        else:
            if training_data is not None and definition.name in training_data.columns:
                return calculate_weighted_arithmetic_mean(
                    training_data[definition.name].tolist()
                )
            else:
                values = self.extract_feature_value(definition, game_data)
                return calculate_weighted_arithmetic_mean(values)

    def build_feature_dataframe(
        self,
        feature_definitions: list[FeatureDefinition],
        game_data: GameData[PlayerStatsType, TeamStatsType],
    ) -> pd.DataFrame:
        """Build a complete feature DataFrame for training"""

        data = {}
        for definition in feature_definitions:
            data[definition.name] = self.extract_feature_value(definition, game_data)

        return pd.DataFrame(data)

    def build_prediction_features(
        self,
        feature_definitions: list[FeatureDefinition],
        game_data: GameData[PlayerStatsType, TeamStatsType],
        training_data: pd.DataFrame,
    ) -> pd.DataFrame:
        """Build feature DataFrame for prediction"""

        data = {}
        for definition in feature_definitions:
            data[definition.name] = self.extract_prediction_feature_value(
                definition, game_data, training_data
            )

        return pd.DataFrame([data])
