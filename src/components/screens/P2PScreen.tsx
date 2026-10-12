import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Users, Link, Loader, Wifi, AlertCircle } from 'lucide-react';
import Peer, { type DataConnection } from 'peerjs';
import type { Screen } from '@/types/game';

interface Props {
  onNavigate: (screen: Screen) => void;
  onP2PStart: (code: string, isHost: boolean) => void;
}

export function P2PScreen({ onNavigate, onP2PStart }: Props) {
  const [mode, setMode] = useState<'menu' | 'host' | 'join'>('menu');
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [hostCode, setHostCode] = useState('');
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  const cleanup = useCallback(() => {
    if (connRef.current) { connRef.current.close(); connRef.current = null; }
    if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
  }, []);

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleHost = useCallback(() => {
    const code = generateCode();
    setHostCode(code);
    setStatus('connecting');
    setErrorMsg('');

    const peer = new Peer(`dlnaija-${code}`, { debug: 1 });
    peerRef.current = peer;

    peer.on('open', () => {
      setStatus('connecting');
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;
      conn.on('open', () => {
        setStatus('connected');
        // Wait a moment for handshake, then start match
        setTimeout(() => {
          onP2PStart(code, true);
        }, 500);
      });
      conn.on('error', (err) => {
        setStatus('error');
        setErrorMsg(err.message || 'Connection failed');
      });
    });

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        setErrorMsg('Code collision, try again');
        setHostCode('');
        setStatus('error');
      } else {
        setStatus('error');
        setErrorMsg(err.message || 'Failed to host');
      }
    });
  }, [onP2PStart]);

  const handleJoin = useCallback(() => {
    if (joinCode.length !== 6) {
      setStatus('error');
      setErrorMsg('Enter a 6-digit code');
      return;
    }
    setStatus('connecting');
    setErrorMsg('');

    const peer = new Peer({ debug: 1 });
    peerRef.current = peer;

    peer.on('open', () => {
      const conn = peer.connect(`dlnaija-${joinCode.toUpperCase()}`, { reliable: true });
      connRef.current = conn;

      conn.on('open', () => {
        setStatus('connected');
        setTimeout(() => {
          onP2PStart(joinCode.toUpperCase(), false);
        }, 500);
      });

      conn.on('error', (err) => {
        setStatus('error');
        setErrorMsg(err.message || 'Connection failed');
      });
    });

    peer.on('error', (err) => {
      setStatus('error');
      if (err.type === 'peer-unavailable') {
        setErrorMsg('No host found with that code');
      } else {
        setErrorMsg(err.message || 'Failed to connect');
      }
    });
  }, [joinCode, onP2PStart]);

  const handleBack = useCallback(() => {
    cleanup();
    setMode('menu');
    setStatus('idle');
    setErrorMsg('');
    setHostCode('');
    setJoinCode('');
  }, [cleanup]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <button onClick={() => { cleanup(); onNavigate('hub'); }} className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-black text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" /> Friendly Match
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {mode === 'menu' && (
          <div className="w-full max-w-sm space-y-3">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center mb-3">
                <Wifi className="w-10 h-10 text-cyan-400" />
              </div>
              <h2 className="text-xl font-black text-white">Play with a Friend</h2>
              <p className="text-sm text-slate-400 mt-1">Host a match and share your code, or join with a friend's code</p>
            </div>

            <button
              onClick={() => { setMode('host'); handleHost(); }}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-b from-cyan-600 to-cyan-800 text-white font-bold border border-white/10 shadow-lg active:scale-95 hover:brightness-110 transition"
            >
              <Link className="w-5 h-5" />
              HOST MATCH
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-b from-blue-600 to-blue-800 text-white font-bold border border-white/10 shadow-lg active:scale-95 hover:brightness-110 transition"
            >
              <Users className="w-5 h-5" />
              JOIN MATCH
            </button>
          </div>
        )}

        {mode === 'host' && (
          <div className="w-full max-w-sm text-center">
            <h2 className="text-lg font-bold text-white mb-2">Hosting Match</h2>

            {status === 'connecting' && (
              <>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-2xl bg-cyan-600/20 border-2 border-cyan-500/40 flex items-center justify-center">
                    <Loader className="w-10 h-10 text-cyan-400 animate-spin" />
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-3">Share this code with your friend:</p>
                <div className="bg-slate-800 rounded-2xl border-2 border-cyan-500/40 py-4 px-6 mb-4">
                  <span className="text-4xl font-black text-cyan-400 tracking-[0.3em]">{hostCode || '......'}</span>
                </div>
                <p className="text-xs text-slate-500">Waiting for opponent to connect...</p>
              </>
            )}

            {status === 'connected' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600/20 border-2 border-emerald-500/40 flex items-center justify-center mb-3">
                  <Wifi className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-emerald-400 font-bold">Friend connected!</p>
                <p className="text-xs text-slate-400 mt-1">Starting match...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-400 text-sm font-semibold mb-3">{errorMsg}</p>
                <button onClick={handleBack} className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-bold text-sm hover:bg-slate-600 transition">Back</button>
              </div>
            )}

            {status === 'connecting' && (
              <button onClick={handleBack} className="text-sm text-slate-500 hover:text-white transition mt-4">Cancel</button>
            )}
          </div>
        )}

        {mode === 'join' && (
          <div className="w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-4 text-center">Join Match</h2>

            {status === 'idle' && (
              <>
                <label className="text-xs text-slate-400 font-semibold mb-2 block text-center">ENTER 6-DIGIT CODE</label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="ABC123"
                  className="w-full bg-slate-800 text-white text-3xl font-black tracking-[0.3em] text-center rounded-2xl py-4 outline-none border-2 border-slate-700 focus:border-cyan-500 transition mb-4"
                  autoFocus
                />
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length !== 6}
                  className="w-full py-4 rounded-2xl bg-gradient-to-b from-cyan-600 to-cyan-800 text-white font-bold border border-white/10 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  CONNECT
                </button>
                <button onClick={handleBack} className="w-full text-sm text-slate-500 hover:text-white transition mt-3">Back</button>
              </>
            )}

            {status === 'connecting' && (
              <div className="text-center py-8">
                <Loader className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Connecting to host...</p>
                <button onClick={handleBack} className="text-sm text-slate-500 hover:text-white transition mt-4">Cancel</button>
              </div>
            )}

            {status === 'connected' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600/20 border-2 border-emerald-500/40 flex items-center justify-center mb-3">
                  <Wifi className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-emerald-400 font-bold">Connected to host!</p>
                <p className="text-xs text-slate-400 mt-1">Starting match...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-400 text-sm font-semibold mb-3">{errorMsg}</p>
                <button onClick={() => { setStatus('idle'); setErrorMsg(''); }} className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-bold text-sm hover:bg-slate-600 transition">Try Again</button>
                <button onClick={handleBack} className="w-full text-sm text-slate-500 hover:text-white transition mt-3">Back</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function createPeerConnection(code: string, isHost: boolean): { peer: Peer; conn: Promise<DataConnection> } {
  const peer = isHost
    ? new Peer(`dlnaija-${code}`, { debug: 1 })
    : new Peer({ debug: 1 });

  const conn = new Promise<DataConnection>((resolve, reject) => {
    if (isHost) {
      peer.on('connection', (c) => resolve(c));
      peer.on('error', reject);
    } else {
      peer.on('open', () => {
        const c = peer.connect(`dlnaija-${code}`, { reliable: true });
        c.on('open', () => resolve(c));
        c.on('error', reject);
      });
      peer.on('error', reject);
    }
  });

  return { peer, conn };
}
