
import React, { useState } from 'react';
import { AppState, EventTemplate, RoleDefinition, GroupCategory, UUID, ProgramItem } from '../types';
import { Settings, Plus, Info, Edit3, Trash2, Shield, Repeat, X, Clock, Users } from 'lucide-react';

interface Props {
  db: AppState;
  setDb: React.Dispatch<React.SetStateAction<AppState>>;
  onCreateRecurring: (templateId: string, startDate: string, count: number, intervalDays: number) => void;
  onAddProgramItem: (item: ProgramItem) => void;
  onDeleteProgramItem: (id: string) => void;
}

const MasterMenu: React.FC<Props> = ({ db, setDb, onCreateRecurring, onAddProgramItem, onDeleteProgramItem }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(db.eventTemplates[0] || null);
  
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);

  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateType, setNewTemplateType] = useState('Gudstjeneste');
  const [newTemplateRecurrence, setNewTemplateRecurrence] = useState('Hver søndag');

  const [recStartDate, setRecStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [recCount, setRecCount] = useState(4);
  const [recInterval, setRecInterval] = useState(7);

  const [progTitle, setProgTitle] = useState('');
  const [progDuration, setProgDuration] = useState(5);
  const [progRoleId, setProgRoleId] = useState<string>('');
  const [progGroupId, setProgGroupId] = useState<string>('');

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle.trim()) return;

    const newTemplate: EventTemplate = {
      id: crypto.randomUUID(),
      title: newTemplateTitle,
      type: newTemplateType,
      recurrence_rule: newTemplateRecurrence
    };

    setDb(prev => ({
      ...prev,
      eventTemplates: [...prev.eventTemplates, newTemplate]
    }));

    setNewTemplateTitle('');
    setIsTemplateModalOpen(false);
    setSelectedTemplate(newTemplate);
  };

  const handleAddProgramItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !progTitle.trim()) return;

    const items = db.programItems.filter(p => p.template_id === selectedTemplate.id);
    const newItem: ProgramItem = {
      id: crypto.randomUUID(),
      template_id: selectedTemplate.id,
      title: progTitle,
      duration_minutes: progDuration,
      role_id: progRoleId || null,
      group_id: progGroupId || null,
      order: items.length
    };

    onAddProgramItem(newItem);

    setProgTitle('');
    setProgDuration(5);
    setProgRoleId('');
    setProgGroupId('');
    setIsProgramModalOpen(false);
  };

  const handlePlanRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    onCreateRecurring(selectedTemplate.id, recStartDate, recCount, recInterval);
    setIsRecurringModalOpen(false);
  };

  const handleDeleteTemplate = (id: UUID) => {
    if (!confirm('Er du sikker på at du vil slette denne master-malen? Dette sletter ikke eksisterende hendelser i kalenderen.')) return;
    setDb(prev => ({
      ...prev,
      eventTemplates: prev.eventTemplates.filter(t => t.id !== id)
    }));
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(db.eventTemplates.filter(t => t.id !== id)[0] || null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Settings className="text-amber-500" size={28} />
            Master-meny <span className="text-amber-500 font-normal">(Gul sone)</span>
          </h2>
          <p className="text-slate-500">Administrer menighetens arrangement-maler og grunnoppsett.</p>
        </div>
        <button 
          onClick={() => setIsTemplateModalOpen(true)}
          className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Ny Master-mal
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-left">
        <aside className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Valgt Mal</h3>
          {db.eventTemplates.map(t => (
            <button 
              key={t.id}
              onClick={() => setSelectedTemplate(t)}
              className={`w-full text-left px-5 py-4 rounded-2xl transition-all border ${selectedTemplate?.id === t.id ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-sm' : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'}`}
            >
              <p className="font-bold text-sm">{t.title}</p>
              <p className="text-[10px] opacity-60 mt-1 uppercase tracking-tighter">{t.recurrence_rule}</p>
            </button>
          ))}
        </aside>

        <main className="lg:col-span-3 space-y-6">
          {selectedTemplate ? (
            <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
              <div className="p-8 bg-amber-50 border-b border-amber-100 flex justify-between items-start">
                <div>
                  <h4 className="text-2xl font-bold text-amber-900">{selectedTemplate.title}</h4>
                  <p className="text-amber-700/60 font-medium">Denne malen brukes som "oppskrift" for nye hendelser.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsRecurringModalOpen(true)}
                    className="p-3 bg-white rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-2 font-bold text-sm"
                  >
                    <Repeat size={18} /> Planlegg Serie
                  </button>
                  <button 
                    onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                    className="p-3 bg-white rounded-xl text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-8 space-y-10">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2">
                      <Clock size={18} className="text-indigo-500" />
                      Standard Kjøreplan
                    </h5>
                    <button 
                      onClick={() => setIsProgramModalOpen(true)}
                      className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} /> Ny Aktivitet
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {db.programItems
                      .filter(p => p.template_id === selectedTemplate.id)
                      .sort((a, b) => a.order - b.order)
                      .map((item, idx) => {
                        const role = db.roleDefinitions.find(r => r.id === item.role_id);
                        const group = db.groups.find(g => g.id === item.group_id);
                        return (
                          <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl group">
                            <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800">{item.title}</p>
                              <div className="flex gap-3 mt-0.5">
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Clock size={10} /> {item.duration_minutes} min
                                </span>
                                {role && (
                                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Shield size={10} /> {role.title}
                                  </span>
                                )}
                                {group && (
                                  <span className="text-[10px] text-teal-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Users size={10} /> {group.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => onDeleteProgramItem(item.id)}
                              className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    {db.programItems.filter(p => p.template_id === selectedTemplate.id).length === 0 && (
                      <p className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 border border-dashed rounded-2xl">Ingen aktiviteter definert i kjøreplanen.</p>
                    )}
                  </div>
                </section>

                <hr className="border-slate-100" />

                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2">
                      <Shield size={18} className="text-indigo-500" />
                      Standard Bemanning (Vaktliste)
                    </h5>
                    <p className="text-xs text-slate-400">Roller som alltid skal bemannes.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {db.assignments
                      .filter(a => a.template_id === selectedTemplate.id)
                      .map(assign => {
                        const role = db.roleDefinitions.find(r => r.id === assign.role_id);
                        return (
                          <div key={assign.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group">
                            <span className="font-semibold text-slate-700">{role?.title}</span>
                          </div>
                        );
                      })}
                  </div>
                </section>

                <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl flex gap-4">
                  <div className="mt-1"><Info size={20} className="text-amber-400" /></div>
                  <div className="text-sm">
                    <p className="font-bold text-white mb-1">Snapshot-logikk</p>
                    <p className="leading-relaxed">Endringer du gjør i malen vil <strong>ikke</strong> påvirke eksisterende hendelser i kalenderen. Kun nye hendelser vil arve dette oppsettet.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center bg-slate-100 border-2 border-dashed rounded-3xl text-slate-400">
              <p>Opprett eller velg en mal for å starte planleggingen.</p>
            </div>
          )}
        </main>
      </div>

      {isProgramModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProgramModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Ny Aktivitet</h3>
              <button onClick={() => setIsProgramModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddProgramItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tittel / Hva skjer?</label>
                <input autoFocus required type="text" value={progTitle} onChange={e => setProgTitle(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="f.eks. Åpning & Velkomst" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Varighet (minutter)</label>
                <input required type="number" min="1" value={progDuration} onChange={e => setProgDuration(parseInt(e.target.value) || 5)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Knytt til Rolle</label>
                  <select value={progRoleId} onChange={e => { setProgRoleId(e.target.value); if(e.target.value) setProgGroupId(''); }} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm">
                    <option value="">Ingen (Valgfritt)</option>
                    {db.roleDefinitions.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Knytt til Team</label>
                  <select value={progGroupId} onChange={e => { setProgGroupId(e.target.value); if(e.target.value) setProgRoleId(''); }} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm">
                    <option value="">Ingen (Valgfritt)</option>
                    {db.groups.filter(g => g.category === GroupCategory.SERVICE).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">Legg til i kjøreplan</button>
            </form>
          </div>
        </div>
      )}

      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsTemplateModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-6 bg-amber-500 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Ny Master-mal</h3>
              <button onClick={() => setIsTemplateModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Navn på mal</label>
                <input autoFocus required type="text" value={newTemplateTitle} onChange={e => setNewTemplateTitle(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all" placeholder="f.eks. Lovsangsmøte" />
              </div>
              <button type="submit" className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-lg hover:bg-amber-600 transition-all">Opprett Master</button>
            </form>
          </div>
        </div>
      )}

      {isRecurringModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm shadow-xl" onClick={() => setIsRecurringModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2"><Repeat size={20} /> Planlegg serie</h3>
              <button onClick={() => setIsRecurringModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handlePlanRecurring} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bruker mal:</p>
                <p className="text-sm font-bold text-slate-800">{selectedTemplate.title}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Startdato</label>
                <input required type="date" value={recStartDate} onChange={e => setRecStartDate(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Antall ganger</label>
                  <input required type="number" min="1" max="52" value={recCount} onChange={e => setRecCount(parseInt(e.target.value) || 1)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Intervall (dager)</label>
                  <input required type="number" min="1" value={recInterval} onChange={e => setRecInterval(parseInt(e.target.value) || 7)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">Start planlegging</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterMenu;
