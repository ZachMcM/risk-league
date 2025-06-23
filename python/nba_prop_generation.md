# NBA Prop Generation
The prop generation code was written by Zach McMullen with the intention of simulating the lines of DFS (Daily Fantasy Sports) books like PrizePicks and Betr. This document is a high level overview of the system that generates props.

## Sample Sizes
We use a sample size of $10$ games for all of our dating processing. 

### Sample Size Rationale For Line Calculation
We choose $10$ because it is a low enough sample size to introduce some variability in the lines generated from day to day. If we pick a sample size too large then the props will be too deterministic as the projected lines will start to trend too much towards a player's season average (Law of Large Numbers and Central Limit Theorem). If we pick a sample size too low the lines will tend to be too volatile and will only represent recent play. 

### Sample Size Rationale For Eligibility Determination
We also chose a sample size of $10$ because it better suited how we want our prop eligiblity determination to work. Our goal is to generate lines that represent a player's overall trends as well as how they have been playing recently. Having a lower sample size generates more props because if player's have a stretch of good games, the computed sample means will represent the recent games more and allow the player to meet eligibility requirements. If we had a higher sample size, the recent good play will matter less as the computed sample means will trend toward the true population mean (Law of Large Numbers and Central Limit Theorem) and players will be less likely to eligibility thresholds. We want players with spurts of good play to have props created, not just the typical superstars and stat leaders. This introduces some variability and fun to our system.

## Eligibility Pipeline
We first compute the league sample mean and standard deviation for a particular stat for the season. If the game context is a playoff game then we try to use only playoff data. If there is enough data (30 games ish so 12 players times 30 games is 360, the number we use). Then we just use straight playoff games. If there is not enough then we combine both playoff and regular season games. We check if the player passes a secondary mintues thershold (15 mpg) to make sure they are a regular in the line up, and if their sample mean is greater than or equal to some small $k$ standard deviations below the mean. 
$$
\text{player}_{\bar{x}} \ge k \cdot \text{league}_{\bar{x}}
$$

## Line Calculation Pipeline
Our goal with prop generation is to mimic that of DFS books like PrizePicks and Betr. That is having a house edge (some standard bias constant), but also introducing a bit of randomized but controlled variability as this is a video game. 

### Linear Regression
The heart of our prop generation is Linear Regression. We use Scikit-learn's linear regression library in python. How does linear regression work and how do we apply it to our use case? Linear regression is essentially coming up with a linear equation for a scatter plot of points. Linear regression comes up with a "line of best fit" to represent the relationship linearly. Information about how linear regression comes up with this line [here](https://www.ncl.ac.uk/webtemplate/ask-assets/external/maths-resources/statistics/regression-and-correlation/simple-linear-regression.html). We want a linear line because we can plug in some x values and then get a predicted y value. In our case the x values or our feature variables are various stats that impact what stat we are trying to predict. Every stat will typically include things likes defensive and offensive ratings, pace, minutes per game, but also specific stats the directly effect what we are trying to predict. For example three pointers attempted will be a feature variable for predicting points. Once we create a plot with our feature variables on the x-axis and our variable to predict on the y-axis. We plug in the sample means for all the feature variables and that is the projected value of the specific stat. With that projected value we then apply a "house edge" or some bias constant. This is a very small value that we multiple by the sample standard deviation of the data.
$$
\text{final line} = \text{projected} + s \cdot \text{bias}
$$
This practice adds a little bit of variability to the prop generation. If we just use the projected, then users will be betting against a line that looks something like the sample mean. This could be too unfair in some cases and too easy in other cases depending on the player and their typical play. We also use some randomization to derive the bias. We have a standard bias of $0.15$. We then plug that into a Gaussian distribution as the mean with a standard deviation of $0.03$. We pick a random value from that distribution $0.1 \le x \le 0.3$. So our bias can range anywhere from $0.1$ to $0.3$ with the majority of values being close to $0.15$. This makes it so in separate runs of the same game, a prop could differ by $0.5$, something we want to have.

### Final Rounding
As all DFS platforms do, we round our final props to the nearest 0.5. This is a very important aspect of sports betting as it enhances both the challenge and engagement of the system.

## Wrapping up
All NBA prop generation code is located in `/scripts/nba_generate_props.py`, `/scripts/nba_eligibility.py`, and `/scripts/nba_regression.py`. See there for exact implementation.