export const OWNER_ROLE_KEY = "ORG_OWNER";

export const ROLE_LABEL: Record<string, string> = {
  PLATFORM_ADMIN: "Platform admin",
  ORG_OWNER: "Organization owner",
  CISO: "CISO",
  CSO: "CISO",
  ASSESSOR: "Assessor",
  CONTROL_OWNER: "Control owner",
  AUDITOR: "Auditor",
  EXEC_VIEWER: "Board / executive viewer",
};

export const SYSTEM_ROLES = [
  { key: "ORG_OWNER", name: "Organization owner", locked: true, sortOrder: 0 },
  { key: "CISO", name: "CISO", locked: false, sortOrder: 1 },
  { key: "ASSESSOR", name: "Assessor", locked: false, sortOrder: 2 },
  { key: "CONTROL_OWNER", name: "Control owner", locked: false, sortOrder: 3 },
  { key: "AUDITOR", name: "Auditor", locked: false, sortOrder: 4 },
  { key: "EXEC_VIEWER", name: "Board / executive viewer", locked: false, sortOrder: 5 },
] as const;

export const SYSTEM_ROLE_KEYS = SYSTEM_ROLES.map((role) => role.key);
export const MANAGED_ROLES = SYSTEM_ROLE_KEYS;

export function isOwnerRole(role: string) {
  return role === OWNER_ROLE_KEY;
}

export function roleDisplayName(key: string, name?: string | null) {
  return name?.trim() || ROLE_LABEL[key] || key;
}

export function roleKeyFromName(name: string) {
  const key = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  return key || "ROLE";
}

export const PRODUCT_AREAS = [
  {
    code: "PROGRAM",
    label: "Program",
    description: "Brand list, dashboards, and creating brands",
  },
  {
    code: "ASSESSMENT",
    label: "Assessment",
    description: "Organizational profile scoring and outcome details",
  },
  {
    code: "EVIDENCE",
    label: "Evidence",
    description: "Evidence locker, downloads, and attachments",
  },
  {
    code: "HISTORY",
    label: "History",
    description: "Current and Target change history",
  },
  {
    code: "REPORTS",
    label: "Reports",
    description: "Board scorecards and publishing snapshots",
  },
  {
    code: "PEOPLE",
    label: "People",
    description: "Roster and invitations",
  },
  {
    code: "ROLES",
    label: "Roles",
    description: "Role permission matrix",
  },
  {
    code: "CONFIG",
    label: "Config",
    description: "System email and CVE settings",
  },
  {
    code: "SOFTWARE",
    label: "Software inventory",
    description: "Brand software inventory, CVE catalog, matching, and alert history",
  },
] as const;

export type ProductAreaCode = (typeof PRODUCT_AREAS)[number]["code"];
export type AccessLevel = "view" | "edit";
export type AccessMode = "none" | "view" | "edit";
export type AreaAccess = { view: boolean; edit: boolean };
export type PermissionMap = Record<ProductAreaCode, AreaAccess>;
export type RolePermissionMatrix = Record<string, PermissionMap>;

export const ACCESS_MODES: { code: AccessMode; label: string; description: string }[] = [
  { code: "none", label: "None", description: "No access to this area" },
  { code: "view", label: "View", description: "See the area, lists, and details" },
  { code: "edit", label: "Edit", description: "View plus create, update, or delete" },
];

const none: AreaAccess = { view: false, edit: false };
const viewOnly: AreaAccess = { view: true, edit: false };
const full: AreaAccess = { view: true, edit: true };

