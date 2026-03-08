import { User, UserStatus, Permission, DEFAULT_PERMISSIONS, CountryCode } from './types';

const USERS_KEY = 'bank_insights_users';
const AUDIT_KEY = 'bank_insights_audit_log';
const INVITES_KEY = 'bank_insights_invites';

export interface AuditEvent {
  id: string;
  action: string;
  actorEmail?: string;
  targetId?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export type InviteStatus = 'draft' | 'sent' | 'used' | 'expired';

export interface SubscriberInvite {
  id: string;
  token: string;
  userId: string;
  email: string;
  companyName: string;
  countries: CountryCode[];
  requestedCountries?: CountryCode[];
  contactName?: string;
  phone?: string;
  subscriptionEndsAt?: string;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
}

const seedUsers = (): User[] => [
  {
    id: 'admin-001',
    email: 'admin@bankinsights.com',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    permissions: Object.values(DEFAULT_PERMISSIONS.admin),
    emailVerified: true,
    subscription_tier: 'standard',
    subscription_addon_ai: true,
    ai_usage_count: 0,
    ai_usage_reset_date: new Date().toISOString(),
  },
  {
    id: 'subscriber-001',
    email: 'analyst@accessbank.com',
    role: 'subscriber',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    assignedCountries: ['rwanda', 'uganda'],
    bankId: 'access',
    companyName: 'Access Bank',
    emailVerified: true,
    permissions: DEFAULT_PERMISSIONS.subscriber,
    subscription_tier: 'standard',
    subscription_addon_ai: false,
    ai_usage_count: 0,
    ai_usage_reset_date: new Date().toISOString(),
  },
  {
    id: 'subscriber-002',
    email: 'manager@gtbank.com',
    role: 'subscriber',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    assignedCountries: ['burundi'],
    bankId: 'gtbank',
    companyName: 'Guaranty Trust Bank',
    emailVerified: true,
    permissions: DEFAULT_PERMISSIONS.subscriber,
    subscription_tier: 'free',
    subscription_addon_ai: false,
    ai_usage_count: 0,
    ai_usage_reset_date: new Date().toISOString(),
  }
];

const ensureSeeded = (): void => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers()));
  }
};

