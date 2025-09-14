import psycopg 
from utils import getenv_required

def get_connection():
    """Get a database connection"""
    return psycopg.connect(getenv_required("DATABASE_URL"))