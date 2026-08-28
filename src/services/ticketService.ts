import { apiRequest } from "./apiClient";

export type TicketPriority = "Critical" | "High" | "Medium" | "Low";

export const TICKET_PRIORITIES: TicketPriority[] = ["Critical", "High", "Medium", "Low"];

// Same fixed list as the web console's Create Service Request form
// (DEVICE_TYPES in ServiceDesk.tsx) — not sourced from the Offline Asset
// device-type lookup, which is a separate, unrelated list.
export const DEVICE_TYPES = ["Desktop", "Laptop", "Tablet", "Mobile", "Server", "Network Device", "Printer", "Other"];

export type IncidentDetail = {
  id: number;
  name: string;
};

export type IncidentSubcategory = {
  id: number;
  name: string;
  details: IncidentDetail[];
};

export type IncidentCategory = {
  id: number;
  name: string;
  subcategories: IncidentSubcategory[];
};

export type CreateTicketInput = {
  title: string;
  description: string;
  priority: TicketPriority;
  deviceType: string;
  assetId: string;
  categoryId: number;
  subcategoryId?: number | null;
  detailId?: number | null;
};

export type CreateTicketResult = {
  id: string;
  requesterName: string;
  requesterPhone: string;
  title: string;
  category: string;
  subcategory: string;
  incidentDetail: string;
  deviceType: string;
  assetId: string;
  priority: TicketPriority;
  status: string;
  message: string;
};

export type MyTicket = {
  id: string;
  title: string;
  status: string;
  priority: TicketPriority;
  category: string;
  subcategory: string;
  createdAt: string;
};

function text(value: unknown, fallback = "-") {
  const clean = String(value ?? "").trim();
  return clean || fallback;
}

function formatTicketDate(value: unknown) {
  const raw = text(value, "");
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Reuses the web app's existing category/subcategory/detail taxonomy
// endpoint — already a single lean query, no mobile-specific mirror needed
// (same pattern as /api/task-list, /api/reports/catalog elsewhere in this
// app).
export async function fetchIncidentCategories(): Promise<IncidentCategory[]> {
  const response: any = await apiRequest("/api/settings/incident-config/categories");
  const rows = Array.isArray(response?.data) ? response.data : [];

  return rows
    .filter((row: any) => row?.isActive !== false)
    .map((row: any) => ({
      id: Number(row.id),
      name: text(row.name, "Unnamed Category"),
      subcategories: (Array.isArray(row.subcategories) ? row.subcategories : [])
        .filter((sub: any) => sub?.isActive !== false)
        .map((sub: any) => ({
          id: Number(sub.id),
          name: text(sub.name, "Unnamed Subcategory"),
          details: (Array.isArray(sub.details) ? sub.details : [])
            .filter((detail: any) => detail?.isActive !== false)
            .map((detail: any) => ({
              id: Number(detail.id),
              name: text(detail.name, "Unnamed Detail"),
            })),
        })),
    }));
}

// Assignment is intentionally not collected on mobile — a ticket created
// here always comes in unassigned (EMA_Incidents.AssignedTo/AssignedLevel
// stay blank server-side), and an admin picks the owner from the web
// Service Desk console. Product decision: keep the mobile create-ticket
// flow to "report the issue", not "route the issue".
export async function createTicket(input: CreateTicketInput): Promise<CreateTicketResult> {
  const response: any = await apiRequest("/api/mobile/tickets", {
    method: "POST",
    body: {
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority,
      deviceType: input.deviceType,
      assetId: input.assetId,
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId || undefined,
      detailId: input.detailId || undefined,
    },
  });
  const data = response?.data || {};

  return {
    id: text(data.id, ""),
    requesterName: text(data.requesterName),
    requesterPhone: text(data.requesterPhone),
    title: text(data.title),
    category: text(data.category),
    subcategory: text(data.subcategory, ""),
    incidentDetail: text(data.incidentDetail, ""),
    deviceType: text(data.deviceType, ""),
    assetId: text(data.assetId, ""),
    priority: (data.priority as TicketPriority) || input.priority,
    status: text(data.status),
    message: text(response?.message, "Ticket created."),
  };
}

// Backs the Overview screen's "My Recent Tickets" card — the authenticated
// user's own submitted tickets, not the tenant-wide open queue (that's
// fetchTicketAlerts in opsMobileService.ts).
export async function fetchMyTickets(): Promise<MyTicket[]> {
  const response: any = await apiRequest("/api/mobile/tickets/mine");
  const rows = Array.isArray(response?.data) ? response.data : [];

  return rows.map((row: any) => ({
    id: text(row.id, ""),
    title: text(row.title, "Untitled ticket"),
    status: text(row.status, "Awaiting"),
    priority: (row.priority as TicketPriority) || "Medium",
    category: text(row.category, ""),
    subcategory: text(row.subcategory, ""),
    createdAt: formatTicketDate(row.createdAt),
  }));
}
