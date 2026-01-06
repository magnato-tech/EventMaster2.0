
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

export interface GatheringPattern {
  frequency_type: 'weeks' | 'months';
  interval: number;
  day_of_week: number;
  start_date: string;
}

export interface Person {
  id: UUID;
  name: string;
  email: string;
  phone?: string;
  social_security_number?: string;
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
  gathering_pattern?: GatheringPattern;
}

export interface GroupMember {
  id: UUID;
  group_id: UUID;
  person_id: UUID;
  role: GroupRole;
  service_role_id?: UUID | null; // Nytt felt: Spesifikk funksjon fra katalogen
}

/** Global Role Catalog */
export interface ServiceRole {
  id: UUID;
  name: string;
  description?: string;
  default_instructions: string[];
  is_active: boolean;
}

/** Link between a Group and a ServiceRole (Defines which roles are valid for this group) */
export interface GroupServiceRole {
  id: UUID;
  group_id: UUID;
  service_role_id: UUID;
  instructions_override?: string[];
  is_active: boolean;
}

export interface EventTemplate {
  id: UUID;
  title: string;
  type: string;
  recurrence_rule: string;
}

export interface EventOccurrence {
  id: UUID;
  template_id: UUID | null;
  date: string;
  title_override?: string;
  status: OccurrenceStatus;
}

export interface Assignment {
  id: UUID;
  occurrence_id?: UUID | null;
  template_id?: UUID | null;
  service_role_id: UUID; // Point to global role
  person_id?: UUID | null;
}

export interface ProgramItem {
  id: UUID;
  template_id?: UUID | null;
  occurrence_id?: UUID | null;
  title: string;
  duration_minutes: number;
  service_role_id?: UUID | null; // Point to global role
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
  serviceRoles: ServiceRole[];
  groupServiceRoles: GroupServiceRole[];
  eventTemplates: EventTemplate[];
  eventOccurrences: EventOccurrence[];
  assignments: Assignment[];
  programItems: ProgramItem[];
  tasks: Task[];
}
