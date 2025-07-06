"""
Auto-registration system for prop stats.
This eliminates the need to manually update multiple places when adding new stats.
"""

from typing import Any, Callable, Dict, Generic, List, TypeVar

from .base import PropConfig

T = TypeVar("T")


class StatRegistry(Generic[T]):
    """Registry for automatically managing prop stat configurations"""

    def __init__(self, league: str):
        self.league = league
        self._configs: Dict[str, PropConfig] = {}
        self._config_functions: Dict[str, Callable[[], PropConfig]] = {}
        self._stats_list: List[str] = []
        self._finalized = False

    def register(self, func: Callable[[], PropConfig]) -> Callable[[], PropConfig]:
        """
        Decorator to register a stat configuration function.

        Usage:
        @nba_registry.register
        def pts_config() -> PropConfig:
            return PropConfig(...)
        """
        # Extract stat name from function name (remove '_config' suffix)
        stat_name = func.__name__.replace("_config", "")

        if stat_name in self._config_functions:
            raise ValueError(
                f"Stat '{stat_name}' is already registered in {self.league} registry"
            )

        self._config_functions[stat_name] = func

        # Add to stats list if not already there
        if stat_name not in self._stats_list:
            self._stats_list.append(stat_name)

        return func

    def get_configs(self) -> Dict[str, PropConfig]:
        """Get all registered prop configurations"""
        if not self._finalized:
            self._finalize_configs()
        return self._configs.copy()

    def get_stats_list(self) -> List[str]:
        """Get list of all registered stat names"""
        return self._stats_list.copy()

    def get_config(self, stat_name: str) -> PropConfig:
        """Get configuration for a specific stat"""
        if not self._finalized:
            self._finalize_configs()

        if stat_name not in self._configs:
            available = ", ".join(self._stats_list)
            raise ValueError(
                f"Unknown {self.league} stat: '{stat_name}'. Available: {available}"
            )

        return self._configs[stat_name]

    def _finalize_configs(self):
        """Build all configurations from registered functions"""
        if self._finalized:
            return

        for stat_name, config_func in self._config_functions.items():
            try:
                config = config_func()
                # Validate that the config stat_name matches the function name
                if config.stat_name != stat_name:
                    raise ValueError(
                        f"Config stat_name '{config.stat_name}' doesn't match "
                        f"function name '{stat_name}' (expected '{stat_name}_config')"
                    )
                self._configs[stat_name] = config
            except Exception as e:
                raise RuntimeError(
                    f"Error building config for {self.league} stat '{stat_name}': {e}"
                )

        self._finalized = True

    def validate_all_configs(self):
        """Validate all registered configurations (call at module import)"""
        try:
            self._finalize_configs()
            print(
                f"✅ {self.league.upper()} registry: Successfully registered {len(self._configs)} stats: {', '.join(self._stats_list)}"
            )
        except Exception as e:
            print(f"❌ {self.league.upper()} registry validation failed: {e}")
            raise


# Create league-specific registries
nba_registry = StatRegistry[Any]("NBA")
mlb_registry = StatRegistry[Any]("MLB")


# Convenience decorators
def register_nba_stat(func: Callable[[], PropConfig]) -> Callable[[], PropConfig]:
    """Decorator to register an NBA stat configuration"""
    return nba_registry.register(func)


def register_mlb_stat(func: Callable[[], PropConfig]) -> Callable[[], PropConfig]:
    """Decorator to register an MLB stat configuration"""
    return mlb_registry.register(func)
