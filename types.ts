
export type UUID = string;

export enum GroupCategory {
  SERVICE = 'service',
  FELLOWSHIP = 'fellowship',
  STRATEGY = 'strategy'
}

export enum GroupRole {
  LEADER = 'leader',
  MEMBER = 'member'
}

export enum OccurrenceStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published'
}

export enum CoreRole {
  ADMIN = 'admin',
  PASTOR = 'pastor',
  TEAM_LEADER = 'team_leader',
  MEMBER = 'member',
  GUEST = 'guest'
}

export interface Person {
  id: UUID;
  name: string;
  email: string;
  phone?: string;
  is_admin: boolean;
  is_active: boolean;
  core_role: CoreRole;
}

export interface Group {
  id: UUID;
  name: string;
  category: GroupCategory;
  description?: string;
  link?: string;
  parent_id?: UUID | null;
}

export interface GroupMember {
  id: UUID;
  group_id: UUID;
  person_id: UUID;
  role: GroupRole;
}

export interface RoleDefinition {
  id: UUID;
  group_id: UUID;
  title: string;
  default_tasks: string[];
}

export interface EventTemplate {
  id: UUID;
  title: string;
  type: string;
  recurrence_rule: string;
}

export interface EventOccurrence {
  id: UUID;
  template_id: UUID;
  date: string;
  title_override?: string;
  status: OccurrenceStatus;
}

export interface Assignment {
  id: UUID;
  occurrence_id?: UUID | null;
  template_id?: UUID | null;
  role_id: UUID;
  person_id?: UUID | null;
}

export interface ProgramItem {
  id: UUID;
  template_id?: UUID | null;
  occurrence_id?: UUID | null;
  title: string;
  duration_minutes: number;
  role_id?: UUID | null;
  group_id?: UUID | null;
  person_id?: UUID | null;
  order: number;
}

export interface Task {
  id: UUID;
  occurrence_id?: UUID | null;
  template_id?: UUID | null;
  title: string;
  deadline: string;
  responsible_id: UUID;
  is_global: boolean;
}

export interface AppState {
  persons: Person[];
  groups: Group[];
  groupMembers: GroupMember[];
  roleDefinitions: RoleDefinition[];
  eventTemplates: EventTemplate[];
  eventOccurrences: EventOccurrence[];
  assignments: Assignment[];
  programItems: ProgramItem[];
  tasks: Task[];
}
