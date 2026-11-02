export type VendorProfileDraft = {
  company: string;
  ssm: string;
  businessType: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  coverage: string;
  foundedYear: string;
  languages: string;
  description: string;
  deposit: string;
  cancellation: string;
  rescheduling: string;
};
const required: (keyof VendorProfileDraft)[] = [
  "company",
  "ssm",
  "businessType",
  "ownerName",
  "phone",
  "email",
  "address",
  "state",
  "coverage",
  "languages",
  "description",
];
export function vendorProfileCompleteness(
  profile: VendorProfileDraft,
  categoryCount: number,
  hasSsm: boolean,
  hasIc: boolean,
) {
  const filled = required.filter((key) => profile[key].trim()).length;
  const total = required.length + 3;
  return Math.round(
    ((filled + (categoryCount ? 1 : 0) + (hasSsm ? 1 : 0) + (hasIc ? 1 : 0)) /
      total) *
      100,
  );
}
export function validFoundedYear(
  value: string,
  year = new Date().getFullYear(),
) {
  if (!value) return true;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1800 && parsed <= year;
}
