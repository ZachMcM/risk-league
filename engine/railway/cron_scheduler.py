import schedule
import time
import subprocess
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_command(command, job_name):
    """Run a command and log the result"""
    try:
        logger.info(f"Starting {job_name} at {datetime.now()}")
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            logger.info(f"{job_name} completed successfully")
        else:
            logger.error(f"{job_name} failed with return code {result.returncode}")
            logger.error(f"Error output: {result.stderr}")
    except Exception as e:
        logger.error(f"Exception running {job_name}: {str(e)}")

def update_players_mlb():
    run_command("python -m mlb.update_players", "MLB Update Players")

def update_players_nba():
    run_command("python -m nba.update_players", "NBA Update Players")

def update_stats_mlb():
    run_command("python -m mlb.update_stats", "MLB Update Stats")

def update_stats_nba():
    run_command("python -m nba.update_stats", "NBA Update Stats")

def create_props_mlb():
    run_command("python -m mlb.create_props", "MLB Create Props")

def create_props_nba():
    run_command("python -m nba.create_props", "NBA Create Props")

# Schedule jobs (EST times)
schedule.every().day.at("03:00").do(update_players_mlb)
schedule.every().day.at("03:00").do(update_players_nba)
schedule.every().day.at("03:30").do(update_stats_mlb)
schedule.every().day.at("03:30").do(update_stats_nba)
schedule.every().day.at("04:00").do(create_props_mlb)
schedule.every().day.at("04:00").do(create_props_nba)

def main():
    logger.info("Starting Railway cron scheduler")
    logger.info("Scheduled jobs:")
    logger.info("- Update Players (MLB/NBA): 3:00 AM EST")
    logger.info("- Update Stats (MLB/NBA): 3:30 AM EST")
    logger.info("- Create Props (MLB/NBA): 4:00 AM EST")
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    main()