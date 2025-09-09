import os
import logging
import json
from pythonjsonlogger.json import JsonFormatter
from dotenv import load_dotenv
from typing import Literal, Optional
from datetime import datetime, timezone

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


def setup_logger(name: str, level: int = logging.INFO):
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


def server_req(
    route: str,
    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH"],
    body: Optional[str] = None,
    files: Optional[dict] = None,
    max_retries: int = 3,
):
    """Make authenticated requests to the server API with retry logic for DNS failures.

    Args:
        route: API route (e.g., '/teams')
        method: HTTP method
        body: JSON string body for request (optional)
        files: Dictionary of files for multipart form data (optional)
        max_retries: Maximum number of retry attempts for DNS/connection errors

    Returns:
        Response object from requests

    Raises:
        requests.HTTPError: If response status is not 200
        requests.ConnectionError: If connection fails after all retries
    """
    import requests
    import time
    from urllib3.exceptions import NameResolutionError

    SERVER_API_BASE_URL = getenv_required("SERVER_API_BASE_URL")
    SERVER_API_KEY = getenv_required("SERVER_API_KEY")

    url = f"{SERVER_API_BASE_URL}{route}"
    headers = {"x-api-key": SERVER_API_KEY}
    
    # Only set Content-Type for JSON if no files are being sent
    if not files:
        headers["Content-Type"] = "application/json"

    for attempt in range(max_retries + 1):
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=headers, data=body, files=files, timeout=30)
            elif method == "PUT":
                response = requests.put(url, headers=headers, data=body, files=files, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, data=body, files=files, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            if response.status_code not in [200, 304]:
                raise requests.HTTPError(
                    f"Server request failed: {response.status_code} {response.reason}. Response: {response.text}",
                    response=response,
                )

            return response

        except requests.ConnectionError as e:
            # Check if it's a DNS resolution error
            if "Failed to resolve" in str(e) or "Name or service not known" in str(e):
                if attempt < max_retries:
                    wait_time = (2 ** attempt) + (attempt * 0.1)  # Exponential backoff with jitter
                    logging.getLogger(__name__).warning(
                        f"DNS resolution failed for {url} (attempt {attempt + 1}/{max_retries + 1}). "
                        f"Retrying in {wait_time:.1f} seconds..."
                    )
                    time.sleep(wait_time)
                    continue
                else:
                    logging.getLogger(__name__).error(
                        f"DNS resolution failed for {url} after {max_retries + 1} attempts. Giving up."
                    )
                    raise
            else:
                # For non-DNS connection errors, don't retry
                raise


def data_feeds_req(route: str):
    """Make authenticated GET requests to the data feeds API.

    Args:
        route: API route (e.g., '/team-info/MLB')

    Returns:
        Response object from requests

    Raises:
        requests.HTTPError: If response status is not 200
    """
    import requests

    DATA_FEEDS_API_TOKEN = getenv_required("DATA_FEEDS_API_TOKEN")
    DATA_FEEDS_BASE_URL = getenv_required("DATA_FEEDS_BASE_URL")

    url = f"{DATA_FEEDS_BASE_URL}{route}?RSC_token={DATA_FEEDS_API_TOKEN}"

    response = requests.get(url, timeout=30)

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


