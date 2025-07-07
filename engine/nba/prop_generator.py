import pandas as pd
from shared.prop_generation.generator import BasePropGenerator
from shared.prop_generation.base import PropConfig, GameData
from shared.tables import NbaPlayerStats, NbaGames
from nba.prop_configs import get_nba_prop_configs, get_nba_stats_list

class NbaPropGenerator(BasePropGenerator[NbaPlayerStats, NbaGames]):
    """NBA-specific prop generator using auto-registration system"""
    
    def __init__(self):
        super().__init__()
        self.configs = get_nba_prop_configs()  # Auto-generated from decorators!
    
    def generate_prop_for_stat(
        self, 
        stat_name: str,
        game_data: GameData[NbaPlayerStats, NbaGames]
    ) -> float:
        """Generate prop for a specific NBA stat"""
        
        if stat_name not in self.configs:
            available = ", ".join(self.get_available_stats())
            raise ValueError(f"Unknown NBA stat: {stat_name}. Available: {available}")
        
        config = self.configs[stat_name]
        
        # Handle special cases for percentage calculations
        if stat_name in ["blk", "stl"]:
            return self._generate_special_percentage_prop(config, game_data)
        
        return self.generate_prop(config, game_data)
    
    def _generate_special_percentage_prop(
        self,
        config: PropConfig,
        game_data: GameData[NbaPlayerStats, NbaGames]
    ) -> float:
        """Handle special percentage calculations for blocks and steals"""
        
        # Extract features manually for these special cases
        feature_df = self.feature_extractor.build_feature_dataframe(
            [f for f in config.features if f.name not in ["pct_blk_a", "pct_stl_a"]], 
            game_data
        )
        
        # Add special percentage calculations
        if config.stat_name == "blk":
            pct_blk_a = []
            for i, player_game in enumerate(game_data.player_games):
                team_blk = game_data.team_games[i].blk if i < len(game_data.team_games) else 1
                pct = (player_game.blk / team_blk * 100) if team_blk > 0 else 0
                pct_blk_a.append(pct)
            feature_df["pct_blk_a"] = pct_blk_a
            
        elif config.stat_name == "stl":
            pct_stl_a = []
            for i, player_game in enumerate(game_data.player_games):
                team_stl = game_data.team_games[i].stl if i < len(game_data.team_games) else 1
                pct = (player_game.stl / team_stl * 100) if team_stl > 0 else 0
                pct_stl_a.append(pct)
            feature_df["pct_stl_a"] = pct_stl_a
        
        # Add target variable
        target_values = [getattr(game, config.target_field) for game in game_data.player_games]
        feature_df[config.target_field] = target_values
        
        # Continue with normal prop generation
        x_values = feature_df[[f.name for f in config.features]]
        y_values = feature_df[config.target_field]
        
        model = self.create_model(config.model_type, config.model_params)
        model.fit(x_values, y_values)
        
        # Build prediction features manually
        prediction_data = {}
        for feature in config.features:
            if feature.name in ["pct_blk_a", "pct_stl_a"]:
                # Use the mean of the calculated percentages
                if feature.name == "pct_blk_a":
                    prediction_data[feature.name] = feature_df["pct_blk_a"].mean()
                elif feature.name == "pct_stl_a":
                    prediction_data[feature.name] = feature_df["pct_stl_a"].mean()
            else:
                prediction_data[feature.name] = self.feature_extractor.extract_prediction_feature_value(
                    feature, game_data, feature_df
                )
        
        prediction_features = pd.DataFrame([prediction_data])
        
        # Make prediction and apply adjustments
        predicted_value = model.predict(prediction_features)[0]
        import numpy as np
        from shared.constants import bias
        from shared.utils import round_prop
        
        sd = np.std(y_values, ddof=1)
        final_prop = predicted_value + bias * sd
        
        if np.isnan(final_prop) or np.isinf(final_prop):
            return 0.0
            
        return round_prop(final_prop)
    
    def get_available_stats(self) -> list[str]:
        """Get list of available NBA stats (auto-generated!)"""
        return get_nba_stats_list()
