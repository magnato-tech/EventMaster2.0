import React, { useState, useMemo } from 'react';
// Fix: Import EventOccurrence to use in the updated type definition.
import { AppState, Person, GroupCategory, RoleDefinition, Assignment, UUID, EventOccurrence } from '../types';
import { Calendar, Users, Bell, ArrowRight, ListChecks, Info, X, CheckCircle2, Clock, User, Shield } from 'lucide-react';

interface Props {
  db: AppState;
  currentUser: Person;
  onGoToWheel?: () => void;
  onViewGroup: (groupId: UUID) => void;
}

const Dashboard: React.FC<Props> = ({ db, currentUser, onGoToWheel, onViewGroup }) => {
  // Fix: Add the 'occurrence' property to the type definition for 'selectedAssignment'.
  const [selectedAssignment, setSelectedAssignment] = useState<(Assignment & { occurrence: EventOccurrence, role: RoleDefinition | undefined }) | null>(null);

  // 1. Mine Tjenester
  const myAssignments = db.assignments
    .filter(a => a.person_id === currentUser.id && a.occurrence_id)
    .map(a => {
      const occ = db.eventOccurrences.find(o => o.id === a.occurrence_id);
      const role = db.roleDefinitions.find(r => r.id === a.role_id);
      return { ...a, occurrence: occ, role };
    })
    .filter((a): a is typeof a & { occurrence: EventOccurrence } => !!a.occurrence)
    .sort((a, b) => new Date(a.occurrence.date).getTime() - new Date(b.occurrence.date).getTime());

  // 2. Mine Grupper
  const myGroups = db.groupMembers
    .filter(gm => gm.person_id === currentUser.id)
    .map(gm => db.groups.find(g => g.id === gm.group_id))
    .filter(g => g !== undefined);

  // 3. Administrative Frister
  const myTasks = db.tasks
    .filter(t => t.responsible_id === currentUser.id && t.is_global)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const formatTimeFromOffset = (offsetMinutes: number) => {
    const baseHour = 11;
    const baseMinute = 0;
    const totalMinutes = baseHour * 60 + baseMinute + offsetMinutes;
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = Math.floor(totalMinutes % 60);
    return `${h.toString().padStart(2, '0')}.${m.toString().padStart(2, '0')}`;
  };

  const programWithTimes = useMemo(() => {
    if (!selectedAssignment || !selectedAssignment.occurrence_id) return [];
    const items = db.programItems
      .filter(p => p.occurrence_id === selectedAssignment.occurrence_id)
      .sort((a, b) => a.order - b.order);
    let currentOffset = 0;
    return items.map((item, idx) => {
      let startTimeOffset = currentOffset;
      if (idx === 0 && item.order === 0) startTimeOffset = -item.duration_minutes;
      const formattedTime = formatTimeFromOffset(startTimeOffset);
      if (idx === 0 && item.order === 0) currentOffset = 0;
      else currentOffset += item.duration_minutes;
      return { ...item, formattedTime };
    });
  }, [selectedAssignment, db.programItems]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0 text-left">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">God dag, {currentUser.name.split(' ')[0]}!</h2>
        <p className="text-slate-500 mt-1">Her er din oversikt over tjenester og ansvar i LMK.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="text-indigo-500" size={20} /> Mine kommende vakter
          </h3>
          
          <div className="space-y-4">
            {myAssignments.length > 0 ? myAssignments.map(assign => (
              <button key={assign.id} onClick={() => setSelectedAssignment(assign)} className="w-full text-left bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all">
                <div className="p-5 flex items-center justify-between border-b border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center text-indigo-700 font-bold border border-indigo-100">
                      <span className="text-[10px] uppercase leading-none">{new Intl.DateTimeFormat('no-NO', { month: 'short' }).format(new Date(assign.occurrence.date))}</span>
                      <span className="text-lg leading-none">{new Date(assign.occurrence.date).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-left">{assign.occurrence.title_override || db.eventTemplates.find(t => t.id === assign.occurrence.template_id)?.title}</h4>
                      <div className="text-sm text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1">
                        {assign.role?.title}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${assign.occurrence.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {assign.occurrence.status}
                    </span>
                  </div>
                </div>
              </button>
            )) : (
              <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
                <p className="text-slate-400 font-medium">Ingen oppsatte vakter de neste ukene.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6 text-left">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Users className="text-teal-500" size={20} /> Mine grupper
            </h3>
            <div className="space-y-3">
              {myGroups.map(group => (
                <button key={group!.id} onClick={() => onViewGroup(group!.id)} className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${group!.category === GroupCategory.SERVICE ? 'bg-indigo-400' : group!.category === GroupCategory.FELLOWSHIP ? 'bg-teal-400' : 'bg-amber-400'}`}></div>
                  <span className="text-sm font-semibold text-slate-700">{group!.name}</span>
                </button>
              ))}
              {myGroups.length === 0 && <p className="text-xs text-slate-400">Ikke medlem i noen grupper.</p>}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl shadow-lg text-white">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-indigo-300">
              <Bell className="text-indigo-300" size={20} /> Viktige frister
            </h3>
            <div className="space-y-4">
              {myTasks.map(task => (
                <div key={task.id} className="border-l-2 border-indigo-500 pl-3 py-1 text-left">
                  <p className="text-sm font-bold">{task.title}</p>
                  <p className="text-xs text-indigo-400 mt-1">Frist: {new Intl.DateTimeFormat('no-NO').format(new Date(task.deadline))}</p>
                </div>
              ))}
              {myTasks.length === 0 && <p className="text-xs text-indigo-400">Ingen globale frister akkurat nå.</p>}
              <button 
                onClick={onGoToWheel}
                className="w-full mt-4 flex items-center justify-between p-4 bg-slate-800 rounded-2xl text-xs font-bold hover:bg-slate-700 transition-colors group"
              >
                Se årshjul <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Vakt Detaljer Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setSelectedAssignment(null)}
          ></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-700 text-white flex justify-between items-start text-left">
              <div>
                {/* Fix: Access occurrence property directly as its existence is guaranteed by the type. */}
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-1">{new Intl.DateTimeFormat('no-NO', { dateStyle: 'full' }).format(new Date(selectedAssignment.occurrence.date))}</p>
                {/* Fix: Access occurrence property directly as its existence is guaranteed by the type. */}
                <h3 className="text-3xl font-bold">{selectedAssignment.occurrence.title_override || db.eventTemplates.find(t => t.id === selectedAssignment.occurrence.template_id)?.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedAssignment(null)}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <section className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Min Rolle</h4>
                  <p className="text-2xl font-bold text-indigo-800">{selectedAssignment.role?.title}</p>
                  <div className="space-y-3 mt-4">
                    {selectedAssignment.role?.default_tasks.filter(t => t.trim().length > 0).map((task, i) => (
                      <div key={i} className="flex gap-3 text-left">
                        <CheckCircle2 size={18} className="text-indigo-400 mt-1 shrink-0" />
                        <p className="text-indigo-900/80 leading-relaxed font-medium">{task}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                   <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Teamet for dagen</h4>
                   <div className="space-y-2">
                     {db.assignments.filter(a => a.occurrence_id === selectedAssignment.occurrence_id && a.person_id).map(a => {
                       const person = db.persons.find(p => p.id === a.person_id);
                       const role = db.roleDefinitions.find(r => r.id === a.role_id);
                       if (!person) return null;
                       return (
                         <div key={a.id} className={`flex items-center gap-3 p-3 rounded-2xl ${a.person_id === currentUser.id ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${a.person_id === currentUser.id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{person.name.charAt(0)}</div>
                            <div>
                              <p className="font-bold text-sm text-slate-800">{person.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{role?.title}</p>
                            </div>
                         </div>
                       )
                     })}
                   </div>
                </section>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Kjøreplan</h4>
                <div className="space-y-2">
                  {programWithTimes.map(item => {
                    const responsible = item.role_id 
                      ? db.roleDefinitions.find(r => r.id === item.role_id)?.title 
                      : item.group_id
                      ? db.groups.find(g => g.id === item.group_id)?.name
                      : null;

                    const isMyItem = item.person_id === currentUser.id || item.role_id === selectedAssignment.role_id;
                    
                    return (
                      <div key={item.id} className={`flex items-start gap-4 p-4 rounded-2xl border ${isMyItem ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                        <div className="mt-1 flex flex-col items-center shrink-0 w-12 text-center">
                          <span className={`text-xs font-bold ${isMyItem ? 'text-indigo-600' : 'text-slate-600'}`}>{item.formattedTime}</span>
                          <span className={`text-[9px] ${isMyItem ? 'text-indigo-400' : 'text-slate-400'} font-bold`}>{item.duration_minutes}m</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-slate-800 text-sm leading-tight">{item.title}</h5>
                          {responsible && (
                             <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 flex items-center gap-1 ${isMyItem ? 'text-indigo-600' : 'text-slate-500'}`}>
                               <Shield size={10}/> {responsible}
                             </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex justify-center">
              <button 
                onClick={() => setSelectedAssignment(null)}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all"
              >
                Greit!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
