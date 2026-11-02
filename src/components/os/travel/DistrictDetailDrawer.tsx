'use client';

import React, { useState } from 'react';
import type { DistrictTravelData, DistrictTravelStatus, TravelMemory } from '@/types/travel.types';
import {
  X,
  Calendar,
  Sparkles,
  Star,
  Plus,
  Trash2,
  Car,
  Train,
  Plane,
  Bike,
  Ship,
  MapPin,
} from 'lucide-react';

interface DistrictDetailDrawerProps {
  district: DistrictTravelData | null;
  onClose: () => void;
  mode: 'admin' | 'public';
  onUpdateStatus?: (code: string, status: DistrictTravelStatus) => Promise<void>;
  onUpdateDistrict?: (code: string, updates: Partial<DistrictTravelData>) => Promise<void>;
  onAddMemory?: (code: string, memory: Omit<TravelMemory, 'id'>) => Promise<void>;
  onDeleteMemory?: (code: string, memoryId: string) => Promise<void>;
}

export const DistrictDetailDrawer: React.FC<DistrictDetailDrawerProps> = ({
  district,
  onClose,
  mode,
  onUpdateStatus,
  onUpdateDistrict,
  onAddMemory,
  onDeleteMemory,
}) => {
  // New memory form state
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [memTitle, setMemTitle] = useState('');
  const [memDate, setMemDate] = useState(new Date().toISOString().split('T')[0]);
  const [memTransport, setMemTransport] = useState('Train');
  const [memRating, setMemRating] = useState<number>(5);
  const [memNotes, setMemNotes] = useState('');
  const [isSubmittingMemory, setIsSubmittingMemory] = useState(false);

  // Edit district notes state
  const [notesInput, setNotesInput] = useState(district?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);

  // Key Places / Attractions state
  const [newPlaceInput, setNewPlaceInput] = useState('');
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  if (!district) return null;

  const handleAddPlace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPlaceInput.trim();
    if (!trimmed || !onUpdateDistrict) return;
    setIsAddingPlace(true);
    try {
      const currentPlaces = district.places || [];
      if (!currentPlaces.includes(trimmed)) {
        await onUpdateDistrict(district.code, { places: [...currentPlaces, trimmed] });
      }
      setNewPlaceInput('');
    } finally {
      setIsAddingPlace(false);
    }
  };

  const handleRemovePlace = async (placeToRemove: string) => {
    if (!onUpdateDistrict) return;
    const currentPlaces = district.places || [];
    const updated = currentPlaces.filter((p) => p !== placeToRemove);
    await onUpdateDistrict(district.code, { places: updated });
  };

  const handleStatusChange = async (newStatus: DistrictTravelStatus) => {
    if (onUpdateStatus) {
      await onUpdateStatus(district.code, newStatus);
    }
  };

  const handleVisitsCountDelta = async (delta: number) => {
    if (onUpdateDistrict) {
      const nextCount = Math.max(0, (district.visitsCount || 0) + delta);
      await onUpdateDistrict(district.code, { visitsCount: nextCount });
    }
  };

  const handleRatingChange = async (rating: number) => {
    if (onUpdateDistrict) {
      await onUpdateDistrict(district.code, { rating });
    }
  };

  const handleSaveNotes = async () => {
    if (!onUpdateDistrict) return;
    setIsSavingNotes(true);
    try {
      await onUpdateDistrict(district.code, { notes: notesInput.trim() });
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 2500);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCreateMemorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memTitle.trim() || !onAddMemory) return;

    setIsSubmittingMemory(true);
    try {
      await onAddMemory(district.code, {
        title: memTitle.trim(),
        date: memDate,
        transport: memTransport,
        rating: memRating,
        notes: memNotes.trim(),
      });
      setMemTitle('');
      setMemNotes('');
      setIsAddingMemory(false);
    } finally {
      setIsSubmittingMemory(false);
    }
  };

  const getTransportIcon = (trans?: string) => {
    const t = (trans || '').toLowerCase();
    if (t.includes('plane') || t.includes('air') || t.includes('flight')) return <Plane className="size-3.5" />;
    if (t.includes('train') || t.includes('rail')) return <Train className="size-3.5" />;
    if (t.includes('bike') || t.includes('cycle') || t.includes('motorcycle')) return <Bike className="size-3.5" />;
    if (t.includes('boat') || t.includes('launch') || t.includes('ferry') || t.includes('ship')) return <Ship className="size-3.5" />;
    return <Car className="size-3.5" />;
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/95 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl flex flex-col space-y-5 text-white max-h-[820px] overflow-y-auto [scrollbar-width:thin] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {/* Header with Title & Close button */}
      <div className="flex items-start justify-between pb-3.5 border-b border-white/10 gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">{district.name}</h3>
            <span className="text-base font-serif text-emerald-400 font-bold">({district.bnName})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-white/60">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 font-semibold capitalize text-emerald-300">
              {district.division} Division
            </span>
            <span>•</span>
            <span className="font-mono text-[11px] text-white/40">{district.code.toUpperCase()}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer transition-colors shrink-0"
          title="Close details"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* ADMIN CONTROLS: Status Picker */}
      {mode === 'admin' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/80 block">Travel Status</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'not_visited', label: 'Unexplored', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
                { id: 'planned', label: 'Wishlist / Planned', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                { id: 'visited', label: 'Visited', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                { id: 'revisit_planned', label: 'Revisit Planned', color: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
              ].map((s) => {
                const isActive = district.status === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStatusChange(s.id as DistrictTravelStatus)}
                    className={`h-9 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center text-center ${
                      isActive
                        ? `${s.color} border-current shadow-md shadow-emerald-500/15 ring-1 ring-current scale-[1.01]`
                        : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visits Counter & Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
            {/* Visits Counter */}
            <div>
              <span className="text-[11px] font-bold text-white/70 block mb-1.5">Visits Count</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleVisitsCountDelta(-1)}
                  className="size-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold grid place-items-center cursor-pointer text-sm"
                >
                  -
                </button>
                <span className="font-mono font-bold text-base px-3">{district.visitsCount || 0}</span>
                <button
                  type="button"
                  onClick={() => handleVisitsCountDelta(1)}
                  className="size-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold grid place-items-center cursor-pointer text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Rating Stars */}
            <div>
              <span className="text-[11px] font-bold text-white/70 block mb-1.5">District Rating</span>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`size-4.5 ${
                        (district.rating || 0) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-zinc-600 hover:text-amber-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Key Places & Attractions Tag Manager */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                <MapPin className="size-3.5 text-emerald-400" />
                <span>Places & Attractions ({district.places?.length || 0})</span>
              </label>
            </div>

            {/* Existing Places Pills */}
            <div className="flex flex-wrap gap-1.5">
              {district.places && district.places.length > 0 ? (
                district.places.map((place) => (
                  <span
                    key={place}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
                  >
                    <span>{place}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlace(place)}
                      className="size-3.5 rounded-full hover:bg-emerald-500/30 text-emerald-400 grid place-items-center cursor-pointer transition-colors"
                      title="Remove place"
                    >
                      <X className="size-2.5" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-white/40 italic">
                  No specific places added yet. Add one below!
                </span>
              )}
            </div>

            {/* Quick Add Place Input */}
            <form onSubmit={handleAddPlace} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newPlaceInput}
                onChange={(e) => setNewPlaceInput(e.target.value)}
                placeholder="e.g. Inani Beach, Lalbagh Fort, Ratargul..."
                className="flex-1 h-8 px-3 rounded-xl border border-white/10 bg-black/40 text-xs text-white placeholder:text-white/30 outline-hidden focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={isAddingPlace || !newPlaceInput.trim()}
                className="h-8 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1 disabled:opacity-40 cursor-pointer transition-all"
              >
                <Plus className="size-3" />
                <span>Add Place</span>
              </button>
            </form>
          </div>

          {/* Notes Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/80">Personal Travel Notes</label>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                {notesSavedSuccess ? '✓ Saved!' : isSavingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="e.g. Best local food, road condition, hotel recommendations, scenic spots..."
              rows={3}
              className="w-full p-3 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder:text-white/30 outline-hidden focus:border-emerald-500/50 leading-relaxed font-sans"
            />
          </div>
        </div>
      ) : (
        /* PUBLIC VIEW SUMMARY */
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80">Status</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                district.status === 'visited'
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                  : district.status === 'planned'
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                  : district.status === 'revisit_planned'
                  ? 'bg-violet-500/20 border-violet-500/30 text-violet-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              {district.status === 'visited'
                ? `✓ Visited (${district.visitsCount || 1} Trips)`
                : district.status === 'planned'
                ? '⭐ Wishlist Destination'
                : district.status === 'revisit_planned'
                ? '🔁 Revisit Planned'
                : 'Not Visited Yet'}
            </span>
          </div>

          {district.rating && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-white/60">Rating:</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`size-3.5 ${
                      district.rating! >= star ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {district.places && district.places.length > 0 && (
            <div className="space-y-1.5 border-t border-white/5 pt-2">
              <span className="text-[11px] font-bold text-white/60 flex items-center gap-1">
                <MapPin className="size-3 text-emerald-400" />
                <span>Key Places & Spots:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {district.places.map((place) => (
                  <span
                    key={place}
                    className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs text-emerald-300/90 font-medium"
                  >
                    {place}
                  </span>
                ))}
              </div>
            </div>
          )}

          {district.notes && (
            <p className="text-xs text-white/80 leading-relaxed border-t border-white/5 pt-2 italic">
              &ldquo;{district.notes}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* TRIP MEMORIES SECTION */}
      <div className="space-y-3 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-emerald-400" />
            <span>Trip Memories ({district.memories?.length || 0})</span>
          </h4>

          {mode === 'admin' && (
            <button
              type="button"
              onClick={() => setIsAddingMemory(!isAddingMemory)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>{isAddingMemory ? 'Cancel' : 'Add Trip'}</span>
            </button>
          )}
        </div>

        {/* Add Memory Form (Admin Only) */}
        {mode === 'admin' && isAddingMemory && (
          <form
            onSubmit={handleCreateMemorySubmit}
            className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3"
          >
            <span className="text-xs font-bold text-emerald-300 block">Log a Visit to {district.name}</span>

            <div>
              <label className="text-[11px] text-white/70 block mb-1">Trip / Experience Title *</label>
              <input
                type="text"
                value={memTitle}
                onChange={(e) => setMemTitle(e.target.value)}
                placeholder="e.g. Inani Sunset & Marine Drive Cruise"
                className="w-full h-8 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white outline-hidden focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-white/70 block mb-1">Visit Date</label>
                <input
                  type="date"
                  value={memDate}
                  onChange={(e) => setMemDate(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-white/70 block mb-1">Transport</label>
                <select
                  value={memTransport}
                  onChange={(e) => setMemTransport(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-white/10 bg-zinc-900 text-xs text-white outline-hidden focus:border-emerald-500"
                >
                  <option value="Train">Train</option>
                  <option value="Car / Jeep">Car / Jeep</option>
                  <option value="Bus">Bus</option>
                  <option value="Flight / Air">Flight / Air</option>
                  <option value="Bike / Motorcycle">Bike / Motorcycle</option>
                  <option value="Boat / Launch">Boat / Launch</option>
                  <option value="Walking / Trekking">Walking / Trekking</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-white/70 block mb-1">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setMemRating(star)}
                    className="p-0.5 cursor-pointer"
                  >
                    <Star
                      className={`size-4 ${
                        memRating >= star ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-white/70 block mb-1">Highlights & Notes</label>
              <textarea
                value={memNotes}
                onChange={(e) => setMemNotes(e.target.value)}
                placeholder="What was remarkable about this visit? (Places seen, local cuisine, stories...)"
                rows={2}
                className="w-full p-2.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white outline-hidden focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingMemory || !memTitle.trim()}
              className="w-full h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
            >
              <Plus className="size-3.5" />
              <span>{isSubmittingMemory ? 'Saving...' : 'Save Trip to Journey'}</span>
            </button>
          </form>
        )}

        {/* List of Trip Memories */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {district.memories && district.memories.length > 0 ? (
            district.memories.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-all space-y-1.5 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-bold text-white">{m.title}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-white/50 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-emerald-400" />
                        <span>{m.date}</span>
                      </span>
                      {m.transport && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-cyan-300">
                            {getTransportIcon(m.transport)}
                            <span>{m.transport}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {mode === 'admin' && onDeleteMemory && (
                    <button
                      type="button"
                      onClick={() => onDeleteMemory(district.code, m.id)}
                      className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 p-1 cursor-pointer transition-opacity"
                      title="Delete memory"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>

                {m.notes && <p className="text-[11px] text-white/70 leading-relaxed">{m.notes}</p>}
              </div>
            ))
          ) : (
            <p className="text-xs text-white/40 italic py-2">
              {mode === 'admin'
                ? 'No trip memories logged yet for this district. Click "Add Trip" above!'
                : 'No detailed memories logged yet for this district.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
