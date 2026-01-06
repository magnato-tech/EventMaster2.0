
import { AppState, GroupCategory, GroupRole, CoreRole } from './types';

export const INITIAL_DATA: AppState = {
  persons: [
    { id: 'p1', name: 'Anders Admin', email: 'anders@lmk.no', phone: '900 11 001', is_admin: true, is_active: true, core_role: CoreRole.ADMIN },
    { id: 'p2', name: 'Lise Lovsang', email: 'lise@lmk.no', phone: '900 22 002', is_admin: false, is_active: true, core_role: CoreRole.TEAM_LEADER },
    { id: 'p3', name: 'Tom Tekniker', email: 'tom@lmk.no', phone: '900 33 003', is_admin: false, is_active: true, core_role: CoreRole.MEMBER },
    { id: 'p5', name: 'Per Pastor', email: 'per@lmk.no', phone: '900 55 005', is_admin: true, is_active: true, core_role: CoreRole.PASTOR },
    { id: 'p7', name: 'Morten Møtevert', email: 'morten@lmk.no', phone: '900 77 007', is_admin: false, is_active: true, core_role: CoreRole.MEMBER },
  ],
  groups: [
    { id: 'g1', name: 'Lovsang', category: GroupCategory.SERVICE, description: 'Ansvarlig for musikk og tilbedelse under gudstjenester.' },
    { id: 'g2', name: 'Teknikk', category: GroupCategory.SERVICE, description: 'Lyd, lys og bilde.' },
    { id: 'g3', name: 'Vertskap', category: GroupCategory.SERVICE, description: 'Møteverter og kirkekaffe.' },
    { id: 'g4', name: 'Ledelse & Forkynnelse', category: GroupCategory.SERVICE, description: 'Talerer og møteledere.' },
  ],
  groupMembers: [
    { id: 'gm1', group_id: 'g1', person_id: 'p2', role: GroupRole.LEADER },
    { id: 'gm2', group_id: 'g2', person_id: 'p3', role: GroupRole.MEMBER },
    { id: 'gm4', group_id: 'g4', person_id: 'p5', role: GroupRole.LEADER },
    { id: 'gm6', group_id: 'g3', person_id: 'p7', role: GroupRole.MEMBER },
  ],
  serviceRoles: [
    { id: 'sr1', name: 'Møteleder', default_instructions: ['Lage kjøreplan', 'Lede bønnemøtet', 'Gjennomgang kl. 10.45'], is_active: true },
    { id: 'sr2', name: 'Taler', default_instructions: ['Lage PowerPoint', 'Holde preken'], is_active: true },
    { id: 'sr3', name: 'Lovsangsleder', default_instructions: ['Lage setliste', 'Lade iPader'], is_active: true },
    { id: 'sr4', name: 'Møtevert', default_instructions: ['Ønske velkommen i døra', 'Sørge for kaffe'], is_active: true },
    { id: 'sr5', name: 'Tekniker', default_instructions: ['Slå på lydanlegg', 'Sjekke mikrofoner'], is_active: true },
    { id: 'sr6', name: 'Kjøkkenansvarlig', default_instructions: ['Sette over kaffe', 'Klargjøre servering', 'Vaske opp'], is_active: true },
    { id: 'sr7', name: 'Bønnearbeider', default_instructions: ['Være tilgjengelig for forbønn', 'Lede bønn før møtet'], is_active: true }
  ],
  groupServiceRoles: [
    { id: 'gsr1', group_id: 'g4', service_role_id: 'sr1', is_active: true },
    { id: 'gsr2', group_id: 'g4', service_role_id: 'sr2', is_active: true },
    { id: 'gsr3', group_id: 'g1', service_role_id: 'sr3', is_active: true },
    { id: 'gsr4', group_id: 'g3', service_role_id: 'sr4', is_active: true },
    { id: 'gsr5', group_id: 'g2', service_role_id: 'sr5', is_active: true },
    { id: 'gsr6', group_id: 'g3', service_role_id: 'sr6', is_active: true },
  ],
  eventTemplates: [
    { id: 't1', title: 'Gudstjeneste Standard', type: 'Gudstjeneste', recurrence_rule: 'Hver søndag kl. 11:00' },
  ],
  eventOccurrences: [],
  assignments: [
    { id: 'a1', template_id: 't1', service_role_id: 'sr1', person_id: null },
    { id: 'a2', template_id: 't1', service_role_id: 'sr2', person_id: null },
    { id: 'a3', template_id: 't1', service_role_id: 'sr3', person_id: null },
    { id: 'a4', template_id: 't1', service_role_id: 'sr4', person_id: null },
  ],
  programItems: [
    { id: 'pi0', template_id: 't1', title: 'Velkommen ved inngang', duration_minutes: 15, service_role_id: 'sr4', order: 0 },
    { id: 'pi1', template_id: 't1', title: 'Lovsang x2', duration_minutes: 7, group_id: 'g1', order: 1 },
    { id: 'pi2', template_id: 't1', title: 'Velkommen. Åpningsord', duration_minutes: 3, service_role_id: 'sr1', order: 2 },
    { id: 'pi3', template_id: 't1', title: 'Bønn', duration_minutes: 2, service_role_id: 'sr1', order: 3 },
    { id: 'pi9', template_id: 't1', title: 'Tale / undervisning', duration_minutes: 20, service_role_id: 'sr2', order: 6 },
  ],
  tasks: [],
};
