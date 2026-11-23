import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Users, MapPin, ReceiptText, Wallet, Search,
  Plus, Menu, X, ChevronRight, ArrowUpRight, IndianRupee,
  CalendarDays, UserRound, Download, CheckCircle2, Store, Filter
} from "lucide-react";

const initialCustomers = [
  { id: "JC1001", name: "Ramesh Kumar", phone: "9876543210", area: "West Street", village: "Tambaram", joined: "2026-06-12", status: "Active" },
  { id: "JC1002", name: "Lakshmi", phone: "9876501234", area: "Gandhi Road", village: "Chitlapakkam", joined: "2026-07-02", status: "Active" },
  { id: "JC1003", name: "Selvam", phone: "9840012345", area: "Market Street", village: "Sembakkam", joined: "2026-05-18", status: "Active" },
  { id: "JC1004", name: "Meena", phone: "9000012345", area: "North Street", village: "Tambaram", joined: "2026-08-01", status: "Inactive" }
];
const initialPayments = [
  { id: "TXN001", customerId: "JC1001", date: "2026-11-02", amount: 2000, receipt: "R-001", mode: "Cash", enteredBy: "Office" },
  { id: "TXN002", customerId: "JC1001", date: "2026-11-12", amount: 1500, receipt: "R-002", mode: "Cash", enteredBy: "Office" },
  { id: "TXN003", customerId: "JC1002", date: "2026-11-08", amount: 3000, receipt: "R-003", mode: "UPI", enteredBy: "Office" },
  { id: "TXN004", customerId: "JC1003", date: "2026-11-15", amount: 1000, receipt: "R-004", mode: "Cash", enteredBy: "Office" },
  { id: "TXN005", customerId: "JC1004", date: "2026-11-18", amount: 2500, receipt: "R-005", mode: "Cash", enteredBy: "Office" }
];
const initialAreas = ["West Street", "Gandhi Road", "Market Street", "North Street"];

const money = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const today = () => new Date().toISOString().slice(0, 10);
const readStore = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
};

