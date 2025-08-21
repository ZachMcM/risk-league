import { View } from "react-native";
import { Dimensions, ScrollView } from "react-native";
import RankBadge from "../ui/RankBadge";
import { Rank } from "~/types/rank";
import { CartesianChart, Line } from "victory-native";
import { Circle, useFont } from "@shopify/react-native-skia";

export default function RankGraph({
  pointsTimeline,
  peakRank,
  currentRank,
}: {
  pointsTimeline: { x: string; y: number }[];
  peakRank: Rank;
  currentRank: Rank;
}) {
  console.log(pointsTimeline);

  // Convert string dates to numbers for Victory Native
  const chartData = pointsTimeline.map((point, index) => ({
    x: index,
    y: point.y,
    date: point.x,
  }));


  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      className="flex-1"
      contentContainerClassName="flex-1"
    >
      <View
        style={{
          width: Math.max(
            Dimensions.get("window").width - 60,
            pointsTimeline.length * 30
          ),
          height: 200,
        }}
      >
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={["y"]}
          domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
        >
          {({ points }) => (
            <>
              <Line
                points={points.y}
                color="rgb(231, 29, 147)"
                strokeWidth={3}
                curveType="catmullRom"
              />
              {points.y.map((point, index) => (
                <Circle
                  key={index}
                  cx={point.x}
                  cy={point.y!}
                  r={4}
                  color="rgb(231, 29, 147)"
                />
              ))}
            </>
          )}
        </CartesianChart>

        {/* Peak rank badge */}
        {(() => {
          const peakIndex = pointsTimeline.findIndex(
            (point) => point.y === Math.max(...pointsTimeline.map((p) => p.y))
          );
          const currentIndex = pointsTimeline.length - 1;

          if (peakIndex < 0) return null;

          const chartWidth = Math.max(
            Dimensions.get("window").width - 60,
            pointsTimeline.length * 30
          );
          const peakX =
            20 + (peakIndex * (chartWidth - 40)) / (pointsTimeline.length - 1);
          const maxY = Math.max(...pointsTimeline.map((p) => p.y));
          const minY = Math.min(...pointsTimeline.map((p) => p.y));
          const peakY =
            20 +
            (200 - 40) *
              (1 - (pointsTimeline[peakIndex].y - minY) / (maxY - minY));

          return (
            <>
              <View
                style={{
                  position: "absolute",
                  left: peakX - 24,
                  top: peakY - 40,
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

              {/* Current rank badge */}
              {currentIndex >= 0 &&
                currentIndex !== peakIndex &&
                (() => {
                  const currentX =
                    20 +
                    (currentIndex * (chartWidth - 40)) /
                      (pointsTimeline.length - 1);
                  const currentY =
                    20 +
                    (200 - 40) *
                      (1 -
                        (pointsTimeline[currentIndex].y - minY) /
                          (maxY - minY));

                  return (
                    <View
                      style={{
                        position: "absolute",
                        left: currentX - 24,
                        top: currentY - 40,
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
                  );
                })()}
            </>
          );
        })()}
      </View>
    </ScrollView>
  );
}
