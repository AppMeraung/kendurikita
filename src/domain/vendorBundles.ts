export function validBundle(
  name: string,
  price: string,
  members: { vendorId: string; commission: number }[],
) {
  const amount = Number(price);
  return (
    name.trim().length >= 3 &&
    Number.isFinite(amount) &&
    amount > 0 &&
    members.length >= 2 &&
    new Set(members.map((item) => item.vendorId)).size === members.length &&
    members.every(
      (item) =>
        item.vendorId &&
        Number.isFinite(item.commission) &&
        item.commission >= 0 &&
        item.commission <= 100,
    )
  );
}