export default function App() {
  const [customers, setCustomers] = useState(() => readStore("jm_customers", initialCustomers).map(c => c.status === "Closed" ? { ...c, status: "Inactive" } : c));
  const [payments, setPayments] = useState(() => readStore("jm_payments", initialPayments));
  const [areas, setAreas] = useState(() => readStore("jm_areas", initialAreas));
  const [page, setPage] = useState("dashboard");
  const [selectedId, setSelectedId] = useState("JC1001");
  const [search, setSearch] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const persist = (key, value, setter) => {
    setter(value);
    localStorage.setItem(key, JSON.stringify(value));
  };
  const customerTotals = useMemo(() => {
    const map = {};
    payments.forEach(p => map[p.customerId] = (map[p.customerId] || 0) + Number(p.amount));
    return map;
  }, [payments]);
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const activeCustomers = customers.filter(c => c.status === "Active").length;
  const selectedCustomer = customers.find(c => c.id === selectedId);
  const selectedPayments = payments.filter(p => p.customerId === selectedId).sort((a,b) => b.date.localeCompare(a.date));
  const filteredCustomers = customers.filter(c =>
    [c.name, c.id, c.phone, c.area, c.village].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const navItems = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["customers", "Customers", Users],
    ["areas", "Areas", MapPin],
    ["collections", "Collection entries", ReceiptText],
    ["statement", "Customer statement", Wallet]
  ];
  const navigate = (p) => { setPage(p); setMobileOpen(false); setSearch(""); };

  function updateCustomerStatus(id, status) {
    const next = customers.map(c => c.id === id ? { ...c, status } : c);
    persist("jm_customers", next, setCustomers);
    setNotice(`Customer status changed to ${status}.`);
  }

  function deleteCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    if (payments.some(p => p.customerId === id)) {
      setNotice("This customer has receipt history and cannot be deleted. Change the status to Inactive instead.");
      return;
    }
    if (!window.confirm(`Delete ${customer.name}? This cannot be undone.`)) return;
    const next = customers.filter(c => c.id !== id);
    persist("jm_customers", next, setCustomers);
    if (selectedId === id) setSelectedId(next[0]?.id || "");
    setNotice("Customer deleted.");
  }

  function addCustomer(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const customer = {
      id: `JC${Math.max(1000, ...customers.map(c => Number(String(c.id).replace("JC", "")) || 0) ) + 1}`,
      name: f.get("name").trim(),
      phone: f.get("phone").trim(),
      area: f.get("area"),
      village: f.get("village").trim(),
      joined: f.get("joined"),
      status: f.get("status") || "Active"
    };
    const next = [...customers, customer];
    persist("jm_customers", next, setCustomers);
    setSelectedId(customer.id);
    setShowCustomerForm(false);
    setNotice("Customer added successfully.");
    navigate("customers");
  }

  function addPayment(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payment = {
      id: `TXN${String(payments.length + 1).padStart(3, "0")}`,
      customerId: f.get("customerId"),
      date: f.get("date"),
      amount: Number(f.get("amount")),
      receipt: f.get("receipt").trim(),
      mode: f.get("mode"),
      enteredBy: "Office"
    };
    if (payments.some(p => p.receipt.toLowerCase() === payment.receipt.toLowerCase())) {
      setNotice("That receipt number already exists. Please check the paper receipt.");
      return;
    }
    persist("jm_payments", [...payments, payment], setPayments);
    setSelectedId(payment.customerId);
    setShowPaymentForm(false);
    setNotice("Collection entry saved in this demo.");
    navigate("statement");
  }

  function addArea(e) {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get("area").trim();
    if (name && !areas.some(a => a.toLowerCase() === name.toLowerCase())) {
      persist("jm_areas", [...areas, name], setAreas);
      setNotice("Area added.");
    } else setNotice("Area already exists or is empty.");
    setShowAreaForm(false);
  }

  function exportCsv() {
    const rows = [["Receipt", "Date", "Customer ID", "Customer", "Area", "Amount", "Mode"]];
    payments.forEach(p => {
      const c = customers.find(x => x.id === p.customerId);
      rows.push([p.receipt, p.date, p.customerId, c?.name || "", c?.area || "", p.amount, p.mode]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = "jewelmanager-demo-collections.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const title = navItems.find(n => n[0] === page)?.[1] || "Dashboard";

  return (
    <div className="app-shell">
      {mobileOpen && <div className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Store size={21}/></div>
          <div><div className="brand-name">JewelManager</div><div className="brand-caption">COLLECTION DESK</div></div>
          <button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)}><X size={19}/></button>
        </div>
        <div className="shop-switch">
          <div className="shop-avatar">S</div>
          <div className="min-w-0"><div className="shop-name">Sri Lakshmi Jewellers</div><div className="shop-caption">Demo workspace</div></div>
          <span className="demo-dot"/>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav">
          {navItems.map(([id, label, Icon]) => (
            <button key={id} className={`nav-link ${page === id ? "active" : ""}`} onClick={() => navigate(id)}>
              <Icon size={18}/><span>{label}</span>{page === id && <ChevronRight size={15} className="nav-chevron"/>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-note"><span className="demo-dot"/> Demo mode <span className="ms-auto">No login</span></div>
          <div className="profile-row"><div className="profile-avatar">AD</div><div><div className="profile-name">Demo Admin</div><div className="profile-role">Shop administrator</div></div></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="d-flex align-items-center gap-3">
            <button className="icon-btn menu-toggle" onClick={() => setMobileOpen(true)}><Menu size={21}/></button>
            <div><div className="breadcrumb">Workspace <span>/</span> {title}</div><h1 className="page-title">{title}</h1></div>
          </div>
          <div className="topbar-right">
            <div className="today-pill"><CalendarDays size={15}/>{new Date().toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"})}</div>
            <div className="top-avatar">AD</div>
          </div>
        </header>

        {notice && <div className="notice"><CheckCircle2 size={17}/>{notice}<button onClick={() => setNotice("")}><X size={15}/></button></div>}

        <div className="content">
          {page === "dashboard" && <Dashboard customers={customers} payments={payments} totalCollected={totalCollected} activeCustomers={activeCustomers} customerTotals={customerTotals} onNavigate={navigate} onAdd={() => setShowPaymentForm(true)} />}
          {page === "customers" && <Customers customers={filteredCustomers} allCustomers={customers} customerTotals={customerTotals} search={search} setSearch={setSearch} onAdd={() => setShowCustomerForm(true)} onStatement={(id) => {setSelectedId(id);navigate("statement");}} onStatusChange={updateCustomerStatus} onDelete={deleteCustomer} />}
          {page === "areas" && <Areas areas={areas} customers={customers} onAdd={() => setShowAreaForm(true)} />}
          {page === "collections" && <Collections payments={payments} customers={customers} onAdd={() => setShowPaymentForm(true)} onStatement={(id) => {setSelectedId(id);navigate("statement");}} />}
          {page === "statement" && <Statement customers={customers} selectedCustomer={selectedCustomer} selectedId={selectedId} setSelectedId={setSelectedId} payments={selectedPayments} total={customerTotals[selectedId] || 0} onAdd={() => setShowPaymentForm(true)} />}
        </div>
        <footer className="footer"><span>JewelManager Demo</span><span>Sample data · Stored in this browser only</span></footer>
      </main>

      {showCustomerForm && <Modal title="Add new customer" onClose={() => setShowCustomerForm(false)}>
        <form onSubmit={addCustomer} className="form-grid">
          <Field label="Customer name" name="name" placeholder="e.g. Ramesh Kumar" required/>
          <Field label="Mobile number" name="phone" placeholder="10-digit mobile number" required pattern="[0-9]{10}"/>
          <div><label className="form-label">Area / Street</label><select name="area" className="form-select" required><option value="">Select area</option>{areas.map(a=><option key={a}>{a}</option>)}</select></div>
          <Field label="Village / Town" name="village" placeholder="e.g. Tambaram" required/>
          <Field label="Joined date" name="joined" type="date" defaultValue={today()} required/>
          <div><label className="form-label">Account status</label><select name="status" className="form-select" defaultValue="Active"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
          <div className="form-actions"><button type="button" className="btn btn-light" onClick={() => setShowCustomerForm(false)}>Cancel</button><button className="btn btn-primary">Save customer</button></div>
        </form>
      </Modal>}
      {showPaymentForm && <Modal title="Enter paper receipt" onClose={() => setShowPaymentForm(false)}>
        <CollectionForm customers={customers} areas={areas} defaultCustomerId={selectedId} onSubmit={addPayment} onCancel={() => setShowPaymentForm(false)} />
      </Modal>}
      {showAreaForm && <Modal title="Add area" onClose={() => setShowAreaForm(false)}>
        <form onSubmit={addArea} className="form-grid">
          <Field label="Area / Street name" name="area" placeholder="e.g. Lake View Road" required/>
          <div className="form-actions"><button type="button" className="btn btn-light" onClick={() => setShowAreaForm(false)}>Cancel</button><button className="btn btn-primary">Add area</button></div>
        </form>
      </Modal>}
    </div>
  );
}

function Dashboard({customers,payments,totalCollected,activeCustomers,customerTotals,onNavigate,onAdd}) {
  const recent = [...payments].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const todayTotal = payments.filter(p=>p.date===today()).reduce((s,p)=>s+p.amount,0);
  return <>
    <div className="welcome-row"><div><div className="eyebrow">OVERVIEW</div><h2>Good morning, Admin <span>✦</span></h2><p>Here's what's happening with your collection accounts.</p></div><button className="btn btn-primary" onClick={onAdd}><Plus size={17}/> New collection</button></div>
    <div className="stats-grid">
      <Stat icon={Users} label="Total customers" value={customers.length} foot={`${activeCustomers} active accounts`} tone="blue"/>
      <Stat icon={Wallet} label="Total savings collected" value={money(totalCollected)} foot="Across all customer accounts" tone="green"/>
      <Stat icon={ReceiptText} label="Total entries" value={payments.length} foot="Paper receipts entered" tone="purple"/>
      <Stat icon={CalendarDays} label="Today's collection" value={money(todayTotal)} foot="Based on entry date" tone="orange"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel recent-panel">
        <div className="panel-head"><div><h3>Recent collection entries</h3><p>Latest receipts entered into the system</p></div><button className="text-action" onClick={()=>onNavigate("collections")}>View all <ArrowUpRight size={15}/></button></div>
        <PaymentTable payments={recent} customers={customers} compact/>
      </section>
      <section className="panel quick-panel">
        <div className="panel-head"><div><h3>Quick actions</h3><p>Common tasks</p></div></div>
        <button className="quick-action" onClick={()=>onNavigate("customers")}><span className="quick-icon blue"><Users size={18}/></span><span><b>Manage customers</b><small>Add or find a customer</small></span><ChevronRight size={17}/></button>
        <button className="quick-action" onClick={onAdd}><span className="quick-icon green"><Plus size={18}/></span><span><b>Enter collection</b><small>Record a paper receipt</small></span><ChevronRight size={17}/></button>
        <button className="quick-action" onClick={()=>onNavigate("areas")}><span className="quick-icon amber"><MapPin size={18}/></span><span><b>Manage areas</b><small>Organise customer locations</small></span><ChevronRight size={17}/></button>
      </section>
    </div>
    <section className="panel bottom-panel"><div className="panel-head"><div><h3>Customer accounts</h3><p>Quick view of customer savings</p></div><button className="text-action" onClick={()=>onNavigate("customers")}>All customers <ArrowUpRight size={15}/></button></div>
      <div className="mini-customer-grid">{customers.slice(0,4).map(c=><div className="mini-customer" key={c.id}><div className="customer-initial">{c.name[0]}</div><div className="min-w-0"><b>{c.name}</b><small>{c.village} · {c.id}</small></div><strong>{money(customerTotals[c.id]||0)}</strong></div>)}</div>
    </section>
  </>;
}

function Stat({icon:Icon,label,value,foot,tone}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-foot">{foot}</div></div>;
}

function Customers({customers,allCustomers,customerTotals,search,setSearch,onAdd,onStatement,onStatusChange,onDelete}) {
  return <>
    <div className="page-intro"><div><h2>Customers</h2><p>Manage customer profiles and view their savings.</p></div><button className="btn btn-primary" onClick={onAdd}><Plus size={17}/> Add customer</button></div>
    <section className="panel">
      <div className="table-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, ID, mobile or area..."/></div><span className="result-count">{customers.length} of {allCustomers.length} customers</span></div>
      <div className="table-responsive"><table className="table data-table"><thead><tr><th>Customer</th><th>Area / Village</th><th>Mobile</th><th>Total savings</th><th>Status</th><th></th></tr></thead><tbody>
        {customers.map(c=><tr key={c.id}><td><div className="table-person"><div className="customer-initial">{c.name[0]}</div><div><b>{c.name}</b><small>{c.id}</small></div></div></td><td>{c.area}<small className="cell-sub">{c.village}</small></td><td>{c.phone}</td><td className="amount-cell">{money(customerTotals[c.id]||0)}</td><td><select className="form-select status-select" value={c.status} onChange={e=>onStatusChange(c.id,e.target.value)}><option>Active</option><option>Inactive</option></select></td><td><div className="customer-actions"><button className="view-btn" onClick={()=>onStatement(c.id)}>Statement <ChevronRight size={14}/></button><button className="delete-btn" title="Delete customer" onClick={()=>onDelete(c.id)}><X size={15}/></button></div></td></tr>)}
        {customers.length===0&&<tr><td colSpan="6" className="empty-state">No customers found. Try another search.</td></tr>}
      </tbody></table></div>
    </section>
  </>;
}

function Areas({areas,customers,onAdd}) {
  return <>
    <div className="page-intro"><div><h2>Areas</h2><p>Organise customers by village, street and collection area.</p></div><button className="btn btn-primary" onClick={onAdd}><Plus size={17}/> Add area</button></div>
    <div className="area-grid">{areas.map((a,i)=>{const count=customers.filter(c=>c.area===a).length;return <div className="area-card" key={a}><div className="area-card-top"><span className="area-icon"><MapPin size={19}/></span><span className="area-code">AREA {String(i+1).padStart(2,"0")}</span></div><h3>{a}</h3><p>{count} registered customers</p><div className="area-progress"><span style={{width:`${Math.min(count*12,100)}%`}}/></div></div>})}</div>
  </>;
}

function Collections({payments,customers,onAdd,onStatement}) {
  return <>
    <div className="page-intro"><div><h2>Collection entries</h2><p>Digital records entered from physical paper receipts.</p></div><button className="btn btn-primary" onClick={onAdd}><Plus size={17}/> Enter receipt</button></div>
    <section className="panel"><div className="table-toolbar"><div><b className="toolbar-title">All transactions</b><small className="toolbar-sub">{payments.length} receipt entries</small></div><span className="result-count">Paper receipt register</span></div><PaymentTable payments={[...payments].sort((a,b)=>b.date.localeCompare(a.date))} customers={customers} onStatement={onStatement}/></section>
  </>;
}

function PaymentTable({payments,customers,compact=false,onStatement}) {
  return <div className="table-responsive"><table className="table data-table"><thead><tr><th>Receipt</th><th>Customer</th><th>Date</th><th>Mode</th><th className="text-end">Amount</th></tr></thead><tbody>
    {payments.map(p=>{const c=customers.find(x=>x.id===p.customerId);return <tr key={p.id}><td><span className="receipt-tag">{p.receipt}</span></td><td><button className="customer-link" onClick={()=>onStatement?.(p.customerId)}>{c?.name||"Unknown"}<small>{p.customerId}</small></button></td><td>{new Date(p.date+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td><td><span className="mode-tag">{p.mode}</span></td><td className="text-end amount-cell">{money(p.amount)}</td></tr>})}
    {payments.length===0&&<tr><td colSpan="5" className="empty-state">No collection entries yet.</td></tr>}
  </tbody></table></div>;
}

function Statement({customers,selectedCustomer,selectedId,setSelectedId,payments,total,onAdd}) {
  const [filter,setFilter] = useState("");
  const [area,setArea] = useState(selectedCustomer?.area || "");
  useEffect(() => { if (selectedCustomer?.area) setArea(selectedCustomer.area); }, [selectedId]);
  const areaOptions = [...new Set(customers.map(c=>c.area))].sort();
  const areaCustomers = customers.filter(c=>c.area===area);
  const currentCustomer = customers.find(c=>c.id===selectedId);
  const visible = payments.filter(p=>!filter || p.date.startsWith(filter));
  const chooseArea = (value) => {
    setArea(value);
    const first = customers.find(c=>c.area===value);
    setSelectedId(first?.id || "");
  };
  if (!customers.length) return <div className="panel empty-state">Add a customer to view a statement.</div>;
  return <>
    <div className="page-intro"><div><h2>Customer statement</h2><p>Choose an area first, then select a customer to view their receipt history.</p></div><button className="btn btn-primary" onClick={onAdd}><Plus size={17}/> Enter collection</button></div>
    <section className="statement-head panel">
      <div className="statement-person"><div className="statement-avatar">{currentCustomer?.name?.[0] || "?"}</div><div><div className="eyebrow">CUSTOMER ACCOUNT</div><h2>{currentCustomer?.name || "Select a customer"}</h2><p>{currentCustomer ? `${currentCustomer.id} · ${currentCustomer.area}, ${currentCustomer.village}` : "Choose a customer below"}</p></div></div>
      <div className="statement-select statement-select-grid">
        <div><label className="form-label">1. Select area</label><select className="form-select" value={area} onChange={e=>chooseArea(e.target.value)}><option value="">Select area</option>{areaOptions.map(a=><option key={a} value={a}>{a}</option>)}</select></div>
        <div><label className="form-label">2. Select customer</label><select className="form-select" value={areaCustomers.some(c=>c.id===selectedId)?selectedId:""} onChange={e=>setSelectedId(e.target.value)} disabled={!area}><option value="">Select customer</option>{areaCustomers.map(c=><option value={c.id} key={c.id}>{c.name} · {c.id}</option>)}</select></div>
        <div><label className="form-label">3. Mobile number</label><input className="form-control" value={currentCustomer?.id===selectedId && currentCustomer?.area===area ? currentCustomer.phone : ""} placeholder="Auto-filled" readOnly /></div>
      </div>
    </section>
    {currentCustomer && currentCustomer.area===area && <>
      <div className="statement-summary">
        <div className="summary-card"><span>Total savings collected</span><strong>{money(total)}</strong><small>Sum of recorded deposits</small></div>
        <div className="summary-card"><span>Total transactions</span><strong>{payments.length}</strong><small>Paper receipts entered</small></div>
        <div className="summary-card"><span>Account status</span><strong className="status-text">{currentCustomer.status}</strong><small>Current account state</small></div>
      </div>
      <section className="panel"><div className="panel-head statement-table-head"><div><h3>Transaction history</h3><p>Deposits recorded against this account</p></div><input className="form-control month-filter" type="month" value={filter} onChange={e=>setFilter(e.target.value)}/></div><PaymentTable payments={visible} customers={customers}/></section>
    </>}
  </>;
}

function CollectionForm({customers,areas,defaultCustomerId,onSubmit,onCancel}) {
  const initial = customers.find(c=>c.id===defaultCustomerId && c.status==="Active") || customers.find(c=>c.status==="Active");
  const [area,setArea] = useState(initial?.area || "");
  const [customerId,setCustomerId] = useState(initial?.id || "");
  const available = customers.filter(c=>c.status==="Active" && c.area===area);
  function changeArea(value) {
    setArea(value);
    setCustomerId(customers.find(c=>c.status==="Active" && c.area===value)?.id || "");
  }
  return <form onSubmit={onSubmit} className="form-grid">
    <div><label className="form-label">1. Area / Street</label><select className="form-select" value={area} onChange={e=>changeArea(e.target.value)} required><option value="">Select area</option>{areas.map(a=><option key={a} value={a}>{a}</option>)}</select></div>
    <div><label className="form-label">2. Customer</label><select name="customerId" className="form-select" value={customerId} onChange={e=>setCustomerId(e.target.value)} required disabled={!area}><option value="">Select customer</option>{available.map(c=><option value={c.id} key={c.id}>{c.name} · {c.id}</option>)}</select></div>
    <div className="full-field"><label className="form-label">Customer mobile</label><input className="form-control" value={customers.find(c=>c.id===customerId)?.phone || ""} placeholder="Auto-filled after customer selection" readOnly /></div>
    <Field label="Paper receipt number" name="receipt" placeholder="e.g. R-006" required/>
    <Field label="Collection date" name="date" type="date" defaultValue={today()} required/>
    <Field label="Amount received (₹)" name="amount" type="number" min="1" placeholder="Enter amount" required/>
    <div><label className="form-label">Payment mode</label><select name="mode" className="form-select"><option>Cash</option><option>UPI</option><option>Bank transfer</option></select></div>
    <div className="form-hint full-field">Demo entry only. In production, staff member and creation timestamp will also be recorded.</div>
    <div className="form-actions"><button type="button" className="btn btn-light" onClick={onCancel}>Cancel</button><button className="btn btn-primary">Save collection</button></div>
  </form>;
}

function Modal({title,onClose,children}) {
  return <div className="modal-backdrop-custom" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal-card"><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={19}/></button></div>{children}</div></div>;
}
function Field({label,name,type="text",placeholder,required,defaultValue,pattern,min}) {
  return <div><label className="form-label">{label}</label><input className="form-control" name={name} type={type} placeholder={placeholder} required={required} defaultValue={defaultValue} pattern={pattern} min={min}/></div>;
}