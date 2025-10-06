import pandas as pd
import numpy as np
from typing import Generic, TypeVar, Protocol, Any
from prop_generation.generator.base import DataScope, FeatureDefinition, GameStats


class StatsDict(Protocol):
    """Protocol for objects that support dictionary-like access"""

    def __getitem__(self, key: str) -> Any: ...


PlayerStatsType = TypeVar("PlayerStatsType", bound=StatsDict)
TeamStatsType = TypeVar("TeamStatsType", bound=StatsDict)


def calculate_weighted_arithmetic_mean(values: list[float], decay: float = 0.08) -> float:
    """
    Calculate weighted arithmetic mean with exponential decay for recency weighting.

    Args:
        values: List of values ordered from oldest to most recent
        decay: Exponential decay rate. Higher = stronger recency bias
               Recommended values by sport:
               - Basketball: 0.08 (effective sample ~18 games from 35)
               - Football: 0.10 (effective sample ~9 games from 12)
               - Baseball: 0.06 (effective sample ~22 games from 40)

    Returns:
        Weighted mean with recent games weighted exponentially higher
    """
    if not values:
        return 0.0

    n = len(values)
    if n == 1:
        return values[0]

    # Exponential weights: recent games weighted much more heavily
    # weights[i] = exp(-decay * (n - i - 1))
    # oldest game (i=0): exp(-decay * (n-1))
    # most recent game (i=n-1): exp(0) = 1.0
    weights = [np.exp(-decay * (n - i - 1)) for i in range(n)]

    weighted_sum = sum(v * w for v, w in zip(values, weights))
    total_weight = sum(weights)

    return weighted_sum / total_weight if total_weight > 0 else 0.0


class FeatureExtractor(Generic[PlayerStatsType, TeamStatsType]):
    """Handles feature extraction with scope-aware calculations"""

    def extract_feature_value(
        self,
        definition: FeatureDefinition,
        game_data: GameStats[PlayerStatsType, TeamStatsType],
    ) -> list[float]:
        """Extract raw feature values based on scope and field"""

        if definition.scope == DataScope.PLAYER:
            source_data = game_data.player_stats_list
        elif definition.scope == DataScope.TEAM:
            source_data = game_data.team_stats_list
        elif definition.scope == DataScope.OPPONENT:
            source_data = game_data.prev_opponents_stats_list
        else:
            raise ValueError(f"Unknown scope: {definition.scope}")

        values = []
        for game in source_data:
            try:
                value = game[definition.field]
                values.append(float(value) if value is not None else 0.0)
            except AttributeError:
                values.append(0.0)
        return values

    def extract_prediction_feature_value(
        self,
        definition: FeatureDefinition,
        game_data: GameStats[PlayerStatsType, TeamStatsType],
        decay_rate: float,
        training_data: pd.DataFrame | None = None,
    ) -> float:
        """Extract feature value for prediction (uses weighted arithmetic mean)"""

        if definition.scope == DataScope.OPPONENT:
            source_data = game_data.curr_opponent_stats_list

            values = [game[definition.field] for game in source_data]
            return calculate_weighted_arithmetic_mean(values, decay_rate)
        else:
            if training_data is not None and definition.name in training_data.columns:
                return calculate_weighted_arithmetic_mean(
                    training_data[definition.name].tolist(), decay_rate
                )
            else:
                values = self.extract_feature_value(definition, game_data)
                return calculate_weighted_arithmetic_mean(values, decay_rate)

    def build_feature_dataframe(
        self,
        feature_definitions: list[FeatureDefinition],
        game_data: GameStats[PlayerStatsType, TeamStatsType],
        decay_rate: float,
    ) -> pd.DataFrame:
        """
        Build a complete feature DataFrame for training using rolling window aggregations.

        Each row represents the weighted aggregation of all games up to (but not including)
        that game, maintaining consistency with prediction-time feature distribution.

        Args:
            feature_definitions: List of features to extract
            game_data: Historical game data
            decay_rate: Exponential decay rate for recency weighting

        Returns:
            DataFrame where each row's features are aggregated from all prior games
        """
        num_games = len(game_data.player_stats_list)

        # Start from game 1 (we need at least 1 previous game for aggregation)
        if num_games <= 1:
            return pd.DataFrame()

        aggregated_data = {definition.name: [] for definition in feature_definitions}

        for definition in feature_definitions:
            # Extract all raw values for this feature
            all_values = self.extract_feature_value(definition, game_data)

            # For each game (starting from game 1), aggregate all previous games
            for i in range(1, num_games):
                previous_games = all_values[:i]
                aggregated_value = calculate_weighted_arithmetic_mean(
                    previous_games, decay_rate
                )
                aggregated_data[definition.name].append(aggregated_value)

        return pd.DataFrame(aggregated_data)

    def build_prediction_features(
        self,
        feature_definitions: list[FeatureDefinition],
        game_data: GameStats[PlayerStatsType, TeamStatsType],
        training_data: pd.DataFrame,
        decay_rate: float,
    ) -> pd.DataFrame:
        """Build feature DataFrame for prediction"""

        data = {}
        for definition in feature_definitions:
            data[definition.name] = self.extract_prediction_feature_value(
                definition, game_data, decay_rate, training_data
            )

        return pd.DataFrame([data])
