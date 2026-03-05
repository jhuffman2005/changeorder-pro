import { useState, useRef, useEffect } from "react";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const C = {
  ink: "#0f0e0c", steel: "#1c2b35", amber: "#e8a020", amberDim: "#c4861a",
  cream: "#f5f0e8", creamDark: "#ede8de", muted: "#8a8478", green: "#2d7a4f",
  greenLight: "#e8f5ee", red: "#c0392b", redLight: "#fdecea",
  border: "#d4cec4", white: "#ffffff", blue: "#1a5fa8",
};
const font = { display: "'Playfair Display', Georgia, serif", body: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.cream}; font-family: ${font.body}; color: ${C.ink}; -webkit-font-smoothing: antialiased; }
  button { cursor: pointer; font-family: ${font.body}; }
  textarea, input { font-family: ${font.body}; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px);} to {opacity:1;transform:translateY(0);}}
  @keyframes spin { to { transform: rotate(360deg); } }
  .fu { animation: fadeUp 0.35s ease both; }
  .fu2 { animation: fadeUp 0.35s 0.08s ease both; }
  .fu3 { animation: fadeUp 0.35s 0.16s ease both; }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt$ = n => "$" + Number(n || 0).toLocaleString();
const today = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

function useStorage(key, init) {
  return useState(init);
}

