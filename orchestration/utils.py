import json
import logging
import os
from datetime import datetime, timezone
from typing import Literal, Optional

from dotenv import load_dotenv
from pythonjsonlogger.json import JsonFormatter

load_dotenv()


def getenv_required(key: str) -> str:
    """Returns the specified ENV variable"""
    value = os.getenv(key)
    if value is None:
        raise ValueError(f"Required environment variable {key} is not set")
    return value


class UnicodeJsonFormatter(JsonFormatter):
    """Custom JSON formatter that preserves Unicode characters like emojis."""

    def jsonify_log_record(self, log_record):
        """Override to ensure Unicode characters are not escaped."""
        return json.dumps(log_record, ensure_ascii=False, default=str)


def server_req(
    route: str,
    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH"],
    body: Optional[str] = None,
    files: Optional[dict] = None,
    params: Optional[dict] = None,
):
    """Make authenticated requests to the server API.

    Args:
        route: API route (e.g., '/teams')
        method: HTTP method
        body: JSON string body for request (optional)
        files: Dictionary of files for multipart form data (optional)
        params: Dictionary of query parameters (optional)

    Returns:
        Response object from requests

    Raises:
        requests.HTTPError: If response status is not 200
    """
    import requests

    SERVER_API_BASE_URL = getenv_required("SERVER_API_BASE_URL")
    API_KEY = getenv_required("API_KEY")

    url = f"{SERVER_API_BASE_URL}{route}"
    headers = {"x-api-key": API_KEY}

    # Only set Content-Type for JSON if no files are being sent
    if not files:
        headers["Content-Type"] = "application/json"

    if method == "GET":
        response = requests.get(url, headers=headers, params=params, timeout=30)
    elif method == "POST":
        response = requests.post(
            url, headers=headers, data=body, files=files, params=params, timeout=30
        )
    elif method == "PUT":
        response = requests.put(
            url, headers=headers, data=body, files=files, params=params, timeout=30
        )
    elif method == "DELETE":
        response = requests.delete(url, headers=headers, params=params, timeout=30)
    elif method == "PATCH":
        response = requests.patch(
            url, headers=headers, data=body, files=files, params=params, timeout=30
        )
    else:
        raise ValueError(f"Unsupported HTTP method: {method}")

    if response.status_code not in [200, 304]:
        raise requests.HTTPError(
            f"Server request failed: {response.status_code} {response.reason}. Response: {response.text}",
            response=response,
        )

    return response


def data_feeds_req(route: str, params: Optional[dict] = None):
    """Make authenticated GET requests to the data feeds API.

    Args:
        route: API route (e.g., '/team-info/MLB')
        params: Dictionary of query parameters (optional)

    Returns:
        Response object from requests

    Raises:
        requests.HTTPError: If response status is not 200
    """
    import requests

    DATA_FEEDS_API_TOKEN = getenv_required("DATA_FEEDS_API_TOKEN")
    DATA_FEEDS_BASE_URL = getenv_required("DATA_FEEDS_BASE_URL")

    # Build base parameters with API token
    api_params = {"RSC_token": DATA_FEEDS_API_TOKEN}

    # Add any additional query parameters
    if params:
        api_params.update(params)

    url = f"{DATA_FEEDS_BASE_URL}{route}"

    response = requests.get(url, params=api_params, timeout=30)

    if response.status_code not in [200, 304]:
        raise requests.HTTPError(
            f"Data feeds request failed: {response.status_code} {response.reason}. Response: {response.text}",
            response=response,
        )

    return response


def convert_to_iso_utc(date_string: str):
    """Parses a given date string as a ISO UTC datestring"""
    parsed_date = datetime.strptime(date_string, "%a, %d %b %Y %H:%M:%S GMT")
    parsed_date = parsed_date.replace(tzinfo=timezone.utc)

    return parsed_date.isoformat()
