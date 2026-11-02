import { Widget } from "expo-widgets";

declare const widget: Widget<{
  eventName: string;
  daysLeft: number;
  daysLabel: string;
  nextTask: string;
}>;
export default widget;
