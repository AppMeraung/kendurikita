import { Text, VStack } from "@expo/ui/swift-ui";
import { createWidget } from "expo-widgets";

type EventWidgetProps = {
  eventName: string;
  daysLeft: number;
  daysLabel: string;
  nextTask: string;
};

function EventCountdownWidget(props: EventWidgetProps) {
  "widget";
  return (
    <VStack alignment="center" spacing={4}>
      <Text>{props.eventName}</Text>
      <Text>{String(props.daysLeft)}</Text>
      <Text>{props.daysLabel}</Text>
      <Text>{props.nextTask || "Tiada tugas seterusnya"}</Text>
    </VStack>
  );
}

export default createWidget("EventCountdownWidget", EventCountdownWidget, {
  eventName: "KenduriKita",
  daysLeft: 0,
  daysLabel: "hari lagi",
  nextTask: "Buka aplikasi untuk mula merancang",
});
