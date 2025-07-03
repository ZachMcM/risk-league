import os
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert as pg_insert
import json
import pandas as pd
import numpy as np
from shared.constants import (
    bias_gaussian_mean,
    bias_gaussian_sd,
    bias_lower_bound,
    bias_upper_bound,
)


def pretty_print(data):
    formatted_json = json.dumps(data, indent=4)
    print(formatted_json)


def json_to_csv(json_data, csv_path="../tmp/out.csv"):
    df = pd.DataFrame(json_data)
    df.to_csv(csv_path, index=False)


def db_response_to_json(res, field=None):
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


def setup_database_connection():
    """Set up and return a database engine using environment variables"""
    return create_engine(os.getenv("DATABASE_URL"))


def safe_float(value):
    """Safely convert a value to float, returning None if conversion fails"""
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


# rounds props to 0.5
def round_prop(line) -> float:
    return round(round(line / 0.5) * 0.5, 1)


def get_bias() -> float:
    bias = np.random.normal(bias_gaussian_mean, bias_gaussian_sd)
    bias = np.clip(bias, bias_lower_bound, bias_upper_bound)
    return bias
