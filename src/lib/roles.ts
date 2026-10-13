export type Role = "chairperson" | "secretary" | "treasurer" | "kagawad" | "kabataan";

export const OFFICIAL_ROLES: Role[] = ["chairperson", "secretary", "treasurer", "kagawad"];

export const ROLE_LABEL: Record<Role, string> = {
  chairperson: "SK Chairperson",
  secretary: "SK Secretary",
  treasurer: "SK Treasurer",
  kagawad: "SK Kagawad",
  kabataan: "Kabataan",
};

export function isOfficial(role: string): boolean {
  return OFFICIAL_ROLES.includes(role as Role);
}

/** Where each role lands in the dashboard. */
export const ROLE_HOME: Record<Role, string> = {
  chairperson: "/dashboard/chair",
  secretary: "/dashboard/secretary",
  treasurer: "/dashboard/treasurer",
  kagawad: "/dashboard/kagawad",
  kabataan: "/",   // v1 has no kabataan desk; see README
};

export const CATEGORIES = [
  "Edukasyon",
  "Kalusugan",
  "Kalikasan",
  "Palakasan",
  "Sining at Kultura",
  "Kabuhayan",
  "Imprastraktura",
  "Iba pa",
] as const;

/** Colors stay inside the flag palette. `chip` is for calendar events, `dot` for small markers. */
const CATEGORY_STYLE: Record<string, { chip: string; dot: string }> = {
  Edukasyon: { chip: "bg-flag-blue text-white", dot: "bg-flag-blue" },
  Kalusugan: { chip: "bg-flag-red text-white", dot: "bg-flag-red" },
  Kalikasan: { chip: "bg-emerald-700 text-white", dot: "bg-emerald-700" },
  Palakasan: { chip: "bg-flag-yellow text-ink", dot: "bg-flag-yellow" },
  "Sining at Kultura": { chip: "bg-rose-700 text-white", dot: "bg-rose-700" },
  Kabuhayan: { chip: "bg-ink text-white", dot: "bg-ink" },
  Imprastraktura: { chip: "bg-sky-700 text-white", dot: "bg-sky-700" },
  "Iba pa": { chip: "bg-slate-600 text-white", dot: "bg-slate-600" },
};

export function categoryStyle(category: string) {
  return CATEGORY_STYLE[category] ?? CATEGORY_STYLE["Iba pa"];
}

export const PROJECT_STATUS: Record<string, { label: string; className: string }> = {
  proposed: { label: "Proposed", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  approved: { label: "Funded", className: "bg-yellow-50 text-yellow-800 ring-yellow-200" },
  scheduled: { label: "Scheduled", className: "bg-blue-50 text-flag-blue ring-blue-200" },
  ongoing: { label: "Ongoing", className: "bg-flag-blue text-white ring-flag-blue" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-flag-red ring-red-200" },
};

export const IDEA_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Under review", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  approved: { label: "Approved for polling", className: "bg-yellow-50 text-yellow-800 ring-yellow-200" },
  polling: { label: "In the poll", className: "bg-blue-50 text-flag-blue ring-blue-200" },
  selected: { label: "Won the poll", className: "bg-flag-yellow text-ink ring-yellow-300" },
  proposed: { label: "Now a project", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  rejected: { label: "Not taken forward", className: "bg-red-50 text-flag-red ring-red-200" },
};

export const DOC_STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  pending: { label: "Waiting for approval", className: "bg-yellow-50 text-yellow-800 ring-yellow-200" },
  published: { label: "Published", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
};
