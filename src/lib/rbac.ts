// Role-based access control
// OWNER > MANAGER > CASHIER

export const ROLES = ["OWNER", "MANAGER", "CASHIER"] as const;
export type Role = (typeof ROLES)[number];

const ROLE_LEVEL: Record<Role, number> = {
  OWNER: 3,
  MANAGER: 2,
  CASHIER: 1,
};

export function hasRole(actual: Role | string | null | undefined, required: Role): boolean {
  if (!actual) return false;
  const a = ROLE_LEVEL[actual as Role] ?? 0;
  const r = ROLE_LEVEL[required];
  return a >= r;
}

export const PERMISSIONS = {
  // Tenant settings
  "settings.read": "CASHIER" as Role,
  "settings.write": "MANAGER" as Role,
  "settings.billing": "OWNER" as Role,

  // Products
  "products.read": "CASHIER" as Role,
  "products.write": "MANAGER" as Role,
  "products.delete": "MANAGER" as Role,

  // Customers
  "customers.read": "CASHIER" as Role,
  "customers.write": "CASHIER" as Role,
  "customers.delete": "MANAGER" as Role,

  // Sales / POS
  "sales.read": "CASHIER" as Role,
  "sales.create": "CASHIER" as Role,
  "sales.return": "MANAGER" as Role,
  "sales.discount": "CASHIER" as Role,
  "sales.discount.high": "MANAGER" as Role,

  // Shifts
  "shifts.manage": "CASHIER" as Role,
  "shifts.close": "MANAGER" as Role,

  // Employees
  "employees.read": "MANAGER" as Role,
  "employees.write": "OWNER" as Role,

  // Suppliers & purchases
  "suppliers.read": "MANAGER" as Role,
  "suppliers.write": "MANAGER" as Role,
  "purchases.read": "MANAGER" as Role,
  "purchases.write": "MANAGER" as Role,

  // Reports
  "reports.read": "MANAGER" as Role,

  // Tax & discount config
  "tax.write": "OWNER" as Role,
  "discount.write": "MANAGER" as Role,
};

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | string | null | undefined, permission: Permission): boolean {
  return hasRole(role, PERMISSIONS[permission]);
}

export function assertCan(role: Role | string | null | undefined, permission: Permission): void {
  if (!can(role, permission)) {
    throw new Error(`Forbidden: ${permission} requires ${PERMISSIONS[permission]}`);
  }
}
