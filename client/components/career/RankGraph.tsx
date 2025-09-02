import { Circle } from "@shopify/react-native-skia";
import { useEffect, useRef } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import { CartesianChart, Line } from "victory-native";
import { Rank } from "~/types/rank";
import RankIcon from "../ui/rank-icon";

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

  const scrollViewRef = useRef<ScrollView>(null);

  // Convert string dates to numbers for Victory Native
  const chartData = pointsTimeline.map((point, index) => ({
    x: index,
    y: point.y,
    date: point.x,
  }));

  const chartWidth = Math.max(
    Dimensions.get("window").width - 60,
    pointsTimeline.length * 50 + 100
  );

  useEffect(() => {
    // Scroll to the end to show the latest data point
    const timer = setTimeout(() => {
      if (
        scrollViewRef.current &&
        chartWidth > Dimensions.get("window").width - 60
      ) {
        scrollViewRef.current.scrollToEnd({ animated: false });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [chartWidth]);

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      scrollEventThrottle={16}
      decelerationRate="normal"
      bounces={false}
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 20 }}
    >
      <View
        style={{
          width: chartWidth,
          height: 200,
        }}
      >
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={["y"]}
          domainPadding={{ left: 40, right: 40, top: 60, bottom: 20 }}
        >
          {({ points }) => (
            <>
              <Line
                points={points.y}
                color="rgb(231, 29, 147)"
                strokeWidth={3}
                curveType="catmullRom"
                animate={{ type: "timing", duration: 300 }}
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

          const peakX =
            40 + (peakIndex * (chartWidth - 80)) / (pointsTimeline.length - 1);
          const maxY = Math.max(...pointsTimeline.map((p) => p.y));
          const minY = Math.min(...pointsTimeline.map((p) => p.y));
          const peakY =
            60 +
            (200 - 80) *
              (1 - (pointsTimeline[peakIndex].y - minY) / (maxY - minY));

          return (
            <>
              <View
                style={{
                  position: "absolute",
                  left: peakX - 18,
                  top: peakY - 64,
                }}
              >
                <RankIcon rank={peakRank} />
              </View>
              {currentIndex >= 0 &&
                currentIndex !== peakIndex &&
                (() => {
                  const currentX =
                    40 +
                    (currentIndex * (chartWidth - 80)) /
                      (pointsTimeline.length - 1);
                  const currentY =
                    60 +
                    (200 - 80) *
                      (1 -
                        (pointsTimeline[currentIndex].y - minY) /
                          (maxY - minY));

                  return (
                    <View
                      style={{
                        position: "absolute",
                        left: currentX - 18,
                        top: currentY - 64,
                      }}
                    >
                      <RankIcon rank={peakRank} />
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
