"""Date and time utilities for the risk-league engine."""

import pytz
from datetime import datetime, timedelta


# Define Eastern timezone for consistent date handling across the application
EASTERN_TZ = pytz.timezone('America/New_York')


def get_today_eastern() -> str:
    """Get today's date in Eastern timezone.
    
    Returns:
        str: Today's date in YYYY-MM-DD format
    """
    return datetime.now(EASTERN_TZ).strftime("%Y-%m-%d")


def get_eastern_datetime() -> datetime:
    """Get current datetime in Eastern timezone.
    
    Returns:
        datetime: Current datetime in Eastern timezone
    """
    return datetime.now(EASTERN_TZ)


def get_eastern_year() -> str:
    """Get current year in Eastern timezone.
    
    Returns:
        str: Current year in YYYY format
    """
    return datetime.now(EASTERN_TZ).strftime("%Y")


def get_yesterday_eastern() -> str:
    """Get yesterday's date in Eastern timezone.
    
    Returns:
        str: Yesterday's date in YYYY-MM-DD format
    """
    yesterday = datetime.now(EASTERN_TZ) - timedelta(days=1)
    return yesterday.strftime("%Y-%m-%d")


def get_eastern_date_formatted(date_format: str) -> str:
    """Get current date/time in Eastern timezone with custom format.
    
    Args:
        date_format (str): strftime format string
        
    Returns:
        str: Formatted date/time string
    """
    return datetime.now(EASTERN_TZ).strftime(date_format)


def get_yesterday_eastern_formatted(date_format: str) -> str:
    """Get yesterday's date in Eastern timezone with custom format.
    
    Args:
        date_format (str): strftime format string
        
    Returns:
        str: Formatted date/time string for yesterday
    """
    yesterday = datetime.now(EASTERN_TZ) - timedelta(days=1)
    return yesterday.strftime(date_format)