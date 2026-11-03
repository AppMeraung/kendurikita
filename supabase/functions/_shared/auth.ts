// An unset secret must never authorise a request (otherwise "Bearer undefined" would pass).
export const bearerMatches = (header: string | null, secret: string | undefined) =>
  Boolean(secret) && header === `Bearer ${secret}`;
