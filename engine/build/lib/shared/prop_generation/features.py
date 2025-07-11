import pandas as pd
import numpy as np
from typing import Any, Generic, TypeVar
from shared.prop_generation.base import DataScope, FeatureDefinition, GameData
from shared.utils import calculate_weighted_arithmetic_mean

PlayerStatsType = TypeVar('PlayerStatsType')
TeamStatsType = TypeVar('TeamStatsType')

class FeatureExtractor(Generic[PlayerStatsType, TeamStatsType]):
    """Handles feature extraction with scope-aware calculations"""
    
    def extract_feature_value(
        self,
        definition: FeatureDefinition,
        game_data: GameData[PlayerStatsType, TeamStatsType]
    ) -> list[float]:
        """Extract raw feature values based on scope and field"""
        
        if definition.scope == DataScope.PLAYER:
            source_data = game_data.player_games
        elif definition.scope == DataScope.TEAM:
            source_data = game_data.team_games
        elif definition.scope == DataScope.OPPONENT_TEAM:
            source_data = game_data.opponent_team_games
        elif definition.scope == DataScope.MATCHUP_TEAM:
            source_data = game_data.matchup_team_games
        else:
            raise ValueError(f"Unknown scope: {definition.scope}")
        
        if definition.calculation:
            return self._calculate_derived_feature(
                definition.calculation, 
                source_data
            )
        else:
            # For simple field access, handle None values
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
        training_data: pd.DataFrame | None = None
    ) -> float:
        """Extract feature value for prediction (uses weighted arithmetic mean)"""
        
        if definition.scope == DataScope.MATCHUP_TEAM:
            # For matchup team, we use the opposing team's current data
            source_data = game_data.matchup_team_games
            if definition.calculation:
                values = self._calculate_derived_feature(
                    definition.calculation,
                    source_data
                )
            else:
                values = [getattr(game, definition.field) for game in source_data]
            return calculate_weighted_arithmetic_mean(values)
        elif definition.scope == DataScope.OPPONENT_TEAM:
            # For prediction, OPPONENT_TEAM features should use the upcoming opponent's data
            # (In training we used historical opponents, but for prediction we use the actual matchup)
            source_data = game_data.matchup_team_games
            if definition.calculation:
                values = self._calculate_derived_feature(
                    definition.calculation,
                    source_data
                )
            else:
                values = [getattr(game, definition.field) for game in source_data]
            return calculate_weighted_arithmetic_mean(values)
        else:
            # For PLAYER and TEAM scopes, use the training data mean
            if training_data is not None and definition.name in training_data.columns:
                return calculate_weighted_arithmetic_mean(training_data[definition.name])
            else:
                # Fallback to extracting from game data
                values = self.extract_feature_value(definition, game_data)
                return calculate_weighted_arithmetic_mean(values)
    
    def _calculate_derived_feature(
        self, 
        calculation: str, 
        source_data: list[Any]
    ) -> list[float]:
        """Calculate derived features using string expressions"""
        results = []
        
        for game in source_data:
            try:
                # Create a safe namespace with game attributes
                namespace = {}
                
                # Add all numeric attributes from the game object
                for attr in dir(game):
                    if not attr.startswith('_') and not callable(getattr(game, attr)):
                        try:
                            value = getattr(game, attr)
                            # Only add numeric values to namespace
                            if isinstance(value, (int, float)) or value is None:
                                namespace[attr] = value if value is not None else 0
                        except:
                            continue
                
                # Add common mathematical functions
                safe_builtins = {
                    '__builtins__': {},
                    'max': max,
                    'min': min,
                    'abs': abs,
                    'round': round
                }
                
                # Safely evaluate the calculation
                result = eval(calculation, safe_builtins, namespace)
                results.append(float(result) if result is not None else 0.0)
                
            except (AttributeError, ZeroDivisionError, TypeError, NameError, SyntaxError):
                # If calculation fails, append 0.0
                results.append(0.0)
        
        return results
    
    def build_feature_dataframe(
        self,
        feature_definitions: list[FeatureDefinition],
        game_data: GameData[PlayerStatsType, TeamStatsType]
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
        training_data: pd.DataFrame
    ) -> pd.DataFrame:
        """Build feature DataFrame for prediction"""
        
        data = {}
        for definition in feature_definitions:
            data[definition.name] = self.extract_prediction_feature_value(
                definition, game_data, training_data
            )
        
        return pd.DataFrame([data])