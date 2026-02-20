import { useState, useEffect, useMemo } from "react";
import { db, ref, set, remove, onValue } from "./firebase";

const MACHINE_ICONS = ["⚡","💎","🔬","🧬","💆","🩺","🔮","✨","🌟","💫","🎯","🧪","💡","🌀","❄️","🔥","💧","🌿","🏥","⭐"];
const CLINIC_COLORS = [
  "#E74C3C","#3498DB","#2ECC71","#F39C12","#9B59B6",
  "#1ABC9C","#E67E22","#34495E","#16A085","#C0392B",
  "#2980B9","#27AE60","#D35400","#8E44AD","#F1C40F"
];

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("hi-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
}

function getWeekDates(baseDate) {
  const dates = [];
  const d = new Date(baseDate + "T00:00:00");
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  for(let i=0;i<7;i++){
    const date = new Date(monday);
    date.setDate(monday.getDate()+i);
    dates.push(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`);
  }
  return dates;
}

function Modal({isOpen, onClose, title, children}) {
  if(!isOpen) return null;
  return (
    <div style={{
      position:"fixed",inset:0,zIndex:1000,
      background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:"20px",animation:"fadeIn 0.2s ease"
    }} onClick={onClose}>
      <div style={{
        background:"#1a1a2e",border:"1px solid #333",
        borderRadius:"16px",padding:"28px",maxWidth:"500px",
        width:"100%",maxHeight:"80vh",overflowY:"auto",
        boxShadow:"0 25px 60px rgba(0,0,0,0.5)"
      }} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
          <h2 style={{margin:0,fontSize:"20px",color:"#fff",fontFamily:"'DM Sans',sans-serif"}}>{title}</h2>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,0.1)",border:"none",color:"#aaa",
            width:"32px",height:"32px",borderRadius:"8px",cursor:"pointer",
            fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  width:"100%",padding:"12px 16px",background:"rgba(255,255,255,0.06)",
  border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",
  color:"#fff",fontSize:"14px",outline:"none",fontFamily:"'DM Sans',sans-serif",
  boxSizing:"border-box",transition:"border-color 0.2s"
};

const btnPrimary = {
  padding:"12px 24px",background:"linear-gradient(135deg,#667eea,#764ba2)",
  border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",
  fontWeight:"600",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"
};

const btnSecondary = {
  padding:"12px 24px",background:"rgba(255,255,255,0.08)",
  border:"1px solid rgba(255,255,255,0.15)",borderRadius:"10px",
  color:"#ccc",fontSize:"14px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"
};

export default function App() {
  const [machines, setMachines] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [bookings, setBookings] = useState({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(true);
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [bookingMachine, setBookingMachine] = useState(null);
  const [notification, setNotification] = useState(null);

  const [machineName, setMachineName] = useState("");
  const [machineType, setMachineType] = useState("");
  const [machineIcon, setMachineIcon] = useState("⚡");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicContact, setClinicContact] = useState("");
  const [bookingClinic, setBookingClinic] = useState("");
  const [bookingDate, setBookingDate] = useState(getToday());
  const [bookingNotes, setBookingNotes] = useState("");

  const showNotif = (msg, type="success") => {
    setNotification({msg,type});
    setTimeout(()=>setNotification(null),3000);
  };

  useEffect(() => {
    const machinesRef = ref(db, "machines");
    const clinicsRef = ref(db, "clinics");
    const bookingsRef = ref(db, "bookings");

    const unsub1 = onValue(machinesRef, (snap) => {
      const data = snap.val();
      setMachines(data ? Object.values(data) : []);
    });

    const unsub2 = onValue(clinicsRef, (snap) => {
      const data = snap.val();
      setClinics(data ? Object.values(data) : []);
    });

    const unsub3 = onValue(bookingsRef, (snap) => {
      const data = snap.val();
      setBookings(data || {});
      setLoading(false);
    });

    const timer = setTimeout(() => setLoading(false), 2000);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      clearTimeout(timer);
    };
  }, []);

  const handleSaveMachine = async () => {
    if(!machineName.trim()) return;
    const id = editItem ? editItem.id : Date.now().toString();
    const machine = { id, name: machineName, type: machineType, icon: machineIcon };
    await set(ref(db, `machines/${id}`), machine);
    setShowMachineModal(false);
    setMachineName(""); setMachineType(""); setMachineIcon("⚡"); setEditItem(null);
    showNotif(editItem ? "Machine updated! ✅" : "Machine added! ✅");
  };

  const deleteMachine = async (id) => {
    await remove(ref(db, `machines/${id}`));
    const keysToDelete = Object.keys(bookings).filter(k => k.startsWith(id + "_"));
    for(const key of keysToDelete) {
      await remove(ref(db, `bookings/${key}`));
    }
    showNotif("Machine deleted 🗑️");
  };

  const handleSaveClinic = async () => {
    if(!clinicName.trim()) return;
    const id = editItem ? editItem.id : Date.now().toString();
    const colorIdx = editItem ? clinics.findIndex(c=>c.id===editItem.id) : clinics.length;
    const clinic = {
      id, name: clinicName, address: clinicAddress, contact: clinicContact,
      color: editItem?.color || CLINIC_COLORS[colorIdx % CLINIC_COLORS.length]
    };
    await set(ref(db, `clinics/${id}`), clinic);
    setShowClinicModal(false);
    setClinicName(""); setClinicAddress(""); setClinicContact(""); setEditItem(null);
    showNotif(editItem ? "Clinic updated! ✅" : "Clinic added! ✅");
  };

  const deleteClinic = async (id) => {
    await remove(ref(db, `clinics/${id}`));
    const keysToDelete = Object.keys(bookings).filter(k => bookings[k].clinicId === id);
    for(const key of keysToDelete) {
      await remove(ref(db, `bookings/${key}`));
    }
    showNotif("Clinic deleted 🗑️");
  };

  const handleSaveBooking = async () => {
    if(!bookingMachine || !bookingClinic || !bookingDate) return;
    const key = `${bookingMachine}_${bookingDate}`;
    await set(ref(db, `bookings/${key}`), {
      clinicId: bookingClinic, notes: bookingNotes, bookedAt: new Date().toISOString()
    });
    setShowBookingModal(false);
    setBookingMachine(null); setBookingClinic(""); setBookingDate(getToday()); setBookingNotes("");
    showNotif("Booking saved! ✅");
  };

  const removeBooking = async (machineId, date) => {
    const key = `${machineId}_${date}`;
    await remove(ref(db, `bookings/${key}`));
    showNotif("Booking removed 🗑️");
  };

  const todayBookings = useMemo(() => {
    return Object.entries(bookings).filter(([key]) => key.endsWith(`_${selectedDate}`));
  }, [bookings, selectedDate]);

  const getClinicById = (id) => clinics.find(c=>c.id===id);
  const getMachineById = (id) => machines.find(m=>m.id===id);
  const getBookingForMachineDate = (machineId, date) => bookings[`${machineId}_${date}`] || null;
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const unallocatedToday = useMemo(() => {
    return machines.filter(m => !getBookingForMachineDate(m.id, selectedDate));
  }, [machines, bookings, selectedDate]);

  if(loading) {
    return (
      <div style={{minHeight:"100vh",background:"#0f0f23",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"}}>
        <div style={{width:"40px",height:"40px",border:"3px solid #333",borderTop:"3px solid #667eea",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{color:"#667eea",fontSize:"16px",fontFamily:"'DM Sans',sans-serif"}}>Loading...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const tabs = [
    {id:"dashboard",label:"📊 Dashboard"},
    {id:"booking",label:"📅 Bookings"},
    {id:"machines",label:"⚙️ Machines"},
    {id:"clinics",label:"🏥 Clinics"},
    {id:"week",label:"📆 Week View"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#0f0f23",color:"#e0e0e0",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        body { margin:0; }
        ::-webkit-scrollbar { width:6px;height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#333;border-radius:3px; }
        input:focus,select:focus,textarea:focus { border-color:#667eea !important; }
        .card-hover:hover { transform:translateY(-2px);box-shadow:0 8px 30px rgba(102,126,234,0.15) !important; }
      `}</style>

      {notification && (
        <div style={{
          position:"fixed",top:"20px",right:"20px",zIndex:2000,
          padding:"14px 24px",borderRadius:"12px",
          background:notification.type==="success"?"linear-gradient(135deg,#2ECC71,#27AE60)":"linear-gradient(135deg,#E74C3C,#C0392B)",
          color:"#fff",fontSize:"14px",fontWeight:"600",
          boxShadow:"0 8px 30px rgba(0,0,0,0.3)",animation:"fadeIn 0.3s ease"
        }}>{notification.msg}</div>
      )}

      <header style={{
        background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
        borderBottom:"1px solid rgba(102,126,234,0.2)",
        padding:"16px 24px",position:"sticky",top:0,zIndex:100
      }}>
        <div style={{maxWidth:"1400px",margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
            <div>
              <h1 style={{
                margin:0,fontSize:"22px",fontWeight:"700",
                background:"linear-gradient(135deg,#667eea,#764ba2)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"
              }}>🏥 MachineTrack Pro</h1>
              <p style={{margin:"2px 0 0",fontSize:"12px",color:"#888"}}>
                Wellness Clinic Machine Management • <span style={{color:"#2ECC71"}}>🟢 Live Sync</span>
              </p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <span style={{fontSize:"13px",color:"#888"}}>{formatDate(selectedDate)}</span>
              <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}
                style={{...inputStyle,width:"auto",padding:"8px 12px",fontSize:"13px"}} />
            </div>
          </div>
          <div style={{display:"flex",gap:"4px",marginTop:"16px",overflowX:"auto",paddingBottom:"4px"}}>
            {tabs.map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{
                padding:"8px 16px",border:"none",borderRadius:"8px",
                background:activeTab===tab.id?"linear-gradient(135deg,#667eea,#764ba2)":"rgba(255,255,255,0.05)",
                color:activeTab===tab.id?"#fff":"#888",
                fontSize:"13px",fontWeight:activeTab===tab.id?"600":"400",
                cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif"
              }}>{tab.label}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{maxWidth:"1400px",margin:"0 auto",padding:"24px"}}>

        {activeTab==="dashboard" && (
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px",marginBottom:"28px"}}>
              {[
                {label:"Total Machines",value:machines.length,icon:"⚙️",color:"#667eea"},
                {label:"Total Clinics",value:clinics.length,icon:"🏥",color:"#2ECC71"},
                {label:"Today Allocated",value:todayBookings.length,icon:"✅",color:"#F39C12"},
                {label:"Unallocated",value:unallocatedToday.length,icon:"⚠️",color:"#E74C3C"},
              ].map((stat,i)=>(
                <div key={i} className="card-hover" style={{
                  background:"linear-gradient(135deg,#1a1a2e,#16213e)",
                  border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",padding:"20px",
                  borderLeft:`3px solid ${stat.color}`,transition:"all 0.2s"
                }}>
                  <div style={{fontSize:"28px",marginBottom:"4px"}}>{stat.icon}</div>
                  <div style={{fontSize:"32px",fontWeight:"700",color:stat.color}}>{stat.value}</div>
                  <div style={{fontSize:"13px",color:"#888",marginTop:"2px"}}>{stat.label}</div>
                </div>
              ))}
            </div>

            <h2 style={{fontSize:"18px",fontWeight:"600",marginBottom:"16px",color:"#fff"}}>
              📋 Today's Allocations — {formatDate(selectedDate)}
            </h2>

            {todayBookings.length===0 ? (
              <div style={{textAlign:"center",padding:"40px",background:"rgba(255,255,255,0.03)",borderRadius:"14px",border:"1px dashed rgba(255,255,255,0.1)"}}>
                <div style={{fontSize:"48px",marginBottom:"12px"}}>📅</div>
                <p style={{color:"#888",fontSize:"15px"}}>{machines.length===0?"Pehle machines aur clinics add karein":"Aaj ke liye koi booking nahi hai"}</p>
                <button onClick={()=>setActiveTab(machines.length===0?"machines":"booking")} style={{...btnPrimary,marginTop:"12px"}}>
                  {machines.length===0?"Add Machines →":"Book Machines →"}
                </button>
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:"12px"}}>
                {todayBookings.map(([key,booking])=>{
                  const machineId = key.split("_")[0];
                  const machine = getMachineById(machineId);
                  const clinic = getClinicById(booking.clinicId);
                  if(!machine||!clinic) return null;
                  return (
                    <div key={key} className="card-hover" style={{
                      background:"linear-gradient(135deg,#1a1a2e,#16213e)",
                      border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"16px",
                      borderLeft:`4px solid ${clinic.color}`,display:"flex",justifyContent:"space-between",alignItems:"center"
                    }}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                          <span style={{fontSize:"20px"}}>{machine.icon}</span>
                          <span style={{fontWeight:"600",color:"#fff",fontSize:"15px"}}>{machine.name}</span>
                        </div>
                        <div style={{fontSize:"12px",color:"#888",marginTop:"4px"}}>{machine.type}</div>
                        <div style={{
                          marginTop:"8px",display:"inline-flex",alignItems:"center",gap:"6px",
                          padding:"4px 10px",borderRadius:"6px",
                          background:`${clinic.color}20`,color:clinic.color,fontSize:"13px",fontWeight:"500"
                        }}>🏥 {clinic.name}</div>
                        {booking.notes && <div style={{fontSize:"12px",color:"#666",marginTop:"6px"}}>📝 {booking.notes}</div>}
                      </div>
                      <button onClick={()=>removeBooking(machineId,selectedDate)} style={{
                        background:"rgba(231,76,60,0.15)",border:"none",color:"#E74C3C",
                        width:"32px",height:"32px",borderRadius:"8px",cursor:"pointer",fontSize:"14px"
                      }}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}

            {unallocatedToday.length>0 && (
              <div style={{marginTop:"28px"}}>
                <h3 style={{fontSize:"16px",fontWeight:"600",marginBottom:"12px",color:"#E74C3C"}}>
                  ⚠️ Unallocated Machines ({unallocatedToday.length})
                </h3>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  {unallocatedToday.map(m=>(
                    <div key={m.id} style={{
                      padding:"10px 16px",background:"rgba(231,76,60,0.1)",
                      border:"1px solid rgba(231,76,60,0.2)",borderRadius:"10px",
                      display:"flex",alignItems:"center",gap:"8px"
                    }}>
                      <span>{m.icon}</span>
                      <span style={{fontSize:"13px",color:"#ccc"}}>{m.name}</span>
                      <button onClick={()=>{
                        setBookingMachine(m.id);setBookingDate(selectedDate);setBookingClinic("");setBookingNotes("");
                        setShowBookingModal(true);
                      }} style={{
                        background:"linear-gradient(135deg,#667eea,#764ba2)",
                        border:"none",color:"#fff",padding:"4px 10px",borderRadius:"6px",fontSize:"11px",cursor:"pointer",fontWeight:"600"
                      }}>Book</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clinics.length>0 && todayBookings.length>0 && (
              <div style={{marginTop:"28px"}}>
                <h3 style={{fontSize:"16px",fontWeight:"600",marginBottom:"12px",color:"#fff"}}>🏥 Clinic-wise Summary</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:"12px"}}>
                  {clinics.map(clinic=>{
                    const cb = todayBookings.filter(([_,b])=>b.clinicId===clinic.id);
                    if(cb.length===0) return null;
                    return (
                      <div key={clinic.id} style={{
                        background:"linear-gradient(135deg,#1a1a2e,#16213e)",
                        border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"16px",
                        borderTop:`3px solid ${clinic.color}`
                      }}>
                        <div style={{fontWeight:"600",color:clinic.color,fontSize:"15px"}}>{clinic.name}</div>
                        <div style={{fontSize:"12px",color:"#666",marginTop:"2px"}}>{clinic.address}</div>
                        <div style={{marginTop:"10px",fontSize:"24px",fontWeight:"700",color:"#fff"}}>
                          {cb.length} <span style={{fontSize:"13px",color:"#888",fontWeight:"400"}}>machines</span>
                        </div>
                        {cb.map(([key])=>{
                          const machine = getMachineById(key.split("_")[0]);
                          return machine ? <div key={key} style={{fontSize:"12px",color:"#aaa",marginTop:"4px"}}>{machine.icon} {machine.name}</div> : null;
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab==="booking" && (
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <h2 style={{margin:"0 0 20px",fontSize:"18px",color:"#fff"}}>📅 Machine Booking — {formatDate(selectedDate)}</h2>

            {machines.length===0||clinics.length===0 ? (
              <div style={{textAlign:"center",padding:"40px",background:"rgba(255,255,255,0.03)",borderRadius:"14px",border:"1px dashed rgba(255,255,255,0.1)"}}>
                <p style={{color:"#888"}}>Pehle machines aur clinics add karein</p>
              </div>
            ) : (
              <div style={{display:"grid",gap:"10px"}}>
                {machines.map(machine=>{
                  const booking = getBookingForMachineDate(machine.id,selectedDate);
                  const clinic = booking ? getClinicById(booking.clinicId) : null;
                  return (
                    <div key={machine.id} className="card-hover" style={{
                      background:"linear-gradient(135deg,#1a1a2e,#16213e)",
                      border:booking?`1px solid ${clinic?.color||'#333'}40`:"1px solid rgba(255,255,255,0.08)",
                      borderRadius:"12px",padding:"16px",
                      display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"12px"
                    }}>
                      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                        <div style={{
                          width:"44px",height:"44px",borderRadius:"10px",
                          background:booking?`${clinic?.color}20`:"rgba(255,255,255,0.05)",
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px"
                        }}>{machine.icon}</div>
                        <div>
                          <div style={{fontWeight:"600",color:"#fff",fontSize:"15px"}}>{machine.name}</div>
                          <div style={{fontSize:"12px",color:"#888"}}>{machine.type}</div>
                        </div>
                      </div>
                      {booking ? (
                        <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
                          <div style={{
                            padding:"6px 14px",borderRadius:"8px",
                            background:`${clinic?.color}20`,color:clinic?.color,fontSize:"13px",fontWeight:"500"
                          }}>🏥 {clinic?.name}</div>
                          <button onClick={()=>removeBooking(machine.id,selectedDate)} style={{
                            background:"rgba(231,76,60,0.15)",border:"none",color:"#E74C3C",
                            padding:"6px 12px",borderRadius:"8px",cursor:"pointer",fontSize:"12px"
                          }}>Remove</button>
                          <button onClick={()=>{
                            setBookingMachine(machine.id);setBookingClinic(booking.clinicId);
                            setBookingDate(selectedDate);setBookingNotes(booking.notes||"");
                            setShowBookingModal(true);
                          }} style={{
                            background:"rgba(102,126,234,0.15)",border:"none",color:"#667eea",
                            padding:"6px 12px",borderRadius:"8px",cursor:"pointer",fontSize:"12px"
                          }}>Change</button>
                        </div>
                      ) : (
                        <button onClick={()=>{
                          setBookingMachine(machine.id);setBookingDate(selectedDate);
                          setBookingClinic("");setBookingNotes("");setShowBookingModal(true);
                        }} style={btnPrimary}>+ Allocate</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab==="machines" && (
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
              <h2 style={{margin:0,fontSize:"18px",color:"#fff"}}>⚙️ Machines ({machines.length})</h2>
              <button onClick={()=>{
                setEditItem(null);setMachineName("");setMachineType("");setMachineIcon("⚡");
                setShowMachineModal(true);
              }} style={btnPrimary}>+ Add Machine</button>
            </div>
            {machines.length===0 ? (
              <div style={{textAlign:"center",padding:"60px 20px",background:"rgba(255,255,255,0.03)",borderRadius:"14px",border:"1px dashed rgba(255,255,255,0.1)"}}>
                <div style={{fontSize:"56px",marginBottom:"16px"}}>⚙️</div>
                <p style={{color:"#888",fontSize:"16px"}}>Koi machine nahi hai</p>
                <p style={{color:"#666",fontSize:"13px"}}>Shuru karne ke liye machines add karein</p>
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"12px"}}>
                {machines.map((m,idx)=>(
                  <div key={m.id} className="card-hover" style={{
                    background:"linear-gradient(135deg,#1a1a2e,#16213e)",
                    border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",padding:"20px",
                    animation:`slideIn 0.3s ease ${idx*0.05}s both`
                  }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                        <div style={{
                          width:"48px",height:"48px",borderRadius:"12px",
                          background:"linear-gradient(135deg,#667eea20,#764ba220)",
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px"
                        }}>{m.icon}</div>
                        <div>
                          <div style={{fontWeight:"600",color:"#fff",fontSize:"16px"}}>{m.name}</div>
                          <div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>{m.type||"General"}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:"4px"}}>
                        <button onClick={()=>{
                          setEditItem(m);setMachineName(m.name);setMachineType(m.type);setMachineIcon(m.icon);
                          setShowMachineModal(true);
                        }} style={{
                          background:"rgba(255,255,255,0.06)",border:"none",color:"#888",
                          width:"30px",height:"30px",borderRadius:"6px",cursor:"pointer",fontSize:"13px"
                        }}>✏️</button>
                        <button onClick={()=>{if(confirm("Delete this machine?"))deleteMachine(m.id)}} style={{
                          background:"rgba(231,76,60,0.1)",border:"none",color:"#E74C3C",
                          width:"30px",height:"30px",borderRadius:"6px",cursor:"pointer",fontSize:"13px"
                        }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab==="clinics" && (
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
              <h2 style={{margin:0,fontSize:"18px",color:"#fff"}}>🏥 Clinics ({clinics.length})</h2>
              <button onClick={()=>{
                setEditItem(null);setClinicName("");setClinicAddress("");setClinicContact("");
                setShowClinicModal(true);
              }} style={btnPrimary}>+ Add Clinic</button>
            </div>
            {clinics.length===0 ? (
              <div style={{textAlign:"center",padding:"60px 20px",background:"rgba(255,255,255,0.03)",borderRadius:"14px",border:"1px dashed rgba(255,255,255,0.1)"}}>
                <div style={{fontSize:"56px",marginBottom:"16px"}}>🏥</div>
                <p style={{color:"#888",fontSize:"16px"}}>Koi clinic nahi hai</p>
                <p style={{color:"#666",fontSize:"13px"}}>Apni clinics add karein</p>
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"12px"}}>
                {clinics.map((c,idx)=>(
                  <div key={c.id} className="card-hover" style={{
                    background:"linear-gradient(135deg,#1a1a2e,#16213e)",
                    border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",padding:"20px",
                    borderTop:`3px solid ${c.color}`,animation:`slideIn 0.3s ease ${idx*0.05}s both`
                  }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:"600",color:c.color,fontSize:"16px"}}>{c.name}</div>
                        {c.address && <div style={{fontSize:"13px",color:"#888",marginTop:"6px"}}>📍 {c.address}</div>}
                        {c.contact && <div style={{fontSize:"13px",color:"#888",marginTop:"4px"}}>📞 {c.contact}</div>}
                      </div>
                      <div style={{display:"flex",gap:"4px"}}>
                        <button onClick={()=>{
                          setEditItem(c);setClinicName(c.name);setClinicAddress(c.address);setClinicContact(c.contact);
                          setShowClinicModal(true);
                        }} style={{
                          background:"rgba(255,255,255,0.06)",border:"none",color:"#888",
                          width:"30px",height:"30px",borderRadius:"6px",cursor:"pointer",fontSize:"13px"
                        }}>✏️</button>
                        <button onClick={()=>{if(confirm("Delete this clinic?"))deleteClinic(c.id)}} style={{
                          background:"rgba(231,76,60,0.1)",border:"none",color:"#E74C3C",
                          width:"30px",height:"30px",borderRadius:"6px",cursor:"pointer",fontSize:"13px"
                        }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab==="week" && (
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}>
              <h2 style={{margin:0,fontSize:"18px",color:"#fff"}}>📆 Weekly Overview</h2>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>{
                  const d=new Date(selectedDate+"T00:00:00");d.setDate(d.getDate()-7);
                  setSelectedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
                }} style={btnSecondary}>← Prev</button>
                <button onClick={()=>setSelectedDate(getToday())} style={btnSecondary}>Today</button>
                <button onClick={()=>{
                  const d=new Date(selectedDate+"T00:00:00");d.setDate(d.getDate()+7);
                  setSelectedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
                }} style={btnSecondary}>Next →</button>
              </div>
            </div>

            {machines.length===0 ? (
              <p style={{color:"#888"}}>Pehle machines add karein</p>
            ) : (
              <div style={{overflowX:"auto",borderRadius:"14px",border:"1px solid rgba(255,255,255,0.08)"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:"800px"}}>
                  <thead>
                    <tr>
                      <th style={{
                        padding:"14px 16px",textAlign:"left",fontSize:"13px",color:"#888",
                        background:"#1a1a2e",borderBottom:"1px solid rgba(255,255,255,0.08)",
                        position:"sticky",left:0,zIndex:10,minWidth:"150px"
                      }}>Machine</th>
                      {weekDates.map(date=>(
                        <th key={date} style={{
                          padding:"14px 12px",textAlign:"center",fontSize:"12px",
                          color:date===getToday()?"#667eea":"#888",
                          background:date===getToday()?"rgba(102,126,234,0.08)":"#1a1a2e",
                          borderBottom:"1px solid rgba(255,255,255,0.08)",minWidth:"120px"
                        }}>
                          {new Date(date+"T00:00:00").toLocaleDateString("hi-IN",{weekday:"short",day:"numeric",month:"short"})}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {machines.map(machine=>(
                      <tr key={machine.id}>
                        <td style={{
                          padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",
                          background:"#0f0f23",position:"sticky",left:0,zIndex:5
                        }}>
                          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                            <span>{machine.icon}</span>
                            <div>
                              <div style={{fontWeight:"600",color:"#fff",fontSize:"13px"}}>{machine.name}</div>
                              <div style={{fontSize:"11px",color:"#666"}}>{machine.type}</div>
                            </div>
                          </div>
                        </td>
                        {weekDates.map(date=>{
                          const booking = getBookingForMachineDate(machine.id,date);
                          const clinic = booking ? getClinicById(booking.clinicId) : null;
                          return (
                            <td key={date} style={{
                              padding:"8px",textAlign:"center",
                              borderBottom:"1px solid rgba(255,255,255,0.05)",
                              background:date===getToday()?"rgba(102,126,234,0.04)":"transparent"
                            }}>
                              {clinic ? (
                                <div style={{
                                  padding:"6px 8px",borderRadius:"8px",
                                  background:`${clinic.color}18`,color:clinic.color,
                                  fontSize:"11px",fontWeight:"500",cursor:"pointer"
                                }} onClick={()=>removeBooking(machine.id,date)} title="Click to remove">
                                  {clinic.name}
                                </div>
                              ) : (
                                <button onClick={()=>{
                                  setBookingMachine(machine.id);setBookingDate(date);
                                  setBookingClinic("");setBookingNotes("");setShowBookingModal(true);
                                }} style={{
                                  background:"rgba(255,255,255,0.03)",border:"1px dashed rgba(255,255,255,0.1)",
                                  borderRadius:"8px",padding:"6px 8px",color:"#555",
                                  cursor:"pointer",fontSize:"16px",width:"100%"
                                }}>+</button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <Modal isOpen={showMachineModal} onClose={()=>setShowMachineModal(false)} title={editItem?"Edit Machine":"Add New Machine"}>
        <div style={{display:"grid",gap:"16px"}}>
          <div>
            <label style={{fontSize:"13px",color:"#888",marginBottom:"6px",display:"block"}}>Machine Name *</label>
            <input value={machineName} onChange={e=>setMachineName(e.target.value)} placeholder="e.g., Laser Machine 1" style={inputStyle} />
          </div>
          <div>
            <label style={{fontSize:"13px",color:"#888",marginBottom:"6px",display:"block"}}>Type / Category</label>
            <input value={machineType} onChange={e=>setMachineType(e.target.value)} placeholder="e.g., HydraFacial, Laser, Cryotherapy" style={inputStyle} />
          </div>
          <div>
            <label style={{fontSize:"13px",color:"#888",marginBottom:"6px",display:"block"}}>Icon</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
              {MACHINE_ICONS.map(icon=>(
                <button key={icon} onClick={()=>setMachineIcon(icon)} style={{
                  width:"40px",height:"40px",borderRadius:"8px",
                  border:machineIcon===icon?"2px solid #667eea":"1px solid rgba(255,255,255,0.1)",
                  background:machineIcon===icon?"rgba(102,126,234,0.2)":"rgba(255,255,255,0.05)",
                  fontSize:"20px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"
                }}>{icon}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:"10px",marginTop:"8px"}}>
            <button onClick={handleSaveMachine} style={{...btnPrimary,flex:1}}>{editItem?"Update":"Add Machine"}</button>
            <button onClick={()=>setShowMachineModal(false)} style={btnSecondary}>Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showClinicModal} onClose={()=>setShowClinicModal(false)} title={editItem?"Edit Clinic":"Add New Clinic"}>
        <div style={{display:"grid",gap:"16px"}}>
          <div>
            <label style={{fontSize:"13px",color:"#888",marginBottom:"6px",display:"block"}}>Clinic Name *</label>
            <input value={clinicName} onChange={e=>setClinicName(e.target.value)} placeholder="e.g., Wellness Hub - Sector 18" style={inputStyle} />
          </div>
          <div>
            <label style={{fontSize:"13px",color:"#888",marginBottom:"6px",display:"block"}}>Address</label>
            <input value={clinicAddress} onChange={e=>setClinicAddress(e.target.value)} placeholder="e.g., Sector 18, Noida" style={inputStyle} />
          </div>
          <div>
            <label style={{fontSize:"13px",color:"#888",marginBottom:"6px",display:"block"}}>Contact Number</label>
            <input value={clinicContact} onChange={e=>setClinicContact(e.target.value)} placeholder="e.g., +91 98765 43210" style={inputStyle} />
          </div>
          <div style={{display:"flex",gap:"10px",marginTop:"8px"}}>
            <button onClick={handleSaveClinic} style={{...btnPrimary,flex:1}}>{editItem?"Update":"Add Clinic"}</button>
            <button onClick={()=>setShowClinicModal(false)} style={btnSecondary}>Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showBookingModal} onClose={()=>setShowBookingModal(false)} title="Allocate Machine">
        <div style={{display:"grid",gap:"16px"}}>
          {bookingMachine && getMachineById(bookingMachine) && (
            <div style={{
              padding:"12px 16px",borderRadius:"10px",
              background:"rgba(102,126,234,0.1)",border:"1px solid rgba(102,126,234,0.2)",
              display:"flex",alignItems:"center",gap:"10px"
            }}>
              <span style={{fontSize:"22px"}}>{getMachineById(bookingMachine)?.icon}</span>
              <div>
                <div style={{fontWeight:"600",color:"#fff",fontSize:"14px"}}>{getMachineById(bookingMachine)?.name}</div>
                <div style={{fontSize:"12px",color:"#888"}}>{getMachineById(bookingMachine)?.type}</div>
              </div>
            </div>
          )}
          <div>
            <label style={{fontSize:"13px",color:"#888",marginBottom:"6px",display:"block"}}>Date</label>
            <input type="date" value={bookingDate} onChange={e=>setBookingDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{fontSize:"13px",color:"#888",marginBottom:"6px",display:"block"}}>Assign to Clinic *</label>
            <select value={bookingClinic} onChange={e=>setBookingClinic(e.target.value)} style={{...inputStyle,appearance:"auto"}}>
              <option value="">-- Select Clinic --</option>
              {clinics.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label style={{fontSize:"13px",color:"#888",marginBottom:"6px",display:"block"}}>Notes (Optional)</label>
            <textarea value={bookingNotes} onChange={e=>setBookingNotes(e.target.value)}
              placeholder="e.g., Morning shift, Contact person name..."
              rows={3} style={{...inputStyle,resize:"vertical"}} />
          </div>
          <button onClick={handleSaveBooking} style={{...btnPrimary,width:"100%"}}>Confirm Allocation</button>
        </div>
      </Modal>
    </div>
  );
}
