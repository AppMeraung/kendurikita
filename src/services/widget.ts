import { Platform } from "react-native";
import { widgetSnapshot } from "../domain/widget";
import i18n from "../i18n";
import type { EventData } from "../state/AppState";

export async function updateEventWidget(event: EventData | null) {
  if (Platform.OS === "web") return;
  const widget = await import("../widgets/EventCountdownWidget");
  const snapshot = widgetSnapshot(event);
  widget.default.updateSnapshot({
    ...snapshot,
    daysLabel: i18n.t("daysLeft"),
    nextTask: snapshot.nextTask || i18n.t("emptyTasks"),
  });
}
