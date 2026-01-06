
import React, { useState, useEffect } from 'react';
import { AppState, Group, GroupCategory, GroupRole, GroupMember, RoleDefinition, UUID, Person, CoreRole } from '../types';
import { Users, Shield, Heart, MoreVertical, Plus, X, Trash2, Search, UserPlus, Check, ListChecks, Edit2, Star, Eye, Info, CheckCircle2, Phone, Mail, User as UserIcon, UserCheck, ShieldCheck, Power, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface Props {
  db: AppState;
  setDb: React.Dispatch<React.SetStateAction<AppState>>;
  isAdmin: boolean;
  initialViewGroupId?: UUID | null;
}

const GroupsView: React.FC<Props> = ({ db, setDb, isAdmin, initialViewGroupId }) => {
  const [activeTab, setActiveTab] = useState<GroupCategory | 'persons'>(GroupCategory.SERVICE);
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [manageGroupId, setManageGroupId] = useState<UUID | null>(null);
  const [viewingGroupId, setViewingGroupId] = useState<UUID | null>(null);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  
  // Person Modal States
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isCreatePersonModalOpen, setIsCreatePersonModalOpen] = useState(false);

  // Create Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState<GroupCategory>(GroupCategory.SERVICE);
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupLink, setNewGroupLink] = useState('');

  // Member Search State
  const [memberSearch, setMemberSearch] = useState('');
  const [personSearch, setPersonSearch] = useState('');

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

  const handleAddRole = () => {
    if (!manageGroupId) return;
    const newRole: RoleDefinition = {
      id: crypto.randomUUID(),
      group_id: manageGroupId,
      title: 'Ny Rolle',
      default_tasks: []
    };
    setDb(prev => ({ ...prev, roleDefinitions: [...prev.roleDefinitions, newRole] }));
    setEditingRole(newRole);
  };

  const handleUpdateRole = (role: RoleDefinition) => {
    setDb(prev => ({
      ...prev,
      roleDefinitions: prev.roleDefinitions.map(rd => rd.id === role.id ? role : rd)
    }));
  };

  const handleDeleteRole = (id: UUID) => {
    setDb(prev => ({ ...prev, roleDefinitions: prev.roleDefinitions.filter(rd => rd.id !== id) }));
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

  const searchResults = db.persons.filter(p => 
    p.name.toLowerCase().includes(memberSearch.toLowerCase()) && 
    !db.groupMembers.some(gm => gm.group_id === manageGroupId && gm.person_id === p.id)
  ).slice(0, 5);

  const getTabSpecificContent = () => {
    const commonProps = {
        filteredGroups,
        db,
        isAdmin,
        setViewingGroupId,
        setManageGroupId
    };

    const newButtonText = 
      activeTab === GroupCategory.SERVICE ? "Nytt team" :
      activeTab === GroupCategory.FELLOWSHIP ? "Ny husgruppe" :
      activeTab === GroupCategory.STRATEGY ? "Ny gruppe" : "";

    return (
        <div className="space-y-4">
            {isAdmin && activeTab !== 'persons' && (
                <div className="flex justify-end">
                    <button onClick={() => { setNewGroupCategory(activeTab as GroupCategory); setIsCreateModalOpen(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                        <Plus size={18} /> {newButtonText}
                    </button>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {filteredGroups.map(group => {
                    const members = db.groupMembers.filter(gm => gm.group_id === group.id);
                    const leaderMembers = members.filter(m => m.role === GroupRole.LEADER);
                    const leadersStr = leaderMembers.map(l => db.persons.find(p => p.id === l.person_id)?.name).filter(Boolean).join(', ');
                    return (
                        <div key={group.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">{getIcon(group.category)}</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{group.name}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{group.category}</p>
                            </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setViewingGroupId(group.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Se detaljer"><Eye size={16} /></button>
                                {isAdmin && <button onClick={() => setManageGroupId(group.id)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Administrer gruppe"><Edit2 size={16} /></button>}
                            </div>
                        </div>
                        <p className="text-slate-600 text-sm mb-6 line-clamp-2 flex-grow">{group.description || 'Ingen beskrivelse tilgjengelig.'}</p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-tighter">Leder:</span>
                            <span className="text-slate-800 font-bold truncate max-w-[150px] flex items-center gap-1">
                                {leadersStr || <span className="text-red-400 italic">Mangler leder</span>}
                                {leaderMembers.length > 0 && <Star size={12} className="text-amber-500 fill-amber-500" />}
                            </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-tighter">Medlemmer ({members.length}):</span>
                            <div className="flex -space-x-1.5">
                                {members.slice(0, 5).map(m => (
                                <div key={m.id} className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold overflow-hidden ${m.role === GroupRole.LEADER ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`} title={db.persons.find(p => p.id === m.person_id)?.name}>
                                    {db.persons.find(p => p.id === m.person_id)?.name?.charAt(0)}
                                </div>
                                ))}
                                {members.length > 5 && <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">+{members.length - 5}</div>}
                            </div>
                            </div>
                        </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };


  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 md:pb-0 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Menighetens Oversikt</h2>
          <p className="text-sm text-slate-500">Administrer fellesskap, teams og medlemmer.</p>
        </div>
        
        <div className="inline-flex bg-slate-200 p-1 rounded-xl">
          <button onClick={() => setActiveTab(GroupCategory.SERVICE)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === GroupCategory.SERVICE ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Teams</button>
          <button onClick={() => setActiveTab(GroupCategory.FELLOWSHIP)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === GroupCategory.FELLOWSHIP ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Husgrupper</button>
          <button onClick={() => setActiveTab(GroupCategory.STRATEGY)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === GroupCategory.STRATEGY ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Styre</button>
          <button onClick={() => setActiveTab('persons')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'persons' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Personer</button>
        </div>
      </div>

      {activeTab === 'persons' ? (
        <div className="space-y-4 text-left">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Søk på navn eller e-post..." 
                  value={personSearch} 
                  onChange={e => setPersonSearch(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                 <button onClick={() => setIsCreatePersonModalOpen(true)} className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                   <Plus size={18} /> Ny Person
                 </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="pb-4 font-bold text-[10px] text-slate-400 uppercase tracking-widest px-4">Navn</th>
                    <th className="pb-4 font-bold text-[10px] text-slate-400 uppercase tracking-widest px-4">Fast Rolle</th>
                    <th className="pb-4 font-bold text-[10px] text-slate-400 uppercase tracking-widest px-4">E-post</th>
                    <th className="pb-4 font-bold text-[10px] text-slate-400 uppercase tracking-widest px-4">Telefon</th>
                    <th className="pb-4 font-bold text-[10px] text-slate-400 uppercase tracking-widest px-4 text-right">Handlinger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPersons.map(person => (
                    <tr key={person.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${person.is_active ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                            {person.name.charAt(0)}
                          </div>
                          <span className={`font-semibold ${person.is_active ? 'text-slate-800' : 'text-slate-400 italic'}`}>{person.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getCoreRoleColor(person.core_role)}`}>
                          {getCoreRoleLabel(person.core_role)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          {person.email}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          {person.phone || <span className="text-slate-300 italic">Ikke oppgitt</span>}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => setEditingPerson(person)}
                          className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPersons.length === 0 && (
                <div className="py-20 text-center">
                  <UserIcon size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400">Ingen personer matchet søket ditt.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        getTabSpecificContent()
      )}

      {/* Person Redigerings-Modal */}
      {editingPerson && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingPerson(null)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">{editingPerson.name.charAt(0)}</div>
                <h3 className="text-xl font-bold">Rediger Person</h3>
              </div>
              <button onClick={() => setEditingPerson(null)} className="p-2 hover:bg-indigo-600 rounded-xl transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleUpdatePerson} className="flex-1 overflow-y-auto p-8 space-y-6 text-left">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><UserIcon size={12} /> Fullt Navn</label>
                  <input required type="text" value={editingPerson.name} onChange={e => setEditingPerson({...editingPerson, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Mail size={12} /> E-post</label>
                    <input required type="email" value={editingPerson.email} onChange={e => setEditingPerson({...editingPerson, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Phone size={12} /> Telefon</label>
                    <input type="tel" value={editingPerson.phone || ''} onChange={e => setEditingPerson({...editingPerson, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-indigo-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">Menighets-Rolle</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Bestemmer tilgang og visning</p>
                      </div>
                    </div>
                    <select 
                      value={editingPerson.core_role} 
                      onChange={e => setEditingPerson({...editingPerson, core_role: e.target.value as CoreRole})} 
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={CoreRole.PASTOR}>Pastor</option>
                      <option value={CoreRole.TEAM_LEADER}>Gruppeleder</option>
                      <option value={CoreRole.MEMBER}>Medlem</option>
                      <option value={CoreRole.GUEST}>Gjest</option>
                      <option value={CoreRole.ADMIN}>Administrator</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <UserCheck size={18} className="text-indigo-600" />
                      <p className="text-sm font-bold text-slate-800">Administrator-tilgang</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setEditingPerson({...editingPerson, is_admin: !editingPerson.is_admin})}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${editingPerson.is_admin ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editingPerson.is_admin ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <Power size={18} className={editingPerson.is_active ? 'text-green-500' : 'text-slate-400'} />
                      <p className="text-sm font-bold text-slate-800">Aktiv Bruker</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setEditingPerson({...editingPerson, is_active: !editingPerson.is_active})}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${editingPerson.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editingPerson.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                <Check size={20} /> Lagre Endringer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ny Person Modal */}
      {isCreatePersonModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreatePersonModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold">Opprett Ny Person</h3>
              <button onClick={() => setIsCreatePersonModalOpen(false)} className="p-2 hover:bg-indigo-600 rounded-xl transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreatePerson} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fullt Navn</label>
                <input required name="name" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="f.eks. Ola Nordmann" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-post</label>
                <input required name="email" type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="ola@eksempel.no" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Telefon</label>
                <input name="phone" type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="900 00 000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kjernerolle</label>
                  <select name="core_role" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                    <option value={CoreRole.MEMBER}>Medlem</option>
                    <option value={CoreRole.PASTOR}>Pastor</option>
                    <option value={CoreRole.TEAM_LEADER}>Gruppeleder</option>
                    <option value={CoreRole.GUEST}>Gjest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Admin?</label>
                  <select name="is_admin" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                    <option value="false">Nei</option>
                    <option value="true">Ja (Admin)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg mt-4">Legg til Person</button>
            </form>
          </div>
        </div>
      )}

       {/* Vis Gruppe Modal */}
       {viewedGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingGroupId(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                {getIcon(viewedGroup.category)}
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{viewedGroup.name}</h3>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{viewedGroup.category}</p>
                </div>
              </div>
              <button onClick={() => setViewingGroupId(null)} className="p-2 hover:bg-slate-200 rounded-xl"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Beskrivelse</h4>
                <p className="text-slate-600 leading-relaxed mb-4">{viewedGroup.description || 'Ingen beskrivelse tilgjengelig.'}</p>
                {viewedGroup.link && (
                  <a 
                    href={viewedGroup.link.startsWith('http') ? viewedGroup.link : `https://${viewedGroup.link}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <ExternalLink size={16} /> Gå til eksternt dokument
                  </a>
                )}
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Medlemmer ({db.groupMembers.filter(gm => gm.group_id === viewedGroup.id).length})</h4>
                  <div className="space-y-3">
                    {db.groupMembers.filter(gm => gm.group_id === viewedGroup.id).sort((a,b) => a.role === GroupRole.LEADER ? -1 : 1).map(gm => {
                      const person = db.persons.find(p => p.id === gm.person_id);
                      if (!person) return null;
                      return (
                        <div key={gm.id} className={`flex items-center gap-4 p-4 rounded-2xl border ${gm.role === GroupRole.LEADER ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${gm.role === GroupRole.LEADER ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>{person.name.charAt(0)}</div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-800">{person.name}</p>
                            <p className={`text-xs font-bold uppercase tracking-wider ${gm.role === GroupRole.LEADER ? 'text-amber-700' : 'text-slate-500'}`}>{gm.role === GroupRole.LEADER ? 'Leder' : 'Medlem'}</p>
                          </div>
                          <div className="flex flex-col text-right text-xs gap-1">
                            <div className="flex items-center justify-end gap-2 text-slate-600"><Mail size={12} className="text-slate-400"/> {person.email}</div>
                            <div className="flex items-center justify-end gap-2 text-slate-600"><Phone size={12} className="text-slate-400"/> {person.phone || '-'}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <section>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Definerte Roller & Instrukser</h4>
                  <div className="space-y-3">
                    {db.roleDefinitions.filter(rd => rd.group_id === viewedGroup.id).map(rd => (
                      <div key={rd.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <h5 className="font-bold text-indigo-800">{rd.title}</h5>
                        <div className="mt-3 space-y-2">
                          {rd.default_tasks.filter(t => t.trim().length > 0).map((task, i) => (
                             <div key={i} className="flex gap-2.5 text-left">
                               <CheckCircle2 size={16} className="text-indigo-300 mt-0.5 shrink-0" />
                               <p className="text-slate-600 text-sm leading-snug font-medium">{task}</p>
                             </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {db.roleDefinitions.filter(rd => rd.group_id === viewedGroup.id).length === 0 && (
                      <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                         <p className="text-xs text-slate-400">Ingen roller definert.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end">
              <button onClick={() => setViewingGroupId(null)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg flex items-center gap-2"><Check size={20} /> Lukk</button>
            </div>
          </div>
        </div>
      )}

      {/* Group Manage Modal */}
      {managedGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setManageGroupId(null); setEditingRole(null); }}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 h-[85vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                {getIcon(managedGroup.category)}
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{managedGroup.name}</h3>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{managedGroup.category}</p>
                </div>
              </div>
              <button onClick={() => { setManageGroupId(null); setEditingRole(null); }} className="p-2 hover:bg-slate-200 rounded-xl"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 border-r p-6 overflow-y-auto space-y-6">
                <section className="space-y-4 text-left">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Basisinformasjon</h4>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Gruppenavn" 
                      value={managedGroup.name} 
                      onChange={e => handleUpdateGroupBasicInfo({ name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    <textarea 
                      placeholder="Kort beskrivelse av gruppens formål..." 
                      value={managedGroup.description || ''} 
                      onChange={e => handleUpdateGroupBasicInfo({ description: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                    />
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="url" 
                        placeholder="Link til eksternt dokument (Google Disk etc.)" 
                        value={managedGroup.link || ''} 
                        onChange={e => handleUpdateGroupBasicInfo({ link: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4 text-left">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medlemmer & Ledelse</h4>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Legg til person..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    {memberSearch && searchResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-xl overflow-hidden">
                        {searchResults.map(p => (
                          <button key={p.id} onClick={() => { handleAddMember(p.id); setMemberSearch(''); }} className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 text-sm border-b last:border-0">
                            <span className="font-medium text-slate-700">{p.name}</span> <UserPlus size={14} className="text-indigo-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {db.groupMembers.filter(gm => gm.group_id === managedGroup.id).sort((a,b) => a.role === GroupRole.LEADER ? -1 : 1).map(gm => {
                      const person = db.persons.find(p => p.id === gm.person_id);
                      return (
                        <div key={gm.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${gm.role === GroupRole.LEADER ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${gm.role === GroupRole.LEADER ? 'bg-white text-amber-600' : 'bg-white text-indigo-600'}`}>{person?.name?.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm truncate">{person?.name}</p>
                            <p className={`text-[9px] uppercase font-bold tracking-tighter ${gm.role === GroupRole.LEADER ? 'text-amber-600' : 'text-slate-400'}`}>{gm.role === GroupRole.LEADER ? 'Hovedleder' : 'Medlem'}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {gm.role !== GroupRole.LEADER && <button onClick={() => handleSetAsLeader(gm.id)} className="p-2 text-slate-300 hover:text-amber-500" title="Sett som leder"><Star size={18} /></button>}
                            <button onClick={() => handleRemoveMember(gm.id)} className="p-2 text-slate-300 hover:text-red-500" title="Fjern"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
              <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-slate-50/50 space-y-6">
                <section className="space-y-4 text-left">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Definerte Roller</h4>
                    <button onClick={handleAddRole} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><Plus size={16} /></button>
                  </div>
                  <div className="space-y-3">
                    {db.roleDefinitions.filter(rd => rd.group_id === managedGroup.id).map(rd => (
                      <div key={rd.id} className="p-4 bg-white rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{rd.title}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{rd.default_tasks.length} instrukser</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setEditingRole(rd)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteRole(rd.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                          </div>
                        </div>
                        {editingRole?.id === rd.id && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={editingRole.title} onChange={e => setEditingRole({...editingRole, title: e.target.value})} placeholder="Rollenavn" />
                            <textarea className="w-full px-3 py-2 border rounded-lg text-sm min-h-[80px]" value={editingRole.default_tasks.join('\n')} onChange={e => setEditingRole({...editingRole, default_tasks: e.target.value.split('\n')})} placeholder="Instrukser (linjeskift skiller)" />
                            <button onClick={() => { handleUpdateRole(editingRole); setEditingRole(null); }} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Lagre</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end">
              <button onClick={() => { setManageGroupId(null); setEditingRole(null); }} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg flex items-center gap-2"><Check size={20} /> Ferdig</button>
            </div>
          </div>
        </div>
      )}

      {/* Opprett Gruppe Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center"><h3 className="text-xl font-bold">Ny Gruppe</h3><button onClick={() => setIsCreateModalOpen(false)}><X size={24} /></button></div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Navn</label><input autoFocus required type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="f.eks. Husgruppe Sør" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kategori</label><select value={newGroupCategory} onChange={e => setNewGroupCategory(e.target.value as GroupCategory)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"><option value={GroupCategory.SERVICE}>Team (Tjeneste)</option><option value={GroupCategory.FELLOWSHIP}>Husgruppe (Fellesskap)</option><option value={GroupCategory.STRATEGY}>Styre / Ledelse</option></select></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Beskrivelse</label><textarea value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none min-h-[100px]" placeholder="Formål..." /></div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><LinkIcon size={12}/> Link til eksternt dokument</label>
                <input type="url" value={newGroupLink} onChange={e => setNewGroupLink(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://drive.google.com/..." />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">Opprett</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsView;
