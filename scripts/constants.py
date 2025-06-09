from typing import TypedDict

req_pause_time = 0.6

class ConstantSet(TypedDict):
  standard: float
  fallback: float
  
class StatConstants(TypedDict):
  pts: ConstantSet
  reb: ConstantSet
  ast: ConstantSet
  three_pm: ConstantSet
  blk: ConstantSet
  stl: ConstantSet
  tov: ConstantSet
  pra: ConstantSet
  fantasy_score: ConstantSet
  reb_ast: ConstantSet
  pts_ast: ConstantSet

constants: StatConstants = {
  "pts": {
    "standard": 2,
    "fallback": -0.5
  },
  "reb": {
    "standard": 1.5,
    "fallback": -0.4
  },
  "ast": {
    "standard": 1,
    "fallback": -0.3
  },
  "three_pm": {
    "standard": 1,
    "fallback": -0.2
  },
  "blk": {
    "standard": 0.5,
    "fallback": -0.2,
  },
  "stl": {
    "standard": 0.5,
    "fallback": -0.2
  },
  "tov": {
    "standard": 0.7,
    "fallback": -0.3
  },
  "pra": {
    "standard": 4,
    "fallback": -1.5
  },
  "fantasy_score": {
    "standard": 5,
    "fallback": -2
  },
  "pts_ast": {
    "standard": 3,
    "fallback": -0.8
  },
  "reb_ast": {
    "standard": 2.5,
    "fallback": -0.7
  }
}