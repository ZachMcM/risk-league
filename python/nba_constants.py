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

sigma_coeff = float(os.getenv("SIGMA_COEFF"))
secondary_minutes_threshold = float(os.getenv("SECONDARY_MINUTES_THRESHOLD"))

min_num_stats = float(os.getenv("MIN_NUM_STATS"))
