import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Guest, SeatingTable } from "../domain";
import { seatingHtml } from "../domain/seatingExport";
export async function shareSeatingPdf(
  eventName: string,
  tables: SeatingTable[],
  guests: Guest[],
) {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Perkongsian fail tidak tersedia pada peranti ini.");
  const result = await Print.printToFileAsync({
    html: seatingHtml(eventName, tables, guests),
  });
  await Sharing.shareAsync(result.uri, {
    mimeType: "application/pdf",
    dialogTitle: "Kongsi pelan meja",
  });
}
