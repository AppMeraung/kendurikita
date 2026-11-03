import { View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

const gold = "#C9A24A";
const leaf = "#B88A3E";
const rose = "#C96F7E";
const roseLight = "#E8B4B8";

// Five-petal blossom centred on (x, y).
function Blossom({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return (
    <G>
      {[0, 72, 144, 216, 288].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return <Circle key={deg} cx={x + Math.cos(a) * r * 0.62} cy={y + Math.sin(a) * r * 0.62} r={r * 0.5} fill={fill} opacity={0.92} />;
      })}
      <Circle cx={x} cy={y} r={r * 0.28} fill={gold} />
    </G>
  );
}

function Leaf({ d }: { d: string }) {
  return <Path d={d} fill={leaf} opacity={0.75} />;
}

/** Gold branch with blossoms for a top corner; `flip` mirrors it for the right side. */
export function FloralCorner({ size = 120, flip = false }: { size?: number; flip?: boolean }) {
  return (
    <View pointerEvents="none" style={{ width: size, height: size, transform: flip ? [{ scaleX: -1 }] : undefined }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Path d="M0 8 C30 14 52 30 66 58 C74 74 78 92 80 112" stroke={gold} strokeWidth={1.6} fill="none" />
        <Path d="M22 14 C30 30 30 44 24 58" stroke={gold} strokeWidth={1.2} fill="none" />
        <Path d="M46 30 C62 26 78 30 92 40" stroke={gold} strokeWidth={1.2} fill="none" />
        <Leaf d="M30 14 C38 4 50 4 56 10 C48 16 38 18 30 14 Z" />
        <Leaf d="M58 44 C66 36 78 38 82 46 C74 50 64 50 58 44 Z" />
        <Leaf d="M26 40 C18 34 10 38 8 46 C16 48 22 46 26 40 Z" />
        <Leaf d="M70 76 C80 72 88 78 88 86 C80 86 74 82 70 76 Z" />
        <Leaf d="M64 64 C56 60 50 66 50 74 C58 74 62 70 64 64 Z" />
        <Leaf d="M92 40 C100 34 110 38 112 46 C104 48 96 46 92 40 Z" />
        <Blossom x={12} y={22} r={10} fill={rose} />
        <Blossom x={42} y={22} r={7} fill={roseLight} />
        <Blossom x={24} y={60} r={8} fill={roseLight} />
        <Blossom x={74} y={54} r={6} fill={rose} />
        <Blossom x={80} y={100} r={7} fill={roseLight} />
        <Circle cx={56} cy={40} r={2.2} fill={gold} />
        <Circle cx={98} cy={30} r={1.8} fill={gold} />
        <Circle cx={88} cy={70} r={1.8} fill={gold} />
        <Circle cx={36} cy={78} r={1.6} fill={gold} />
      </Svg>
    </View>
  );
}

/** Small gold ornament used under the brand name. */
export function Ornament({ width = 70 }: { width?: number }) {
  return (
    <Svg width={width} height={10} viewBox="0 0 70 10">
      <Path d="M0 5 H28 M42 5 H70" stroke={gold} strokeWidth={1} />
      <Path d="M35 0 L40 5 L35 10 L30 5 Z" fill={gold} />
    </Svg>
  );
}
