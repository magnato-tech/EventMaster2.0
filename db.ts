import { AppState, UUID, Assignment, Task, EventOccurrence, ProgramItem, OccurrenceStatus } from './types';
import { INITIAL_DATA } from './constants';

const DB_KEY = 'eventmaster_lmk_db';

export const getDB = (): AppState => {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : INITIAL_DATA;
};

export const saveDB = (state: AppState) => {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
};

/**
 * Performs a snapshot of a template into a specific occurrence.
 * Copies assignments, tasks, and program items from the "Yellow Zone" (Master) to the "White Zone" (Occurrence).
 */
export const performBulkCopy = (occurrence: EventOccurrence, state: AppState): AppState => {
  // Prevent duplicate bulk copy
  const existingAssignments = state.assignments.filter(a => a.occurrence_id === occurrence.id);
  if (existingAssignments.length > 0) return state;

  // Get all assignments linked to the template
  const templateAssignments = state.assignments.filter(a => a.template_id === occurrence.template_id);
  
  // Create local copies of assignments for this occurrence
  // Fix: Use service_role_id instead of non-existent role_id
  const newAssignments: Assignment[] = templateAssignments.map(ta => ({
    id: crypto.randomUUID(),
    occurrence_id: occurrence.id,
    template_id: null,
    service_role_id: ta.service_role_id,
    person_id: ta.person_id // Inherit person if one is set in master (default staff)
  }));

  // Create local copies of program items for this occurrence
  const templateProgramItems = state.programItems.filter(p => p.template_id === occurrence.template_id);
  // Fix: Use service_role_id instead of non-existent role_id
  const newProgramItems: ProgramItem[] = templateProgramItems.map(tp => ({
    id: crypto.randomUUID(),
    occurrence_id: occurrence.id,
    template_id: null,
    title: tp.title,
    duration_minutes: tp.duration_minutes,
    service_role_id: tp.service_role_id,
    group_id: tp.group_id,
    person_id: tp.person_id, // Inherit person if set in master
    order: tp.order
  }));

  // Create local copies of tasks for this occurrence
  const templateTasks = state.tasks.filter(t => t.template_id === occurrence.template_id);
  const newTasks: Task[] = templateTasks.map(tt => ({
    id: crypto.randomUUID(),
    occurrence_id: occurrence.id,
    template_id: null,
    title: tt.title,
    deadline: occurrence.date, // Default task deadline to event date
    responsible_id: tt.responsible_id,
    is_global: false
  }));

  return {
    ...state,
    assignments: [...state.assignments, ...newAssignments],
    programItems: [...state.programItems, ...newProgramItems],
    tasks: [...state.tasks, ...newTasks]
  };
};