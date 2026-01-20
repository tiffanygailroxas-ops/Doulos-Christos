
import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Calendar, 
  Users, 
  History, 
  ShieldCheck, 
  Sparkles,
  Info,
  X,
  ArrowDownCircle,
  Clock,
  Copy,
  CheckCircle2,
  Wallet,
  Zap,
  Trophy
} from 'lucide-react';
import { 
  UserStats, 
  Transaction, 
  Reflection 
} from './types';
import { 
  BIBLE_VERSES, 
  STREAK_REWARDS, 
  MAX_INVITES, 
  INVITE_REWARD, 
  CLAIM_REWARD, 
  WALLET_ADDRESS,
  LOGO_URL
} from './constants';
import { generateReflection } from './services/geminiService';

const Logo = ({ className, glow = true }: { className?: string, glow?: boolean }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <img 
      src={LOGO_URL} 
      alt="Doulos Christos Logo" 
      className={`w-full h-full object-contain rounded-full select-none pointer-events-none ${glow ? 'coin-glow' : ''}`}
      onError={(e) => {
        // Fallback to a simple representation if Drive link fails
        e.currentTarget.src = "https://img.icons8.com/ios-filled/200/00f2ff/holy-bible.png";
      }}
    />
  </div>
);

const App: React.FC = () => {
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('dscs_stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.id) parsed.id = Math.random().toString(36).substring(2, 10).toUpperCase();
      return parsed;
    }
    return {
      id: Math.random().toString(36).substring(2, 10).toUpperCase(),
      balance: 0,
      streak: 0,
      lastClaimDate: null,
      totalInvites: 0,
      isVerified: false
    };
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('dscs_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [activeReflection, setActiveReflection] = useState<Reflection | null>(null);
  const [timer, setTimer] = useState(0); 
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [nextClaimCountdown, setNextClaimCountdown] = useState<string>('');
  const [canClaimNow, setCanClaimNow] = useState<boolean>(false);

  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const STREAK_RESET_MS = 24 * 60 * 60 * 1000; 

  useEffect(() => {
    localStorage.setItem('dscs_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('dscs_history', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    const updateCountdown = () => {
      if (!stats.lastClaimDate) {
        setCanClaimNow(true);
        setNextClaimCountdown('');
        return;
      }

      const now = Date.now();
      const timeSinceLast = now - stats.lastClaimDate;
      const timeLeft = COOLDOWN_MS - timeSinceLast;

      if (timeLeft <= 0) {
        setCanClaimNow(true);
        setNextClaimCountdown('');
      } else {
        setCanClaimNow(false);
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        setNextClaimCountdown(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [stats.lastClaimDate]);

  const handleVerify = () => {
    setStats(prev => ({ ...prev, isVerified: true }));
  };

  const startClaim = async () => {
    if (!stats.isVerified || !canClaimNow) return;
    
    setLoadingReflection(true);
    setModalOpen(true);
    setTimer(10);

    const randomVerse = BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)];
    const reflectionText = await generateReflection(randomVerse);
    
    setActiveReflection({
      verse: randomVerse,
      thought: reflectionText
    });
    setLoadingReflection(false);
  };

  useEffect(() => {
    let interval: any;
    if (modalOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [modalOpen, timer]);

  const finalizeClaim = () => {
    setClaiming(true);
    setTimeout(() => {
      const now = Date.now();
      let newStreak;
      
      if (!stats.lastClaimDate || (now - stats.lastClaimDate) < (COOLDOWN_MS + STREAK_RESET_MS)) {
          newStreak = stats.streak + 1;
      } else {
          newStreak = 1;
      }

      let bonus = 0;
      let finalStreakToSave = newStreak;

      if (newStreak === 30) {
        bonus = STREAK_REWARDS[30];
        finalStreakToSave = 1;
      }

      const newTx: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'CLAIM',
        amount: CLAIM_REWARD,
        timestamp: now,
        details: `Daily Claim Reward (Day ${newStreak})`
      };

      const historyUpdates = [newTx];
      if (bonus > 0) {
        historyUpdates.push({
          id: Math.random().toString(36).substr(2, 9),
          type: 'STREAK_BONUS',
          amount: bonus,
          timestamp: now,
          details: `30-Day Master Blessing (+30 $DSCS)`
        });
      }

      setTransactions(prev => [...historyUpdates, ...prev]);
      setStats(prev => ({
        ...prev,
        balance: prev.balance + CLAIM_REWARD + bonus,
        streak: finalStreakToSave,
        lastClaimDate: now
      }));

      setClaiming(false);
      setModalOpen(false);
    }, 1500);
  };

  const copyReferral = () => {
    const link = `${window.location.origin}/?ref=${stats.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = () => {
    if (stats.balance < 1) {
      alert("Minimum transfer is 1 $DSCS");
      return;
    }
    const amount = stats.balance;
    const now = Date.now();
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'CLAIM', 
      amount: -amount,
      timestamp: now,
      details: `Withdrawal to Wallet`
    };
    setTransactions(prev => [newTx, ...prev]);
    setStats(prev => ({ ...prev, balance: 0 }));
    alert(`Withdrawal of ${amount} $DSCS initiated to ${WALLET_ADDRESS}`);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden pb-40 sm:pb-32">
      {/* Header */}
      <header className="bg-slate-950/90 border-b border-cyan-500/20 px-4 py-4 sm:p-6 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border border-cyan-500/30 flex items-center justify-center p-0 overflow-hidden neon-border">
              <Logo className="w-full h-full" glow={false} />
            </div>
            <div>
              <h1 className="metal-cyan-glow font-bold tracking-[0.1em] sm:tracking-[0.2em] text-sm sm:text-xl uppercase font-serif">Doulos Christos</h1>
              <p className="text-[8px] sm:text-[10px] text-cyan-500/50 font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase">Servants of Christ</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1 sm:gap-2 bg-slate-900/40 hover:bg-slate-800 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-cyan-500/20 transition-all text-[10px] sm:text-xs font-black text-cyan-400 uppercase tracking-widest"
            >
              <History size={14} className="sm:w-4 sm:h-4" /> <span className="hidden xs:inline">History</span>
            </button>
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-950 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-2xl border border-cyan-500/20 shadow-[inset_0_0_15px_rgba(0,242,255,0.05)]">
              <Zap className="text-cyan-400 w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              <span className="font-black text-sm sm:text-lg text-slate-100 whitespace-nowrap">{stats.balance.toLocaleString()} <span className="text-[10px] sm:text-xs text-cyan-400 tracking-tighter">$DSCS</span></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6 sm:space-y-10 flex-grow">
        
        {/* Verification Alert */}
        {!stats.isVerified && (
          <div className="neon-card p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10">
            <div className="space-y-3 sm:space-y-4 text-center md:text-left">
              <h2 className="text-lg sm:text-2xl font-black flex items-center justify-center md:justify-start gap-3 sm:gap-4 text-slate-100">
                <ShieldCheck className="text-cyan-400" size={24} /> VERIFICATION REQUIRED
              </h2>
              <p className="text-slate-400 max-w-xl text-xs sm:text-sm leading-relaxed uppercase tracking-wide font-medium">
                The treasury is reserved for verified humans. Link your World ID to authorize $DSCS distributions to your vault.
              </p>
            </div>
            <button 
              onClick={handleVerify}
              className="w-full md:w-auto whitespace-nowrap px-8 sm:px-12 py-4 sm:py-5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl sm:rounded-2xl transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(0,242,255,0.4)] tracking-widest text-xs sm:text-sm"
            >
              VERIFY NOW
            </button>
          </div>
        )}

        {/* 1. DAILY CLAIM AREA */}
        <div className="neon-card rounded-[2rem] sm:rounded-[3.5rem] p-8 sm:p-16 flex flex-col items-center justify-center text-center space-y-8 sm:space-y-10 relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none opacity-50"></div>
          
          <div className="relative">
            <div className="w-40 h-40 sm:w-72 sm:h-72 rounded-full border-2 border-cyan-500/30 flex items-center justify-center p-0 bg-slate-950/30 animate-pulse-cyan">
              <Logo className="w-full h-full transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-slate-950 border border-cyan-500/40 p-2 sm:p-3 rounded-full shadow-2xl">
              <Sparkles className="text-cyan-400" size={18} />
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-2xl sm:text-5xl font-serif font-bold text-slate-100 uppercase tracking-[0.1em] sm:tracking-[0.2em] metal-cyan-glow">Daily Blessing</h3>
            <p className="text-[9px] sm:text-[11px] text-cyan-400/70 font-black uppercase tracking-[0.3em] sm:tracking-[0.5em]">Collect your daily transmission</p>
          </div>

          <div className="w-full max-w-lg space-y-6 sm:space-y-8">
            <button 
              onClick={startClaim}
              disabled={!stats.isVerified || !canClaimNow}
              className={`w-full py-5 sm:py-8 rounded-xl sm:rounded-[2rem] font-black text-xl sm:text-3xl tracking-[0.4em] sm:tracking-[0.6em] transition-all transform active:scale-95 border-2 ${
                !stats.isVerified || !canClaimNow
                ? 'bg-slate-900/30 text-slate-700 cursor-not-allowed border-slate-800'
                : 'bg-cyan-500 text-slate-950 hover:bg-transparent hover:text-cyan-400 border-cyan-500 shadow-[0_0_40px_rgba(0,242,255,0.2)]'
              }`}
            >
              {canClaimNow ? 'CLAIM' : 'LOCKED'}
            </button>
            
            {!canClaimNow && stats.lastClaimDate && (
              <div className="flex flex-col items-center gap-3 sm:gap-4">
                <div className="text-2xl sm:text-4xl font-mono text-cyan-400 font-bold tracking-[0.2em] sm:tracking-[0.3em] bg-slate-950/50 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border border-cyan-500/20 shadow-inner">
                  {nextClaimCountdown}
                </div>
                <div className="flex items-center gap-2 text-slate-500 uppercase font-black text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.4em]">
                  <Clock size={10} /> Syncing Protocol
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. STATS & MISSIONARY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
          
          <div className="neon-card rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 space-y-6 sm:space-y-8">
            <div className="flex justify-between items-center gap-4">
              <h3 className="text-[9px] sm:text-[11px] font-black text-cyan-500/60 uppercase tracking-[0.2em] sm:tracking-[0.4em] flex items-center gap-2 sm:gap-3">
                <Calendar size={14} /> Stewardship
              </h3>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs font-black text-slate-100 uppercase tracking-widest whitespace-nowrap">
                <Trophy size={12} className="text-cyan-400" /> Goal: 30 Days
              </div>
            </div>
            
            <div className="bg-slate-950/40 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-cyan-500/10 shadow-inner">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="space-y-1">
                  <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Streak</span>
                  <div className="text-4xl sm:text-6xl font-black text-slate-100 font-serif metal-cyan-glow">
                    {stats.streak} <span className="text-xs sm:text-sm uppercase font-bold text-slate-700">Days</span>
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                   <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-cyan-500/20 rounded-full flex items-center justify-center animate-pulse">
                      <Zap className="text-cyan-400 w-6 h-6 sm:w-8 sm:h-8 opacity-60" />
                   </div>
                </div>
              </div>
              
              <div className="pt-6 sm:pt-8 border-t border-cyan-500/10 space-y-4 sm:space-y-6">
                <p className="text-[9px] sm:text-[11px] font-black text-cyan-400 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Streak Progress</p>
                <div className="w-full h-3 sm:h-4 bg-slate-900 rounded-full border border-slate-800 overflow-hidden p-0.5">
                   <div 
                    className="h-full bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(0,242,255,0.6)] transition-all duration-1000"
                    style={{ width: `${(stats.streak / 30) * 100}%` }}
                   ></div>
                </div>
                <div className="flex justify-between items-center px-0.5 sm:px-1">
                   <div className="text-[8px] font-black text-slate-600 uppercase">Start</div>
                   <div className="text-[7px] sm:text-[9px] font-black text-cyan-400 uppercase bg-cyan-500/10 px-2 sm:px-3 py-1 rounded-full border border-cyan-500/20 text-center">
                    +30 $DSCS Bonus at 30 Days
                   </div>
                   <div className="text-[8px] font-black text-slate-600 uppercase">Reset</div>
                </div>
              </div>
            </div>
          </div>

          <div className="neon-card rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-12 space-y-8 sm:space-y-10 flex flex-col justify-between">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-cyan-500/5 rounded-xl sm:rounded-2xl flex items-center justify-center border border-cyan-500/20 neon-border p-2.5 sm:p-3">
                  <Users className="text-cyan-400" size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Fellowship</p>
                  <p className="text-2xl sm:text-4xl font-black text-slate-100">{stats.totalInvites}<span className="text-lg sm:text-xl text-slate-800">/{MAX_INVITES}</span></p>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-100 uppercase tracking-widest font-serif">Missionary Unit</h3>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-[0.1em] sm:tracking-[0.2em] leading-relaxed">
                Invite others. Receive <span className="text-cyan-400">10 $DSCS</span> for every verified soul.
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-cyan-500/20 flex flex-col gap-3 sm:gap-4 mt-4 sm:mt-0">
              <p className="text-[8px] sm:text-[10px] font-black text-cyan-500/40 uppercase tracking-[0.4em]">Node Link</p>
              <div className="flex items-center justify-between gap-3 sm:gap-4 overflow-hidden">
                <code className="text-cyan-400 font-mono text-[9px] sm:text-xs truncate opacity-70 tracking-tighter shrink">{window.location.origin}/?ref={stats.id}</code>
                <button 
                  onClick={copyReferral}
                  className="bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase transition-all shadow-lg active:scale-95"
                >
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. WITHDRAWAL TREASURY */}
        <div className="neon-card rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-10 shadow-2xl group border-2 border-cyan-500/10">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 w-full sm:w-auto text-center sm:text-left">
            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-slate-950/50 rounded-full flex items-center justify-center p-0 overflow-hidden neon-border">
               <Logo className="w-full h-full" glow={false} />
            </div>
            <div className="space-y-1">
              <h3 className="text-[8px] sm:text-[10px] font-black text-cyan-500/50 uppercase tracking-[0.5em]">Vault Balance</h3>
              <div className="flex items-baseline justify-center sm:justify-start gap-2 sm:gap-4">
                 <span className="text-4xl sm:text-6xl font-black text-slate-100 font-serif metal-cyan-glow">{stats.balance}</span>
                 <span className="text-xs sm:text-sm text-cyan-400 font-black tracking-[0.2em]">$DSCS</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleWithdraw}
            disabled={stats.balance < 1}
            className={`w-full sm:w-auto px-10 sm:px-14 py-5 sm:py-8 rounded-xl sm:rounded-[2rem] font-black text-sm sm:text-lg tracking-[0.2em] sm:tracking-[0.4em] transition-all uppercase shadow-2xl border-2 ${
              stats.balance < 1 
              ? 'bg-slate-900/30 text-slate-800 border-slate-800 cursor-not-allowed opacity-50' 
              : 'bg-cyan-500 text-slate-950 hover:bg-transparent hover:text-cyan-400 border-cyan-500'
            }`}
          >
            WITHDRAW
          </button>
        </div>
      </main>

      {/* FOOTER QUOTE */}
      <footer className="fixed bottom-0 left-0 w-full p-4 sm:p-10 z-50 pointer-events-none flex justify-center items-center">
        <div className="glow-text font-serif text-[10px] xs:text-xs sm:text-xl italic text-center text-cyan-400 bg-slate-950/95 px-6 sm:px-12 py-4 sm:py-6 rounded-full border border-cyan-500/20 backdrop-blur-3xl shadow-[0_0_60px_rgba(0,242,255,0.15)] max-w-[90vw]">
          "God is Our Source. Everything Else Is A Resource"
        </div>
      </footer>

      {/* TRANSACTION HISTORY MODAL */}
      {historyOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/98 backdrop-blur-2xl">
          <div className="neon-card rounded-[2rem] sm:rounded-[4rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh] sm:max-h-[85vh]">
            <div className="p-6 sm:p-12 border-b border-cyan-500/10 flex justify-between items-center bg-slate-900/95 sticky top-0 z-10">
              <div className="flex items-center gap-3 sm:gap-5">
                <History className="text-cyan-400" size={24} />
                <h2 className="text-lg sm:text-2xl font-black text-slate-100 uppercase tracking-[0.1em] sm:tracking-[0.3em] font-serif">Logs</h2>
              </div>
              <button onClick={() => setHistoryOpen(false)} className="p-2 sm:p-4 bg-slate-900 hover:bg-red-500/20 hover:text-red-400 rounded-2xl sm:rounded-3xl text-slate-500 transition-all border border-slate-800">
                <X size={20} className="sm:w-7 sm:h-7" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 sm:p-12 custom-scrollbar space-y-4 sm:space-y-6">
              {transactions.length === 0 ? (
                <div className="text-center py-20 sm:py-32 opacity-10 italic font-black uppercase tracking-[0.8em] text-[10px] sm:text-sm">Empty Buffer</div>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="bg-slate-950/40 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-cyan-500/10 flex items-center justify-between group hover:border-cyan-500/30 transition-all gap-4">
                    <div className="flex items-center gap-4 sm:gap-8">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${
                        tx.amount > 0 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {tx.amount < 0 ? <ArrowDownCircle size={20} className="sm:w-7 sm:h-7" /> : tx.type === 'CLAIM' ? <Coins size={20} className="sm:w-7 sm:h-7" /> : tx.type === 'STREAK_BONUS' ? <Trophy size={20} className="sm:w-7 sm:h-7 text-cyan-400" /> : <Zap size={20} className="sm:w-7 sm:h-7" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-sm font-black text-slate-100 uppercase tracking-[0.1em] sm:tracking-[0.2em] truncate">{tx.details || tx.type}</div>
                        <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-700 mt-1 sm:mt-2">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-xl sm:text-3xl font-black font-serif ${tx.amount > 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CLAIM MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/98 backdrop-blur-3xl">
          <div className="neon-card rounded-[2rem] sm:rounded-[5rem] w-full max-w-xl overflow-hidden shadow-[0_0_150px_rgba(0,242,255,0.1)] border-2 border-cyan-500/40 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-8 sm:p-16 space-y-10 sm:space-y-16">
              {loadingReflection ? (
                <div className="flex flex-col items-center justify-center py-20 sm:py-32 space-y-6 sm:space-y-10">
                  <div className="w-20 h-20 sm:w-32 sm:h-32 border-4 border-cyan-500/10 border-t-cyan-400 rounded-full animate-spin"></div>
                  <p className="text-cyan-400 font-black animate-pulse uppercase tracking-[0.4em] sm:tracking-[0.8em] text-[10px] sm:text-xs">Authenticating Revelation</p>
                </div>
              ) : activeReflection && (
                <>
                  <div className="text-center space-y-6 sm:space-y-10">
                    <div className="mx-auto w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-cyan-400/40 p-0 bg-slate-950 shadow-[0_0_40px_rgba(0,242,255,0.3)]">
                       <Logo className="w-full h-full" glow={false} />
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      <h2 className="text-cyan-500/60 font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-[8px] sm:text-[10px]">Revelation</h2>
                      <blockquote className="text-xl sm:text-4xl font-serif text-slate-100 leading-tight italic px-2 sm:px-6 drop-shadow-2xl">
                        "{activeReflection.verse.text}"
                      </blockquote>
                      <div className="inline-block px-4 sm:px-8 py-2 sm:py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em]">
                        {activeReflection.verse.reference}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border border-cyan-500/10 shadow-2xl relative">
                    <div className="absolute -top-3 -left-3 sm:-top-5 sm:-left-5 w-8 h-8 sm:w-12 sm:h-12 bg-slate-950 border border-cyan-500/30 rounded-lg sm:rounded-2xl flex items-center justify-center neon-border">
                      <Info className="text-cyan-400" size={16} />
                    </div>
                    <p className="text-slate-300 italic text-base sm:text-lg leading-relaxed font-serif opacity-90">
                      {activeReflection.thought}
                    </p>
                  </div>

                  <div className="space-y-6 sm:space-y-10">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="h-2 sm:h-3 bg-slate-950 rounded-full overflow-hidden border border-cyan-500/10">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000 shadow-[0_0_30px_rgba(0,242,255,0.8)]" 
                          style={{ width: `${(10 - timer) * 10}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={finalizeClaim}
                      disabled={timer > 0 || claiming}
                      className={`w-full py-5 sm:py-8 rounded-xl sm:rounded-[2.5rem] font-black text-xl sm:text-3xl tracking-[0.4em] sm:tracking-[0.8em] transition-all flex items-center justify-center border-2 ${
                        timer > 0 || claiming
                        ? 'bg-slate-900/50 text-slate-800 border-slate-800 cursor-not-allowed'
                        : 'bg-transparent text-cyan-400 hover:bg-cyan-400 hover:text-slate-950 border-cyan-400 transform active:scale-95 shadow-lg shadow-cyan-500/20'
                      }`}
                    >
                      {claiming ? 'SYNCING...' : timer > 0 ? `WAIT ${timer}S` : 'COMMIT'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
