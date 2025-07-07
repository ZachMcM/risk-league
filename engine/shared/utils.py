import json

import pandas as pd


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