function mapWith(
  overrides: Partial<Record<ProductAreaCode, AreaAccess>>,
  fallback: AreaAccess = none,
): PermissionMap {
  return {
    PROGRAM: overrides.PROGRAM ?? fallback,
    ASSESSMENT: overrides.ASSESSMENT ?? fallback,
    EVIDENCE: overrides.EVIDENCE ?? fallback,
    HISTORY: overrides.HISTORY ?? fallback,
    REPORTS: overrides.REPORTS ?? fallback,
    PEOPLE: overrides.PEOPLE ?? fallback,
    ROLES: overrides.ROLES ?? fallback,
    CONFIG: overrides.CONFIG ?? fallback,
    SOFTWARE: overrides.SOFTWARE ?? fallback,
  };
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionMap> = {
  PLATFORM_ADMIN: mapWith({}, full),
  ORG_OWNER: mapWith({}, full),
  CISO: mapWith({}, full),
  CSO: mapWith({}, full),
  ASSESSOR: mapWith({
    PROGRAM: viewOnly,
    ASSESSMENT: full,
    EVIDENCE: full,
    HISTORY: viewOnly,
    REPORTS: viewOnly,
    PEOPLE: viewOnly,
    ROLES: none,
    CONFIG: none,
    SOFTWARE: viewOnly,
  }),
  CONTROL_OWNER: mapWith({
    PROGRAM: viewOnly,
    ASSESSMENT: full,
    EVIDENCE: full,
    HISTORY: viewOnly,
    REPORTS: viewOnly,
    PEOPLE: viewOnly,
    ROLES: none,
    CONFIG: none,
    SOFTWARE: viewOnly,
  }),
  AUDITOR: mapWith({
    PROGRAM: viewOnly,
    ASSESSMENT: viewOnly,
    EVIDENCE: viewOnly,
    HISTORY: viewOnly,
    REPORTS: viewOnly,
    PEOPLE: viewOnly,
    ROLES: none,
    CONFIG: none,
    SOFTWARE: viewOnly,
  }),
  EXEC_VIEWER: mapWith({
    REPORTS: viewOnly,
  }),
};

export function emptyPermissionMap(): PermissionMap {
  return mapWith({}, none);
}

export function normalizeAccess(access: Partial<AreaAccess> & { read?: boolean }): AreaAccess {
  const edit = Boolean(access.edit);
  const view = Boolean(access.view) || Boolean(access.read) || edit;
  return { view, edit };
}

export function accessMode(access: AreaAccess): AccessMode {
  if (access.edit) return "edit";
  if (access.view) return "view";
  return "none";
}

export function accessFromMode(mode: AccessMode): AreaAccess {
  if (mode === "edit") return { view: true, edit: true };
  if (mode === "view") return { view: true, edit: false };
  return { view: false, edit: false };
}

export function defaultPermissionMap(role: string): PermissionMap {
  const resolved = role === "CSO" ? "CISO" : role;
  const source = DEFAULT_ROLE_PERMISSIONS[resolved] ?? emptyPermissionMap();
  return {
    PROGRAM: normalizeAccess(source.PROGRAM),
    ASSESSMENT: normalizeAccess(source.ASSESSMENT),
    EVIDENCE: normalizeAccess(source.EVIDENCE),
    HISTORY: normalizeAccess(source.HISTORY),
    REPORTS: normalizeAccess(source.REPORTS),
    PEOPLE: normalizeAccess(source.PEOPLE),
    ROLES: normalizeAccess(source.ROLES),
    CONFIG: normalizeAccess(source.CONFIG),
    SOFTWARE: normalizeAccess(source.SOFTWARE),
  };
}

export function defaultPermissionMatrix(): RolePermissionMatrix {
  return {
    PLATFORM_ADMIN: defaultPermissionMap("PLATFORM_ADMIN"),
    ORG_OWNER: defaultPermissionMap("ORG_OWNER"),
    CISO: defaultPermissionMap("CISO"),
    ASSESSOR: defaultPermissionMap("ASSESSOR"),
    CONTROL_OWNER: defaultPermissionMap("CONTROL_OWNER"),
    AUDITOR: defaultPermissionMap("AUDITOR"),
    EXEC_VIEWER: defaultPermissionMap("EXEC_VIEWER"),
  };
}

export function hasAccess(
  permissions: PermissionMap,
  area: ProductAreaCode,
  level: AccessLevel,
) {
  const access = permissions[area];
  if (!access) return false;
  if (level === "edit") return access.edit;
  return access.view || access.edit;
}

export function homePath(permissions: PermissionMap) {
  if (hasAccess(permissions, "PROGRAM", "view")) return "/app";
  if (hasAccess(permissions, "REPORTS", "view")) return "/app/reports";
  if (hasAccess(permissions, "PEOPLE", "view")) return "/app/settings/people";
  if (hasAccess(permissions, "ROLES", "view")) return "/app/settings/roles";
  if (hasAccess(permissions, "CONFIG", "view")) return "/app/settings/config";
  return "/app/reports";
}

export type NavLink = {
  href: string;
  label: string;
  children?: NavLink[];
};

function brandNavChildren(
  permissions: PermissionMap,
  brandId: string,
): NavLink[] {
  const children: NavLink[] = [];
  if (hasAccess(permissions, "ASSESSMENT", "view")) {
    children.push({
      href: `/app/brands/${brandId}/assess`,
      label: "Open assessment",
    });
  }
  if (hasAccess(permissions, "EVIDENCE", "view")) {
    children.push({
      href: `/app/brands/${brandId}/evidence`,
      label: "Evidence",
    });
  }
  if (hasAccess(permissions, "REPORTS", "view")) {
    children.push({
      href: `/app/brands/${brandId}/reports`,
      label: "Reports",
    });
  }
  if (hasAccess(permissions, "REPORTS", "edit")) {
    children.push({
      href: `/app/brands/${brandId}/publish`,
      label: "Publish snapshot",
    });
  }
  if (hasAccess(permissions, "SOFTWARE", "view")) {
    children.push({
      href: `/app/brands/${brandId}/software`,
      label: "Software inventory",
    });
  }
  return children;
}

export function navLinksFor(
  permissions: PermissionMap,
  brands: { id: string; name: string }[] = [],
): NavLink[] {
  const links: NavLink[] = [];
  const canSeeProgram = hasAccess(permissions, "PROGRAM", "view");
  const canSeeReports = hasAccess(permissions, "REPORTS", "view");
  if (canSeeProgram || canSeeReports) {
    links.push({
      href: canSeeProgram ? "/app" : "/app/reports",
      label: canSeeProgram ? "Program" : "Brands",
      children: brands.map((brand) => {
        const children = brandNavChildren(permissions, brand.id);
        return {
          href: canSeeProgram
            ? `/app/brands/${brand.id}`
            : `/app/brands/${brand.id}/reports`,
          label: brand.name,
          children: children.length > 0 ? children : undefined,
        };
      }),
    });
  }
  if (hasAccess(permissions, "PEOPLE", "view")) {
    links.push({ href: "/app/settings/people", label: "People" });
  }
  if (hasAccess(permissions, "ROLES", "view")) {
    links.push({ href: "/app/settings/roles", label: "Roles" });
  }
  if (hasAccess(permissions, "CONFIG", "view")) {
    links.push({ href: "/app/settings/config", label: "Config" });
  }
  return links;
}

export function canEdit(role: string, isPlatformAdmin = false) {
  return isPlatformAdmin || hasAccess(defaultPermissionMap(role), "ASSESSMENT", "edit");
}

export function canInvite(role: string, isPlatformAdmin = false) {
  return isPlatformAdmin || hasAccess(defaultPermissionMap(role), "PEOPLE", "edit");
}

export function canPublish(role: string, isPlatformAdmin = false) {
  return isPlatformAdmin || hasAccess(defaultPermissionMap(role), "REPORTS", "edit");
}

export function isExecViewer(role: string) {
  return role === "EXEC_VIEWER";
}
