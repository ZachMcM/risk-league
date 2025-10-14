import React from "react";
import Svg, {
  Path,
  Text,
  Defs,
  LinearGradient,
  Stop,
  G,
} from "react-native-svg";

interface BasketballJerseyProps {
  color: string;
  alternateColor: string;
  jerseyNumber: string;
  size: number;
  teamName: string;
}

export const BasketballJersey: React.FC<BasketballJerseyProps> = ({
  color,
  alternateColor,
  jerseyNumber,
  size,
  teamName,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      <Defs>
        {/* Main Jersey Body Gradient */}
        <LinearGradient
          id="mainJerseyGradient"
          x1="76.57"
          y1="149.49"
          x2="226.36"
          y2="149.49"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={color} stopOpacity="0.7" />
          <Stop offset="0.05" stopColor={color} stopOpacity="0.8" />
          <Stop offset="0.16" stopColor={color} stopOpacity="0.9" />
          <Stop offset="0.26" stopColor={color} stopOpacity="0.95" />
          <Stop offset="0.37" stopColor={color} stopOpacity="0.98" />
          <Stop offset="0.49" stopColor={color} stopOpacity="1" />
          <Stop offset="0.61" stopColor={color} stopOpacity="0.98" />
          <Stop offset="0.72" stopColor={color} stopOpacity="0.95" />
          <Stop offset="0.83" stopColor={color} stopOpacity="0.9" />
          <Stop offset="0.94" stopColor={color} stopOpacity="0.8" />
          <Stop offset="1" stopColor={color} stopOpacity="0.7" />
        </LinearGradient>

        {/* Neck Area Gradient */}
        <LinearGradient
          id="neckGradient"
          x1="149.78"
          y1="32.17"
          x2="149.78"
          y2="55.34"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="1" />
          <Stop offset="0.26" stopColor={alternateColor} stopOpacity="0.85" />
          <Stop offset="0.75" stopColor={alternateColor} stopOpacity="0.6" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.5" />
        </LinearGradient>
      </Defs>

      <G>
        {/* Main Jersey Body */}
        <Path
          d="m223.59,275.58c.1,1.34-.95,2.48-2.29,2.48-5.66,0-19.88.28-30.74,2.93-9.08,2.21-21.47,3.6-28.95,4.3-3.87.35-7.75.53-11.63.53s-7.76-.18-11.63-.53c-7.48-.7-19.87-2.09-28.95-4.3-10.86-2.65-25.08-2.93-30.74-2.93-1.34,0-2.39-1.14-2.29-2.48,4.85-63.89,6.25-123.59.02-168.83-.13-.94.11-1.88.68-2.64,2.51-3.39,9.66-14.49,12.17-34.03,2.04-15.89-2.93-35.99-5.19-43.97-.55-1.92.56-3.91,2.49-4.48,7.43-2.17,15.4-5.09,23.73-8.47,0,0,1.31,33.38,39.16,49.5,37.85-16.12,40.26-49.5,40.26-49.5,8.33,3.38,16.3,6.3,23.73,8.47,1.93.57,3.04,2.56,2.49,4.48-2.26,7.98-7.23,28.08-5.19,43.97,2.51,19.54,9.66,30.64,12.17,34.03.57.76.81,1.7.68,2.64-6.23,45.24-4.83,104.94.02,168.83Z"
          fill="url(#mainJerseyGradient)"
        />

        {/* Bottom Trim */}
        <Path
          d="m78.66,278.06c49.58,15.2,96.54,16.12,140.36,0"
          fill="none"
          stroke={alternateColor}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Left Shoulder */}
        <Path
          d="m75.46,99.07c.38,2.76.73,5.59,1.05,8.47,0,0,15.8-19.21,17.74-44.25,1.46-18.89-5.91-42.21-5.91-42.21-1.26.4-2.49.78-3.71,1.14-1.74.51-2.74,2.31-2.25,4.05,2.04,7.21,6.53,25.36,4.69,39.7-2.27,17.64-8.72,27.67-10.99,30.73-.51.69-.73,1.54-.61,2.38Z"
          fill={color}
          opacity="0.8"
        />

        {/* Right Shoulder */}
        <Path
          d="m224.54,99.07c-.38,2.76-.73,5.59-1.05,8.47,0,0-15.8-19.21-17.74-44.25-1.46-18.89,5.91-42.21,5.91-42.21,1.26.4,2.49.78,3.71,1.14,1.74.51,2.74,2.31,2.25,4.05-2.04,7.21-6.53,25.36-4.69,39.7,2.27,17.64,8.72,27.67,10.99,30.73.51.69.73,1.54.61,2.38Z"
          fill={color}
          opacity="0.8"
        />

        {/* Collar/Neck Top */}
        <Path
          d="m189.69,13.16s-2.41,33.38-40.26,49.5c-37.85-16.12-39.16-49.5-39.16-49.5,2.18-.89,4.38-1.8,6.6-2.75.51-.22,1.07-.27,1.6-.16.01,0,.02.01.03.02,0,0-4.02,25.63,30.93,44.65,34.95-19.02,32.03-44.65,32.03-44.65.01-.01.02-.02.03-.02.53-.11,1.09-.06,1.6.16,2.22.95,4.42,1.86,6.6,2.75Z"
          fill={color}
          opacity="0.85"
        />

        {/* Neck Area - Top Layer */}
        <Path
          d="m180.15,20.85c-3.54,3.24-15.1,12.5-30.73,11.95-15.59.55-26.6-8.65-30-11.91-1.59-6.35-.92-10.62-.92-10.62-.01-.01-.02-.02-.03-.02.44.1.86.31,1.21.63,3.69,3.41,15.3,13.87,29.56,13.67h1.11c14.26.2,26.24-10.26,29.93-13.67.35-.32.77-.53,1.21-.63-.01,0-.02.01-.03.02,0,0,.48,4.26-1.31,10.58Z"
          fill={alternateColor}
          opacity="0.9"
        />

        {/* Neck Area - Shadow */}
        <Path
          d="m180.15,20.85c-3.54,3.24-15.1,12.5-30.73,11.95-15.59.55-26.6-8.65-30-11.91-1.59-6.35-.92-10.62-.92-10.62-.01-.01-.02-.02-.03-.02.44.1.86.31,1.21.63,3.69,3.41,15.3,13.87,29.56,13.67h1.11c14.26.2,26.24-10.26,29.93-13.67.35-.32.77-.53,1.21-.63-.01,0-.02.01-.03.02,0,0,.48,4.26-1.31,10.58Z"
          fill="#231f20"
          opacity="0.4"
        />

        {/* Neck Area - Gradient Fill */}
        <Path
          d="m180.15,20.85c-2.6,9.21-10.01,22.8-30.72,34.07-20.68-11.26-27.72-24.83-30.01-34.03,3.4,3.26,14.41,12.46,30,11.91,15.63.55,27.19-8.71,30.73-11.95Z"
          fill="url(#neckGradient)"
        />
        <Text
          x="150"
          y="115"
          fontSize="36"
          fontWeight="bolder"
          fill={alternateColor}
          textAnchor="middle"
          fontFamily="system-ui"
        >
          {teamName.toUpperCase()}
        </Text>
        {/* Jersey Number */}
        <Text
          x="150"
          y="190"
          fontSize="72"
          fontWeight="bold"
          fill={alternateColor}
          textAnchor="middle"
          fontFamily="system-ui"
        >
          {jerseyNumber}
        </Text>
      </G>
    </Svg>
  );
};
