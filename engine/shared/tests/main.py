import unittest
from shared.db_utils import send_parlay_picks_message
from dotenv import load_dotenv
from sqlalchemy import create_engine
import os 
 
load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))

class TestStringMethods(unittest.TestCase):
    def test_send_parlay_picks_message(self):
        send_parlay_picks_message(engine, "777227")
        self.assertEqual(True, True)

if __name__ == '__main__':
    unittest.main()