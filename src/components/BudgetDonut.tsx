import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { palette, styles } from "../ui";

export function BudgetDonut({ paid, total, label }: { paid: number; total: number; label: string }) {
  const size = 132; const stroke = 16; const radius = (size - stroke) / 2; const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? Math.min(100, Math.max(0, paid / total * 100)) : 0;
  return <View accessibilityLabel={`${label}: ${Math.round(percent)}%`} style={{ alignSelf: "center", width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={palette.line} strokeWidth={stroke} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={paid > total && total > 0 ? palette.danger : palette.maroon} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - percent / 100)} />
    </Svg>
    <Text style={styles.metric}>{Math.round(percent)}%</Text><Text style={styles.muted}>{label}</Text>
  </View>;
}
