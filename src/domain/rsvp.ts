export function validRsvpToken(token: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    token,
  );
}

export function validRsvpPax(value: string | number, invitedPax: number) {
  const pax = typeof value === "number" ? value : Number(value);
  return Number.isInteger(pax) && pax >= 1 && pax <= invitedPax;
}