// ── Shared UI ────────────────────────────────────────────────────────────────
const Spinner = () => <div style={{ width:18,height:18,border:`2px solid ${C.border}`,borderTopColor:C.amber,borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }} />;
const Label = ({ children }) => <div style={{ fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,marginBottom:5 }}>{children}</div>;
const Badge = ({ children, color=C.amber }) => <span style={{ background:color,color:C.white,fontSize:10,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",padding:"2px 8px",borderRadius:4 }}>{children}</span>;
const Card = ({ children, style={}, className="" }) => <div className={className} style={{ background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:18,...style }}>{children}</div>;

function Btn({ children, onClick, disabled, variant="primary", style={}, icon }) {
  const base = { border:"none",borderRadius:10,padding:"13px 20px",fontWeight:600,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s",cursor:disabled?"not-allowed":"pointer",...style };
  const variants = {
    primary: { background: disabled ? C.border : C.amber, color: disabled ? C.muted : C.ink },
    ghost: { background:"transparent",color:C.muted,border:`1px solid ${C.border}` },
    danger: { background:"transparent",color:C.red,border:`1px solid ${C.red}` },
    dark: { background:C.ink,color:C.white },
  };
  return <button onClick={onClick} disabled={disabled} style={{...base,...variants[variant]}}>{icon&&<span>{icon}</span>}{children}</button>;
}

function Field({ label, value, onChange, placeholder, type="text", style={} }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <Label>{label}</Label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"11px 12px",fontSize:15,background:C.cream,outline:"none",color:C.ink,...style }} />
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { pending:[C.amber,"Pending"], approved:[C.green,"Approved"], declined:[C.red,"Declined"] };
  const [color, label] = map[status] || [C.muted, status];
  return <Badge color={color}>{label}</Badge>;
}

// ── VIEW: Projects Dashboard ──────────────────────────────────────────────────
function DashboardView({ projects, onSelectProject, onNewProject }) {
  const totalCOs = projects.reduce((a,p) => a + (p.cos?.length||0), 0);
  const totalApproved = projects.reduce((a,p) => a + (p.cos?.filter(c=>c.status==="approved").length||0), 0);
  const totalValue = projects.reduce((a,p) => a + (p.cos?.filter(c=>c.status==="approved").reduce((b,c)=>b+Number(c.totalCost||0),0)||0), 0);

  return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"24px 16px 40px" }}>
      {/* Header */}
      <div className="fu" style={{ marginBottom:24 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:38,height:38,background:C.ink,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>🔨</div>
            <div>
              <div style={{ fontFamily:font.display,fontSize:21,fontWeight:700,lineHeight:1 }}>ChangeOrder</div>
              <div style={{ fontSize:10,color:C.muted,letterSpacing:"0.07em" }}>PRO</div>
            </div>
          </div>
          <Btn onClick={onNewProject} variant="primary" icon="+" style={{ padding:"10px 16px",fontSize:13 }}>New Project</Btn>
        </div>
      </div>

      {/* Stats */}
      {projects.length > 0 && (
        <div className="fu" style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20 }}>
          {[
            { label:"Projects", value: projects.length },
            { label:"COs Sent", value: totalCOs },
            { label:"Value Approved", value: fmt$(totalValue) },
          ].map(s => (
            <div key={s.label} style={{ background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 10px",textAlign:"center" }}>
              <div style={{ fontFamily:font.mono,fontWeight:700,fontSize:16,color:C.ink }}>{s.value}</div>
              <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Project list */}
      {projects.length === 0 ? (
        <Card className="fu2" style={{ textAlign:"center",padding:"48px 24px",borderStyle:"dashed" }}>
          <div style={{ fontSize:40,marginBottom:12 }}>🏗️</div>
          <div style={{ fontFamily:font.display,fontSize:18,fontWeight:700,marginBottom:8 }}>No projects yet</div>
          <div style={{ color:C.muted,fontSize:14,marginBottom:20 }}>Add your first project to start sending change orders in seconds.</div>
          <Btn onClick={onNewProject} variant="primary" icon="+" style={{ width:"100%",justifyContent:"center" }}>Add First Project</Btn>
        </Card>
      ) : (
        <div>
          <div style={{ fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,marginBottom:10 }}>Your Projects</div>
          {projects.map((p, i) => {
            const pending = p.cos?.filter(c=>c.status==="pending").length||0;
            const approved = p.cos?.filter(c=>c.status==="approved").length||0;
            const total = p.cos?.reduce((a,c)=>a+Number(c.totalCost||0),0)||0;
            return (
              <Card key={p.id} className="fu" style={{ marginBottom:10,cursor:"pointer",transition:"all 0.2s",animationDelay:`${i*0.06}s` }}
                onClick={() => onSelectProject(p)}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,fontSize:15,marginBottom:2 }}>{p.name}</div>
                    <div style={{ fontSize:12,color:C.muted,marginBottom:8 }}>{p.address}</div>
                    <div style={{ fontSize:12,color:C.muted }}>{p.clientName} · {p.clientPhone}</div>
                  </div>
                  <div style={{ textAlign:"right",minWidth:80 }}>
                    <div style={{ fontFamily:font.mono,fontWeight:700,color:C.amber,fontSize:14 }}>{fmt$(total)}</div>
                    <div style={{ fontSize:11,color:C.muted,marginTop:4 }}>{p.cos?.length||0} COs</div>
                  </div>
                </div>
                {(pending > 0 || approved > 0) && (
                  <div style={{ display:"flex",gap:6,marginTop:10,paddingTop:10,borderTop:`1px solid ${C.creamDark}` }}>
                    {pending > 0 && <Badge color={C.amber}>{pending} Pending</Badge>}
                    {approved > 0 && <Badge color={C.green}>{approved} Approved</Badge>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── VIEW: New/Edit Project ────────────────────────────────────────────────────
function ProjectFormView({ project, onSave, onBack }) {
  const [name, setName] = useState(project?.name||"");
  const [address, setAddress] = useState(project?.address||"");
  const [clientName, setClientName] = useState(project?.clientName||"");
  const [clientEmail, setClientEmail] = useState(project?.clientEmail||"");
  const [clientPhone, setClientPhone] = useState(project?.clientPhone||"");

  const canSave = name && address && clientName && clientEmail;

  function save() {
    onSave({ id: project?.id||uid(), name, address, clientName, clientEmail, clientPhone, cos: project?.cos||[] });
  }

  return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"24px 16px 40px" }}>
      <button onClick={onBack} style={{ background:"none",border:"none",color:C.muted,fontSize:14,marginBottom:20,display:"flex",alignItems:"center",gap:6 }}>← Back</button>
      <div className="fu" style={{ marginBottom:24 }}>
        <div style={{ fontFamily:font.display,fontSize:24,fontWeight:700 }}>{project ? "Edit Project" : "New Project"}</div>
        <div style={{ color:C.muted,fontSize:13,marginTop:6 }}>This info auto-fills every change order for this project.</div>
      </div>

      <Card className="fu" style={{ marginBottom:14 }}>
        <div style={{ fontSize:13,fontWeight:600,color:C.steel,marginBottom:14 }}>📋 Project Details</div>
        <Field label="Project Name" value={name} onChange={setName} placeholder="123 Oak Street Remodel" />
        <Field label="Project Address" value={address} onChange={setAddress} placeholder="123 Oak Street, Grapevine TX 76051" />
      </Card>

      <Card className="fu2" style={{ marginBottom:24 }}>
        <div style={{ fontSize:13,fontWeight:600,color:C.steel,marginBottom:14 }}>👤 Client Info</div>
        <Field label="Client Name" value={clientName} onChange={setClientName} placeholder="John & Sarah Miller" />
        <Field label="Client Email" value={clientEmail} onChange={setClientEmail} placeholder="client@email.com" type="email" />
        <Field label="Client Phone" value={clientPhone} onChange={setClientPhone} placeholder="(817) 555-0100" type="tel" />
      </Card>

      <Btn onClick={save} disabled={!canSave} variant="primary" style={{ width:"100%" }} icon={project?"💾":"➕"}>
        {project ? "Save Changes" : "Create Project"}
      </Btn>
    </div>
  );
}

// ── VIEW: Project Detail (CO list) ────────────────────────────────────────────
function ProjectDetailView({ project, onNewCO, onViewCO, onBack, onEdit }) {
  const cos = project.cos || [];
  const pending = cos.filter(c=>c.status==="pending").length;
  const approved = cos.filter(c=>c.status==="approved");
  const totalApprovedValue = approved.reduce((a,c)=>a+Number(c.totalCost||0),0);

  return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"24px 16px 40px" }}>
      <button onClick={onBack} style={{ background:"none",border:"none",color:C.muted,fontSize:14,marginBottom:20,display:"flex",alignItems:"center",gap:6 }}>← Projects</button>

      {/* Project header */}
      <Card className="fu" style={{ marginBottom:16,borderTop:`4px solid ${C.amber}` }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:font.display,fontSize:20,fontWeight:700,lineHeight:1.2 }}>{project.name}</div>
            <div style={{ fontSize:12,color:C.muted,marginTop:4 }}>{project.address}</div>
          </div>
          <button onClick={onEdit} style={{ background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",fontSize:12,color:C.muted }}>Edit</button>
        </div>
        <div style={{ borderTop:`1px solid ${C.creamDark}`,paddingTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
          <div>
            <div style={{ fontSize:11,color:C.muted }}>Client</div>
            <div style={{ fontSize:14,fontWeight:600 }}>{project.clientName}</div>
          </div>
          <div>
            <div style={{ fontSize:11,color:C.muted }}>Phone</div>
            <div style={{ fontSize:14,fontWeight:600 }}>{project.clientPhone||"—"}</div>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <div style={{ fontSize:11,color:C.muted }}>Email</div>
            <div style={{ fontSize:14,fontWeight:600 }}>{project.clientEmail}</div>
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div className="fu" style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20 }}>
        {[
          { label:"Total COs", value: cos.length },
          { label:"Awaiting", value: pending, color: pending>0?C.amber:C.muted },
          { label:"Approved $", value: fmt$(totalApprovedValue), color: C.green },
        ].map(s => (
          <div key={s.label} style={{ background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 8px",textAlign:"center" }}>
            <div style={{ fontFamily:font.mono,fontWeight:700,fontSize:15,color:s.color||C.ink }}>{s.value}</div>
            <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* New CO button */}
      <Btn onClick={onNewCO} variant="primary" icon="🎙️" style={{ width:"100%",marginBottom:20,padding:"15px" }}>
        New Change Order
      </Btn>

      {/* CO list */}
      {cos.length === 0 ? (
        <Card style={{ textAlign:"center",padding:"32px 20px",borderStyle:"dashed" }}>
          <div style={{ fontSize:32,marginBottom:10 }}>📄</div>
          <div style={{ color:C.muted,fontSize:14 }}>No change orders yet.<br/>Tap above to create your first one.</div>
        </Card>
      ) : (
        <div>
          <div style={{ fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,marginBottom:10 }}>Change Orders</div>
          {[...cos].reverse().map((co,i) => (
            <Card key={co.id} style={{ marginBottom:10,cursor:"pointer",animationDelay:`${i*0.05}s` }} className="fu"
              onClick={() => onViewCO(co)}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:11,color:C.muted,marginBottom:3,fontFamily:font.mono }}>{co.coNumber}</div>
                  <div style={{ fontWeight:600,fontSize:14,marginBottom:4 }}>{co.title}</div>
                  <div style={{ fontSize:12,color:C.muted }}>{co.date}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:font.mono,fontWeight:700,fontSize:15,color:C.ink,marginBottom:6 }}>{fmt$(co.totalCost)}</div>
                  <StatusBadge status={co.status} />
                </div>
              </div>
              {co.scheduleDays > 0 && (
                <div style={{ marginTop:8,fontSize:12,color:C.muted,paddingTop:8,borderTop:`1px solid ${C.creamDark}` }}>
                  ⏱ +{co.scheduleDays} day{co.scheduleDays>1?"s":""} schedule impact
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── VIEW: New CO (voice/text) ─────────────────────────────────────────────────
function NewCOView({ project, onGenerate, onBack }) {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [cost, setCost] = useState("");
  const [scheduleDays, setScheduleDays] = useState("");
  const [generating, setGenerating] = useState(false);
  const recognitionRef = useRef(null);
  const fileRef = useRef(null);

  const canGenerate = transcript.length > 10;

  const shouldListenRef = useRef(false);

  function toggleListening() {
    if (isListening) {
      shouldListenRef.current = false;
      try { recognitionRef.current?.abort(); } catch {}
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Use Chrome for voice dictation."); return; }
    shouldListenRef.current = true;
    setIsListening(true);
    function startRec() {
      if (!shouldListenRef.current) return;
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = e => {
        const t = Array.from(e.results).map(r => r[0].transcript).join(" ");
        setTranscript(prev => (prev ? prev + " " + t : t).trim());
      };
      rec.onend = () => { if (shouldListenRef.current) startRec(); };
      rec.onerror = e => {
        if (e.error === "no-speech" && shouldListenRef.current) { startRec(); return; }
        shouldListenRef.current = false;
        setIsListening(false);
      };
      rec.start();
      recognitionRef.current = rec;
    }
    startRec();
  }

  function handlePhotos(e) {
    Array.from(e.target.files).forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPhotos(p => [...p, { name:f.name, src:ev.target.result }]);
      reader.readAsDataURL(f);
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const coNum = `CO-${String(Math.floor(Math.random()*900)+100)}`;
      const prompt = `You are a professional construction change order writer. Generate a formal Change Order document.

PROJECT: ${project.name}
ADDRESS: ${project.address}
CLIENT: ${project.clientName}
CONTRACTOR DESCRIPTION: "${transcript}"
ADDITIONAL COST: ${cost ? "$"+cost : "estimate from description"}
SCHEDULE IMPACT: ${scheduleDays ? scheduleDays+" additional days" : "estimate from description"}
PHOTOS: ${photos.length} attached

Write a complete professional change order. Return ONLY valid JSON:
{
  "title": "short professional title",
  "scopeDescription": "3-5 sentence professional scope description",
  "justification": "2-3 sentence reason/justification",
  "costBreakdown": [{"item": "...", "amount": 0}],
  "totalCost": 0,
  "scheduleDays": 0,
  "scheduleStatement": "one sentence schedule impact",
  "terms": "payment terms and work start conditions"
}`;

      const res = await fetch(ANTHROPIC_API_URL, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:prompt}] })
      });
      const data = await res.json();
      const text = data.content.map(b=>b.text||"").join("");
      const co = JSON.parse(text.replace(/```json|```/g,"").trim());

      onGenerate({
        id: uid(), coNumber: coNum, status: "pending", date: today(),
        ...co, photos,
        totalCost: cost || co.totalCost,
        scheduleDays: scheduleDays || co.scheduleDays,
      });
    } catch(err) { alert("Generation failed. Please try again."); console.error(err); }
    setGenerating(false);
  }

  return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"24px 16px 40px" }}>
      <button onClick={onBack} style={{ background:"none",border:"none",color:C.muted,fontSize:14,marginBottom:20,display:"flex",alignItems:"center",gap:6 }}>← {project.name}</button>
      <div className="fu" style={{ marginBottom:20 }}>
        <div style={{ fontFamily:font.display,fontSize:22,fontWeight:700 }}>New Change Order</div>
        <div style={{ fontSize:13,color:C.muted,marginTop:4 }}>Dictate or type what changed. AI writes the rest.</div>
      </div>

      {/* Auto-filled project info */}
      <Card className="fu" style={{ marginBottom:14,background:C.creamDark }}>
        <div style={{ fontSize:11,fontWeight:600,color:C.muted,marginBottom:10,letterSpacing:"0.08em",textTransform:"uppercase" }}>Auto-filled from project</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13 }}>
          <div><span style={{ color:C.muted }}>Project: </span><strong>{project.name}</strong></div>
          <div><span style={{ color:C.muted }}>Client: </span><strong>{project.clientName}</strong></div>
          <div style={{ gridColumn:"1/-1" }}><span style={{ color:C.muted }}>Send to: </span><strong>{project.clientEmail}</strong></div>
        </div>
      </Card>

      {/* Voice */}
      <Card className="fu" style={{ marginBottom:14 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <div style={{ fontSize:13,fontWeight:600,color:C.steel }}>🎙️ Describe the Change</div>
          {isListening && <Badge color={C.red}>● RECORDING</Badge>}
        </div>
        <button onClick={toggleListening} style={{
          width:"100%",padding:"14px",borderRadius:10,border:"none",
          background:isListening?C.red:C.steel,color:C.white,fontWeight:600,fontSize:14,
          display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:12,transition:"all 0.2s"
        }}>
          <span style={{ fontSize:18 }}>{isListening?"⏹":"🎙"}</span>
          {isListening?"Stop Recording":"Tap to Dictate"}
        </button>
        <Label>Or type it out</Label>
        <textarea value={transcript} onChange={e=>setTranscript(e.target.value)}
          placeholder="e.g. Client wants to add a second bathroom on the main floor. Moving two walls, plumbing rough-in, 2 electrical circuits, and tile..."
          rows={4} style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:12,fontSize:14,background:C.cream,resize:"vertical",outline:"none",color:C.ink,lineHeight:1.6 }} />
      </Card>

      {/* Cost + Schedule */}
      <Card className="fu2" style={{ marginBottom:14 }}>
        <div style={{ fontSize:13,fontWeight:600,color:C.steel,marginBottom:12 }}>💰 Pricing & Schedule</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <div>
            <Label>Add'l Cost ($)</Label>
            <input type="number" value={cost} onChange={e=>setCost(e.target.value)} placeholder="4,500"
              style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"11px",fontSize:15,background:C.cream,outline:"none",color:C.ink }} />
          </div>
          <div>
            <Label>Extra Days</Label>
            <input type="number" value={scheduleDays} onChange={e=>setScheduleDays(e.target.value)} placeholder="5"
              style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:8,padding:"11px",fontSize:15,background:C.cream,outline:"none",color:C.ink }} />
          </div>
        </div>
        <div style={{ fontSize:12,color:C.muted,marginTop:8 }}>Leave blank — AI estimates from your description.</div>
      </Card>

      {/* Photos */}
      <Card className="fu2" style={{ marginBottom:24 }}>
        <div style={{ fontSize:13,fontWeight:600,color:C.steel,marginBottom:12 }}>📸 Site Photos</div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display:"none" }} />
        <button onClick={()=>fileRef.current?.click()} style={{ width:"100%",padding:"13px",borderRadius:10,border:`2px dashed ${C.border}`,background:C.creamDark,color:C.muted,fontWeight:500,fontSize:14 }}>
          + Add Photos
        </button>
        {photos.length > 0 && (
          <div style={{ display:"flex",gap:8,marginTop:12,flexWrap:"wrap" }}>
            {photos.map((p,i) => (
              <div key={i} style={{ position:"relative" }}>
                <img src={p.src} alt={p.name} style={{ width:68,height:68,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}` }} />
                <button onClick={()=>setPhotos(ph=>ph.filter((_,j)=>j!==i))} style={{ position:"absolute",top:-6,right:-6,width:18,height:18,background:C.red,color:C.white,border:"none",borderRadius:"50%",fontSize:10,fontWeight:700 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Btn onClick={handleGenerate} disabled={!canGenerate||generating} variant="primary" icon={generating?null:"✨"} style={{ width:"100%",padding:"15px" }}>
        {generating ? <><Spinner />&nbsp;Writing Change Order…</> : "Generate Change Order"}
      </Btn>
    </div>
  );
}

// ── VIEW: CO Preview & Send ───────────────────────────────────────────────────
function COPreviewView({ co, project, onSend, onBack }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setSending(true);
    await new Promise(r=>setTimeout(r,1600));
    setSending(false); setSent(true);
    setTimeout(() => onSend({ ...co, status:"pending" }), 900);
  }

  return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"24px 16px 40px" }}>
      <button onClick={onBack} style={{ background:"none",border:"none",color:C.muted,fontSize:14,marginBottom:20,display:"flex",alignItems:"center",gap:6 }}>← Edit</button>
      <div className="fu" style={{ marginBottom:20 }}>
        <Badge color={C.green}>AI Generated</Badge>
        <div style={{ fontFamily:font.display,fontSize:22,fontWeight:700,marginTop:8 }}>Review & Send</div>
        <div style={{ color:C.muted,fontSize:13,marginTop:4 }}>Looks good? Your client gets an approval link instantly.</div>
      </div>

      <CODocument co={co} project={project} />

      <div style={{ display:"flex",gap:10,marginTop:20 }}>
        <Btn onClick={onBack} variant="ghost" style={{ flex:1 }}>Edit</Btn>
        <button onClick={handleSend} disabled={sending||sent} style={{
          flex:2,background:sent?C.green:C.amber,color:C.ink,border:"none",borderRadius:10,
          padding:"14px",fontWeight:700,fontSize:15,display:"flex",alignItems:"center",
          justifyContent:"center",gap:8,transition:"all 0.3s"
        }}>
          {sent?"✓ Sent!":sending?<><Spinner/>&nbsp;Sending…</>:"📤 Send to Client"}
        </button>
      </div>
      <div style={{ textAlign:"center",fontSize:12,color:C.muted,marginTop:10 }}>
        {project.clientName} will receive a one-click approval link at {project.clientEmail}
      </div>
    </div>
  );
}

// Shared CO document renderer
function CODocument({ co, project }) {
  return (
    <>
      <Card className="fu" style={{ borderTop:`4px solid ${C.amber}` }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:font.mono,fontWeight:700,fontSize:16 }}>{co.coNumber}</div>
            <div style={{ fontSize:11,color:C.muted }}>{co.date}</div>
          </div>
          <StatusBadge status={co.status||"pending"} />
        </div>

        {[
          { label:"Project", value: project?.name||co.projectName },
          { label:"Title", value: co.title, bold:true },
          { label:"Scope of Work", value: co.scopeDescription, prose:true },
          { label:"Justification", value: co.justification, prose:true },
        ].map(f => f.value && (
          <div key={f.label} style={{ borderBottom:`1px solid ${C.border}`,marginBottom:12,paddingBottom:12 }}>
            <Label>{f.label}</Label>
            <div style={{ fontSize:f.prose?14:15, fontWeight:f.bold?600:400, lineHeight:f.prose?1.7:1.4, color:f.prose?C.steel:C.ink }}>{f.value}</div>
          </div>
        ))}

        {/* Cost breakdown */}
        {co.costBreakdown?.map((item,i) => (
          <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",fontSize:14,borderBottom:`1px solid ${C.creamDark}` }}>
            <span style={{ color:C.steel }}>{item.item}</span>
            <span style={{ fontFamily:font.mono }}>{fmt$(item.amount)}</span>
          </div>
        ))}
        <div style={{ display:"flex",justifyContent:"space-between",marginTop:10,padding:"11px 14px",background:C.ink,borderRadius:8,color:C.white }}>
          <span style={{ fontWeight:600 }}>TOTAL</span>
          <span style={{ fontFamily:font.mono,color:C.amber,fontWeight:700,fontSize:16 }}>{fmt$(co.totalCost)}</span>
        </div>

        {/* Schedule */}
        <div style={{ marginTop:14,background:Number(co.scheduleDays)>0?"#fff8e8":C.greenLight,border:`1px solid ${Number(co.scheduleDays)>0?"#f0d080":"#a8dcc0"}`,borderRadius:8,padding:12 }}>
          <Label>Schedule Impact</Label>
          <div style={{ fontSize:14,color:C.steel }}>{co.scheduleStatement}</div>
        </div>
      </Card>

      {co.photos?.length > 0 && (
        <Card className="fu2" style={{ marginTop:12 }}>
          <Label>Site Photos ({co.photos.length})</Label>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginTop:8 }}>
            {co.photos.map((p,i) => <img key={i} src={p.src} alt={p.name} style={{ width:80,height:80,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}` }} />)}
          </div>
        </Card>
      )}

      <Card className="fu2" style={{ marginTop:12,background:C.creamDark }}>
        <Label>Terms</Label>
        <div style={{ fontSize:13,color:C.muted,lineHeight:1.6 }}>{co.terms}</div>
      </Card>
    </>
  );
}

// ── VIEW: CO Detail (after sent) ──────────────────────────────────────────────
function CODetailView({ co, project, onBack, onApprovalPage }) {
  return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"24px 16px 40px" }}>
      <button onClick={onBack} style={{ background:"none",border:"none",color:C.muted,fontSize:14,marginBottom:20,display:"flex",alignItems:"center",gap:6 }}>← {project.name}</button>
      <div className="fu" style={{ marginBottom:16 }}>
        <div style={{ fontFamily:font.display,fontSize:22,fontWeight:700 }}>Change Order</div>
      </div>
      <CODocument co={co} project={project} />
      <div style={{ marginTop:16 }}>
        <Btn onClick={onApprovalPage} variant="dark" icon="👁️" style={{ width:"100%",marginBottom:10 }}>Preview Client View</Btn>
      </div>
    </div>
  );
}

