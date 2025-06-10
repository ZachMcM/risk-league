# Risk League

## Docs

### How To Start The Local Database
```
docker start local-postgres
```

## Prop Generation
We utilize statistical concepts like linear regression and the normal (gaussian) distribution in order to create the props

### Prop Eligibility
  - Players must average more than `minutes_threshold` mpg over their last `n_games` games
  - Check if player meets position average for the specific stat
    - If the player does not meet position average threshold we check if they meet a randomized value derived from the normal distribution of the position average with some constant applied

### Prop Generation
  - We use relevant stats as the x value and the target stat as the y value and create a best fit line with a linear regression model
  - We then input the averages for our x values and predict the next value
  - Once we have the predicted next value we use a truncated normal distribution with a max sigma of `max_sigma` to get the actual line
