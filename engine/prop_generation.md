# Prop Generation

Prop generation is powered by both Poisson Regression and Ridge Regression. 

## Ridge Regression

We use Ridge regression as our general purpose regression model due to its ability to handle multicollinearity as many of our independent variables are related to one another when trying to predict outcomes for sports betting. We also use Ridge Regression because it introduces a penalty term to reduce the weights of of the less important coefficients which reduces overfitting. 

## Poisson Regression

We use Poisson Regression for low volume statistics (most MLB stats) because they most closely follow a Poisson distribution due to such low volume stats being discrete and non-negative.

## Standard Scaler

We also use a standard scaler which shrinks features down to a mean of 0 and standard deviation of 1, this is how we handle explanatory variable that have different scales. For instance when trying to predict an NBA player's points, we may use minutes and true shooting percentage as explanatory variables. These two variables have different scales so our standard scaler helps prevent certain variables from disproportionately influencing the fitting.

## Lambda / Alpha

We also set an alpha or lambda (regularization parameter that controls the amount of shrinkage applied to the coefficients of the model) of 1.

## Weighted Arithmetic Mean

$\bar{x} = \frac{\sum_{i=1}^n w_i x_i}{\sum_{i=1}^n w_i}$

When trying to predict an outcome after fitting our model we need to have some inputs. These inputs are derived by using the weighted arithmetic mean. The weighted arithmetic mean is essentially a way of computing the mean but giving certain values more importance. In our case our weights are just $i$.

## Bias

We also introduce a bias when deriving our lines. This is done to add a sort of house edge. We don't want our lines to be exactly what we predict the response to be. We apply the bias to the sample standard deviation and add it to the predicted response.

$response + bias \cdot s$