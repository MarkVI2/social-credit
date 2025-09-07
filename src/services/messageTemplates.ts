// Weighted communist-inspired message templates and helpers

export interface UserTransferContext {
  from: string; // sender username
  to: string; // recipient username
  credits: number; // positive integer credits moved
  reason?: string; // optional reason
}

export interface AdminAdjustmentContext {
  admin: string; // admin username
  user: string; // target user
  credits: number; // positive integer magnitude of change
  reason?: string;
}

type TemplateEntry = { template: string; weight: number };

// Utility: weighted random pick
function weightedPick<T extends TemplateEntry>(items: T[]): T {
  const total = items.reduce((s, i) => s + (i.weight > 0 ? i.weight : 0), 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const it of items) {
    acc += it.weight;
    if (r <= acc) return it;
  }
  return items[items.length - 1];
}

// Normalize / sanitize reason usage; if empty, substitute phrase
function normalizeReason(reason?: string) {
  const trimmed = (reason || "").trim();
  return trimmed.length ? trimmed : "no declared reason";
}

// Simple HTML escape to prevent XSS when injecting into templates
function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function finalize(template: string, mapping: Record<string, string | number>) {
  let out = template;
  for (const [k, v] of Object.entries(mapping)) {
    const re = new RegExp(`{${k}}`, "g");
    out = out.replace(re, String(v));
  }
  return out;
}

// Case 1: User -> User transfer (20)
const userTransferTemplates: TemplateEntry[] = [
  {
    template:
      "{from} has redistributed {credits} to {to} in the spirit of mutual prosperity for {reason}.",
    weight: 9,
  },
  {
    template:
      "{from} sends {credits} to {to} as comrades share bread for {reason}.",
    weight: 8,
  },
  {
    template:
      "From each according to ability, to each according to need: {from} transfers {credits} to {to} for {reason}.",
    weight: 3,
  },
  {
    template:
      "{from} hands over {credits} to {to} to strengthen collective progress for {reason}.",
    weight: 7,
  },
  {
    template:
      "Solidarity in action: {from} grants {credits} to {to} for {reason}.",
    weight: 10,
  },
  {
    template:
      "{from} transfers {credits} to {to}, fueling the revolution of {reason}.",
    weight: 4,
  },
  {
    template: "The people's credits flow: {from} to {to} for {reason}.",
    weight: 6,
  },
  {
    template: "{from} sends {credits} to {to}, uniting resources for {reason}.",
    weight: 8,
  },
  {
    template:
      "Communal harmony forged: {from} grants {credits} to {to} for {reason}.",
    weight: 5,
  },
  {
    template: "{from} invests {credits} into {to}'s cause for {reason}.",
    weight: 2,
  },
  {
    template:
      "Shared strength: {from} supports {to} with {credits} for {reason}.",
    weight: 9,
  },
  {
    template:
      "One for all, all for one: {from} passes {credits} to {to} for {reason}.",
    weight: 6,
  },
  {
    template:
      "The chain of unity grows: {from} transfers {credits} to {to} for {reason}.",
    weight: 5,
  },
  {
    template:
      "Workers stand together: {from} delivers {credits} to {to} for {reason}.",
    weight: 5,
  },
  {
    template:
      "The collective treasury expands: {from} sends {credits} to {to} for {reason}.",
    weight: 4,
  },
  {
    template:
      "Comrades exchange strength: {from} gives {credits} to {to} for {reason}.",
    weight: 7,
  },
  {
    template:
      "{from} honors solidarity by transferring {credits} to {to} for {reason}.",
    weight: 6,
  },
  {
    template:
      "A march toward equality: {from} sends {credits} to {to} for {reason}.",
    weight: 4,
  },
  {
    template:
      "Credit to the cause: {from} bestows {credits} on {to} for {reason}.",
    weight: 3,
  },
  {
    template: "Through unity, wealth circulates: {from} to {to} for {reason}.",
    weight: 2,
  },
];

// Case 2: Admin taking away from user (20)
const adminTakeTemplates: TemplateEntry[] = [
  {
    template:
      "{admin} reclaims {credits} from {user} for the good of the collective: {reason}.",
    weight: 8,
  },
  {
    template:
      "To preserve balance, {admin} removes {credits} from {user} for {reason}.",
    weight: 9,
  },
  {
    template:
      "The revolution spares no imbalance: {admin} withdraws {credits} from {user} for {reason}.",
    weight: 4,
  },
  {
    template: "{admin} confiscates {credits} from {user} for {reason}.",
    weight: 7,
  },
  {
    template:
      "For the strength of the commune, {admin} takes {credits} from {user} for {reason}.",
    weight: 6,
  },
  {
    template:
      "Justice of the people: {admin} reclaims {credits} from {user} for {reason}.",
    weight: 5,
  },
  {
    template:
      "{admin} removes {credits} from {user} to restore equilibrium for {reason}.",
    weight: 7,
  },
  {
    template:
      "No hoarding tolerated: {admin} deducts {credits} from {user} for {reason}.",
    weight: 9,
  },
  {
    template:
      "The people's watch is vigilant: {admin} retrieves {credits} from {user} for {reason}.",
    weight: 5,
  },
  {
    template:
      "Collective fairness enforced: {admin} reclaims {credits} from {user} for {reason}.",
    weight: 6,
  },
  {
    template:
      "{admin} repossesses {credits} from {user} to maintain equality for {reason}.",
    weight: 4,
  },
  {
    template:
      "As the party decrees, {admin} withdraws {credits} from {user} for {reason}.",
    weight: 3,
  },
  {
    template:
      "Unequal gains corrected: {admin} deducts {credits} from {user} for {reason}.",
    weight: 5,
  },
  {
    template:
      "The people's law stands: {admin} reclaims {credits} from {user} for {reason}.",
    weight: 3,
  },
  {
    template:
      "{admin} removes {credits} from {user}, realigning with the revolution for {reason}.",
    weight: 4,
  },
  {
    template:
      "Wealth imbalance targeted: {admin} confiscates {credits} from {user} for {reason}.",
    weight: 2,
  },
  {
    template:
      "For harmony, {admin} withdraws {credits} from {user} for {reason}.",
    weight: 4,
  },
  {
    template:
      "Resource control enacted: {admin} deducts {credits} from {user} for {reason}.",
    weight: 2,
  },
  {
    template:
      "{admin} strips {credits} from {user} to uphold justice for {reason}.",
    weight: 2,
  },
  {
    template:
      "The collective's needs prevail: {admin} reclaims {credits} from {user} for {reason}.",
    weight: 2,
  },
];

