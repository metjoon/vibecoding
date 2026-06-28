import React, { useState, useEffect } from 'react';
import { differenceInDays, differenceInYears, differenceInMonths, differenceInWeeks, addYears, format, isBefore } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import './index.css';

function App() {
  const [name, setName] = useState('Guest');
  const [birthDate, setBirthDate] = useState('1995-01-01');
  const [lifespan, setLifespan] = useState(85);
  const [events, setEvents] = useState([]);
  
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ date: '', memo: '', type: 'memory' });

  // Load from local storage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('lc_name');
    const savedBirthDate = localStorage.getItem('lc_birthDate');
    const savedLifespan = localStorage.getItem('lc_lifespan');
    const savedEvents = localStorage.getItem('lc_events');

    if (savedName !== null) setName(savedName);
    if (savedBirthDate) setBirthDate(savedBirthDate);
    if (savedLifespan) setLifespan(Number(savedLifespan));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
  }, []);

  // Save to local storage when state changes
  useEffect(() => {
    localStorage.setItem('lc_name', name);
    localStorage.setItem('lc_birthDate', birthDate);
    localStorage.setItem('lc_lifespan', lifespan.toString());
    localStorage.setItem('lc_events', JSON.stringify(events));
  }, [name, birthDate, lifespan, events]);

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.date || !newEvent.memo) return;
    
    setEvents([...events, { id: Date.now(), ...newEvent }]);
    setShowEventModal(false);
    setNewEvent({ date: '', memo: '', type: 'memory' });
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(ev => ev.id !== id));
  };

  // Calculations
  const today = new Date();
  const birth = new Date(birthDate);
  const expectedDeath = addYears(birth, lifespan);
  
  const totalDays = differenceInDays(expectedDeath, birth);
  const daysLived = differenceInDays(today, birth);
  const daysRemaining = Math.max(0, totalDays - daysLived);
  
  const yearsRemaining = Math.max(0, differenceInYears(expectedDeath, today));
  const monthsRemaining = Math.max(0, differenceInMonths(expectedDeath, today));
  const weekendsRemaining = Math.max(0, differenceInWeeks(expectedDeath, today));
  
  const progressPercent = Math.min(100, Math.max(0, (daysLived / totalDays) * 100));
  const currentAge = (daysLived / 365.25).toFixed(1);

  const getPositionPercent = (dateStr) => {
    const eventDate = new Date(dateStr);
    const eventDays = differenceInDays(eventDate, birth);
    return Math.min(100, Math.max(0, (eventDays / totalDays) * 100));
  };

  return (
    <>
      <header className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {name ? `${name}'s Life Counter` : 'Life Counter'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Visualize your journey.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              style={{ width: '120px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Birth Date</label>
            <input 
              type="date" 
              className="input-field" 
              value={birthDate} 
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Expected Lifespan</label>
            <input 
              type="number" 
              className="input-field" 
              value={lifespan}
              min="1"
              max="150"
              onChange={(e) => setLifespan(Number(e.target.value))}
              style={{ width: '100px' }}
            />
          </div>
        </div>
      </header>

      <main className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Current Age</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-color)' }}>{currentAge}</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Days Lived</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{daysLived.toLocaleString()}</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Time Remaining</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {daysRemaining.toLocaleString()} <span style={{fontSize: '1rem', fontWeight: 400}}>days</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <span>{yearsRemaining.toLocaleString()} years</span>
              <span>•</span>
              <span>{monthsRemaining.toLocaleString()} months</span>
              <span>•</span>
              <span>{weekendsRemaining.toLocaleString()} weekends</span>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Progress</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {Math.round(progressPercent)}% 
              <span style={{fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '8px'}}>(Remaining: {100 - Math.round(progressPercent)}%)</span>
            </div>
          </div>

        </div>

        <div style={{ position: 'relative', marginTop: '40px', marginBottom: '20px' }}>
          
          {/* Main Life Bar */}
          <div style={{ 
            height: '24px', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '12px', 
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <div style={{ 
              height: '100%', 
              width: `${progressPercent}%`, 
              background: 'var(--accent-gradient)',
              borderRadius: '12px',
              transition: 'width 0.5s ease-out'
            }} />
          </div>

          {/* Current Position Marker */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            bottom: '-10px',
            left: `${progressPercent}%`,
            width: '4px',
            background: '#fff',
            borderRadius: '2px',
            boxShadow: '0 0 10px rgba(255,255,255,0.8)',
            transform: 'translateX(-50%)',
            zIndex: 10
          }}>
            <div style={{
              position: 'absolute',
              top: '-35px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fff',
              color: '#000',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              textAlign: 'center',
              lineHeight: 1.2
            }}>
              <div>TODAY</div>
              <div style={{ fontWeight: 500, marginTop: '2px' }}>{format(today, 'MMM d, yyyy')}</div>
            </div>
          </div>

          {/* Birth Date Marker */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            bottom: '-10px',
            left: '0%',
            width: '4px',
            background: 'var(--text-secondary)',
            borderRadius: '2px',
            transform: 'translateX(-50%)',
            zIndex: 10
          }}>
            <div style={{
              position: 'absolute',
              top: '-35px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--text-secondary)',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              textAlign: 'center',
              lineHeight: 1.2
            }}>
              <div>START</div>
              <div style={{ fontWeight: 400, marginTop: '2px' }}>{format(birth, 'MMM d, yyyy')}</div>
            </div>
          </div>

          {/* Event Markers */}
          {events.map(ev => {
            const pos = getPositionPercent(ev.date);
            const isPast = isBefore(new Date(ev.date), today);
            
            return (
              <div 
                key={ev.id} 
                className="event-marker"
                title={`${ev.date}: ${ev.memo}`}
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: `${pos}%`,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: isPast ? 'var(--text-secondary)' : 'var(--success)',
                  border: '2px solid var(--bg-color)',
                  transform: 'translateX(-50%)',
                  cursor: 'pointer',
                  zIndex: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Milestones & Events</h2>
          <button className="btn" onClick={() => setShowEventModal(true)}>
            <Plus size={18} /> Add Event
          </button>
        </div>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No events added yet. Add important memories or future goals!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.sort((a, b) => new Date(a.date) - new Date(b.date)).map(ev => (
              <div key={ev.id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isBefore(new Date(ev.date), today) ? 'var(--text-secondary)' : 'var(--success)' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{ev.memo}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{format(new Date(ev.date), 'MMMM d, yyyy')}</div>
                  </div>
                </div>
                <button onClick={() => deleteEvent(ev.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7 }}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

      </main>

      {showEventModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 
        }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Add Event</h2>
            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input 
                  type="date" 
                  required
                  className="input-field" 
                  value={newEvent.date} 
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Memo / Goal</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Graduated, Bought a house..."
                  className="input-field" 
                  value={newEvent.memo} 
                  onChange={(e) => setNewEvent({...newEvent, memo: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>Save</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEventModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
