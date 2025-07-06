from shared.prop_generation.generator import BasePropGenerator
from shared.prop_generation.base import GameData
from shared.tables import MlbPlayerStats, MlbGames
from .prop_configs import get_mlb_prop_configs, get_mlb_stats_list

class MlbPropGenerator(BasePropGenerator[MlbPlayerStats, MlbGames]):
    """MLB-specific prop generator using auto-registration system"""
    
    def __init__(self):
        super().__init__()
        self.configs = get_mlb_prop_configs()  # Auto-generated from decorators!
    
    def generate_prop_for_stat(
        self, 
        stat_name: str,
        game_data: GameData[MlbPlayerStats, MlbGames]
    ) -> float:
        """Generate prop for a specific MLB stat"""
        
        if stat_name not in self.configs:
            available = ", ".join(self.get_available_stats())
            raise ValueError(f"Unknown MLB stat: {stat_name}. Available: {available}")
        
        config = self.configs[stat_name]
        return self.generate_prop(config, game_data)
    
    def get_available_stats(self) -> list[str]:
        """Get list of available MLB stats (auto-generated!)"""
        return get_mlb_stats_list()
    
    def print_registered_stats(self):
        """Print all registered MLB stats for debugging"""
        stats = self.get_available_stats()
        print(f"MLB Registered Stats ({len(stats)}): {', '.join(stats)}")