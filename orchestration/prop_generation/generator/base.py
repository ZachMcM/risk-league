from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar
from enum import Enum
import pandas as pd
from sklearn.pipeline import Pipeline

PlayerStatsType = TypeVar("PlayerStatsType")
TeamStatsType = TypeVar("TeamStatsType")


class DataScope(Enum):
    """Defines the scope of where a feature comes from"""

    PLAYER = "player"
    TEAM = "team"
    OPPONENT = "opponent"


class ModelType(Enum):
    """Available model types for prop generation"""

    RIDGE = "ridge"
    POISSON = "poisson"


class FeatureDefinition:
    """Defines how to extract and calculate a feature"""

    def __init__(
        self, name: str, field: str, scope: DataScope
    ):
        self.name = name
        self.field = field
        self.scope = scope


class PropConfig:
    """Configuration for generating a specific prop"""

    def __init__(
        self,
        stat_name: str,
        target_field: str,
        features: list[FeatureDefinition],
        model_type: ModelType,
        model_params: dict[str, Any] | None = None,
        display_name: str | None = None,
    ):
        self.stat_name = stat_name
        self.target_field = target_field
        self.features = features
        self.model_type = model_type
        self.model_params = model_params or {}
        self.display_name = display_name or stat_name


class GameData(Generic[PlayerStatsType, TeamStatsType]):
    """Container for all game data needed for prop generation"""

    def __init__(
        self,
        player_games: list[PlayerStatsType],
        team_games: list[TeamStatsType],
        prev_opponents_games: list[TeamStatsType],
        curr_opponent_games: list[TeamStatsType],
    ):
        self.player_games = player_games
        self.team_games = team_games
        self.prev_opponents_games = prev_opponents_games
        self.curr_opponent_games = curr_opponent_games


class PropGenerator(ABC, Generic[PlayerStatsType, TeamStatsType]):
    """Abstract base class for prop generation"""

    @abstractmethod
    def generate_prop(
        self, config: PropConfig, game_data: GameData[PlayerStatsType, TeamStatsType]
    ) -> float:
        """Generate a prop line using the given configuration and data"""
        pass

    @abstractmethod
    def create_model(
        self, model_type: ModelType, params: dict[str, Any]
    ) -> Pipeline:
        """Create a sklearn model based on the configuration"""
        pass

    @abstractmethod
    def extract_features(
        self, config: PropConfig, game_data: GameData[PlayerStatsType, TeamStatsType]
    ) -> pd.DataFrame:
        """Extract features for model training"""
        pass

    @abstractmethod
    def extract_prediction_features(
        self,
        config: PropConfig,
        game_data: GameData[PlayerStatsType, TeamStatsType],
        training_data: pd.DataFrame,
    ) -> pd.DataFrame:
        """Extract features for the next game prediction"""
        pass