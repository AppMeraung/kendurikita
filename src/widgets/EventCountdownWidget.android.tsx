import { Column, Text } from "@expo/ui/jetpack-compose";
import { createWidget } from "expo-widgets";

export type EventWidgetProps = {
  eventName: string;
  daysLeft: number;
  daysLabel: string;
  nextTask: string;
};

function EventCountdownWidget(props: EventWidgetProps) {
  "widget";
  return (
    <Column horizontalAlignment="center" verticalArrangement="center">
      <Text color="#9C123C" style={{ fontSize: 18, fontWeight: "bold" }}>
        {props.eventName}
      </Text>
      <Text color="#271A1E" style={{ fontSize: 32, fontWeight: "bold" }}>
        {props.daysLeft}
      </Text>
      <Text color="#75676C" style={{ fontSize: 14 }}>
        {props.daysLabel}
      </Text>
      <Text color="#271A1E" style={{ fontSize: 14 }}>
        {props.nextTask || "Tiada tugas seterusnya"}
      </Text>
    </Column>
  );
}

export default createWidget("EventCountdownWidget", EventCountdownWidget, {
  eventName: "KenduriKita",
  daysLeft: 0,
  daysLabel: "hari lagi",
  nextTask: "Buka aplikasi untuk mula merancang",
});
