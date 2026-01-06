
import { AppState, GroupCategory, GroupRole, OccurrenceStatus, CoreRole } from './types';

export const INITIAL_DATA: AppState = {
  persons: [
    { id: 'p1', name: 'Anders Admin', email: 'anders@lmk.no', phone: '900 11 001', is_admin: true, is_active: true, core_role: CoreRole.ADMIN },
    { id: 'p2', name: 'Lise Lovsang', email: 'lise@lmk.no', phone: '900 22 002', is_admin: false, is_active: true, core_role: CoreRole.TEAM_LEADER },
    { id: 'p3', name: 'Tom Tekniker', email: 'tom@lmk.no', phone: '900 33 003', is_admin: false, is_active: true, core_role: CoreRole.MEMBER },
    { id: 'p4', name: 'Hanne Husgruppe', email: 'hanne@lmk.no', phone: '900 44 004', is_admin: false, is_active: true, core_role: CoreRole.MEMBER },
    { id: 'p5', name: 'Per Pastor', email: 'per@lmk.no', phone: '900 55 005', is_admin: true, is_active: true, core_role: CoreRole.PASTOR },
    { id: 'p6', name: 'Berit Barnekirke', email: 'berit@lmk.no', phone: '900 66 006', is_admin: false, is_active: true, core_role: CoreRole.TEAM_LEADER },
    { id: 'p7', name: 'Morten Møtevert', email: 'morten@lmk.no', phone: '900 77 007', is_admin: false, is_active: true, core_role: CoreRole.MEMBER },
  ],
  groups: [
    { id: 'g1', name: 'Lovsang', category: GroupCategory.SERVICE, description: 'Ansvarlig for musikk og tilbedelse under gudstjenester.' },
    { id: 'g2', name: 'Teknikk', category: GroupCategory.SERVICE, description: 'Lyd, lys og bilde.' },
    { id: 'g3', name: 'Vertskap', category: GroupCategory.SERVICE, description: 'Møteverter og kirkekaffe.' },
    { id: 'g4', name: 'Ledelse & Forkynnelse', category: GroupCategory.SERVICE, description: 'Talerer og møteledere.' },
    { id: 'g7', name: 'Husgruppe Sentrum', category: GroupCategory.FELLOWSHIP, description: 'Relasjonelt fellesskap som møtes onsdager i partallsuker.' },
    { id: 'g8', name: 'Eldsterådet', category: GroupCategory.STRATEGY, description: 'Menighetens øverste åndelige ledelse og strategiske organ.' },
    { id: 'g9', name: 'Styret LMK', category: GroupCategory.STRATEGY, description: 'Operativt styre for økonomi og bygg.' },
  ],
  groupMembers: [
    { id: 'gm1', group_id: 'g1', person_id: 'p2', role: GroupRole.LEADER },
    { id: 'gm2', group_id: 'g2', person_id: 'p3', role: GroupRole.MEMBER },
    { id: 'gm4', group_id: 'g4', person_id: 'p5', role: GroupRole.LEADER },
    { id: 'gm6', group_id: 'g3', person_id: 'p7', role: GroupRole.MEMBER },
    { id: 'gm7', group_id: 'g7', person_id: 'p4', role: GroupRole.LEADER },
    { id: 'gm8', group_id: 'g7', person_id: 'p2', role: GroupRole.MEMBER },
    { id: 'gm9', group_id: 'g8', person_id: 'p5', role: GroupRole.LEADER },
    { id: 'gm10', group_id: 'g9', person_id: 'p1', role: GroupRole.LEADER },
  ],
  roleDefinitions: [
    { id: 'r1', group_id: 'g4', title: 'Møteleder', default_tasks: ['Lage kjøreplan', 'Lede bønnemøtet', 'Gjennomgang kl. 10.45'] },
    { id: 'r2', group_id: 'g4', title: 'Taler', default_tasks: ['Lage PowerPoint', 'Holde preken'] },
    { id: 'r3', group_id: 'g1', title: 'Lovsang', default_tasks: ['Lage setliste', 'Lade iPader'] },
    { id: 'r5', group_id: 'g3', title: 'Møtevert', default_tasks: ['Ønske velkommen i døra', 'Sørge for kaffe'] }
  ],
  eventTemplates: [
    { id: 't1', title: 'Gudstjeneste Standard', type: 'Gudstjeneste', recurrence_rule: 'Hver søndag kl. 11:00' },
  ],
  eventOccurrences: [
    { id: 'o1', template_id: 't1', date: '2024-06-02', status: OccurrenceStatus.PUBLISHED },
  ],
  assignments: [
    { id: 'a1', template_id: 't1', role_id: 'r1', person_id: null },
    { id: 'a2', template_id: 't1', role_id: 'r2', person_id: null },
    { id: 'a3', template_id: 't1', role_id: 'r3', person_id: null },
    { id: 'a4', template_id: 't1', role_id: 'r5', person_id: null },
  ],
  programItems: [
    { id: 'pi0', template_id: 't1', title: 'Velkommen ved inngang', duration_minutes: 15, role_id: 'r5', order: 0 },
    { id: 'pi1', template_id: 't1', title: 'Lovsang x2', duration_minutes: 7, group_id: 'g1', order: 1 },
    { id: 'pi2', template_id: 't1', title: 'Velkommen. Åpningsord', duration_minutes: 3, role_id: 'r1', order: 2 },
    { id: 'pi3', template_id: 't1', title: 'Bønn', duration_minutes: 2, role_id: 'r1', order: 3 },
    { id: 'pi4', template_id: 't1', title: 'Kunngjøringer', duration_minutes: 3, role_id: 'r1', order: 4 },
    { id: 'pi5', template_id: 't1', title: 'Lovsang x3', duration_minutes: 10, group_id: 'g1', order: 5 },
    { id: 'pi9', template_id: 't1', title: 'Tale / undervisning', duration_minutes: 20, role_id: 'r2', order: 6 },
    { id: 'pi13', template_id: 't1', title: 'Kollekt', duration_minutes: 2, role_id: 'r1', order: 7 },
    { id: 'pi17', template_id: 't1', title: 'Kirkekaffe', duration_minutes: 30, role_id: 'r5', order: 8 },
  ],
  tasks: [],
};
