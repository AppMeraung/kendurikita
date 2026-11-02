export type Availability = {
  id?: string;
  start: string;
  end: string;
  status: "available" | "tentative" | "booked";
};
export function validVendorPackage(
  name: string,
  price: string,
  minimumPax: string,
  travelCharge: string,
) {
  const amount = Number(price),
    pax = minimumPax ? Number(minimumPax) : 0,
    travel = travelCharge ? Number(travelCharge) : 0;
  return (
    Boolean(name.trim()) &&
    Number.isFinite(amount) &&
    amount >= 0 &&
    Number.isInteger(pax) &&
    pax >= 0 &&
    Number.isFinite(travel) &&
    travel >= 0
  );
}
export function availabilityConflict(
  candidate: Availability,
  entries: Availability[],
) {
  if (candidate.status === "available") return false;
  const start = new Date(candidate.start).getTime(),
    end = new Date(candidate.end).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return true;
  return entries.some(
    (entry) =>
      entry.id !== candidate.id &&
      entry.status !== "available" &&
      new Date(entry.start).getTime() < end &&
      new Date(entry.end).getTime() > start,
  );
}
