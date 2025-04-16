import React from 'react';
import 'arwes';

// Example identities (could be moved to a config/data file)
export interface RunnerIdentity {
  id: string;
  name: string;
  faction: string;
  description: string;
  ability?: string;
}

const RUNNER_IDENTITIES: RunnerIdentity[] = [
  // Noise is disabled for now
  // {
  //   id: 'noise',
  //   name: 'Noise',
  //   faction: 'Anarch',
  //   description: 'Virus specialist. Gains bonuses for trashing cards and playing viruses.',
  //   ability: 'Whenever you trash a card, gain 1 credit.'
  // },
  {
    id: 'mr_santiago',
    name: 'Mr. Santiago',
    faction: 'Criminal',
    description: 'Stealthy infiltrator. Gains credits on first successful run each turn.',
    ability: 'Whenever you successfully overcome an entity at a location, gain 2 credits.'
  },
  {
    id: 'alice',
    name: 'Alice McCaffrey',
    faction: 'Shaper',
    description: 'Efficient builder. Installs programs and hardware at a discount.',
    ability: 'The first time each turn you add a program or hardware to execution, reduce its cost by 1.'
  },
  {
    id: 'crash',
    name: 'Crash',
    faction: 'Anarch',
    description: 'Aggressive disruptor. Excels at sabotaging enemy actions with viruses.',
    ability: 'Whenever you successfully execute a Virus, reduce the action potential of 1 entity by 1.'
  }
];

interface IdentitySelectionModalProps {
  isOpen: boolean;
  onSelect: (identity: RunnerIdentity) => void;
  onClose: () => void;
}

const IdentitySelectionModal: React.FC<IdentitySelectionModalProps> = ({ isOpen, onSelect, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(10,10,30,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" style={{ minWidth: 420, maxWidth: 700, borderRadius: 16, padding: 32, background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)', boxShadow: '0 8px 32px #000b', border: '2px solid #00ffe7', position: 'relative', fontFamily: 'Orbitron, arwes, monospace' }}>
        <h2 style={{ color: '#00ffe7', marginBottom: 24, letterSpacing: 3, textAlign: 'center', fontSize: 32, fontWeight: 700 }}>Select Your Runner Identity</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {RUNNER_IDENTITIES.map(identity => (
            <li key={identity.id} style={{ marginBottom: 28, padding: 20, borderRadius: 12, background: '#17233a', boxShadow: '0 2px 8px #000a', border: '1.5px solid #00ffe7', transition: 'transform 0.1s', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#00ffe7', letterSpacing: 2 }}>{identity.name}</span>
              <span style={{ fontSize: 16, color: '#a0e9ff', marginBottom: 6 }}>{identity.faction}</span>
              <div style={{ color: '#fff', marginBottom: 4 }}>{identity.description}</div>
              {identity.ability && <div style={{ color: '#ffe066', fontWeight: 500, marginBottom: 8 }}><strong>Ability:</strong> {identity.ability}</div>}
              <button onClick={() => onSelect(identity)} style={{ marginTop: 6, padding: '8px 18px', background: 'none', border: '2px solid #00ffe7', color: '#00ffe7', borderRadius: 8, fontWeight: 700, fontSize: 16, letterSpacing: 1, cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}>Select</button>
              <div style={{ position: 'absolute', top: 10, right: 20, fontSize: 18, color: '#ffe066', fontWeight: 500 }}>{identity.faction === 'Criminal' ? '🟦' : identity.faction === 'Anarch' ? '🟥' : '🟩'}</div>
            </li>
          ))}
        </ul>
        <button onClick={onClose} style={{ marginTop: 18, padding: '10px 28px', background: 'none', border: '2px solid #00ffe7', color: '#00ffe7', borderRadius: 8, fontWeight: 700, fontSize: 18, letterSpacing: 1, cursor: 'pointer', width: '100%' }}>Cancel</button>
      </div>
    </div>
  );
};

export default IdentitySelectionModal;