// Case 3: Admin giving to user (20)
const adminGiveTemplates: TemplateEntry[] = [
  {
    template:
      "{admin} allocates {credits} to {user} in the name of the people's cause: {reason}.",
    weight: 8,
  },
  {
    template:
      "The state rewards loyalty: {admin} grants {credits} to {user} for {reason}.",
    weight: 7,
  },
  {
    template:
      "As decreed by the revolution, {admin} bestows {credits} upon {user} for {reason}.",
    weight: 4,
  },
  {
    template:
      "{admin} gifts {credits} to {user} in honor of service for {reason}.",
    weight: 6,
  },
  {
    template:
      "Wealth for the worker: {admin} allocates {credits} to {user} for {reason}.",
    weight: 9,
  },
  {
    template:
      "For contributions to the cause, {admin} grants {credits} to {user} for {reason}.",
    weight: 7,
  },
  { template: "{admin} channels {credits} to {user} for {reason}.", weight: 6 },
  {
    template:
      "The people's treasury supports {user}: {admin} gives {credits} for {reason}.",
    weight: 5,
  },
  {
    template:
      "Party gratitude flows: {admin} awards {credits} to {user} for {reason}.",
    weight: 4,
  },
  {
    template:
      "Recognition of dedication: {admin} transfers {credits} to {user} for {reason}.",
    weight: 5,
  },
  {
    template:
      "{admin} reinforces unity by giving {credits} to {user} for {reason}.",
    weight: 5,
  },
  {
    template:
      "Revolutionary reward: {admin} allocates {credits} to {user} for {reason}.",
    weight: 4,
  },
  {
    template:
      "The spirit of socialism thrives: {admin} grants {credits} to {user} for {reason}.",
    weight: 3,
  },
  {
    template:
      "Worker recognized: {admin} delivers {credits} to {user} for {reason}.",
    weight: 4,
  },
  {
    template: "{admin} enriches {user} with {credits} for {reason}.",
    weight: 3,
  },
  {
    template:
      "Solidarity gift: {admin} bestows {credits} upon {user} for {reason}.",
    weight: 3,
  },
  {
    template:
      "Communal reward: {admin} transfers {credits} to {user} for {reason}.",
    weight: 3,
  },
  {
    template:
      "From the people's fund, {admin} allocates {credits} to {user} for {reason}.",
    weight: 2,
  },
  {
    template: "Labor honored: {admin} grants {credits} to {user} for {reason}.",
    weight: 2,
  },
  {
    template:
      "The revolution rewards its champions: {admin} delivers {credits} to {user} for {reason}.",
    weight: 1,
  },
];

export function buildUserTransferMessage(ctx: UserTransferContext): string {
  const reason = escapeHtml(normalizeReason(ctx.reason));
  const fromEsc = escapeHtml(ctx.from);
  const toEsc = escapeHtml(ctx.to);
  const picked = weightedPick(userTransferTemplates);
  // Build base message
  let msg = finalize(picked.template, {
    from: fromEsc,
    to: toEsc,
    credits: ctx.credits,
    reason,
  });
  // Highlight sender and recipient in red and bold
  msg = msg.replace(
    new RegExp(fromEsc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    `<span class="text-red-500 font-bold">${fromEsc}</span>`
  );
  msg = msg.replace(
    new RegExp(toEsc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    `<span class="text-red-500 font-bold">${toEsc}</span>`
  );
  // Bold only the standalone credit amount occurrence (avoid touching digits in usernames like '23AI69')
  msg = msg.replace(
    new RegExp(`\\b${ctx.credits}\\b`),
    `<span class="font-bold">${ctx.credits}</span>`
  );
  return msg;
}

export function buildAdminGiveMessage(ctx: AdminAdjustmentContext): string {
  const reason = escapeHtml(normalizeReason(ctx.reason));
  const admin = escapeHtml(ctx.admin);
  const user = escapeHtml(ctx.user);
  const picked = weightedPick(adminGiveTemplates);
  return finalize(picked.template, {
    admin,
    user,
    credits: ctx.credits,
    reason,
  });
}

export function buildAdminTakeMessage(ctx: AdminAdjustmentContext): string {
  const reason = escapeHtml(normalizeReason(ctx.reason));
  const admin = escapeHtml(ctx.admin);
  const user = escapeHtml(ctx.user);
  const picked = weightedPick(adminTakeTemplates);
  return finalize(picked.template, {
    admin,
    user,
    credits: ctx.credits,
    reason,
  });
}
