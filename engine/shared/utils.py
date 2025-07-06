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


def pretty_print(data):
    """Pretty print JSON data with indentation.

    Args:
        data: Data to be formatted and printed
    """
    formatted_json = json.dumps(data, indent=4)
    print(formatted_json)


def json_to_csv(json_data, csv_path="../tmp/out.csv"):
    """Convert JSON data to CSV format.

    Args:
        json_data: JSON data to convert
        csv_path: Output CSV file path (default: "../tmp/out.csv")
    """
    df = pd.DataFrame(json_data)
    df.to_csv(csv_path, index=False)


def dump_json(json_data, path="../tmp/json"):
    """Dump JSON data to a file.

    Args:
        json_data: JSON data to dump
        path: Output file path (default: "../tmp/json")
    """
    with open(path, "w") as json_file:
        json.dump(json_data, json_file, indent=4, default=str)


def db_response_to_json(res, field=None):
    """Convert database response to JSON format.

    Args:
        res: Database response object
        field: Optional specific field to extract

    Returns:
        JSON representation of the database response
    """
    # Handle single row
    if hasattr(res, "_mapping"):
        if field is not None:
            return dict(res._mapping)[field]
        else:
            return dict(res._mapping)

    # Handle multiple rows
    if field is not None:
        return [dict(row._mapping)[field] for row in res]
    else:
        return [dict(row._mapping) for row in res]


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