// ── VIEW: Client Approval ─────────────────────────────────────────────────────
function ClientApprovalView({ co, project, onApproved, onBack }) {
  const [status, setStatus] = useState(co.status==="approved"?"approved":"pending");
  const [sig, setSig] = useState("");

  function approve() {
    if (!sig.trim()) { alert("Please type your full name to sign."); return; }
    setStatus("approved");
    onApproved();
  }

  if (status === "approved") return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"60px 16px",textAlign:"center" }}>
      <div style={{ width:90,height:90,background:C.green,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,margin:"0 auto 24px" }}>✓</div>
      <div style={{ fontFamily:font.display,fontSize:26,fontWeight:700,marginBottom:10 }}>Change Order Approved!</div>
      <div style={{ color:C.muted,marginBottom:24 }}>Signed by <strong>{sig||"Client"}</strong> · {today()}</div>
      <Card style={{ background:C.greenLight,border:`1px solid #a8dcc0` }}>
        <div style={{ fontSize:14,color:C.green,fontWeight:500,lineHeight:1.7 }}>
          Your contractor has been notified. Work begins within 3 business days. A signed PDF has been sent to your email.
        </div>
      </Card>
    </div>
  );

  return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"0 0 40px" }}>
      <div style={{ background:C.amber,textAlign:"center",fontSize:11,fontWeight:700,letterSpacing:"0.08em",padding:"5px",color:C.ink }}>
        👇 CLIENT VIEW — this is what {project.clientName} sees
      </div>
      <div style={{ background:C.steel,padding:"18px 20px 14px",borderBottom:`3px solid ${C.amber}` }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
          <div style={{ width:30,height:30,background:C.amber,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>🔨</div>
          <div style={{ color:C.white,fontFamily:font.display,fontWeight:700,fontSize:17 }}>ChangeOrder Pro</div>
        </div>
        <div style={{ color:"rgba(255,255,255,0.55)",fontSize:12 }}>Action Required — Approval Needed</div>
      </div>

      <div style={{ padding:"20px 16px 0" }}>
        <div className="fu" style={{ marginBottom:18 }}>
          <div style={{ fontFamily:font.display,fontSize:21,fontWeight:700,lineHeight:1.3 }}>
            Hi {project.clientName.split(" ")[0]}, your contractor sent a change order.
          </div>
          <div style={{ color:C.muted,fontSize:13,marginTop:6 }}>Please review and sign below.</div>
        </div>

        <CODocument co={co} project={project} />

        <Card className="fu3" style={{ marginTop:16 }}>
          <Label>Electronic Signature</Label>
          <div style={{ fontSize:13,color:C.muted,marginBottom:10 }}>Type your full name to approve this change order.</div>
          <input value={sig} onChange={e=>setSig(e.target.value)} placeholder="Full Name"
            style={{ width:"100%",border:`2px solid ${C.border}`,borderRadius:8,padding:"13px",fontSize:16,fontFamily:"Georgia, serif",background:C.cream,outline:"none",color:C.ink,marginBottom:0 }} />
        </Card>

        <div style={{ marginTop:14 }}>
          <Btn onClick={approve} variant="primary" icon="✅" style={{ width:"100%",marginBottom:10,padding:"15px" }}>
            Approve & Sign Change Order
          </Btn>
          <Btn onClick={onBack} variant="danger" style={{ width:"100%" }}>Decline</Btn>
        </div>
        <div style={{ textAlign:"center",fontSize:11,color:C.muted,marginTop:14 }}>Powered by ChangeOrder Pro · Secure Electronic Signature</div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [projects, setProjects] = useStorage("co_projects", []);
  const [view, setView] = useState("dashboard");
  const [activeProject, setActiveProject] = useState(null);
  const [activeCO, setActiveCO] = useState(null);

  function updateProject(updated) {
    setProjects(ps => ps.map(p => p.id===updated.id ? updated : p));
    setActiveProject(updated);
  }

  function saveProject(p) {
    const exists = projects.find(x=>x.id===p.id);
    if (exists) { updateProject(p); }
    else { setProjects(ps=>[...ps,p]); setActiveProject(p); }
    setView("project");
  }

  function handleNewCO(coData) {
    const updated = { ...activeProject, cos:[...(activeProject.cos||[]),coData] };
    updateProject(updated);
    setActiveCO(coData);
    setView("co-preview");
  }

  function handleSendCO(sentCO) {
    const updated = { ...activeProject, cos: activeProject.cos.map(c=>c.id===sentCO.id?sentCO:c) };
    updateProject(updated);
    setActiveCO(sentCO);
    setView("co-detail");
  }

  function handleApproved() {
    const approved = { ...activeCO, status:"approved" };
    const updated = { ...activeProject, cos: activeProject.cos.map(c=>c.id===approved.id?approved:c) };
    updateProject(updated);
    setActiveCO(approved);
  }

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ minHeight:"100vh",background:C.cream }}>
        {view==="dashboard" && (
          <DashboardView projects={projects}
            onSelectProject={p=>{ setActiveProject(p); setView("project"); }}
            onNewProject={()=>{ setActiveProject(null); setView("new-project"); }} />
        )}
        {view==="new-project" && (
          <ProjectFormView project={activeProject}
            onSave={saveProject}
            onBack={()=>setView(activeProject?"project":"dashboard")} />
        )}
        {view==="project" && activeProject && (
          <ProjectDetailView project={activeProject}
            onNewCO={()=>setView("new-co")}
            onViewCO={co=>{ setActiveCO(co); setView("co-detail"); }}
            onBack={()=>setView("dashboard")}
            onEdit={()=>setView("new-project")} />
        )}
        {view==="new-co" && activeProject && (
          <NewCOView project={activeProject} onGenerate={handleNewCO} onBack={()=>setView("project")} />
        )}
        {view==="co-preview" && activeCO && activeProject && (
          <COPreviewView co={activeCO} project={activeProject} onSend={handleSendCO} onBack={()=>setView("new-co")} />
        )}
        {view==="co-detail" && activeCO && activeProject && (
          <CODetailView co={activeCO} project={activeProject}
            onBack={()=>setView("project")}
            onApprovalPage={()=>setView("client-approval")} />
        )}
        {view==="client-approval" && activeCO && activeProject && (
          <ClientApprovalView co={activeCO} project={activeProject}
            onApproved={handleApproved}
            onBack={()=>setView("co-detail")} />
        )}
      </div>
    </>
  );
}
