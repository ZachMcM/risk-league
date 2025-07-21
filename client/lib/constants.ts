export const NAV_THEME = {
  light: {
    background: "hsl(223.8136 -172.5242% 100%)", // background
    border: "hsl(223.8136 0.0001% 89.8161%)", // border
    card: "hsl(223.8136 -172.5242% 100%)", // card
    notification: "hsl(351.7303 123.6748% 40.5257%)", // destructive
    primary: "hsl(324.9505 80.8% 50.9804%)", // primary
    text: "hsl(223.8136 0% 3.9388%)", // foreground
  },
  dark: {
    background: "hsl(223.8136 0% 3.9388%)", // background
    border: "hsl(223.8136 0% 15.5096%)", // border
    card: "hsl(223.8136 0% 9.0527%)", // card
    notification: "hsl(358.7594 101.8439% 69.8357%)", // destructive
    primary: "hsl(324.9505 80.8% 50.9804%)", // primary
    text: "hsl(223.8136 0.0004% 98.0256%)", // foreground
  },
};

export const startingBalance = parseInt(
  process.env.EXPO_PUBLIC_STARTING_BALANCE!
);

export const multiplier = {
  1: 1.5,
  2: 3,
  3: 5,
  4: 10,
  5: 18,
  6: 30,
  7: 50,
};
