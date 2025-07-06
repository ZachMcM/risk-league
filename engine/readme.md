# Risk League Engine

A sophisticated sports betting engine that combines real-time data processing, machine learning-based prop generation, and comprehensive resolution mechanics for NBA and MLB games.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Pipeline](#data-pipeline)
3. [Component Overview](#component-overview)
4. [Mathematical Models](#mathematical-models)
5. [Prop Generation System](#prop-generation-system)
6. [Resolution Engine](#resolution-engine)
7. [Usage Guide](#usage-guide)
8. [API Reference](#api-reference)

---

## System Architecture

The Risk League engine follows a modular architecture with distinct phases:

```
Data Ingestion  ->  Prop Generation  ->  Real-time Sync
      |                   |                    |
      v                   v                    v
 Player/Team         ML Models          Live Updates
 Data Updates    (Ridge/Poisson)    (60s intervals)
                                           |
                                           v
                                   Resolution Chain
                                  Props -> Picks ->
                                  Parlays -> Matches
```

---

## Data Pipeline

### 1. Data Ingestion Phase

#### NBA Data Flow
```
NBA API -> Game Data -> Team Stats -> Player Stats -> Advanced Stats -> Database
```

#### MLB Data Flow
```
MLB API -> Game Data -> Team Stats -> Player Stats -> Sabermetrics -> Database
```

### 2. Prop Generation Phase
```
Historical Data -> Feature Engineering -> ML Models -> Prop Lines -> Database
```

### 3. Real-time Sync Phase
```
Live Game Data -> Prop Updates -> Redis Pub/Sub -> Resolution Triggers
```

### 4. Resolution Phase
```
Prop Resolution -> Pick Updates -> Parlay Resolution -> Match Resolution -> ELO Updates
```

---

## Component Overview

### Data Update Components

### `update_stats.py`

**Purpose**: Updates database with previous day's game statistics from official league APIs.

#### NBA Implementation
- **Data Source**: NBA API (`nba_api`)
- **Statistics Updated**:
  - Basic stats: Points, rebounds, assists, steals, blocks
  - Advanced stats: True shooting percentage, usage rate, rebounding percentages
  - Team stats: Offensive/defensive ratings, pace, turnover rates

#### MLB Implementation  
- **Data Source**: MLB Stats API (`statsapi`)
- **Statistics Updated**:
  - Batting: Hits, home runs, RBI, batting average, OPS
  - Pitching: Earned runs, strikeouts, WHIP, ERA
  - Fielding: Errors, assists, putouts, fielding percentage

**Mathematical Concepts**:
- **True Shooting %**: $TS\% = \frac{PTS}{2 \times (FGA + 0.44 \times FTA)}$
- **Usage Rate**: $USG\% = \frac{100 \times ((FGA + 0.44 \times FTA + TOV) \times (Tm MP / 5))}{MP \times (Tm FGA + 0.44 \times Tm FTA + Tm TOV)}$
- **OPS**: $OPS = OBP + SLG = \frac{H + BB + HBP}{AB + BB + HBP + SF} + \frac{TB}{AB}$

### `update_players.py`

**Purpose**: Maintains current team rosters and player information.

- **NBA**: Updates all 30 team rosters with current player information
- **MLB**: Updates all team rosters with position-specific data
- **Upsert Logic**: Handles roster changes, trades, and call-ups/send-downs

---

## Real-time Synchronization

### `sync_props.py`

**Purpose**: Real-time synchronization of prop values with live game data.

#### Key Features:
- **Update Interval**: 60-second polling of live games
- **Prop Status Management**: Tracks in-progress vs final props
- **Combined Stats**: Automatically calculates multi-stat props (PRA, Points+Assists, etc.)
- **Resolution Triggers**: Publishes Redis messages when props finalize

#### NBA Sync Logic:
```python
# Combined stat calculation example
pra_value = player_stats.points + player_stats.rebounds + player_stats.assists
prop_status = "final" if game_status == "Final" else "in_progress"
```

#### MLB Sync Logic:
```python
# Auto-registration system integration
mlb_stats = get_mlb_stats_list()  # From registry
for stat in mlb_stats:
    if stat in player_data:
        update_prop(stat, player_id, game_id, player_data[stat])
```

---

## Prop Generation System

### Architecture Overview

The prop generation system uses a sophisticated **auto-registration framework** with machine learning models to generate competitive prop lines.

#### Core Components:

1. **Registry System** (`registry.py`): Auto-registration of stat configurations
2. **Feature Extraction** (`features.py`): Scope-aware feature engineering
3. **Model Generation** (`generator.py`): ML pipeline with bias adjustment
4. **Base Framework** (`base.py`): Abstract interfaces for sport-agnostic implementation

### Auto-Registration System

**Purpose**: Eliminates manual synchronization when adding new statistics.

#### Before (Manual System):
```python
# 3 places to update manually
stats_arr = ["pts", "reb", "ast"]           # 1. Manual list
Stat = Literal["pts", "reb", "ast"]         # 2. Manual type  
configs["pts"] = PropConfig(...)            # 3. Manual config
```

#### After (Auto-Registration):
```python
# 1 place only - automatically registered
@register_nba_stat
def pts_config() -> PropConfig:
    return PropConfig(
        stat_name="pts",
        target_field="pts",
        features=[...],
        model_type=ModelType.RIDGE
    )
```

### Machine Learning Models

#### Ridge Regression
**Use Case**: Continuous statistics (points, rebounds, assists)

#### Poisson Regression
**Use Case**: Count-based statistics (home runs, blocks, steals)

- Better suited for discrete, non-negative counts

### Feature Engineering

#### Data Scopes

The feature extraction system uses different data sources depending on whether we're training a model or making a prediction:

- **PLAYER**: Individual player historical performance (same for training and prediction)
- **TEAM**: Player's team performance context (same for training and prediction)
- **OPPONENT_TEAM**: Opponent team characteristics
  - *Training*: Uses `opponent_team_games` (historical opponents the player actually faced)
  - *Prediction*: Uses `matchup_team_games` (upcoming opponent's defensive stats)
- **MATCHUP_TEAM**: Upcoming opponent team data (primarily used for prediction)

**Key Insight**: During training, OPPONENT_TEAM features learn from the variety of defenses a player has faced historically. During prediction, these same features use the specific defensive characteristics of the upcoming opponent to make accurate projections.

#### Feature Calculation
```python
# Weighted arithmetic mean with time decay
def calculate_weighted_arithmetic_mean(values: List[float], weights: Optional[List[float]] = None) -> float:
    if weights:
        return sum(v * w for v, w in zip(values, weights)) / sum(weights)
    return sum(values) / len(values)
```

#### Safe Expression Evaluation
```python
# Secure calculation of derived features
def _calculate_derived_feature(self, calculation: str, source_data: List[Any]) -> List[float]:
    # Example: "fgm / fga * 100 if fga > 0 else 0"
    namespace = {attr: getattr(game, attr) for attr in game_attributes}
    result = eval(calculation, {"__builtins__": {}}, namespace)
    return [float(result) if not math.isnan(result) else 0.0]
```

### Prop Line Generation

#### Bias Adjustment Formula
$$\text{Final Prop} = \text{Predicted Value} + \text{bias} \times \sigma$$

Where:
- $\text{bias}$ = conservative adjustment coefficient (typically 0.1-0.3)
- $\sigma$ = standard deviation of historical target values
- Ensures prop lines favor the house while remaining competitive

#### Complete Pipeline:
1. **Data Collection**: Historical games for player/team/opponent context
2. **Feature Engineering**: Extract and calculate relevant statistics
3. **Model Training**: Ridge/Poisson regression with cross-validation
4. **Prediction**: Generate base prop line
5. **Bias Adjustment**: Apply conservative adjustment
6. **Validation**: Ensure prop line is reasonable (>0, not NaN/Inf)

---

## Resolution Engine

### Match Resolution (`resolve_matches.py`)

**Purpose**: Resolves daily matches when all games are complete, determining winners and updating ELO ratings.

#### ELO Rating System

**Mathematical Foundation**: Based on Arpad Elo's original chess rating system.

**Core Formula**:
$$R'_A = R_A + K \times (S_A - E_A)$$

Where:
- $R'_A$ = New rating for player A
- $R_A$ = Current rating for player A  
- $K$ = Rating coefficient (typically 32 for new players, 16 for established)
- $S_A$ = Actual score (1 for win, 0.5 for tie, 0 for loss)
- $E_A$ = Expected score

**Expected Score Calculation**:
$$E_A = \frac{1}{1 + 10^{(R_B - R_A)/400}}$$

**Key Properties**:
- Zero-sum system: $\Delta R_A = -\Delta R_B$
- Larger rating differences = smaller adjustments for favorites
- 400-point difference ≈ 90% win probability

#### Data Flow:
1. **Redis Pub/Sub**: Receives prop resolution messages
2. **Bulk Updates**: Updates all picks for resolved prop
3. **Parlay Triggers**: Publishes messages to trigger parlay resolution

### Parlay Resolution (`resolve_parlays.py`)

**Purpose**: Resolves complete parlays when all picks are determined.

#### Parlay Multipliers:
```python
PARLAY_MULTIPLIERS = {
    1: 1.0,    # Single pick
    2: 2.6,    # 2-pick parlay
    3: 6.0,    # 3-pick parlay
    4: 12.0,   # 4-pick parlay
    5: 25.0,   # 5-pick parlay
    6: 50.0,   # 6-pick parlay
    # Higher multipliers for more picks
}
```

#### Resolution Requirements:
- **All picks must be resolved** before parlay can be determined
- **Single miss = entire parlay loss** (no partial payouts)
- **Push handling**: Reduces parlay to remaining picks

---

## Usage Guide

### Daily Operations

#### 1. Update Historical Data
```bash
# Update yesterday's NBA games and stats
PYTHONPATH=. python nba/update_stats.py

# Update yesterday's MLB games and stats  
PYTHONPATH=. python mlb/update_stats.py

# Update team rosters (weekly)
PYTHONPATH=. python nba/update_players.py
PYTHONPATH=. python mlb/update_players.py
```

#### 2. Generate Props for Today
```bash
# Generate NBA props for today's games
PYTHONPATH=. python nba/create_props.py

# Generate MLB props for today's games
PYTHONPATH=. python mlb/create_props.py

# Generate for specific test date
PYTHONPATH=. python nba/create_props.py "01/15/2024"
```

#### 3. Real-time Monitoring
```bash
# Start NBA prop synchronization (runs continuously)
PYTHONPATH=. python nba/sync_props.py

# Start MLB prop synchronization (runs continuously)
PYTHONPATH=. python mlb/sync_props.py
```

#### 4. Resolution (Automated)
```bash
# Runs automatically when props resolve
PYTHONPATH=. python system/resolve_parlay_picks.py

# Runs automatically when parlays resolve  
PYTHONPATH=. python system/resolve_parlays.py

# Runs automatically when all games complete
PYTHONPATH=. python system/resolve_matches.py
```

### Adding New Statistics

#### Example: Adding "Free Throw Percentage" to NBA

```python
# In nba/prop_configs.py
@register_nba_stat
def ft_pct_config() -> PropConfig:
    """Free throw percentage configuration"""
    return PropConfig(
        stat_name="ft_pct",
        target_field="ft_pct",
        features=[
            FeatureDefinition("ftm", "ftm", DataScope.PLAYER),
            FeatureDefinition("fta", "fta", DataScope.PLAYER),
            FeatureDefinition("ft_pct", "ft_pct", DataScope.PLAYER),
            FeatureDefinition("usage_rate", "usage_rate", DataScope.PLAYER),
            FeatureDefinition("pressure_situations", "clutch_fta", DataScope.PLAYER),
        ],
        model_type=ModelType.RIDGE,
        model_params={"alpha": 0.5}
    )
```

**That's it!** The stat is automatically:
- ✅ Added to the available stats list
- ✅ Available to the prop generator
- ✅ Validated at import time
- ✅ Ready for prop generation

---

## API Reference

### Core Database Functions

#### `get_player_last_games(session, player_id, league, n_games)`
Retrieves historical performance data for a player.

**Parameters**:
- `session`: SQLAlchemy session
- `player_id`: Player identifier
- `league`: "nba" or "mlb"
- `n_games`: Number of recent games to retrieve

**Returns**: List of player game statistics

#### `insert_prop(session, line, game_id, player_id, stat, game_time, league)`
Creates a new prop with upsert logic.

**Parameters**:
- `line`: Prop line value
- `game_id`: Game identifier
- `player_id`: Player identifier
- `stat`: Statistic name
- `game_time`: Game start time
- `league`: "nba" or "mlb"

### Prop Generation Classes

#### `PropConfig`
Configuration class for prop generation.

```python
@dataclass
class PropConfig:
    stat_name: str
    target_field: str
    features: List[FeatureDefinition]
    model_type: ModelType
    model_params: Optional[Dict[str, Any]] = None
```

#### `FeatureDefinition`
Defines a feature for model training.

```python
@dataclass
class FeatureDefinition:
    name: str           # Feature name in dataset
    field: str          # Database field name
    scope: DataScope    # PLAYER/TEAM/OPPONENT_TEAM/MATCHUP_TEAM
    calculation: Optional[str] = None  # Optional derived calculation
```

### Model Types

#### `ModelType.RIDGE`
Ridge regression for continuous statistics.
- **Best for**: Points, rebounds, assists, minutes
- **Handles**: Linear relationships with regularization

#### `ModelType.POISSON`
Poisson regression for count-based statistics.
- **Best for**: Home runs, blocks, steals, turnovers
- **Handles**: Discrete, non-negative counts

---

## Mathematical Foundations

### Statistical Concepts

#### Weighted Arithmetic Mean
$$\bar{x}_w = \frac{\sum_{i=1}^n w_i x_i}{\sum_{i=1}^n w_i}$$

Used for time-weighted player performance where recent games have higher weight.

#### Standard Deviation (Population)
$$\sigma = \sqrt{\frac{\sum_{i=1}^n (x_i - \mu)^2}{n}}$$

Used for bias adjustment and eligibility thresholds.

#### Confidence Intervals
$$CI = \bar{x} \pm z_{\alpha/2} \cdot \frac{\sigma}{\sqrt{n}}$$

Used to determine reasonable prop line ranges.

### Machine Learning Foundations

#### Ridge Regression Objective Function
$$J(\beta) = \|y - X\beta\|_2^2 + \alpha\|\beta\|_2^2$$

Minimizes prediction error while penalizing large coefficients.

#### Poisson Regression Log-Likelihood
$$\ell(\beta) = \sum_{i=1}^n [y_i \log(\lambda_i) - \lambda_i - \log(y_i!)]$$

Where $\lambda_i = \exp(x_i^T\beta)$ is the expected count.

---

## Error Handling

### Common Issues

#### 3. Invalid Predictions
```python
if np.isnan(final_prop) or np.isinf(final_prop) or final_prop <= 0:
    print(f"Invalid prop value: {final_prop}")
    return 0.0
```

---

*Risk League Engine v0.0.1 - Sophisticated sports betting with machine learning*