const readUsersRaw = (): User[] => {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const readUsers = (): User[] => {
  ensureSeeded();
  return readUsersRaw();
};

const writeUsers = (users: User[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const readAudit = (): AuditEvent[] => {
  const raw = localStorage.getItem(AUDIT_KEY);
  return raw ? JSON.parse(raw) : [];
};

const writeAudit = (events: AuditEvent[]): void => {
  localStorage.setItem(AUDIT_KEY, JSON.stringify(events));
};

const readInvites = (): SubscriberInvite[] => {
  const raw = localStorage.getItem(INVITES_KEY);
  return raw ? JSON.parse(raw) : [];
};

const writeInvites = (invites: SubscriberInvite[]): void => {
  localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
};

const logEvent = (action: string, details?: Record<string, unknown>, actorEmail?: string, targetId?: string) => {
  const events = readAudit();
  const next: AuditEvent = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    actorEmail,
    targetId,
    timestamp: new Date().toISOString(),
    details,
  };
  writeAudit([next, ...events].slice(0, 200));
};

export const adminStore = {
  listUsers: (): User[] => readUsers(),
  getUserByEmail: (email: string): User | undefined => readUsers().find(u => u.email === email),
  hasAdmin: (): boolean => readUsers().some(u => u.role === 'admin'),
  hasAdminStored: (): boolean => readUsersRaw().some(u => u.role === 'admin'),
  listAudit: (): AuditEvent[] => readAudit(),
  listInvites: (): SubscriberInvite[] => readInvites(),
  getInviteByToken: (token: string): SubscriberInvite | undefined => readInvites().find(invite => invite.token === token),
  getInviteByUserId: (userId: string): SubscriberInvite | undefined => readInvites().find(invite => invite.userId === userId && invite.status !== 'expired'),
  createAdmin: (data: { email: string; password?: string }, actorEmail?: string): User => {
    const users = readUsers();
    const newUser: User = {
      id: `admin-${Date.now()}`,
      email: data.email,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      permissions: Object.values(DEFAULT_PERMISSIONS.admin),
      emailVerified: true,
      subscription_tier: 'standard',
      subscription_addon_ai: true,
      ai_usage_count: 0,
      ai_usage_reset_date: new Date().toISOString(),
      passwordHash: data.password ? btoa(data.password) : undefined,
    };
    writeUsers([...users, newUser]);
    logEvent('admin_created', { email: newUser.email }, actorEmail, newUser.id);
    return newUser;
  },
  createSubscriber: (data: { email: string; password?: string; companyName?: string }, actorEmail?: string): User => {
    const users = readUsers();
    const newUser: User = {
      id: `subscriber-${Date.now()}`,
      email: data.email,
      role: 'subscriber',
      status: 'pending',
      createdAt: new Date().toISOString(),
      companyName: data.companyName || data.email.split('@')[0],
      assignedCountries: [],
      emailVerified: false,
      permissions: DEFAULT_PERMISSIONS.subscriber,
      subscription_tier: 'free',
      subscription_addon_ai: false,
      ai_usage_count: 0,
      ai_usage_reset_date: new Date().toISOString(),
    };
    writeUsers([...users, newUser]);
    logEvent('subscriber_created', { email: newUser.email, companyName: newUser.companyName }, actorEmail, newUser.id);
    return newUser;
  },
  createDraftSubscriber: (data: { email: string; companyName?: string }, actorEmail?: string): User => {
    const users = readUsers();
    const newUser: User = {
      id: `subscriber-${Date.now()}`,
      email: data.email,
      role: 'subscriber',
      status: 'draft',
      createdAt: new Date().toISOString(),
      companyName: data.companyName || data.email.split('@')[0],
      assignedCountries: [],
      emailVerified: false,
      permissions: DEFAULT_PERMISSIONS.subscriber,
      subscription_tier: 'free',
      subscription_addon_ai: false,
      ai_usage_count: 0,
      ai_usage_reset_date: new Date().toISOString(),
    };
    writeUsers([...users, newUser]);
    logEvent('subscriber_draft_created', { email: newUser.email, companyName: newUser.companyName }, actorEmail, newUser.id);
    return newUser;
  },
  createInvite: (userId: string, countries: CountryCode[], validityDays: number, actorEmail?: string): SubscriberInvite | null => {
    const users = readUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    const token = `invite_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + validityDays * 24 * 60 * 60 * 1000);
    const invite: SubscriberInvite = {
      id: `invite-${Date.now()}`,
      token,
      userId,
      email: user.email,
      companyName: user.companyName || user.email,
      countries,
      status: 'sent',
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      subscriptionEndsAt: user.subscriptionEndsAt,
    };
    const invites = readInvites();
    writeInvites([invite, ...invites]);
    adminStore.updateUser(userId, { assignedCountries: countries });
    logEvent('subscriber_invite_created', { email: user.email, countries }, actorEmail, userId);
    return invite;
  },
  acceptInvite: (token: string, data: { contactName: string; phone: string; requestedCountries: CountryCode[]; companyName: string }): SubscriberInvite | null => {
    const invites = readInvites();
    const index = invites.findIndex(invite => invite.token === token);
    if (index === -1) return null;
    const invite = invites[index];
    const now = new Date();
    if (invite.usedAt) return null;
    if (new Date(invite.expiresAt).getTime() < now.getTime()) {
      invites[index] = { ...invite, status: 'expired' };
      writeInvites(invites);
      return null;
    }
    invites[index] = {
      ...invite,
      status: 'used',
      usedAt: now.toISOString(),
      contactName: data.contactName,
      phone: data.phone,
      requestedCountries: data.requestedCountries,
      companyName: data.companyName,
    };
    writeInvites(invites);
    adminStore.updateUser(invite.userId, {
      status: 'pending',
      contactName: data.contactName,
      phone: data.phone,
      requestedCountries: data.requestedCountries,
      companyName: data.companyName,
      assignedCountries: invite.countries,
    });
    logEvent('subscriber_invite_used', { email: invite.email }, undefined, invite.userId);
    return invites[index];
  },
  updateUser: (id: string, patch: Partial<User>): User | null => {
    const users = readUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...patch };
    writeUsers(users);
    return users[index];
  },
  setUserStatus: (id: string, status: UserStatus, actorEmail?: string): User | null => {
    const updated = adminStore.updateUser(id, { status });
    if (updated) logEvent('subscriber_status_updated', { status }, actorEmail, id);
    return updated;
  },
  setUserCountries: (id: string, countries: CountryCode[], actorEmail?: string): User | null => {
    const updated = adminStore.updateUser(id, { assignedCountries: countries });
    if (updated) logEvent('subscriber_countries_updated', { countries }, actorEmail, id);
    return updated;
  },
  setUserPermissions: (id: string, permissions: Permission[], actorEmail?: string): User | null => {
    const updated = adminStore.updateUser(id, { permissions });
    if (updated) logEvent('subscriber_permissions_updated', { permissions }, actorEmail, id);
    return updated;
  },
  setUserDevice: (id: string, deviceId: string, actorEmail?: string): User | null => {
    const updated = adminStore.updateUser(id, { deviceId, lastDeviceSeen: new Date().toISOString() });
    if (updated) logEvent('subscriber_device_locked', { deviceId }, actorEmail, id);
    return updated;
  },
  logDeviceViolation: (userId: string, deviceId: string, actorEmail?: string): void => {
    logEvent('subscriber_device_violation', { deviceId }, actorEmail, userId);
  },
};
