import React from "react";
import Svg, {
  Path,
  Circle,
  Text,
  Defs,
  LinearGradient,
  Stop,
  G,
} from "react-native-svg";

interface BaseballJerseyProps {
  color: string;
  alternateColor: string;
  jerseyNumber: string;
  size: number;
  teamName: string
}

export const BaseballJersey: React.FC<BaseballJerseyProps> = ({
  color,
  alternateColor,
  jerseyNumber,
  size,
  teamName
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      <Defs>
        {/* Main Jersey Body Gradient */}
        <LinearGradient
          id="linear-gradient"
          x1="150"
          y1="25.34"
          x2="150"
          y2="270.92"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={color} stopOpacity="0.85" />
          <Stop offset="0.23" stopColor={color} stopOpacity="0.9" />
          <Stop offset="0.49" stopColor={color} stopOpacity="0.95" />
          <Stop offset="0.64" stopColor={color} stopOpacity="0.93" />
          <Stop offset="0.73" stopColor={color} stopOpacity="0.88" />
          <Stop offset="0.82" stopColor={color} stopOpacity="0.8" />
          <Stop offset="0.89" stopColor={color} stopOpacity="0.7" />
          <Stop offset="0.96" stopColor={color} stopOpacity="0.6" />
          <Stop offset="1" stopColor={color} stopOpacity="0.5" />
        </LinearGradient>

        {/* Secondary Body Gradient */}
        <LinearGradient
          id="linear-gradient-2"
          x1="150"
          y1="25.34"
          x2="150"
          y2="270.92"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={color} stopOpacity="0.75" />
          <Stop offset="0.02" stopColor={color} stopOpacity="0.78" />
          <Stop offset="0.08" stopColor={color} stopOpacity="0.83" />
          <Stop offset="0.14" stopColor={color} stopOpacity="0.85" />
          <Stop offset="0.49" stopColor={color} stopOpacity="0.95" />
          <Stop offset="0.64" stopColor={color} stopOpacity="0.93" />
          <Stop offset="0.73" stopColor={color} stopOpacity="0.88" />
          <Stop offset="0.82" stopColor={color} stopOpacity="0.8" />
          <Stop offset="0.89" stopColor={color} stopOpacity="0.7" />
          <Stop offset="0.96" stopColor={color} stopOpacity="0.6" />
          <Stop offset="1" stopColor={color} stopOpacity="0.5" />
        </LinearGradient>

        {/* Right Sleeve Gradient */}
        <LinearGradient
          id="linear-gradient-3"
          x1="211.02"
          y1="88.62"
          x2="250.36"
          y2="88.62"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.2" />
          <Stop offset="0.13" stopColor={alternateColor} stopOpacity="0.3" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="0.35" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.25" />
        </LinearGradient>

        {/* Right Sleeve Band Gradient */}
        <LinearGradient
          id="linear-gradient-4"
          x1="256.82"
          y1="111.01"
          x2="213.38"
          y2="127.09"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.7" />
          <Stop offset="0.35" stopColor={alternateColor} stopOpacity="0.9" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="0.95" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.25" />
        </LinearGradient>

        {/* Left Sleeve Gradient */}
        <LinearGradient
          id="linear-gradient-5"
          x1="49.64"
          y1="88.62"
          x2="88.98"
          y2="88.62"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.25" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="0.35" />
          <Stop offset="0.87" stopColor={alternateColor} stopOpacity="0.3" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.2" />
        </LinearGradient>

        {/* Left Sleeve Band Gradient */}
        <LinearGradient
          id="linear-gradient-6"
          x1="43.18"
          y1="111.01"
          x2="86.62"
          y2="127.09"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.25" />
          <Stop offset="0.51" stopColor={alternateColor} stopOpacity="0.95" />
          <Stop offset="0.65" stopColor={alternateColor} stopOpacity="0.9" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.7" />
        </LinearGradient>

        {/* Collar Gradient */}
        <LinearGradient
          id="linear-gradient-7"
          x1="120.02"
          y1="21.9"
          x2="179.94"
          y2="21.9"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.35" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="0.35" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.25" />
        </LinearGradient>

        {/* Collar Detail Gradient */}
        <LinearGradient
          id="linear-gradient-8"
          x1="150"
          y1="22.87"
          x2="150"
          y2="60.38"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.95" />
          <Stop offset="0.31" stopColor={alternateColor} stopOpacity="0.8" />
          <Stop offset="0.83" stopColor={alternateColor} stopOpacity="0.6" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.55" />
        </LinearGradient>

        {/* Button Gradients */}
        <LinearGradient
          id="linear-gradient-9"
          x1="148.58"
          y1="69.71"
          x2="153.98"
          y2="69.71"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.2" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="0.35" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.25" />
        </LinearGradient>
        <LinearGradient
          id="linear-gradient-10"
          x1="146.33"
          y1="100.67"
          x2="151.73"
          y2="100.67"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.2" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="0.35" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.25" />
        </LinearGradient>
        <LinearGradient
          id="linear-gradient-11"
          x1="146.33"
          y1="137.31"
          x2="151.73"
          y2="137.31"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.2" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="0.35" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.25" />
        </LinearGradient>
        <LinearGradient
          id="linear-gradient-12"
          x1="146.33"
          y1="173.95"
          x2="151.73"
          y2="173.95"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.2" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="0.35" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.25" />
        </LinearGradient>
        <LinearGradient
          id="linear-gradient-13"
          x1="146.33"
          y1="210.6"
          x2="151.73"
          y2="210.6"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.2" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="0.35" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.25" />
        </LinearGradient>
        <LinearGradient
          id="linear-gradient-14"
          x1="146.33"
          y1="247.24"
          x2="151.73"
          y2="247.24"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={alternateColor} stopOpacity="0.2" />
          <Stop offset="0.49" stopColor={alternateColor} stopOpacity="0.35" />
          <Stop offset="1" stopColor={alternateColor} stopOpacity="0.25" />
        </LinearGradient>
      </Defs>

      <G>
        {/* Main Jersey Body - Path 1 */}
        <Path
          d="m150,282.5c-42.55-.11-60.75-21.33-65.11-27.42-.7-.99-.98-2.21-.79-3.41,4.64-30.52,7.2-61.7,6.19-89.08v-50.16c-2.22,6.59-3.98,13.31-5.31,20.14-3.01,7.73-44.69-8.5-41.68-16.23,4.73-17.66,10.81-37.89,17.72-59.66,2.98-9.39,9.89-17.02,18.92-20.94l39.54-17.18c2.02-.87,4.31-1.42,6.41-.79,7.01,2.1,41.22,2.1,48.23,0,2.1-.63,4.38-.08,6.41.79l39.54,17.18c9.03,3.92,15.94,11.55,18.92,20.94,6.91,21.76,12.99,42,17.72,59.66,3.01,7.73-38.67,23.96-41.68,16.23-1.33-6.82-3.09-13.55-5.31-20.14v50.16c-1.01,27.38,1.56,58.56,6.19,89.08.18,1.2-.09,2.42-.79,3.41-4.36,6.09-22.56,27.31-65.11,27.42Z"
          fill="url(#linear-gradient)"
        />

        {/* Secondary Body Layer - Path 2 */}
        <Path
          d="m215.02,132.58c-1.17-5.97-2.66-11.85-4.49-17.64-.27-.84-.54-1.67-.82-2.5v50.16c-1.01,27.38,1.55,58.56,6.19,89.08.18,1.2-.09,2.42-.79,3.41-1.92,2.69-6.54,8.32-14.76,13.78-10.41,6.92-26.58,13.57-50.35,13.63-42.55-.11-60.75-21.32-65.11-27.41-.7-.99-.98-2.21-.79-3.41,4.63-30.52,7.2-61.7,6.19-89.08v-50.16c-2.22,6.59-3.98,13.31-5.31,20.14-3.01,7.73-44.69-8.51-41.68-16.24,4.73-17.65,10.82-37.89,17.72-59.65,2.98-9.39,9.89-17.03,18.92-20.94l39.54-17.18c2.02-.88,4.3-1.42,6.41-.79,7,2.1,41.22,2.1,48.22,0,2.1-.63,4.39-.09,6.41.79l39.54,17.18c9.03,3.91,15.94,11.55,18.92,20.94,6.9,21.76,12.98,42,17.71,59.65,3.01,7.73-38.66,23.97-41.67,16.24Z"
          fill="url(#linear-gradient-2)"
          opacity="0.3"
        />

        {/* Right Sleeve - Path 3 */}
        <Path
          d="m215.02,132.58c-1.34-6.83-3.1-13.55-5.31-20.14-.82-13.88,2.88-24.8,7.95-34.68,5.7-11.1,10.05-22.84,12.63-35.05l.02-.08c3.96,3.85,6.97,8.67,8.68,14.06,6.9,21.76,12.98,42,17.71,59.66,3.01,7.72-38.66,23.96-41.67,16.23Z"
          fill="url(#linear-gradient-3)"
        />

        {/* Right Sleeve Band - Path 4 */}
        <Path
          d="m213.89,127.26c14.91-.02,28.78-5.56,41.59-15.41l-1.17-4.24c-12.81,9.85-26.55,15.35-41.47,15.37l1.05,4.28Z"
          fill="url(#linear-gradient-4)"
        />

        {/* Left Sleeve - Path 5 */}
        <Path
          d="m84.98,132.58c1.34-6.83,3.1-13.55,5.31-20.14.82-13.88-2.88-24.8-7.95-34.68-5.7-11.1-10.05-22.84-12.63-35.05l-.02-.08c-3.96,3.85-6.97,8.67-8.68,14.06-6.9,21.76-12.98,42-17.71,59.66-3.01,7.72,38.66,23.96,41.67,16.23Z"
          fill="url(#linear-gradient-5)"
        />

        {/* Left Sleeve Band - Path 6 */}
        <Path
          d="m86.11,127.26c-14.91-.02-28.78-5.56-41.59-15.41l1.17-4.24c12.81,9.85,26.55,15.35,41.47,15.37l-1.05,4.28Z"
          fill="url(#linear-gradient-6)"
        />

        {/* Collar Detail Left - Path 7 */}
        <Path
          d="m144.18,72.8c-.64-1.29-1.46-2.5-2.47-3.58-3.23-3.47-8.47-8.74-15.91-15.18-13.73-11.9-15.25-31.6-15.25-31.6l9.49-4.1s.14,11.11,8.44,19.65c8.3,8.54,16.48,16.6,16.48,16.6,0,0,2.42,2.17,5.03,5.79-2.83,3.78-4.72,7.94-5.82,12.43Z"
          fill={alternateColor}
          opacity="0.4"
        />

        {/* Collar Top Base - Path 8 */}
        <Path
          d="m179.94,18.33c0,.43-.1,2.19-.59,4.54-19.92,4.63-39.49,4.54-58.7,0-.5-2.37-.61-4.12-.63-4.53,1.89-.73,3.95-1.13,5.87-.56,7,2.1,41.22,2.1,48.22,0,1.9-.57,3.95-.17,5.83.55Z"
          fill={alternateColor}
          opacity="0.4"
        />

        {/* Collar Top Overlay - Path 9 */}
        <Path
          d="m179.94,18.33c0,.43-.1,2.19-.59,4.54-19.92,4.63-39.49,4.54-58.7,0-.5-2.37-.61-4.12-.63-4.53,1.89-.73,3.95-1.13,5.87-.56,7,2.1,41.22,2.1,48.22,0,1.9-.57,3.95-.17,5.83.55Z"
          fill="url(#linear-gradient-7)"
          opacity="0.3"
        />

        {/* Collar Detail Right - Path 10 */}
        <Path
          d="m189.44,22.45s-1.52,19.69-15.25,31.59c-7.43,6.45-12.67,11.71-15.91,15.19-2.6,2.79-4.03,6.48-4,10.31l1.49,197.96.07.92.29,3.91c-1.98.11-4.03.17-6.13.17s-3.99-.06-5.9-.15l-.25-2.75c-.03-.4-.06-.8-.09-1.2-.09-1.36-.14-2.73-.14-4.1V78.39c-.04-1.93.17-3.8.56-5.58h0c1.07-4.94,3.52-9.25,5.82-12.43,2.61-3.62,5.03-5.79,5.03-5.79,0,0,8.18-8.05,16.48-16.6,4.95-5.1,7-11.11,7.84-15.12.57-2.71.6-4.52.6-4.52l9.49,4.1Z"
          fill={alternateColor}
          opacity="0.4"
        />

        {/* Buttons */}
        <Circle cx="151.28" cy="69.71" r="2.7" fill={color} opacity="0.7" />
        <Circle cx="149.03" cy="100.67" r="2.7" fill={color} opacity="0.7" />
        <Circle cx="149.03" cy="137.31" r="2.7" fill={color} opacity="0.7" />
        <Circle cx="149.03" cy="173.95" r="2.7" fill={color} opacity="0.7" />
        <Circle cx="149.03" cy="210.6" r="2.7" fill={color} opacity="0.7" />
        <Circle cx="149.03" cy="247.24" r="2.7" fill={color} opacity="0.7" />
        <Text
          x="180"
          y="100"
          fontSize="18"
          fontWeight="bold"
          fill={alternateColor}
          textAnchor="middle"
          fontFamily="system-ui"
        >
          {teamName}
        </Text>
        {/* Jersey Number */}
        <Text
          x="180"
          y="130"
          fontSize="24"
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
