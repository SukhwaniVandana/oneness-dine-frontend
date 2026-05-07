/* ─────────────────────────────────────────────────────
   Role → Landing page mapping
   Add/change routes here as screens are built
───────────────────────────────────────────────────── */
export const ROLE_HOME = {
  ADMIN:         '/tables',
  MANAGER:       '/tables',
  CASHIER:       '/billing',
  WAITER:        '/tables',
  CAPTAIN:       '/tables',
  KITCHEN_STAFF: '/kot',
};

export const DEFAULT_HOME = '/tables';

export function getRoleHome(roleName) {
  return ROLE_HOME[roleName] || DEFAULT_HOME;
}

/* Role display labels */
export const ROLE_LABELS = {
  ADMIN:         'Admin',
  MANAGER:       'Manager',
  CASHIER:       'Cashier',
  WAITER:        'Waiter',
  CAPTAIN:       'Captain',
  KITCHEN_STAFF: 'Kitchen Staff',
};

/* Role icons */
export const ROLE_ICONS = {
  ADMIN:         '👑',
  MANAGER:       '🏢',
  CASHIER:       '💳',
  WAITER:        '🍽️',
  CAPTAIN:       '📋',
  KITCHEN_STAFF: '👨‍🍳',
};
