import React from "react";
import { View, ViewStyle } from "react-native";

type GridItemWrapperProps = {
  index: number;
  numCols: number;
  gap: number; // Tailwind gap-x equivalent in px
  children: React.ReactNode;
  style?: ViewStyle;
};

export const GridItemWrapper: React.FC<GridItemWrapperProps> = ({
  index,
  numCols,
  gap,
  children,
  style,
}) => {
  const halfGap = gap / 2;
  const columnIndex = index % numCols;
  const rowIndex = Math.floor(index / numCols);

  return (
    <View
      style={[
        style,
        {
          flexGrow: 1,
          marginLeft: columnIndex === 0 ? 0 : halfGap, // no left margin on first col
          marginRight: columnIndex === numCols - 1 ? 0 : halfGap, // no right margin on last col
          marginTop: rowIndex == 0 ? 0 : halfGap,
          marginBottom: halfGap,
        },
      ]}
    >
      {children}
    </View>
  );
};
