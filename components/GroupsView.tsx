
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Group, GroupCategory, GroupRole, GroupMember, ServiceRole, GroupServiceRole, UUID, Person, CoreRole } from '../types';
import { Users, Shield, Heart, MoreVertical, Plus, X, Trash2, Search, UserPlus, Check, ListChecks, Edit2, Star, Eye, Info, CheckCircle2, Phone, Mail, User as UserIcon, UserCheck, ShieldCheck, Power, Link as LinkIcon, ExternalLink, Library, ChevronDown } from 'lucide-react';

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

  // Dropdown states for manage modal
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Create Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState<GroupCategory>(GroupCategory.SERVICE);
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupLink, setNewGroupLink] = useState('');

  // Member/Role Search State
  const [memberSearch, setMemberSearch] = useState('');
  const [personSearch, setPersonSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  // Handle outside click for role dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [roleDropdownRef]);

  useEffect(() => {
    if (initialViewGroupId) {
      const group = db.groups.find(g => g.id === initialViewGroupId);
      if (group) {
        setActiveTab(group.category);
        setViewingGroupId(initialViewGroupId);
      }
    }
  }, [initialViewGroupId, db.groups]);

  const filteredGroups = db.groups.filter(g => g.category === activeTab);
  const managedGroup = db.groups.find(g => g.id === manageGroupId);
  const viewedGroup = db.groups.find(g => g.id === viewingGroupId);

  const getIcon = (cat: GroupCategory) => {
    switch (cat) {
      case GroupCategory.SERVICE: return <Shield className="text-indigo-500" size={20} />;
      case GroupCategory.FELLOWSHIP: return <Heart className="text-rose-500" size={20} />;
      case GroupCategory.STRATEGY: return <Users className="text-amber-500" size={20} />;
    }
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

  const handleUpdateServiceRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceRole) return;
    setDb(prev => ({
      ...prev,
      serviceRoles: prev.serviceRoles.map(sr => sr.id === editingServiceRole.id ? editingServiceRole : sr)
    }));
    setEditingServiceRole(null);
  };

  const handleAddRoleToGroup = (roleId: UUID) => {
    if (!manageGroupId) return;
    if (db.groupServiceRoles.some(gsr => gsr.group_id === manageGroupId && gsr.service_role_id === roleId)) return;
    const newLink: GroupServiceRole = {
      id: crypto.randomUUID(),
      group_id: manageGroupId,
      service_role_id: roleId,
      is_active: true
    };
    setDb(prev => ({ ...prev, groupServiceRoles: [...prev.groupServiceRoles, newLink] }));
    setIsRoleDropdownOpen(false);
    setRoleSearch('');
  };

  const handleRemoveRoleFromGroup = (linkId: UUID) => {
    setDb(prev => ({ ...prev, groupServiceRoles: prev.groupServiceRoles.filter(gsr => gsr.id !== linkId) }));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: newGroupName,
      category: newGroupCategory,
      description: newGroupDesc,
      link: newGroupLink
    };
    setDb(prev => ({ ...prev, groups: [...prev.groups, newGroup] }));
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupLink('');
    setIsCreateModalOpen(false);
  };

  const handleUpdateGroupBasicInfo = (updates: Partial<Group>) => {
    if (!manageGroupId) return;
    setDb(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === manageGroupId ? { ...g, ...updates } : g)
    }));
  };

  const handleUpdatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson) return;
    setDb(prev => ({
      ...prev,
      persons: prev.persons.map(p => p.id === editingPerson.id ? editingPerson : p)
    }));
    setEditingPerson(null);
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

  const handleSetAsLeader = (memberId: UUID) => {
    if (!manageGroupId) return;
    setDb(prev => ({
      ...prev,
      groupMembers: prev.groupMembers.map(gm => {
        if (gm.group_id !== manageGroupId) return gm;
        if (gm.id === memberId) return { ...gm, role: GroupRole.LEADER };
        return gm;
      })
    }));
  };

  const getCoreRoleLabel = (role: CoreRole) => {
    switch (role) {
      case CoreRole.ADMIN: return 'Administrator';
      case CoreRole.PASTOR: return 'Pastor';
      case CoreRole.TEAM_LEADER: return 'Gruppeleder';
      case CoreRole.MEMBER: return 'Medlem';
      case CoreRole.GUEST: return 'Gjest';
      default: return 'Medlem';
    }
  };

  const getCoreRoleColor = (role: CoreRole) => {
    switch (role) {
      case CoreRole.PASTOR: return 'bg-purple-100 text-purple-700';
      case CoreRole.TEAM_LEADER: return 'bg-blue-100 text-blue-700';
      case CoreRole.ADMIN: return 'bg-indigo-100 text-indigo-700';
      case CoreRole.GUEST: return 'bg-slate-100 text-slate-700';
      default: return 'bg-emerald-100 text-emerald-700';
    }
  };

  const filteredPersons = db.persons.filter(p => 
    p.name.toLowerCase().includes(personSearch.toLowerCase()) ||
    p.email.toLowerCase().includes(personSearch.toLowerCase())
  ).sort((a,b) => a.name.localeCompare(b.name));

  const filteredRoles = db.serviceRoles.filter(sr => 
    sr.name.toLowerCase().includes(roleSearch.toLowerCase())
  ).sort((a,b) => a.name.localeCompare(b.name));

  const memberSearchResults = db.persons.filter(p => 
    p.name.toLowerCase().includes(memberSearch.toLowerCase()) && 
    !db.groupMembers.some(gm => gm.group_id === manageGroupId && gm.person_id === p.id)
  ).slice(0, 5);

  // Filter roles that are NOT already in the managed group
  const availableRoleOptions = db.serviceRoles.filter(sr => 
    !db.groupServiceRoles.some(gsr => gsr.group_id === manageGroupId && gsr.service_role_id === sr.id) &&
    sr.name.toLowerCase().includes(roleSearch.toLowerCase())
  );

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
          <button onClick={() => setActiveTab(GroupCategory.STRATEGY)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'strategy' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Styre</button>
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
            {isAdmin && <button onClick={() => setIsCreateServiceRoleModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow flex items-center gap-2"><Plus size={16} /> Ny Rolle</button>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map(sr => (
              <div key={sr.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Library size={18} /></div>
                  {isAdmin && <button onClick={() => setEditingServiceRole(sr)} className="p-1.5 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={16} /></button>}
                </div>
                <h4 className="font-bold text-slate-800 mb-1">{sr.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{sr.description || 'Ingen beskrivelse.'}</p>
                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sr.default_instructions.length} instrukser</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-300">Brukt i</span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{db.groupServiceRoles.filter(gsr => gsr.service_role_id === sr.id).length} team</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'persons' ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Søk på navn..." value={personSearch} onChange={e => setPersonSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
            <button onClick={() => setIsCreatePersonModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"><Plus size={16} /> Ny Person</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b text-[10px] text-slate-400 uppercase tracking-widest font-bold"><th className="pb-3 px-4">Navn</th><th className="pb-3 px-4">Rolle</th><th className="pb-3 px-4">Kontakt</th><th className="pb-3 px-4 text-right">Handlinger</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPersons.map(person => (
                  <tr key={person.id} className="group hover:bg-slate-50">
                    <td className="py-3 px-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold">{person.name.charAt(0)}</div><span className="text-sm font-semibold">{person.name}</span></div></td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getCoreRoleColor(person.core_role)}`}>{getCoreRoleLabel(person.core_role)}</span></td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">{person.email}</td>
                    <td className="py-3 px-4 text-right"><button onClick={() => setEditingPerson(person)} className="p-1.5 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100"><Edit2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {isAdmin && <div className="flex justify-end"><button onClick={() => { setNewGroupCategory(activeTab as GroupCategory); setIsCreateModalOpen(true); }} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow"><Plus size={16} /> Nytt Team</button></div>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map(group => {
              const members = db.groupMembers.filter(gm => gm.group_id === group.id);
              return (
                <button 
                  key={group.id} 
                  onClick={() => setViewingGroupId(group.id)}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-1 transition-all group flex flex-col h-full relative overflow-hidden text-left w-full"
                >
                  <div className="flex justify-between items-start mb-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">{getIcon(group.category)}</div>
                      <h3 className="text-base font-bold text-slate-800">{group.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isAdmin && (
                        <div 
                          onClick={(e) => { e.stopPropagation(); setManageGroupId(group.id); }} 
                          className="p-1.5 text-slate-400 hover:text-amber-600 bg-slate-100 rounded-lg"
                        >
                          <Edit2 size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs mb-4 line-clamp-2 flex-grow">{group.description || 'Ingen beskrivelse.'}</p>
                  <div className="pt-4 border-t flex justify-between items-center w-full">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{members.length} medlemmer</span>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-tighter">{db.groupServiceRoles.filter(gsr => gsr.group_id === group.id).length} roller</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Vis Gruppe Modal */}
      {viewedGroup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewingGroupId(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 text-left">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl">{getIcon(viewedGroup.category)}</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{viewedGroup.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewedGroup.category}</p>
                </div>
              </div>
              <button onClick={() => setViewingGroupId(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} className="text-slate-500" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 max-h-[70vh]">
              {viewedGroup.description && (
                <section>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Om gruppen</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{viewedGroup.description}</p>
                </section>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Users size={12} /> Medlemmer ({db.groupMembers.filter(gm => gm.group_id === viewedGroup.id).length})
                  </h4>
                  <div className="space-y-2">
                    {db.groupMembers.filter(gm => gm.group_id === viewedGroup.id).map(gm => {
                      const person = db.persons.find(p => p.id === gm.person_id);
                      return (
                        <div key={gm.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-sm">{person?.name.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate">{person?.name}</p>
                            <p className="text-[9px] uppercase font-bold text-slate-400">{gm.role}</p>
                          </div>
                          {gm.role === GroupRole.LEADER && <Star size={12} className="text-amber-500 fill-amber-500" />}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Library size={12} /> Tilknyttede Roller ({db.groupServiceRoles.filter(gsr => gsr.group_id === viewedGroup.id).length})
                  </h4>
                  <div className="space-y-2">
                    {db.groupServiceRoles.filter(gsr => gsr.group_id === viewedGroup.id).map(gsr => {
                      const role = db.serviceRoles.find(r => r.id === gsr.service_role_id);
                      return (
                        <div key={gsr.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <p className="font-bold text-indigo-700 text-xs">{role?.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{role?.description || 'Ingen beskrivelse.'}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
            
            <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
              {isAdmin && (
                <button 
                  onClick={() => { setViewingGroupId(null); setManageGroupId(viewedGroup.id); }}
                  className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                >
                  <Edit2 size={14} /> Rediger
                </button>
              )}
              <button 
                onClick={() => setViewingGroupId(null)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-slate-800 transition-colors"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Manage Modal (Forbedret med nedtrekksmeny for roller) */}
      {managedGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setManageGroupId(null)}></div>
          <div className="relative bg-white w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                {getIcon(managedGroup.category)}
                <h3 className="text-base font-bold uppercase tracking-tight">Administrer {managedGroup.name}</h3>
              </div>
              <button onClick={() => setManageGroupId(null)} className="p-2 hover:bg-slate-200 rounded-xl"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 p-6 border-r overflow-y-auto space-y-6">
                <section className="text-left space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team-informasjon</h4>
                  <input type="text" value={managedGroup.name} onChange={e => handleUpdateGroupBasicInfo({ name: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Teamnavn" />
                  <textarea value={managedGroup.description || ''} onChange={e => handleUpdateGroupBasicInfo({ description: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-20" placeholder="Beskrivelse" />
                </section>
                
                <section className="text-left space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tilknyttede Roller (Tjenester)</h4>
                  
                  {/* Nedtrekksmeny for roller */}
                  <div className="relative" ref={roleDropdownRef}>
                    <div 
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Library size={16} className="text-indigo-500" />
                        <span className="text-xs font-bold text-slate-600">Velg og legg til rolle fra katalogen...</span>
                      </div>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    
                    {isRoleDropdownOpen && (
                      <div className="absolute z-[110] w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 border-b bg-slate-50">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                            <input 
                              autoFocus
                              type="text" 
                              placeholder="Søk i roller..." 
                              value={roleSearch} 
                              onChange={e => setRoleSearch(e.target.value)} 
                              onClick={e => e.stopPropagation()}
                              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500" 
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {availableRoleOptions.length > 0 ? availableRoleOptions.map(sr => (
                            <button 
                              key={sr.id} 
                              onClick={() => handleAddRoleToGroup(sr.id)} 
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 text-xs border-b border-slate-50 last:border-0 transition-colors"
                            >
                              <div className="text-left">
                                <span className="font-bold text-slate-700 block">{sr.name}</span>
                                <span className="text-[9px] text-slate-400 font-medium line-clamp-1">{sr.description || 'Ingen beskrivelse.'}</span>
                              </div>
                              <Plus size={14} className="text-indigo-500 shrink-0 ml-2" />
                            </button>
                          )) : (
                            <div className="px-4 py-8 text-center text-[10px] text-slate-400 italic">Ingen flere tilgjengelige roller funnet.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    {db.groupServiceRoles.filter(gsr => gsr.group_id === managedGroup.id).map(gsr => {
                      const role = db.serviceRoles.find(r => r.id === gsr.service_role_id);
                      return (
                        <div key={gsr.id} className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl shadow-sm text-xs font-bold group/role">
                          <div className="flex items-center gap-2">
                            <Library size={14} className="text-indigo-400"/> 
                            <span className="text-indigo-900">{role?.name}</span>
                          </div>
                          <button 
                            onClick={() => handleRemoveRoleFromGroup(gsr.id)} 
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      );
                    })}
                    {db.groupServiceRoles.filter(gsr => gsr.group_id === managedGroup.id).length === 0 && (
                      <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ingen roller tilknyttet</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
              
              <div className="w-full md:w-1/2 p-6 bg-slate-50 overflow-y-auto space-y-6">
                 <section className="text-left space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medlemmer</h4>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="text" placeholder="Søk og legg til person..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                    {memberSearch && memberSearchResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-lg overflow-hidden">
                        {memberSearchResults.map(p => (
                          <button key={p.id} onClick={() => { handleAddMember(p.id); setMemberSearch(''); }} className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-indigo-50 text-xs border-b last:border-0">
                            <span className="font-bold text-slate-700">{p.name}</span> <UserPlus size={12} className="text-indigo-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {db.groupMembers.filter(gm => gm.group_id === managedGroup.id).map(gm => {
                      const person = db.persons.find(p => p.id === gm.person_id);
                      return (
                        <div key={gm.id} className={`flex items-center gap-3 p-2 bg-white border rounded-xl transition-all ${gm.role === GroupRole.LEADER ? 'border-amber-200' : 'border-slate-100'}`}>
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-bold">{person?.name.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate">{person?.name}</p>
                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">{gm.role}</p>
                          </div>
                          <div className="flex gap-1">
                             <button onClick={() => handleSetAsLeader(gm.id)} className={`p-1.5 ${gm.role === GroupRole.LEADER ? 'text-amber-500' : 'text-slate-200 hover:text-amber-500'}`}><Star size={14}/></button>
                             <button onClick={() => handleRemoveMember(gm.id)} className="p-1.5 text-slate-200 hover:text-red-500"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end">
              <button onClick={() => setManageGroupId(null)} className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-indigo-700 transition-all">Ferdig</button>
            </div>
          </div>
        </div>
      )}

      {/* Katalog CRUD Modals */}
      {isCreateServiceRoleModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateServiceRoleModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-left animate-in zoom-in-95">
            <div className="p-4 bg-indigo-700 text-white flex justify-between items-center"><h3 className="text-sm font-bold uppercase tracking-tight">Ny Rolle i Katalog</h3><button onClick={() => setIsCreateServiceRoleModalOpen(false)}><X size={18}/></button></div>
            <form onSubmit={handleCreateServiceRole} className="p-6 space-y-4">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rollenavn</label><input required name="name" type="text" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="f.eks. Møtevert" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Beskrivelse</label><textarea name="description" className="w-full px-3 py-2 border rounded-lg text-sm h-20" placeholder="Hva innebærer denne rollen?" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Standard Instrukser (En per linje)</label><textarea name="instructions" className="w-full px-3 py-2 border rounded-lg text-sm h-32" placeholder="Sjekke kaffe&#10;Henvise folk til plass" /></div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg">Opprett i Katalog</button>
            </form>
          </div>
        </div>
      )}

      {editingServiceRole && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingServiceRole(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-left animate-in zoom-in-95">
            <div className="p-4 bg-indigo-700 text-white flex justify-between items-center"><h3 className="text-sm font-bold uppercase tracking-tight">Rediger Katalog-rolle</h3><button onClick={() => setEditingServiceRole(null)}><X size={18}/></button></div>
            <form onSubmit={handleUpdateServiceRole} className="p-6 space-y-4">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rollenavn</label><input required type="text" value={editingServiceRole.name} onChange={e => setEditingServiceRole({...editingServiceRole, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Beskrivelse</label><textarea value={editingServiceRole.description || ''} onChange={e => setEditingServiceRole({...editingServiceRole, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm h-20" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Standard Instrukser</label><textarea value={editingServiceRole.default_instructions.join('\n')} onChange={e => setEditingServiceRole({...editingServiceRole, default_instructions: e.target.value.split('\n')})} className="w-full px-3 py-2 border rounded-lg text-sm h-32" /></div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg">Oppdater Katalog</button>
            </form>
          </div>
        </div>
      )}

      {/* Ny Gruppe Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-4 bg-indigo-700 text-white flex justify-between items-center"><h3 className="text-sm font-bold uppercase tracking-tight">Nytt Team</h3><button onClick={() => setIsCreateModalOpen(false)}><X size={18} /></button></div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Navn</label><input autoFocus required type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="f.eks. Husgruppe Sør" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kategori</label><select value={newGroupCategory} onChange={e => setNewGroupCategory(e.target.value as GroupCategory)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"><option value={GroupCategory.SERVICE}>Team (Tjeneste)</option><option value={GroupCategory.FELLOWSHIP}>Husgruppe (Fellesskap)</option><option value={GroupCategory.STRATEGY}>Styre / Ledelse</option></select></div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow">Opprett</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsView;
