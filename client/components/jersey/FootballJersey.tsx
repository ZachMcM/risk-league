import React from "react";
import Svg, {
  Path,
  Text,
  Defs,
  LinearGradient,
  Stop,
  G,
  ClipPath,
  Rect,
} from "react-native-svg";

interface FootballJerseyProps {
  color: string;
  alternateColor: string;
  jerseyNumber: string;
  size: number;
  teamName: string
}

export const FootballJersey: React.FC<FootballJerseyProps> = ({
  color,
  alternateColor,
  jerseyNumber,
  size,
  teamName
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      <Defs>
        {/* Sleeve Gradient - Base */}
        <LinearGradient
          id="linear-gradient"
          x1="211.76"
          y1="124.35"
          x2="251.2"
          y2="124.35"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.8" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="1" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.9" />
        </LinearGradient>

        <LinearGradient
          id="linear-gradient-2"
          x1="214.53"
          y1="134.15"
          x2="253.37"
          y2="134.15"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.8" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="1" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.9" />
        </LinearGradient>

        <LinearGradient
          id="linear-gradient-3"
          x1="-1549.78"
          x2="-1510.34"
          gradientTransform="translate(-1461.44) rotate(-180) scale(1 -1)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.8" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="1" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.9" />
        </LinearGradient>

        <LinearGradient
          id="linear-gradient-4"
          x1="-1547.01"
          y1="134.15"
          x2="-1508.16"
          y2="134.15"
          gradientTransform="translate(-1461.44) rotate(-180) scale(1 -1)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.8" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="1" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.9" />
        </LinearGradient>

        {/* Jersey Body Gradient */}
        <LinearGradient
          id="linear-gradient-5"
          x1="149.9"
          y1="17.48"
          x2="149.9"
          y2="47.37"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={color} stopOpacity="1" />
          <Stop offset="0.06" stopColor={color} stopOpacity="0.98" />
          <Stop offset="0.68" stopColor={color} stopOpacity="0.75" />
          <Stop offset="1" stopColor={color} stopOpacity="0.65" />
        </LinearGradient>

        {/* Number Area Gradient */}
        <LinearGradient
          id="linear-gradient-6"
          x1="114.48"
          y1="138.51"
          x2="186.18"
          y2="138.51"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={color} stopOpacity="0.9" />
          <Stop offset="1" stopColor={color} stopOpacity="1" />
        </LinearGradient>

        {/* Main Jersey Body Gradient - Full Height */}
        <LinearGradient
          id="linear-gradient-7"
          x1="149.9"
          y1="17.48"
          x2="149.9"
          y2="271"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={color} stopOpacity="1" />
          <Stop offset="0.06" stopColor={color} stopOpacity="0.98" />
          <Stop offset="0.68" stopColor={color} stopOpacity="0.75" />
          <Stop offset="1" stopColor={color} stopOpacity="0.65" />
        </LinearGradient>

        {/* ClipPaths */}
        <ClipPath id="clippath">
          <Path d="m212.77,266.84l-1-15.31c-.36-5.43-.94-10.84-1.7-16.22-5.24-37.26-4.27-73.99,1.47-110.32-.13,1.79.57,3.82,1.23,5.29.73,1.64,1.3,3.34,1.63,5.1l2.18,11.47c1.38,5.58,39.25-3.77,37.87-9.35-4.11-20.48-9.3-43.03-14.65-65.3-3.76-15.64-14.38-28.75-28.9-35.68l-25.29-12.08-9.21-5.71c-1.53-.95-3.29-1.45-5.08-1.45h-42.65c-1.8,0-3.56.5-5.08,1.45l-9.21,5.71-25.29,12.08c-14.52,6.93-25.14,20.04-28.9,35.68-5.35,22.27-10.54,44.82-14.65,65.3-1.25,5.06,36.62,14.41,37.87,9.35l2.18-11.47c.33-1.76.9-3.47,1.63-5.1.66-1.47,1.36-3.5,1.23-5.29,5.74,36.33,6.71,73.07,1.47,110.32-.76,5.39-1.34,10.79-1.7,16.22l-1.02,15.49c-.14,2.07,1.12,3.96,3.07,4.67,39.83,14.59,79.75,14.83,119.47-.2,1.92-.73,3.16-2.61,3.02-4.66Z" />
        </ClipPath>

        <ClipPath id="clippath-1">
          <Rect x="40.51" y="12.3" width="218.98" height="275.4" />
        </ClipPath>
      </Defs>

      <G>
        {/* Main Jersey Body Fill - Using the exact outline path */}
        <Path
          d="m212.77,266.84l-1-15.31c-.36-5.43-.94-10.84-1.7-16.22-5.24-37.26-4.27-73.99,1.47-110.32-.13,1.79.57,3.82,1.23,5.29.73,1.64,1.3,3.34,1.63,5.10l2.18,11.47c1.38,5.58,39.25-3.77,37.87-9.35-4.11-20.48-9.3-43.03-14.65-65.3-3.76-15.64-14.38-28.75-28.9-35.68l-25.29-12.08-9.21-5.71c-1.53-.95-3.29-1.45-5.08-1.45h-42.65c-1.8,0-3.56.5-5.08,1.45l-9.21,5.71-25.29,12.08c-14.52,6.93-25.14,20.04-28.9,35.68-5.35,22.27-10.54,44.82-14.65,65.3-1.25,5.06,36.62,14.41,37.87,9.35l2.18-11.47c.33-1.76.9-3.47,1.63-5.10.66-1.47,1.36-3.5,1.23-5.29,5.74,36.33,6.71,73.07,1.47,110.32-.76,5.39-1.34,10.79-1.7,16.22l-1.02,15.49c-.14,2.07,1.12,3.96,3.07,4.67,39.83,14.59,79.75,14.83,119.47-.2,1.92-.73,3.16-2.61,3.02-4.66Z"
          fill="url(#linear-gradient-7)"
        />

        {/* Main Jersey with Clipping */}
        <G clipPath="url(#clippath)">
          <G clipPath="url(#clippath-1)">
            {/* Right Sleeve Detail */}
            <Path
              d="m251.2,121.85s-13.39,9.95-37.74,10.37c-.81-1.74-1.44-3.42-1.7-5,24.28-.54,38.27-10.76,38.27-10.76l1.17,5.38Z"
              fill="url(#linear-gradient)"
            />

            {/* Right Sleeve Band */}
            <Path
              d="m215.57,141.46c14.39.75,26.81-2.89,37.8-9.31l-1.13-5.4c-10.99,6.41-23.33,9.97-37.71,9.22l1.04,5.49Z"
              fill="url(#linear-gradient-2)"
            />

            {/* Left Sleeve Detail */}
            <Path
              d="m48.9,121.85s13.39,9.95,37.74,10.37c.81-1.74,1.44-3.42,1.7-5-24.28-.54-38.27-10.76-38.27-10.76l-1.17,5.38Z"
              fill="url(#linear-gradient-3)"
            />

            {/* Left Sleeve Band */}
            <Path
              d="m84.53,141.46c-14.39.75-26.81-2.89-37.8-9.31l1.13-5.4c10.99,6.41,23.33,9.97,37.71,9.22l-1.04,5.49Z"
              fill="url(#linear-gradient-4)"
            />

            {/* Jersey Bottom Shadow */}
            <Path
              d="m151.21,274.15c-21.77,0-42.98-3.51-63.73-11.11l.06-.94c40.99,15.01,85.84,15.13,124.95.34l.06.99c-19.5,7.38-39.91,10.72-61.34,10.72Z"
              fill="#231f20"
              opacity="0.35"
            />

            {/* Collar Outer */}
            <Path
              d="m124.84,18.06v5.68c0,3.57,1.08,7.06,3.1,10.01,3.88,5.65,11.32,14.6,21.96,19.14,10.63-4.54,18.08-13.49,21.96-19.14,2.02-2.95,3.1-6.43,3.10-10.01v-5.68l11.81,7.01c-2.38,18.82-17.03,32.17-36.87,43.2-19.84-11.04-34.49-24.39-36.87-43.2l11.81-7.01Z"
              fill={alternateColor}
            />

            {/* Collar Inner/Body Top */}
            <Path
              d="m174.96,18v5.82c0,3.58-1.08,7.06-3.11,10.01-3.87,5.65-11.32,14.6-21.95,19.14-10.64-4.53-18.08-13.48-21.96-19.14-2.02-2.94-3.10-6.43-3.10-10.01v-5.68c1.23-.54,2.56-.83,3.91-.83h42.65c1.23,0,2.43.23,3.56.70Z"
              fill="url(#linear-gradient-5)"
            />

            {/* Collar Detail/Shadow */}
            <Path
              d="m187.24,25.22c-.52,3.92-1.56,7.69-3.17,11.31-5.19,11.83-16.25,22.21-33.93,32.04-.07.04-.16.06-.24.06s-.17-.02-.24-.06c-17.68-9.83-28.74-20.21-33.93-32.04-1.59-3.60-2.64-7.33-3.15-11.22l.94-.45h0c.51,4.06,1.60,7.94,3.29,11.67,5.17,11.41,15.96,21.47,33.09,31.03,17.12-9.56,27.91-19.62,33.09-31.03,1.69-3.73,2.78-7.61,3.29-11.66,0-.03,0-.06.03-.09l.93.44Z"
              fill={color}
              opacity="0.8"
            />

            {/* Collar Stripe/Band */}
            <Path
              d="m150.09,30.79c-7.95,0-16.07-.42-24.14-1.26-.28-.73-.50-1.43-.66-2.10,8.43.80,16.83,1.20,25.01,1.20,8.15,0,16.29-.40,24.22-1.20-.16.65-.38,1.34-.66,2.09-7.83.83-15.82,1.26-23.76,1.26h0Z"
              fill={alternateColor}
              opacity="0.6"
            />

            {/* Inner Collar Detail */}
            <Path
              d="m175.46,18.23v5.37c0,3.69-1.10,7.25-3.19,10.29-.55.79-1.19,1.68-1.92,2.64-4.06,5.33-10.96,12.71-20.25,16.68-.07.02-.13.04-.20.04s-.13-.02-.20-.04c-9.29-3.97-16.19-11.35-20.25-16.68-.73-.96-1.37-1.85-1.92-2.64-2.09-3.04-3.19-6.60-3.19-10.29v-5.27c.33-.16.66-.31,1-.43v5.70c0,3.48,1.04,6.85,3.01,9.72.65.95,1.44,2.04,2.36,3.21,4.02,5.14,10.54,11.92,19.19,15.67,8.65-3.75,15.18-10.53,19.20-15.67.91-1.17,1.70-2.26,2.35-3.21,1.97-2.87,3.01-6.23,3.01-9.72v-5.68s0-.06,0-.09c.34.11.67.25.99.40Z"
              fill="url(#linear-gradient-5)"
              opacity="0.85"
            />

            {/* Right Shoulder Seam */}
            <Path
              d="m171.83,52.51c12.34,7.35,26.66,10.50,40.28,14.78,4.52,1.52,9.27,2.74,13.30,5.38-2.01-1.31-4.26-2.19-6.52-2.96-15.90-5.37-32.84-7.79-47.64-16.19-.65-.37-.09-1.41.59-1.01h0Z"
              fill={color}
              opacity="0.85"
            />

            {/* Left Shoulder Seam */}
            <Path
              d="m127.09,51.75c-12.34,7.35-26.66,10.50-40.28,14.78-4.52,1.52-9.27,2.74-13.30,5.38,2.01-1.31,4.26-2.19,6.52-2.96,15.90-5.37,32.84-7.79,47.64-16.19.65-.37.09-1.41-.59-1.01h0Z"
              fill={color}
              opacity="0.85"
            />
          </G>
        </G>
        {/* Jersey Number */}
        <Text
          x="150"
          y="110"
          fontSize="36"
          fontWeight="bolder"
          fill={alternateColor}
          textAnchor="middle"
          fontFamily="system-ui"
        >
          {teamName}
        </Text>
        {/* Jersey Number */}
        <Text
          x="150"
          y="170"
          fontSize="64"
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
