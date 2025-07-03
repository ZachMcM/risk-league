import os

from dotenv import load_dotenv

load_dotenv()

bias_gaussian_mean = float(os.getenv("BIAS_GAUSSIAN_MEAN"))
bias_gaussian_sd = float(os.getenv("BIAS_GAUSSIAN_SD"))
bias_lower_bound = float(os.getenv("BIAS_LOWER_BOUND"))
bias_upper_bound = float(os.getenv("BIAS_UPPER_BOUND"))