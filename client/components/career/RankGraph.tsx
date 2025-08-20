import { View } from "react-native";
import { Dimensions, ScrollView } from "react-native";
import { LineChart } from "react-native-chart-kit";
import RankBadge from "../ui/RankBadge";
import { Rank } from "~/types/rank";

export default function RankGraph({
  pointsTimeline,
  peakRank,
  currentRank,
}: {
  pointsTimeline: { x: string; y: number }[];
  peakRank: Rank;
  currentRank: Rank;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <LineChart
        data={{
          labels: pointsTimeline.map((point, index) =>
            index % Math.max(1, Math.floor(pointsTimeline.length / 5)) === 0
              ? new Date(point.x).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : ""
          ),
          datasets: [
            {
              data: pointsTimeline.map((point) => point.y),
              color: (opacity = 1) => `rgba(231, 29, 147, 1)`,
              strokeWidth: 3,
            },
          ],
        }}
        width={Math.max(
          Dimensions.get("window").width - 60,
          pointsTimeline.length * 30
        )}
        height={200}
        withVerticalLabels={false}
        withHorizontalLabels={false}
        chartConfig={{
          backgroundColor: "rgb(23, 23, 23)",
          backgroundGradientFrom: "rgb(23, 23, 23)",
          backgroundGradientTo: "rgb(23, 23, 23)",
          fillShadowGradient: "transparent",
          fillShadowGradientOpacity: 0,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(231, 29, 147, ${opacity})`,
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "rgb(231, 29, 147)",
            fill: "rgb(231, 29, 147)",
          },
          propsForLabels: {
            fontSize: 12,
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          marginHorizontal: -48,
          backgroundColor: "rgb(23, 23, 23)",
        }}
        decorator={() => {
          const peakIndex = pointsTimeline.findIndex(
            (point) => point.y === Math.max(...pointsTimeline.map((p) => p.y))
          );
          const currentIndex = pointsTimeline.length - 1;

          return (
            <View>
              {peakIndex >= 0 && (
                <View
                  style={{
                    position: "absolute",
                    left: Math.max(
                      48,
                      48 +
                        (peakIndex *
                          (Math.max(
                            Dimensions.get("window").width - 60,
                            pointsTimeline.length * 30
                          ) -
                            100)) /
                          (pointsTimeline.length - 1) -
                        48
                    ),
                    top:
                      40 +
                      (200 - 80) *
                        (1 -
                          (pointsTimeline[peakIndex].y -
                            Math.min(...pointsTimeline.map((p) => p.y))) /
                            (Math.max(...pointsTimeline.map((p) => p.y)) -
                              Math.min(...pointsTimeline.map((p) => p.y)))) -
                      30,
                  }}
                >
                  <RankBadge
                    showIcon
                    iconClassName="h-4 w-4"
                    textClassName="text-xs"
                    gradientStyle={{
                      paddingHorizontal: 8,
                      gap: 4,
                      alignSelf: "flex-start",
                    }}
                    rank={peakRank}
                  />
                </View>
              )}
              {currentIndex >= 0 && currentIndex !== peakIndex && (
                <View
                  style={{
                    position: "absolute",
                    left: Math.max(
                      48,
                      64 +
                        (currentIndex *
                          (Math.max(
                            Dimensions.get("window").width - 60,
                            pointsTimeline.length * 30
                          ) -
                            100)) /
                          (pointsTimeline.length - 1) -
                        48
                    ),
                    top:
                      40 +
                      (200 - 80) *
                        (1 -
                          (pointsTimeline[currentIndex].y -
                            Math.min(...pointsTimeline.map((p) => p.y))) /
                            (Math.max(...pointsTimeline.map((p) => p.y)) -
                              Math.min(...pointsTimeline.map((p) => p.y)))) -
                      30,
                  }}
                >
                  <RankBadge
                    showIcon
                    iconClassName="h-4 w-4"
                    textClassName="text-xs"
                    gradientStyle={{
                      paddingHorizontal: 8,
                      gap: 4,
                      alignSelf: "flex-start",
                    }}
                    rank={currentRank}
                  />
                </View>
              )}
            </View>
          );
        }}
      />
    </ScrollView>
  );
}
