import os

from dotenv import load_dotenv

load_dotenv()

req_pause_time = float(os.getenv("REQ_PAUSE_TIME"))
minutes_threshold = int(os.getenv("MINUTES_THRESHOLD"))

n_games = int(os.getenv("N_GAMES"))

bias_gaussian_mean = float(os.getenv("BIAS_GAUSSIAN_MEAN"))
bias_gaussian_sd = float(os.getenv("BIAS_GAUSSIAN_SD"))
bias_lower_bound = float(os.getenv("BIAS_LOWER_BOUND"))
bias_upper_bound = float(os.getenv("BIAS_UPPER_BOUND"))

strict_k_high_volume = float(os.getenv("STRICT_K_HIGH_VOLUME"))
strict_k_low_volume = float(os.getenv("STRICT_K_LOW_VOLUME"))
soft_k_subtrahend = float(os.getenv("SOFT_K_SUBTRAHEND"))
secondary_fallback_pct = float(os.getenv("SECONDARY_FALLBACK_PCT"))
