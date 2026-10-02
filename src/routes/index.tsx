import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard, ListChecks, Flame, StickyNote, Timer, Target, BookHeart,
  Plus, Trash2, Pin, Search, Play, Pause, RotateCcw, Crown, Check,
} from "lucide-react";
import {
  useLocal, uid, dayKey, seedTasks, seedHabits, seedNotes, seedGoals,
  type Task, type Habit, type Note, type Goal, type Mood, type Priority,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Taskline — Your Red & Gold Productivity Suite" },
      { name: "description", content: "Manage tasks, build habits, write notes, focus with a timer, track goals and journal your mood." },
      { property: "og:title", content: "Taskline — Your Red & Gold Productivity Suite" },
      { property: "og:description", content: "Tasks, habits, notes, focus timer, goals and journal in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

const TABS = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "habits", label: "Habits", icon: Flame },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "focus", label: "Focus", icon: Timer },
  { id: "goals", label: "Goals", icon: Target },
  { id: "journal", label: "Journal", icon: BookHeart },
] as const;
type TabId = (typeof TABS)[number]["id"];

const card = "rounded-2xl border border-border bg-card/80 backdrop-blur p-5";
const input = "w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground";
const goldBtn = "inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-gold transition hover:brightness-110";

function App() {
  const [tab, setTab] = useState<TabId>("home");
  const [tasks, setTasks] = useLocal<Task[]>("aurum.v2.tasks", seedTasks);
  const [habits, setHabits] = useLocal<Habit[]>("aurum.v2.habits", seedHabits);
  const [notes, setNotes] = useLocal<Note[]>("aurum.v2.notes", seedNotes);
  const [goals, setGoals] = useLocal<Goal[]>("aurum.v2.goals", seedGoals);
  const [moods, setMoods] = useLocal<Mood[]>("aurum.moods", []);
  const [sessions, setSessions] = useLocal<number>("aurum.sessions", 0);

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-sidebar-border bg-sidebar/90 md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold shadow-gold">
            <Crown className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-gold">Taskline</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                tab === t.id ? "bg-crimson text-accent-foreground ring-1 ring-primary/40" : "text-sidebar-foreground/75 hover:bg-sidebar-accent"
              }`}
            >
              <t.icon className={`h-4 w-4 ${tab === t.id ? "text-primary" : ""}`} />
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-10">
        {tab === "home" && <Dashboard tasks={tasks} habits={habits} goals={goals} sessions={sessions} setTab={setTab} setTasks={setTasks} />}
        {tab === "tasks" && <Tasks tasks={tasks} setTasks={setTasks} />}
        {tab === "habits" && <Habits habits={habits} setHabits={setHabits} />}
        {tab === "notes" && <Notes notes={notes} setNotes={setNotes} />}
        {tab === "focus" && <Focus sessions={sessions} setSessions={setSessions} />}
        {tab === "goals" && <Goals goals={goals} setGoals={setGoals} />}
        {tab === "journal" && <Journal moods={moods} setMoods={setMoods} />}
      </main>
    </div>
  );
}

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold md:text-5xl"><span className="text-gold">{title}</span></h1>
      <p className="mt-2 text-muted-foreground">{sub}</p>
    </div>
  );
}

const streak = (days: string[]) => {
  let n = 0; const d = new Date();
  while (days.includes(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
};

const QUOTES = [
  "Discipline is choosing what you want most over what you want now.",
  "Small daily improvements lead to stunning results.",
  "Gold is forged in fire. So is greatness.",
  "Focus on being productive instead of busy.",
];

/* ---------------- Dashboard ---------------- */
function Dashboard({ tasks, habits, goals, sessions, setTab, setTasks }: {
  tasks: Task[]; habits: Habit[]; goals: Goal[]; sessions: number; setTab: (t: TabId) => void; setTasks: (f: (t: Task[]) => Task[]) => void;
}) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);
  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const habitsToday = habits.filter((h) => h.days.includes(dayKey())).length;
  const avgGoal = goals.length ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0;
  const hour = now?.getHours() ?? 12;
  const greet = (hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening") + ", Pratham";
  const quote = QUOTES[(now?.getDate() ?? 0) % QUOTES.length];
  const open = tasks.filter((t) => !t.done).slice(0, 5);

  return (
    <div>
      <Header title={greet} sub={now ? now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : " "} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tasks done" value={`${done}/${tasks.length}`} onClick={() => setTab("tasks")} />
        <Stat label="Habits today" value={`${habitsToday}/${habits.length}`} onClick={() => setTab("habits")} />
        <Stat label="Focus sessions" value={String(sessions)} onClick={() => setTab("focus")} />
        <Stat label="Goal progress" value={`${avgGoal}%`} onClick={() => setTab("goals")} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className={`${card} flex flex-col items-center justify-center`}>
          <Ring pct={pct} />
          <p className="mt-3 text-sm text-muted-foreground">Today's completion</p>
        </div>
        <div className={`${card} lg:col-span-2`}>
          <h3 className="mb-3 text-xl font-semibold">Up next</h3>
          {open.length === 0 && <p className="text-muted-foreground">All clear. You're a legend. 👑</p>}
          <ul className="space-y-2">
            {open.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
                <CheckBox checked={false} onClick={() => { setTasks((ts) => ts.map((x) => x.id === t.id ? { ...x, done: true } : x)); toast.success("Task completed"); }} />
                <span className="flex-1 text-sm">{t.title}</span>
                <PriorityTag p={t.priority} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-crimson p-8 ring-1 ring-primary/30">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Daily inspiration</p>
        <p className="mt-3 font-display text-2xl italic md:text-3xl">"{quote}"</p>
      </div>
    </div>
  );
}

function Stat({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`${card} text-left transition hover:ring-1 hover:ring-primary/50`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-gold">{value}</p>
    </button>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--muted)" strokeWidth="12" />
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset .6s" }} />
      <text x="70" y="78" textAnchor="middle" className="font-display" fontSize="28" fontWeight="700" fill="var(--primary)">{pct}%</text>
    </svg>
  );
}

function CheckBox({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Toggle" className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border border-primary/60 transition ${checked ? "bg-gold" : "hover:bg-primary/10"}`}>
      {checked && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
    </button>
  );
}

