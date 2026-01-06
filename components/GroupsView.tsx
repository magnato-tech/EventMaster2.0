
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Group, GroupCategory, GroupRole, GroupMember, ServiceRole, GroupServiceRole, UUID, Person, CoreRole, GatheringPattern, OccurrenceStatus, EventOccurrence } from '../types';
import { Users, Shield, Heart, MoreVertical, Plus, X, Trash2, Search, UserPlus, Check, ListChecks, Edit2, Star, Eye, Info, CheckCircle2, Phone, Mail, User as UserIcon, UserCheck, ShieldCheck, Power, Link as LinkIcon, ExternalLink, Library, ChevronDown, Calendar, Repeat, Clock, AlertCircle } from 'lucide-react';

interface Props {
  db: AppState;
  setDb: React.Dispatch<React.SetStateAction<AppState>>;
  isAdmin: boolean;
  initialViewGroupId?: UUID | null;
}

const GroupsView: React.FC<Props> = ({ db, setDb, isAdmin, initialViewGroupId }) => {
  const [activeTab, setActiveTab] = useState<GroupCategory | 'persons' | 'roles'>(GroupCategory.SERVICE);
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [manageGroupId, setManageGroupId] = useState<UUID | null>(null);
  const [viewingGroupId, setViewingGroupId] = useState<UUID | null>(null);
  const [editingServiceRole, setEditingServiceRole] = useState<ServiceRole | null>(null);
  const [isCreateServiceRoleModalOpen, setIsCreateServiceRoleModalOpen] = useState(false);
  
  // Person Modal States
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isCreatePersonModalOpen, setIsCreatePersonModalOpen] = useState(false);

  // Samlingsplanlegging State (Manage mode only)
  const [tempPattern, setTempPattern] = useState<GatheringPattern | null>(null);
  const [syncCount, setSyncCount] = useState(4);

  // Create Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState<GroupCategory>(GroupCategory.SERVICE);

  // Search States
  const [memberSearch, setMemberSearch] = useState('');
  const [personSearch, setPersonSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  const filteredGroups = db.groups.filter(g => g.category === activeTab);
  const managedGroup = db.groups.find(g => g.id === manageGroupId);
  const viewedGroup = db.groups.find(g => g.id === viewingGroupId);

  // Sync tempPattern when group changes in MANAGE mode
  useEffect(() => {
    if (manageGroupId) {
      const group = db.groups.find(g => g.id === manageGroupId);
      if (group?.gathering_pattern) {
        setTempPattern(group.gathering_pattern);
      } else {
        setTempPattern({
          frequency_type: 'weeks',
          interval: 2,
          day_of_week: 3, 
          start_date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [manageGroupId, db.groups]);

  const getIcon = (cat: GroupCategory) => {
    switch (cat) {
      case GroupCategory.SERVICE: return <Shield className="text-indigo-500" size={20} />;
      case GroupCategory.FELLOWSHIP: return <Heart className="text-rose-500" size={20} />;
      case GroupCategory.STRATEGY: return <Users className="text-amber-500" size={20} />;
    }
  };

  const handleUpdateGatheringPattern = (updates: Partial<GatheringPattern>) => {
    if (!tempPattern || !manageGroupId) return;
    const newPattern = { ...tempPattern, ...updates };
    setTempPattern(newPattern);
    setDb(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === manageGroupId ? { ...g, gathering_pattern: newPattern } : g)
    }));
  };

  const handleSyncToCalendar = () => {
    if (!managedGroup || !tempPattern) return;
    const newOccurrences: EventOccurrence[] = [];
    let current = new Date(tempPattern.start_date);
    while (current.getDay() !== (tempPattern.day_of_week % 7)) {
      current.setDate(current.getDate() + 1);
    }
    for (let i = 0; i < syncCount; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const exists = db.eventOccurrences.some(o => o.date === dateStr && o.title_override === managedGroup.name);
      if (!exists) {
        newOccurrences.push({
          id: crypto.randomUUID(),
          template_id: null,
          date: dateStr,
          title_override: managedGroup.name,
          status: OccurrenceStatus.DRAFT
        });
      }
      if (tempPattern.frequency_type === 'weeks') {
        current.setDate(current.getDate() + (tempPattern.interval * 7));
      } else {
        current.setMonth(current.getMonth() + tempPattern.interval);
      }
    }
    if (newOccurrences.length > 0) {
      setDb(prev => ({ ...prev, eventOccurrences: [...prev.eventOccurrences, ...newOccurrences] }));
      alert(`${newOccurrences.length} samlinger lagt til i kalenderen.`);
    }
  };

  const handleUpdateMemberRole = (memberId: UUID, serviceRoleId: UUID | null) => {
    setDb(prev => ({
      ...prev,
      groupMembers: prev.groupMembers.map(gm => gm.id === memberId ? { ...gm, service_role_id: serviceRoleId } : gm)
    }));
  };

  const handleUpdateMemberGroupRole = (memberId: UUID, role: GroupRole) => {
    setDb(prev => ({
      ...prev,
      groupMembers: prev.groupMembers.map(gm => gm.id === memberId ? { ...gm, role: role } : gm)
    }));
  };

  const handleAddMember = (personId: UUID) => {
    if (!manageGroupId) return;
    if (db.groupMembers.some(gm => gm.group_id === manageGroupId && gm.person_id === personId)) return;
    const newMember: GroupMember = {
      id: crypto.randomUUID(),
      group_id: manageGroupId,
      person_id: personId,
      role: GroupRole.MEMBER
    };
    setDb(prev => ({ ...prev, groupMembers: [...prev.groupMembers, newMember] }));
  };

  const handleRemoveMember = (memberId: UUID) => {
    setDb(prev => ({ ...prev, groupMembers: prev.groupMembers.filter(gm => gm.id !== memberId) }));
  };

  const handleUpdateGroupBasicInfo = (updates: Partial<Group>) => {
    if (!manageGroupId) return;
    setDb(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === manageGroupId ? { ...g, ...updates } : g)
    }));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: newGroupName,
      category: newGroupCategory,
    };
    setDb(prev => ({ ...prev, groups: [...prev.groups, newGroup] }));
    setNewGroupName('');
    setIsCreateModalOpen(false);
  };

  const handleCreatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const newPerson: Person = {
      id: crypto.randomUUID(),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      core_role: formData.get('core_role') as CoreRole,
      is_admin: formData.get('is_admin') === 'true',
      is_active: true
    };
    setDb(prev => ({ ...prev, persons: [...prev.persons, newPerson] }));
    setIsCreatePersonModalOpen(false);
  };

  const handleCreateServiceRole = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const newRole: ServiceRole = {
      id: crypto.randomUUID(),
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      default_instructions: (formData.get('instructions') as string).split('\n').filter(t => t.trim()),
      is_active: true
    };
    setDb(prev => ({ ...prev, serviceRoles: [...prev.serviceRoles, newRole] }));
    setIsCreateServiceRoleModalOpen(false);
  };

  const getCoreRoleLabel = (role: CoreRole) => {
    switch (role) {
      case CoreRole.ADMIN: return 'Administrator';
      case CoreRole.PASTOR: return 'Pastor';
      case CoreRole.TEAM_LEADER: return 'Gruppeleder';
      case CoreRole.MEMBER: return 'Medlem';
      default: return 'Gjest';
    }
  };

  const getCoreRoleColor = (role: CoreRole) => {
    switch (role) {
      case CoreRole.PASTOR: return 'bg-purple-100 text-purple-700';
      case CoreRole.TEAM_LEADER: return 'bg-blue-100 text-blue-700';
      case CoreRole.ADMIN: return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredPersons = db.persons.filter(p => 
    p.name.toLowerCase().includes(personSearch.toLowerCase())
  ).sort((a,b) => a.name.localeCompare(b.name));

  const filteredRoles = db.serviceRoles.filter(sr => 
    sr.name.toLowerCase().includes(roleSearch.toLowerCase())
  ).sort((a,b) => a.name.localeCompare(b.name));

  const memberSearchResults = db.persons.filter(p => 
    p.name.toLowerCase().includes(memberSearch.toLowerCase()) && 
    !db.groupMembers.some(gm => gm.group_id === manageGroupId && gm.person_id === p.id)
  ).slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 md:pb-0 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Menighetens Oversikt</h2>
          <p className="text-xs text-slate-500">Administrer fellesskap, teams og medlemmer.</p>
        </div>
        
        <div className="inline-flex bg-slate-200 p-1 rounded-xl">
          <button onClick={() => setActiveTab(GroupCategory.SERVICE)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === GroupCategory.SERVICE ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Teams</button>
          <button onClick={() => setActiveTab(GroupCategory.FELLOWSHIP)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === GroupCategory.FELLOWSHIP ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Husgrupper</button>
          <button onClick={() => setActiveTab(GroupCategory.STRATEGY)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === GroupCategory.STRATEGY ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Styre</button>
          <button onClick={() => setActiveTab('roles')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'roles' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Roller</button>
          <button onClick={() => setActiveTab('persons')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'persons' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Personer</button>
        </div>
      </div>

      {activeTab === 'roles' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Søk i rollekatalog..." value={roleSearch} onChange={e => setRoleSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
            {isAdmin && (
              <button onClick={() => setIsCreateServiceRoleModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow flex items-center gap-2">
                <Plus size={16} /> Ny Katalogrolle
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map(sr => (
              <div key={sr.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                <div className="p-2 bg-indigo-50 w-fit rounded-lg text-indigo-600 mb-3"><Library size={18} /></div>
                <h4 className="font-bold text-slate-800 mb-1">{sr.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{sr.description || 'Ingen beskrivelse.'}</p>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'persons' ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Søk på navn..." value={personSearch} onChange={e => setPersonSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
            </div>
            {isAdmin && (
              <button onClick={() => setIsCreatePersonModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2">
                <Plus size={16} /> Ny Person
              </button>
            )}
          </div>
          <table className="w-full text-left">
            <thead><tr className="border-b text-[10px] text-slate-400 uppercase tracking-widest font-bold"><th className="pb-3 px-4">Navn</th><th className="pb-3 px-4">Rolle</th><th className="pb-3 px-4">Kontakt</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPersons.map(person => (
                <tr key={person.id} className="group hover:bg-slate-50">
                  <td className="py-3 px-4"><div className="flex items-center gap-3 font-semibold text-sm">{person.name}</div></td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getCoreRoleColor(person.core_role)}`}>{getCoreRoleLabel(person.core_role)}</span></td>
                  <td className="py-3 px-4 text-[11px] text-slate-500">{person.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {isAdmin && <div className="flex justify-end"><button onClick={() => { setNewGroupCategory(activeTab as GroupCategory); setIsCreateModalOpen(true); }} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"><Plus size={16} /> Ny Gruppe</button></div>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map(group => (
              <button key={group.id} onClick={() => setViewingGroupId(group.id)} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col h-full relative overflow-hidden text-left w-full">
                <div className="flex justify-between items-start mb-4 w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">{getIcon(group.category)}</div>
                    <h3 className="text-base font-bold text-slate-800">{group.name}</h3>
                  </div>
                  {isAdmin && (
                    <div onClick={(e) => { e.stopPropagation(); setManageGroupId(group.id); }} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg">
                      <Edit2 size={16} />
                    </div>
                  )}
                </div>
                <p className="text-slate-500 text-xs mb-4 flex-grow line-clamp-2">{group.description || 'Ingen beskrivelse.'}</p>
                <div className="pt-4 border-t flex justify-between items-center w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{db.groupMembers.filter(gm => gm.group_id === group.id).length} medlemmer</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vis Gruppe Modal (Read-Only) */}
      {viewedGroup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewingGroupId(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 text-left max-h-[85vh]">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl">{getIcon(viewedGroup.category)}</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{viewedGroup.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{viewedGroup.category}</p>
                </div>
              </div>
              <button onClick={() => setViewingGroupId(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={24} className="text-slate-500" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              {viewedGroup.description && (
                <section>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Om gruppen</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{viewedGroup.description}</p>
                </section>
              )}

              <section className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} /> Medlemmer & Funksjoner
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {db.groupMembers.filter(gm => gm.group_id === viewedGroup.id).map(gm => {
                    const person = db.persons.find(p => p.id === gm.person_id);
                    const role = db.serviceRoles.find(r => r.id === gm.service_role_id);
                    return (
                      <div key={gm.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-sm">{person?.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">{person?.name}</p>
                          <p className={`text-[9px] uppercase font-bold ${gm.role === GroupRole.LEADER ? 'text-amber-500' : 'text-slate-400'}`}>
                            {gm.role === GroupRole.LEADER ? 'Leder' : role?.name || 'Medlem'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {viewedGroup.gathering_pattern && (
                <section className="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl">
                  <h4 className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <Repeat size={14} /> Samlingsplan
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-indigo-600"><Calendar size={18} /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {viewedGroup.gathering_pattern.frequency_type === 'weeks' 
                          ? `Hver ${viewedGroup.gathering_pattern.interval === 1 ? '' : viewedGroup.gathering_pattern.interval + '. '}uke`
                          : `Hver ${viewedGroup.gathering_pattern.interval === 1 ? '' : viewedGroup.gathering_pattern.interval + '. '}måned`}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Fast dag: {['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'][viewedGroup.gathering_pattern.day_of_week]}
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </div>
            
            <div className="p-6 border-t bg-white flex justify-end shrink-0">
              <button onClick={() => setViewingGroupId(null)} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-slate-800 transition-colors">Lukk</button>
            </div>
          </div>
        </div>
      )}

      {/* Administrer Gruppe Modal */}
      {managedGroup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setManageGroupId(null)}></div>
          <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">{getIcon(managedGroup.category)}</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-none">Administrer {managedGroup.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Konfigurasjon & Team</p>
                </div>
              </div>
              <button onClick={() => setManageGroupId(null)} className="p-2.5 hover:bg-slate-200 rounded-xl transition-colors"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Venstre side: Konfigurasjon & Samlingsplan */}
              <div className="w-full md:w-1/3 p-8 border-r overflow-y-auto space-y-8 text-left">
                <section className="space-y-4">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Grunninfo</h4>
                  <input type="text" value={managedGroup.name} onChange={e => handleUpdateGroupBasicInfo({ name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <textarea value={managedGroup.description || ''} onChange={e => handleUpdateGroupBasicInfo({ description: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm h-24 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Kort beskrivelse av gruppens formål..." />
                </section>

                <section className="space-y-4 pt-6 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    <Repeat size={14} /> Samlingsplanlegging
                  </h4>
                  <div className="space-y-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Frekvens</label>
                      <div className="flex gap-2">
                        <select value={tempPattern?.interval} onChange={e => handleUpdateGatheringPattern({ interval: parseInt(e.target.value) })} className="flex-1 p-2 bg-white border rounded-lg text-xs font-bold">
                          {[1,2,3,4].map(v => <option key={v} value={v}>Hver {v > 1 ? v + '.' : ''}</option>)}
                        </select>
                        <select value={tempPattern?.frequency_type} onChange={e => handleUpdateGatheringPattern({ frequency_type: e.target.value as any })} className="flex-1 p-2 bg-white border rounded-lg text-xs font-bold">
                          <option value="weeks">Uke</option><option value="months">Måned</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Ukedag</label>
                      <select value={tempPattern?.day_of_week} onChange={e => handleUpdateGatheringPattern({ day_of_week: parseInt(e.target.value) })} className="w-full p-2 bg-white border rounded-lg text-xs font-bold">
                        {['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'].map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </div>
                    <button onClick={handleSyncToCalendar} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-2">
                      <Calendar size={14} /> Synkroniser {syncCount} samlinger
                    </button>
                  </div>
                </section>
              </div>
              
              {/* Høyre side: Medlemsliste & Funksjonstildeling */}
              <div className="flex-1 p-8 bg-slate-50 overflow-y-auto space-y-6 text-left">
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Medlemmer & Tjenester</h4>
                    <span className="text-[10px] font-bold bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                      {db.groupMembers.filter(gm => gm.group_id === managedGroup.id).length} totalt
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Søk og legg til person fra menigheten..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none shadow-sm focus:ring-2 focus:ring-indigo-500" />
                    {memberSearch && memberSearchResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {memberSearchResults.map(p => (
                          <button key={p.id} onClick={() => { handleAddMember(p.id); setMemberSearch(''); }} className="w-full px-5 py-3 flex items-center justify-between hover:bg-indigo-50 border-b border-slate-50 last:border-0 text-left">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px]">{p.name.charAt(0)}</div>
                              <span className="text-xs font-bold text-slate-700">{p.name}</span>
                            </div>
                            <Plus size={16} className="text-indigo-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {db.groupMembers.filter(gm => gm.group_id === managedGroup.id).map(gm => {
                      const person = db.persons.find(p => p.id === gm.person_id);
                      return (
                        <div key={gm.id} className={`flex items-center gap-4 p-4 bg-white border rounded-2xl shadow-sm transition-all ${gm.role === GroupRole.LEADER ? 'border-amber-400' : 'border-slate-200'}`}>
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-bold text-xs border border-slate-100">{person?.name.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm">{person?.name}</p>
                            <div className="flex gap-2 mt-1">
                               <button 
                                onClick={() => handleUpdateMemberGroupRole(gm.id, gm.role === GroupRole.LEADER ? GroupRole.MEMBER : GroupRole.LEADER)}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter border transition-colors ${gm.role === GroupRole.LEADER ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-amber-500'}`}
                               >
                                Leder
                               </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="relative group/role">
                              <select 
                                value={gm.service_role_id || ''} 
                                onChange={e => handleUpdateMemberRole(gm.id, e.target.value || null)}
                                className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none appearance-none hover:bg-indigo-50 transition-colors cursor-pointer"
                              >
                                <option value="">Tildel tjeneste-rolle...</option>
                                {db.serviceRoles.map(sr => <option key={sr.id} value={sr.id}>{sr.name}</option>)}
                              </select>
                              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <button onClick={() => handleRemoveMember(gm.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      );
                    })}
                    {db.groupMembers.filter(gm => gm.group_id === managedGroup.id).length === 0 && (
                      <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                        <Users size={32} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ingen medlemmer ennå</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
            <div className="px-8 py-5 border-t bg-slate-50 flex justify-end">
              <button onClick={() => setManageGroupId(null)} className="px-12 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-xl hover:bg-slate-800 transition-all">Lagre Endringer</button>
            </div>
          </div>
        </div>
      )}

      {/* Ny Katalogrolle Modal */}
      {isCreateServiceRoleModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateServiceRoleModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-left animate-in zoom-in-95">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center"><h3 className="text-xl font-bold">Ny Katalogrolle</h3><button onClick={() => setIsCreateServiceRoleModalOpen(false)}><X size={24} /></button></div>
            <form onSubmit={handleCreateServiceRole} className="p-8 space-y-4">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Navn</label><input autoFocus required name="name" type="text" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="f.eks. Møteleder" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Beskrivelse</label><textarea name="description" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-24" placeholder="Kort beskrivelse av rollen..." /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Instrukser (per linje)</label><textarea name="instructions" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-32 font-mono" placeholder="Oppgave 1&#10;Oppgave 2" /></div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">Opprett Rolle</button>
            </form>
          </div>
        </div>
      )}

      {/* Ny Person Modal */}
      {isCreatePersonModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreatePersonModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-left animate-in zoom-in-95">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center"><h3 className="text-xl font-bold">Registrer Ny Person</h3><button onClick={() => setIsCreatePersonModalOpen(false)}><X size={24} /></button></div>
            <form onSubmit={handleCreatePerson} className="p-8 space-y-4">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fullt Navn</label><input autoFocus required name="name" type="text" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-post</label><input required name="email" type="email" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hovedrolle i menigheten</label><select name="core_role" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"><option value={CoreRole.MEMBER}>Medlem</option><option value={CoreRole.TEAM_LEADER}>Gruppeleder</option><option value={CoreRole.PASTOR}>Pastor</option><option value={CoreRole.ADMIN}>Administrator</option></select></div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">Legg til Person</button>
            </form>
          </div>
        </div>
      )}

      {/* Ny Gruppe Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-left animate-in zoom-in-95">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center"><h3 className="text-xl font-bold">Opprett ny Gruppe</h3><button onClick={() => setIsCreateModalOpen(false)}><X size={24} /></button></div>
            <form onSubmit={handleCreateGroup} className="p-8 space-y-4">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Navn</label><input autoFocus required type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="f.eks. Husgruppe Sør" /></div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">Opprett</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsView;
