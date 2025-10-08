#!/usr/bin/env python3
"""
Test program for get_active_players_for_team() function.
Usage: python test_get_active_players.py <league> <team_id>
Example: python test_get_active_players.py NFL 1
"""

import sys
from db.players import get_active_players_for_team


def main():
    if len(sys.argv) != 3:
        print("Usage: python test_get_active_players.py <league> <team_id>")
        print("Example: python test_get_active_players.py NFL 1")
        sys.exit(1)

    league = sys.argv[1]
    try:
        team_id = int(sys.argv[2])
    except ValueError:
        print(f"Error: team_id must be an integer, got '{sys.argv[2]}'")
        sys.exit(1)

    print(f"\nFetching active players for team {team_id} in {league}...\n")

    try:
        players = get_active_players_for_team(league, team_id)

        if not players:
            print("No active players found.")
        else:
            print(f"Found {len(players)} active player(s):\n")
            print("-" * 80)
            for i, player in enumerate(players, 1):
                print(f"{i}. {player['name']}")
                print(f"   Player ID: {player['player_id']}")
                print(f"   Position: {player['position']}")
                print(f"   Number: {player['number']}")
                print(f"   Status: {player['status']}")
                print(f"   Height: {player['height']}")
                print(f"   Weight: {player['weight']}")
                print(f"   Updated: {player['updated_at']}")
                print("-" * 80)

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
