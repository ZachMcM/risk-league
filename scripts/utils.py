import datetime

def clean_minutes(min_str):
  if isinstance(min_str, str) and ':' in min_str:
    mins, _ = min_str.split(':')
    return int(mins)
  return 0

def get_current_season():
    now = datetime.datetime.now()
    year = now.year
    
    if now.month < 10:  # Before October, use last season
        return f"{year - 1}-{str(year)[-2:]}"
    else:  # From October onwards, use current season 
        return f"{year}-{str(year + 1)[-2:]}"
      
def remove_decimals_from_string_id(s):
  if '.' in s:
    s = s.split('.')[0]
  return s