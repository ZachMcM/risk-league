import logging
import json
from pythonjsonlogger.json import JsonFormatter


class UnicodeJsonFormatter(JsonFormatter):
    """Custom JSON formatter that preserves Unicode characters like emojis."""
    
    def jsonify_log_record(self, log_record):
        """Override to ensure Unicode characters are not escaped."""
        return json.dumps(log_record, ensure_ascii=False, default=str)


def calculate_weighted_arithmetic_mean(values: list[float]) -> float:
    """Calculate weighted arithmetic mean with increasing weights.

    Args:
        values: List of float values

    Returns:
        Weighted arithmetic mean where later values have higher weights
    """
    numerator = 0
    denominator = 0

    for i, value in enumerate(values):
        weight = i + 1
        numerator += weight * value
        denominator += weight

    return numerator / denominator


def safe_float(value):
    """Safely convert a value to float, returning None if conversion fails"""
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def round_prop(line) -> float:
    """Round prop values to nearest 0.5.

    Args:
        line: The prop line value to round

    Returns:
        Rounded value to nearest 0.5
    """
    return round(round(line / 0.5) * 0.5, 1)


def setup_logger(name: str | None = None, level: int = logging.INFO):
    """Creates a new logger with proper JSON configuration.
    
    Args:
        name: Logger name (defaults to calling module name)
        level: Logging level (defaults to INFO)
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Avoid adding multiple handlers to the same logger
    if logger.handlers:
        return logger
    
    logger.setLevel(level)
    
    handler = logging.StreamHandler()
    handler.setFormatter(UnicodeJsonFormatter())
    
    logger.addHandler(handler)
    
    # Prevent propagation to root logger to avoid duplicate messages
    logger.propagate = False
    
    return logger
