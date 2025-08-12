def convert_minutes_to_decimal(minutes_str):
    """Convert MM:SS format to decimal minutes"""
    if isinstance(minutes_str, str):
        if ":" in minutes_str:
            minutes, seconds = minutes_str.split(":")
            return int(minutes) + int(seconds) / 60.0
        elif "-" in minutes_str:
            # Handle cases like "0-0" which seem to be records, not minutes
            return 0.0
        else:
            # Try to convert to float, return 0.0 if it fails
            try:
                return float(minutes_str)
            except ValueError:
                return 0.0
    return float(minutes_str) if minutes_str else 0.0