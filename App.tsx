
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Person, GroupCategory, EventOccurrence, ProgramItem, Assignment, UUID, GroupRole, Task } from './types';
import { getDB, saveDB, performBulkCopy } from './db';
import IdentityPicker from './components/IdentityPicker';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import CalendarView from './components/CalendarView';
import MasterMenu from './components/MasterMenu';
import GroupsView from './components/GroupsView';
import YearlyWheelView from './components/YearlyWheelView';
import { User, Calendar, Settings, Users, ClipboardList, Target } from 'lucide-react';

const App: React.FC = () => {
  const [db, setDb] = useState<AppState>(getDB());
  const [currentUser, setCurrentUser] = useState<Person | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'groups' | 'master' | 'wheel'>('dashboard');
  const [initialGroupId, setInitialGroupId] = useState<UUID | null>(null);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const findRecommendedPerson = (roleId: string, state: AppState): string | null => {
    const roleDef = state.roleDefinitions.find(rd => rd.id === roleId);
    if (!roleDef) return null;
    
    const members = state.groupMembers.filter(gm => gm.group_id === roleDef.group_id);
    if (members.length === 0) return null;
    
    // Prioritering: 1. Leder, 2. Første medlem
    const leader = members.find(m => m.role === GroupRole.LEADER);
    return leader ? leader.person_id : members[0].person_id;
  };

  const autoFillOccurrence = (occurrenceId: string, state: AppState): AppState => {
    const updatedAssignments = state.assignments.map(a => {
      if (a.occurrence_id === occurrenceId && !a.person_id) {
        return { ...a, person_id: findRecommendedPerson(a.role_id, state) };
      }
      return a;
    });

    const updatedProgramItems = state.programItems.map(p => {
      if (p.occurrence_id === occurrenceId && !p.person_id && p.role_id) {
        return { ...p, person_id: findRecommendedPerson(p.role_id, state) };
      }
      return p;
    });

    return {
      ...state,
      assignments: updatedAssignments,
      programItems: updatedProgramItems
    };
  };

  const handleUpdateAssignment = (id: string, personId: string | null) => {
    setDb(prev => ({
      ...prev,
      assignments: prev.assignments.map(a => a.id === id ? { ...a, person_id: personId } : a)
    }));
  };

  const handleAddAssignment = (occurrenceId: string, roleId: string) => {
    const defaultPersonId = findRecommendedPerson(roleId, db);
    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      occurrence_id: occurrenceId,
      template_id: null,
      role_id: roleId,
      person_id: defaultPersonId
    };
    setDb(prev => ({
      ...prev,
      assignments: [...prev.assignments, newAssignment]
    }));
  };

  const handleSyncStaffing = (occurrenceId: string) => {
    setDb(prev => {
      const items = prev.programItems.filter(p => p.occurrence_id === occurrenceId);
      let updatedAssignments = [...prev.assignments];
      
      const rolePersonMap = new Map<string, string | null>();
      items.forEach(item => {
        if (item.role_id) {
          if (!rolePersonMap.has(item.role_id) || item.person_id) {
            rolePersonMap.set(item.role_id, item.person_id);
          }
        }
      });

      rolePersonMap.forEach((personId, roleId) => {
        const existingIdx = updatedAssignments.findIndex(a => a.occurrence_id === occurrenceId && a.role_id === roleId);
        const targetPerson = personId || findRecommendedPerson(roleId, prev);

        if (existingIdx > -1) {
          updatedAssignments[existingIdx] = { ...updatedAssignments[existingIdx], person_id: targetPerson };
        } else {
          updatedAssignments.push({
            id: crypto.randomUUID(),
            occurrence_id: occurrenceId,
            template_id: null,
            role_id: roleId,
            person_id: targetPerson
          });
        }
      });
      
      return { ...prev, assignments: updatedAssignments };
    });
  };

  const handleAddProgramItem = (item: ProgramItem) => {
    setDb(prev => ({
      ...prev,
      programItems: [...prev.programItems, item]
    }));
  };

  const handleUpdateProgramItem = (id: string, updates: Partial<ProgramItem>) => {
    setDb(prev => ({
      ...prev,
      programItems: prev.programItems.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const handleDeleteProgramItem = (id: string) => {
    setDb(prev => ({
      ...prev,
      programItems: prev.programItems.filter(p => p.id !== id)
    }));
  };

  const handleCreateOccurrence = (templateId: string, date: string) => {
    const newId = crypto.randomUUID();
    const newOccurrence: EventOccurrence = {
      id: newId,
      template_id: templateId,
      date,
      status: 'draft' as any
    };
    
    let nextDb = {
      ...db,
      eventOccurrences: [...db.eventOccurrences, newOccurrence]
    };
    
    nextDb = performBulkCopy(newOccurrence, nextDb);
    nextDb = autoFillOccurrence(newId, nextDb);
    setDb(nextDb);
  };

  const handleCreateRecurringOccurrences = (templateId: string, startDate: string, count: number, intervalDays: number) => {
    let nextDb = { ...db };
    let currentDate = new Date(startDate);

    for (let i = 0; i < count; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const exists = nextDb.eventOccurrences.some(o => o.template_id === templateId && o.date === dateStr);
      
      if (!exists) {
        const newId = crypto.randomUUID();
        const newOccurrence: EventOccurrence = {
          id: newId,
          template_id: templateId,
          date: dateStr,
          status: 'draft' as any
        };
        
        nextDb.eventOccurrences.push(newOccurrence);
        nextDb = performBulkCopy(newOccurrence, nextDb);
        nextDb = autoFillOccurrence(newId, nextDb);
      }
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }
    setDb(nextDb);
  };

  const handleUpdateTask = (task: Task) => {
    setDb(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === task.id ? task : t)
    }));
  };

  const handleAddTask = (task: Task) => {
    setDb(prev => ({
      ...prev,
      tasks: [...prev.tasks, task]
    }));
  };

  const handleDeleteTask = (id: string) => {
    setDb(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
  };

  const handleIdentitySelect = (person: Person) => {
    setCurrentUser(person);
  };
  
  const handleViewGroup = (groupId: UUID) => {
    setActiveTab('groups');
    setInitialGroupId(groupId);
  };

  useEffect(() => {
    if (activeTab !== 'groups') {
      setInitialGroupId(null);
    }
  }, [activeTab]);

  if (!currentUser) {
    return <IdentityPicker persons={db.persons} onSelect={handleIdentitySelect} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <nav className="hidden md:flex flex-col w-64 bg-white border-r h-screen sticky top-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-700 leading-tight">EventMaster<br/><span className="text-indigo-400">LMK</span></h1>
        </div>
        
        <div className="flex-1 px-4 space-y-2 py-4">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<ClipboardList size={20}/>} label="Min Vaktliste" />
          <NavItem active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<Calendar size={20}/>} label="Kalender" />
          <NavItem active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} icon={<Users size={20}/>} label="Teams & Grupper" />
          <NavItem active={activeTab === 'wheel'} onClick={() => setActiveTab('wheel')} icon={<Target size={20}/>} label="Årshjul" />
          {currentUser.is_admin && (
            <NavItem active={activeTab === 'master'} onClick={() => setActiveTab('master')} icon={<Settings size={20}/>} label="Master-meny" />
          )}
        </div>

        <div className="p-4 border-t bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 uppercase tracking-tighter">{currentUser.is_admin ? 'Admin' : 'Frivillig'}</p>
            </div>
            <button onClick={() => setCurrentUser(null)} className="text-slate-400 hover:text-slate-600">
              <User size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === 'dashboard' && <Dashboard db={db} currentUser={currentUser} onGoToWheel={() => setActiveTab('wheel')} onViewGroup={handleViewGroup} />}
        {activeTab === 'calendar' && (
          <CalendarView 
            db={db} 
            isAdmin={currentUser.is_admin} 
            onUpdateAssignment={handleUpdateAssignment}
            onAddAssignment={handleAddAssignment}
            onSyncStaffing={handleSyncStaffing}
            onCreateOccurrence={handleCreateOccurrence}
            onCreateRecurring={handleCreateRecurringOccurrences}
            onAddProgramItem={handleAddProgramItem}
            onUpdateProgramItem={handleUpdateProgramItem}
            onDeleteProgramItem={handleDeleteProgramItem}
          />
        )}
        {activeTab === 'groups' && <GroupsView db={db} setDb={setDb} isAdmin={currentUser.is_admin} initialViewGroupId={initialGroupId} />}
        {activeTab === 'wheel' && <YearlyWheelView db={db} isAdmin={currentUser.is_admin} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />}
        {activeTab === 'master' && currentUser.is_admin && (
          <MasterMenu 
            db={db} 
            setDb={setDb} 
            onCreateRecurring={handleCreateRecurringOccurrences} 
            onAddProgramItem={handleAddProgramItem}
            onDeleteProgramItem={handleDeleteProgramItem}
          />
        )}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 px-1 z-50">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<ClipboardList size={20}/>} label="Vakter" />
        <MobileNavItem active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<Calendar size={20}/>} label="Datoer" />
        <MobileNavItem active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} icon={<Users size={20}/>} label="Grupper" />
        <MobileNavItem active={activeTab === 'wheel'} onClick={() => setActiveTab('wheel')} icon={<Target size={20}/>} label="Årshjul" />
        {currentUser.is_admin && (
          <MobileNavItem active={activeTab === 'master'} onClick={() => setActiveTab('master')} icon={<Settings size={20}/>} label="Master" />
        )}
      </div>
    </div>
  );
};

const NavItem: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string}> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MobileNavItem: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string}> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-3 py-1 rounded-md transition-all ${active ? 'text-indigo-700' : 'text-slate-500'}`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;
