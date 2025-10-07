import pandas as pd
from typing import Generic, TypeVar, Protocol, Any
from prop_generation.generator.base import DataScope, FeatureDefinition, GameStats


class StatsDict(Protocol):
    """Protocol for objects that support dictionary-like access"""

    def __getitem__(self, key: str) -> Any: ...


PlayerStatsType = TypeVar("PlayerStatsType", bound=StatsDict)
TeamStatsType = TypeVar("TeamStatsType", bound=StatsDict)


def calculate_weighted_arithmetic_mean(values: list[float], decay_factor: float = 0.875) -> float:
    """Calculate weighted mean with exponential decay (recent games weighted more)

    Uses exponential decay weighting to maintain strong recency bias regardless of sample size.
    This allows larger historical datasets for model training while keeping predictions
    heavily influenced by recent performance.

    Args:
        values: List of values with index 0 = oldest, index -1 = most recent
        decay_factor: Decay rate (0.85-0.95). Lower = more aggressive recency bias.
                     0.90 is recommended default - maintains ~35% weight on last 4 games
                     even with 50+ game history.

    Returns:
        Weighted average with exponential decay applied
    """
    if not values:
        return 0.0

    n = len(values)
    if n == 1:
        return values[0]

    # Exponential weights: decay^(n-1), decay^(n-2), ..., decay^1, decay^0
    # Most recent game (index n-1) gets weight 1.0 (decay^0 = 1)
    weights = [decay_factor ** (n - i - 1) for i in range(n)]
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
        training_data: pd.DataFrame | None = None,
    ) -> float:
        """Extract feature value for prediction (uses weighted arithmetic mean)"""

        if definition.scope == DataScope.OPPONENT:
            source_data = game_data.curr_opponent_stats_list

            values = [game[definition.field] for game in source_data]
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
        game_data: GameStats[PlayerStatsType, TeamStatsType],
    ) -> pd.DataFrame:
        """Build a complete feature DataFrame for training"""

        data = {}
        for definition in feature_definitions:
            feature_values = self.extract_feature_value(definition, game_data)
            data[definition.name] = feature_values

        return pd.DataFrame(data)

    def build_prediction_features(
        self,
        feature_definitions: list[FeatureDefinition],
        game_data: GameStats[PlayerStatsType, TeamStatsType],
        training_data: pd.DataFrame,
    ) -> pd.DataFrame:
        """Build feature DataFrame for prediction"""

        data = {}
        for definition in feature_definitions:
            data[definition.name] = self.extract_prediction_feature_value(
                definition, game_data, training_data
            )

        return pd.DataFrame([data])
