import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { eventReportHtml } from "../domain/reportExport";
import { EventData } from "../state/AppState";

export async function shareEventReport(event: EventData) {
  const { uri } = await Print.printToFileAsync({
    html: eventReportHtml(event),
  });
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Perkongsian fail tidak tersedia.");
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: event.name,
  });
  return uri;
}