function PriorityTag({ p }: { p: Priority }) {
  const cls = p === "high" ? "bg-secondary text-secondary-foreground" : p === "medium" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>{p}</span>;
}

/* ---------------- Tasks ---------------- */
function Tasks({ tasks, setTasks }: { tasks: Task[]; setTasks: (f: (t: Task[]) => Task[]) => void }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("Personal");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [q, setQ] = useState("");

  const add = () => {
    if (!title.trim()) return;
    setTasks((t) => [{ id: uid(), title: title.trim(), done: false, priority, category, due: due || undefined, created: Date.now() }, ...t]);
    setTitle(""); setDue(""); toast.success("Task added");
  };
  const order = { high: 0, medium: 1, low: 2 };
  const list = useMemo(() => tasks
    .filter((t) => filter === "all" || (filter === "done" ? t.done : !t.done))
    .filter((t) => t.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(a.done) - Number(b.done) || order[a.priority] - order[b.priority]), [tasks, filter, q]);

  return (
    <div>
      <Header title="Tasks" sub="Prioritise, categorise and conquer your to-dos." />
      <div className={`${card} grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]`}>
        <input className={input} placeholder="What needs to be done?" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <select className={input} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
          {["Personal", "Work", "Health", "Learning", "Finance"].map((c) => <option key={c}>{c}</option>)}
        </select>
        <input type="date" className={input} value={due} onChange={(e) => setDue(e.target.value)} />
        <button className={goldBtn} onClick={add}><Plus className="h-4 w-4" />Add</button>
      </div>
      <div className="my-5 flex flex-wrap items-center gap-2">
        {(["all", "active", "done"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm capitalize transition ${filter === f ? "bg-gold text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{f}</button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input className={`${input} pl-9`} placeholder="Search tasks" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <ul className="space-y-2">
        {list.map((t) => (
          <li key={t.id} className={`${card} flex items-center gap-3 !py-3`}>
            <CheckBox checked={t.done} onClick={() => setTasks((ts) => ts.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))} />
            <div className="flex-1">
              <p className={t.done ? "text-muted-foreground line-through" : ""}>{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.category}{t.due ? ` · due ${t.due}` : ""}</p>
            </div>
            <PriorityTag p={t.priority} />
            <button aria-label="Delete" onClick={() => setTasks((ts) => ts.filter((x) => x.id !== t.id))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
        {list.length === 0 && <p className="py-10 text-center text-muted-foreground">No tasks here.</p>}
      </ul>
    </div>
  );
}

/* ---------------- Habits ---------------- */
function Habits({ habits, setHabits }: { habits: Habit[]; setHabits: (f: (h: Habit[]) => Habit[]) => void }) {
  const [name, setName] = useState("");
  const [week, setWeek] = useState<Date[]>([]);
  useEffect(() => { setWeek(Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d; })); }, []);
  const toggle = (id: string, day: string) => setHabits((hs) => hs.map((h) => h.id === id ? { ...h, days: h.days.includes(day) ? h.days.filter((d) => d !== day) : [...h.days, day] } : h));

  return (
    <div>
      <Header title="Habits" sub="Build streaks that turn into a golden lifestyle." />
      <div className={`${card} mb-5 flex gap-3`}>
        <input className={input} placeholder="New habit, e.g. Morning walk" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { setHabits((h) => [...h, { id: uid(), name: name.trim(), days: [] }]); setName(""); } }} />
        <button className={goldBtn} onClick={() => { if (name.trim()) { setHabits((h) => [...h, { id: uid(), name: name.trim(), days: [] }]); setName(""); } }}><Plus className="h-4 w-4" />Add</button>
      </div>
      <div className="space-y-3">
        {habits.map((h) => (
          <div key={h.id} className={`${card} flex flex-wrap items-center gap-4`}>
            <div className="min-w-40 flex-1">
              <p className="font-medium">{h.name}</p>
              <p className="flex items-center gap-1 text-sm text-primary"><Flame className="h-4 w-4" />{streak(h.days)} day streak</p>
            </div>
            <div className="flex gap-1.5">
              {week.map((d) => {
                const k = dayKey(d), on = h.days.includes(k);
                return (
                  <button key={k} onClick={() => toggle(h.id, k)} className={`flex h-11 w-10 flex-col items-center justify-center rounded-lg text-xs transition ${on ? "bg-gold text-primary-foreground shadow-gold" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                    <span>{d.toLocaleDateString(undefined, { weekday: "narrow" })}</span>
                    <span className="font-bold">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <button aria-label="Delete" onClick={() => setHabits((hs) => hs.filter((x) => x.id !== h.id))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Notes ---------------- */
function Notes({ notes, setNotes }: { notes: Note[]; setNotes: (f: (n: Note[]) => Note[]) => void }) {
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const sorted = notes.filter((n) => (n.title + n.body).toLowerCase().includes(q.toLowerCase())).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated - a.updated);
  const active = notes.find((n) => n.id === activeId) ?? sorted[0];
  const update = (patch: Partial<Note>) => active && setNotes((ns) => ns.map((n) => n.id === active.id ? { ...n, ...patch, updated: Date.now() } : n));
  const create = () => { const n = { id: uid(), title: "Untitled", body: "", pinned: false, updated: Date.now() }; setNotes((ns) => [n, ...ns]); setActiveId(n.id); };

  return (
    <div>
      <Header title="Notes" sub="Your private vault of ideas." />
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className={card}>
          <div className="mb-3 flex gap-2">
            <input className={input} placeholder="Search notes" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className={goldBtn} onClick={create} aria-label="New note"><Plus className="h-4 w-4" /></button>
          </div>
          <ul className="space-y-1">
            {sorted.map((n) => (
              <li key={n.id}>
                <button onClick={() => setActiveId(n.id)} className={`w-full rounded-lg px-3 py-2 text-left transition ${active?.id === n.id ? "bg-crimson ring-1 ring-primary/40" : "hover:bg-muted"}`}>
                  <p className="flex items-center gap-1 truncate text-sm font-medium">{n.pinned && <Pin className="h-3 w-3 text-primary" />}{n.title || "Untitled"}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.body || "Empty note"}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className={`${card} min-h-96`}>
          {active ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <input className="flex-1 bg-transparent font-display text-3xl font-bold outline-none" value={active.title} onChange={(e) => update({ title: e.target.value })} />
                <button aria-label="Pin" onClick={() => update({ pinned: !active.pinned })} className={active.pinned ? "text-primary" : "text-muted-foreground hover:text-primary"}><Pin className="h-5 w-5" /></button>
                <button aria-label="Delete" onClick={() => { setNotes((ns) => ns.filter((n) => n.id !== active.id)); setActiveId(null); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-5 w-5" /></button>
              </div>
              <textarea className="h-80 w-full resize-none bg-transparent leading-relaxed outline-none placeholder:text-muted-foreground" placeholder="Start writing..." value={active.body} onChange={(e) => update({ body: e.target.value })} />
              <p className="text-xs text-muted-foreground">{active.body.trim().split(/\s+/).filter(Boolean).length} words · saved automatically</p>
            </>
          ) : <p className="text-muted-foreground">Create your first note.</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Focus ---------------- */
const MODES = { focus: 25, short: 5, long: 15 } as const;
function Focus({ sessions, setSessions }: { sessions: number; setSessions: (f: (n: number) => number) => void }) {
  const [mode, setMode] = useState<keyof typeof MODES>("focus");
  const [left, setLeft] = useState(MODES.focus * 60);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);
  useEffect(() => {
    if (left <= 0) {
      setRunning(false);
      if (mode === "focus") { setSessions((s) => s + 1); toast.success("Focus session complete! Take a break."); }
      else toast("Break over — back to work!");
      setLeft(MODES[mode] * 60);
    }
  }, [left, mode, setSessions]);

  const switchMode = (m: keyof typeof MODES) => { setMode(m); setRunning(false); setLeft(MODES[m] * 60); };
  const total = MODES[mode] * 60;
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");

  return (
    <div>
      <Header title="Focus" sub="Pomodoro timer for deep, distraction-free work." />
      <div className={`${card} mx-auto flex max-w-xl flex-col items-center py-10`}>
        <div className="mb-8 flex gap-2">
          {(Object.keys(MODES) as (keyof typeof MODES)[]).map((m) => (
            <button key={m} onClick={() => switchMode(m)} className={`rounded-full px-4 py-1.5 text-sm transition ${mode === m ? "bg-gold text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {m === "focus" ? "Focus" : m === "short" ? "Short break" : "Long break"}
            </button>
          ))}
        </div>
        <div className="relative grid h-64 w-64 place-items-center rounded-full bg-crimson ring-4 ring-primary/30 shadow-gold">
          <svg className="absolute inset-0" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="47" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"
              strokeDasharray={295} strokeDashoffset={295 * (left / total)} transform="rotate(-90 50 50)" />
          </svg>
          <span className="font-display text-6xl font-bold text-gold">{mm}:{ss}</span>
        </div>
        <div className="mt-8 flex gap-3">
          <button className={goldBtn} onClick={() => setRunning((r) => !r)}>{running ? <><Pause className="h-4 w-4" />Pause</> : <><Play className="h-4 w-4" />Start</>}</button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted" onClick={() => switchMode(mode)}><RotateCcw className="h-4 w-4" />Reset</button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Sessions completed: <span className="font-bold text-primary">{sessions}</span></p>
      </div>
    </div>
  );
}

/* ---------------- Goals ---------------- */
function Goals({ goals, setGoals }: { goals: Goal[]; setGoals: (f: (g: Goal[]) => Goal[]) => void }) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const add = () => { if (!title.trim()) return; setGoals((g) => [...g, { id: uid(), title: title.trim(), progress: 0, deadline: deadline || undefined }]); setTitle(""); setDeadline(""); };
  return (
    <div>
      <Header title="Goals" sub="Dream big. Track every step toward it." />
      <div className={`${card} mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]`}>
        <input className={input} placeholder="A goal worth chasing" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <input type="date" className={input} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        <button className={goldBtn} onClick={add}><Plus className="h-4 w-4" />Add goal</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => (
          <div key={g.id} className={card}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-semibold">{g.title}</p>
                {g.deadline && <p className="text-xs text-muted-foreground">Target: {g.deadline}</p>}
              </div>
              <button aria-label="Delete" onClick={() => setGoals((gs) => gs.filter((x) => x.id !== g.id))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${g.progress}%` }} />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input type="range" min={0} max={100} value={g.progress} className="flex-1 accent-primary"
                onChange={(e) => { const v = Number(e.target.value); setGoals((gs) => gs.map((x) => x.id === g.id ? { ...x, progress: v } : x)); if (v === 100 && g.progress !== 100) toast.success(`Goal achieved: ${g.title} 🏆`); }} />
              <span className="w-12 text-right font-display font-bold text-primary">{g.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Journal ---------------- */
const MOODS = ["😞", "😕", "😐", "🙂", "🤩"];
function Journal({ moods, setMoods }: { moods: Mood[]; setMoods: (f: (m: Mood[]) => Mood[]) => void }) {
  const [today, setToday] = useState("");
  useEffect(() => setToday(dayKey()), []);
  const entry = moods.find((m) => m.day === today);
  const [mood, setMood] = useState(3);
  const [text, setText] = useState("");
  useEffect(() => { if (entry) { setMood(entry.mood); setText(entry.text); } }, [entry?.day]);
  const save = () => { setMoods((ms) => [{ day: today, mood, text }, ...ms.filter((m) => m.day !== today)]); toast.success("Journal saved"); };

  return (
    <div>
      <Header title="Journal" sub="Reflect on your day and track your mood." />
      <div className={`${card} mb-6`}>
        <p className="mb-3 text-sm text-muted-foreground">How are you feeling today?</p>
        <div className="mb-4 flex gap-2">
          {MOODS.map((m, i) => (
            <button key={i} onClick={() => setMood(i)} className={`grid h-14 w-14 place-items-center rounded-xl text-3xl transition ${mood === i ? "bg-gold shadow-gold scale-110" : "bg-muted hover:bg-accent"}`}>{m}</button>
          ))}
        </div>
        <textarea className={`${input} h-32`} placeholder="Three things I'm grateful for..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className={`${goldBtn} mt-3`} onClick={save}>Save entry</button>
      </div>
      <h3 className="mb-3 text-xl font-semibold">Past entries</h3>
      <div className="space-y-2">
        {moods.map((m) => (
          <div key={m.day} className={`${card} flex gap-4 !py-3`}>
            <span className="text-3xl">{MOODS[m.mood]}</span>
            <div><p className="text-sm font-medium text-primary">{m.day}</p><p className="text-sm text-muted-foreground">{m.text || "No notes"}</p></div>
          </div>
        ))}
        {moods.length === 0 && <p className="text-muted-foreground">No entries yet.</p>}
      </div>
    </div>
  );
}
