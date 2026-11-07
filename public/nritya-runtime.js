
(function(){
"use strict";
/* ================= STORAGE ================= */
const LS="nritya_laya_v4",SES="nritya_laya_session_v3";
const mem={};
const store={get(k){try{return localStorage.getItem(k)}catch(e){return mem[k]||null}},set(k,v){try{localStorage.setItem(k,v);return true}catch(e){mem[k]=v;return false}},del(k){try{localStorage.removeItem(k)}catch(e){}delete mem[k]}};
let S=null,sess=store.get(SES);
let theme=store.get("nritya_laya_theme")==="classic"?"classic":"night";
function save(){if(!store.set(LS,JSON.stringify(S)))toast("Browser storage is full or blocked — changes may not persist. Try smaller images.")}
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const todayISO=()=>iso(new Date());
const amt=s=>parseInt(String(s).replace(/[^\d]/g,""),10)||0;
const fmt=n=>"₹"+Number(n).toLocaleString("en-IN");
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}

/* ================= SEED DATA ================= */
const WC=(n,w)=>"https://commons.wikimedia.org/wiki/Special:FilePath/"+encodeURIComponent(n)+"?width="+w;
const PH=[
["Bharata_Natyam_Performance_DS.jpg"],["Mamallapuram,_Indian_Dance_Festival,_Bharatanatyam_dancer_(9902464906).jpg"],["Mamallapuram,_Indian_Dance_Festival,_Bharatanatyam_dancer_(9902967203).jpg"],["Flickr_-_dalbera_-_Rama_Vaidyanathan_(Musée_Guimet)_(5).jpg"],["Bharathanaatyam_at_Kerala_school_kalolsavam_2019_11.jpg"],["Bharathanatyam_By_Ranjitha.jpg"]].map(a=>({u:WC(a[0],900),big:WC(a[0],1600)}));
function seed(){
const site={name:"Nritya Laya",tag:"Bharatanatyam Academy",city:"Chennai, Tamil Nadu",phone:"+91 00000 00000",email:"info@example.com",address:"Add the academy address in Website Editor → Branding",hours:"Mon–Sat · evenings",heroTitle:"Nritya Laya",heroSub:"The rhythm of tradition. Learn Bharatanatyam with devotion, discipline and grace.",heroImg:"",welcomeH:"Welcome",welcome:"Nritya Laya is a Bharatanatyam academy in Chennai dedicated to nurturing students in the discipline, expression and rhythm of this classical art form. Replace this paragraph with the academy's own introduction from the Website Editor.",story:"Our story: add the academy's founding story, the guru's journey and what makes the school special. This text is edited from Website Editor → Branding.",philosophy:"Bharatanatyam is learned step by step — posture and rhythm first, then expression, then performance. Classes balance discipline with joy, for children and adults alike.",c1:"#8b5a2b",c2:"#c8281e",c3:"#c19a55"};
const t={};
t.courses=[
["Bharatanatyam Foundations","Regular classes","Beginner","Children & adults","Ongoing","Posture, araimandi, basic adavus, hand gestures (mudras) and a first sense of tala.",""],
["Intermediate Repertoire","Regular classes","Intermediate","After foundations","Ongoing","Longer adavu sequences and first items of the repertoire with growing attention to expression.",""],
["Advanced & Varnam","Regular classes","Advanced","Senior students","Ongoing","Complex jathis, abhinaya and varnam-level study for committed students.",""],
["Adult Foundations","Regular classes","Beginner","Adults","Ongoing","A gentle, structured introduction for adult beginners — no prior dance experience needed.",""],
["Abhinaya Workshop","Workshops","All levels","Students & adults","Short-term","Focused work on facial expression, storytelling and emotion in performance.",""],
["Arangetram Preparation","Performance","Advanced","Selected students","As scheduled","Stage craft, repertoire polish and guidance towards the debut performance.",""],
["Examination Preparation","Exams","All levels","Exam candidates","As scheduled","Practical and theory preparation for graded Bharatanatyam examinations.",""]];
t.gurus=[["Guru Name 1","Founder & Principal Guru","Biography to be added by the academy through the Website Editor.",""],["Guru Name 2","Senior Instructor","Biography to be added by the academy through the Website Editor.",""],["Guru Name 3","Instructor","Biography to be added by the academy through the Website Editor.",""]];
t.gallery=Array.from({length:8},(_,i)=>["Gallery photo "+(i+1),"Upload a real photo from Website Editor → Gallery",""]);
t.events=[["Annual Day Showcase","Date to be announced","Venue to be announced","Replace with the academy's real event details.","Upcoming",""],["Student Performance Evening","Date to be announced","Venue to be announced","Replace with the academy's real event details.","Upcoming",""]];
t.highlights=[["Annual Day Showcase","Year","Placeholder — replace with a real highlight from the academy.",""],["Arangetram Milestones","Year","Placeholder — replace with a real highlight from the academy.",""],["Performances & Festivals","Year","Placeholder — replace with a real highlight from the academy.",""],["Student Achievements","Year","Placeholder — replace with a real highlight from the academy.",""]];
t.courses.forEach((c,i)=>{c[6]=PH[[0,2,4,1,3,5,2][i%7]].u});t.gallery=[["Bharatanatyam recital",0],["Mamallapuram Dance Festival",1],["Poise and posture",2],["On stage",3],["Youth festival performance",4],["Performance in costume",5]].map(g=>[g[0],"Sample photograph — replace from Website Editor → Gallery",PH[g[1]].u]);t.events.forEach((e,i)=>{e[5]=PH[[1,5][i%2]].u});t.highlights.forEach((hh,i)=>{hh[3]=PH[[3,2,5,1][i%4]].u});site.heroImg=PH[0].u;
t.students=[["STU001","Student A","Beginners – Evening","Beginner","Guardian A","₹1,500","Active"],["STU002","Student B","Intermediate","Intermediate","Guardian B","₹1,800","Active"],["STU003","Student C","Advanced","Advanced","Guardian C","₹2,200","Active"],["STU004","Student D","Adults – Foundations","Beginner","Self","₹2,000","Suspended"],["STU005","Student E","Beginners – Evening","Beginner","Guardian E","₹1,500","Active"],["STU006","Student F","Performance Prep","Advanced","Guardian F","₹2,500","Active"],["STU007","Student G","Beginners – Evening","Beginner","Guardian G","₹1,500","Active"],["STU008","Student H","Intermediate","Intermediate","Guardian H","₹1,800","Active"],["STU009","Student I","Beginners – Evening","Beginner","Guardian I","₹1,500","Pending"],["STU010","Student J","Adults – Foundations","Beginner","Self","₹2,000","Active"]];
t.admissions=[["ENQ-001","Prospect 1","00000 00000","","Bharatanatyam Foundations",todayISO(),"Pending","Sample enquiry"]];
t.guardians=[["Guardian A","Student A","placeholder"],["Guardian B","Student B","placeholder"],["Guardian G","Student G","placeholder"]];
t.teachers=[["TCH001","Guru 1","Beginners, Advanced","placeholder","Active"],["TCH002","Guru 2","Intermediate","placeholder","Active"],["TCH003","Guru 3","Adults, Performance Prep","placeholder","Active"]];
t.batches=[["BAT001","Beginners – Evening","Beginner","Guru 1","35","Active"],["BAT002","Intermediate","Intermediate","Guru 2","30","Active"],["BAT003","Advanced","Advanced","Guru 1","20","Active"],["BAT004","Adults – Foundations","Beginner","Guru 3","25","Active"],["BAT005","Performance Prep","Advanced","Guru 3","15","Active"]];
t.tt=[["Mon","5:00 PM","Beginners – Evening","Guru 1","Hall A"],["Wed","5:00 PM","Beginners – Evening","Guru 1","Hall A"],["Fri","5:00 PM","Beginners – Evening","Guru 1","Hall A"],["Tue","6:00 PM","Intermediate","Guru 2","Hall B"],["Thu","6:00 PM","Intermediate","Guru 2","Hall B"],["Sat","4:00 PM","Advanced","Guru 1","Hall A"],["Sat","6:00 PM","Performance Prep","Guru 3","Hall A"],["Mon","7:00 PM","Adults – Foundations","Guru 3","Hall B"],["Thu","7:00 PM","Adults – Foundations","Guru 3","Hall B"]];
t.invoices=[["INV-2026-11-001","Student A","Nov 2026","₹1,500","₹1,500","10 Nov 2026","Paid"],["INV-2026-11-002","Student B","Nov 2026","₹1,800","₹0","10 Nov 2026","Pending"],["INV-2026-11-003","Student C","Nov 2026","₹2,200","₹1,000","10 Nov 2026","Partial"],["INV-2026-11-005","Student E","Nov 2026","₹1,500","₹0","10 Nov 2026","Pending"],["INV-2026-11-006","Student F","Nov 2026","₹2,500","₹2,500","10 Nov 2026","Paid"],["INV-2026-11-007","Student G","Nov 2026","₹1,500","₹0","10 Nov 2026","Pending"],["INV-2026-11-008","Student H","Nov 2026","₹1,800","₹0","10 Nov 2026","Pending"],["INV-2026-10-004","Student D","Oct 2026","₹2,000","₹0","10 Oct 2026","Overdue"],["INV-2026-10-001","Student A","Oct 2026","₹1,500","₹1,500","10 Oct 2026","Paid"],["INV-2026-10-002","Student B","Oct 2026","₹1,800","₹1,800","10 Oct 2026","Paid"]];
t.payments=[["PAY-0001","Student A","₹1,500","UPI (online)","demo-ref-1","2026-11-03","Verified"],["PAY-0002","Student C","₹1,000","Cash","—","2026-11-04","Verified"],["PAY-0003","Student F","₹2,500","Bank transfer","demo-ref-3","2026-11-02","Verified"],["PAY-0004","Student A","₹1,500","UPI (online)","demo-ref-4","2026-10-05","Verified"],["PAY-0005","Student B","₹1,800","Cash","—","2026-10-07","Verified"]];
t.receipts=[["RCP-0001","Student A","INV-2026-11-001","₹1,500","2026-11-03","Issued"],["RCP-0002","Student C","INV-2026-11-003","₹1,000","2026-11-04","Issued"],["RCP-0003","Student F","INV-2026-11-006","₹2,500","2026-11-02","Issued"]];
t.refunds=[];
t.leave=[["LV-001","Student E","2026-10-27","Family function","Approved"],["LV-002","Student B","2026-11-05","Unwell","Pending"]];
t.assessments=[["Student A","Adavus","4 / 5","Good rhythm, work on araimandi.","2026-10-20","Guru 1"],["Student A","Mudras","5 / 5","Clear and precise.","2026-10-20","Guru 1"],["Student C","Abhinaya","3 / 5","Develop facial expression range.","2026-10-22","Guru 1"]];
t.announcements=[["AN-001","Annual Day rehearsals (sample)","Rehearsals begin next week. Details will follow.","All batches","2026-11-01","Published"],["AN-002","Holiday notice (sample)","Draft — not yet published.","All","—","Draft"]];
t.notifications=[["N-001","Invoice generated for Nov 2026","In-app, Email","2026-11-01","Delivered"],["N-002","Fee reminder","In-app, SMS","2026-11-08","Queued"]];
t.audit=[];
t.users=[["U-001","Academy Owner","admin","owner@example.com","Active","","all"],["U-002","Guru 1","teacher","guru1@example.com","Active","Guru 1","attendance,assessments"],["U-003","Guru 2","teacher","guru2@example.com","Active","Guru 2","attendance,assessments"],["U-004","Guru 3","teacher","guru3@example.com","Active","Guru 3","attendance,assessments"],["U-005","Cashier","accounts","accounts@example.com","Active","","finance,reports"],["U-006","Student A","student","studenta@example.com","Active","STU001",""],["U-007","Student B","student","studentb@example.com","Active","STU002",""],["U-008","Guardian A","parent","guardiana@example.com","Active","STU001",""],["U-009","Guardian B","parent","guardianb@example.com","Active","STU002",""]];
t.attendance=[];
const tNow=new Date();
for(let back=35;back>=1;back--){const d=new Date(tNow);d.setDate(d.getDate()-back);const dn=DAYS[d.getDay()];
 t.batches.forEach(b=>{if(!t.tt.some(s=>s[0]===dn&&s[2]===b[1]))return;
  t.students.filter(s=>s[6]==="Active"&&s[2]===b[1]).forEach((s,si)=>{const h=(si*7+back*13+s[0].length*3)%11;const st=h===0?"Absent":h===1?"Late":h===2&&back%5===0?"Leave":"Present";t.attendance.push([iso(d),b[1],s[0],s[1],st,b[3]])})})}
return{v:3,site,settings:{dueDay:"10",lateFee:"0",lateMins:"10"},t}}
function load(){return seed();}

/* ================= SCHEMA ================= */
const X=(l,t,o)=>({l,t:t||"text",o});
const LEVELS=["Beginner","Intermediate","Advanced","All levels"];
const bn=()=>S.t.batches.map(b=>b[1]);
const tn=()=>S.t.teachers.map(x=>x[1]);
const SC={
students:{t:"Students",add:"student",idp:"STU",w:3,st:6,cols:[X("ID"),X("Name"),X("Batch","select",bn),X("Level","select",LEVELS.slice(0,3)),X("Guardian"),X("Monthly fee"),X("Status","select",["Active","Pending","Suspended","Inactive"])]},
admissions:{t:"Admissions & enquiries",add:"enquiry",idp:"ENQ-",w:3,st:6,cols:[X("ID"),X("Name"),X("Phone"),X("Email"),X("Programme"),X("Date","date"),X("Status","select",["Pending","Review","Approved","Rejected"]),X("Message","textarea")]},
guardians:{t:"Parents / Guardians",add:"guardian",cols:[X("Name"),X("Children"),X("Contact")]},
teachers:{t:"Teachers",add:"teacher",idp:"TCH",w:3,st:4,cols:[X("ID"),X("Name"),X("Batches"),X("Contact"),X("Status","select",["Active","Inactive"])]},
batches:{t:"Batches",add:"batch",idp:"BAT",w:3,st:5,cols:[X("ID"),X("Batch"),X("Level","select",LEVELS.slice(0,3)),X("Teacher","select",tn),X("Capacity","number"),X("Status","select",["Active","Inactive"])]},
tt:{t:"Timetable slots",add:"class slot",cols:[X("Day","select",["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]),X("Time"),X("Batch","select",bn),X("Teacher","select",tn),X("Room")]},
attendance:{t:"Attendance records",add:"record",st:4,cols:[X("Date","date"),X("Batch","select",bn),X("Student ID"),X("Student"),X("Status","select",["Present","Late","Absent","Leave"]),X("Marked by")]},
invoices:{t:"Invoices",add:"invoice",idp:"INV-",w:3,st:6,cols:[X("Invoice"),X("Student"),X("Period"),X("Amount"),X("Paid"),X("Due date"),X("Status","select",["Pending","Partial","Paid","Overdue"])]},
payments:{t:"Payments",add:"payment",idp:"PAY-",w:4,st:6,cols:[X("Payment"),X("Student"),X("Amount"),X("Method","select",["UPI (online)","Card (online)","Net banking (online)","Cash","Cheque","Bank transfer"]),X("Reference"),X("Date","date"),X("Status","select",["Verified","Pending","Failed"])]},
receipts:{t:"Receipts",add:"receipt",idp:"RCP-",w:4,st:5,cols:[X("Receipt"),X("Student"),X("Invoice"),X("Amount"),X("Date","date"),X("Status","select",["Issued","Void"])]},
refunds:{t:"Refunds",add:"refund",idp:"RF-",w:3,st:4,cols:[X("Refund"),X("Student"),X("Amount"),X("Reason"),X("Status","select",["Pending","Approved","Rejected"])]},
leave:{t:"Leave requests",add:"leave request",idp:"LV-",w:3,st:4,cols:[X("ID"),X("Student"),X("Date(s)"),X("Reason"),X("Status","select",["Pending","Approved","Rejected"])]},
assessments:{t:"Assessments",add:"assessment",cols:[X("Student"),X("Category","select",["Adavus","Mudras","Abhinaya","Rhythm","Posture","Other"]),X("Rating","select",["1 / 5","2 / 5","3 / 5","4 / 5","5 / 5"]),X("Comment","textarea"),X("Date","date"),X("By")]},
announcements:{t:"Announcements",add:"announcement",idp:"AN-",w:3,st:5,cols:[X("ID"),X("Title"),X("Message","textarea"),X("Audience"),X("Date","date"),X("Status","select",["Draft","Published"])]},
notifications:{t:"Notifications",add:"notification",idp:"N-",w:3,st:4,cols:[X("ID"),X("Title"),X("Channels"),X("Date","date"),X("Status","select",["Queued","Delivered","Failed"])]},
audit:{t:"Audit log",cols:[X("Time"),X("Actor"),X("Action"),X("Target")]},
users:{t:"Accounts",add:"account",idp:"U-",w:3,st:4,cols:[X("ID"),X("Name"),X("Role","select",["admin","teacher","accounts","student","parent"]),X("Email"),X("Status","select",["Active","Suspended"]),X("Linked (student IDs / teacher name)"),X("Permissions (comma separated)")]},
courses:{t:"Programmes",add:"programme",cols:[X("Name"),X("Category","select",["Regular classes","Workshops","Performance","Exams","Other"]),X("Level"),X("Age group"),X("Duration"),X("Description","textarea"),X("Image","image")]},
gurus:{t:"Gurus",add:"guru",cols:[X("Name"),X("Title"),X("Bio","textarea"),X("Photo","image")]},
gallery:{t:"Gallery",add:"photo",cols:[X("Title"),X("Caption"),X("Photo","image")]},
events:{t:"Events",add:"event",st:4,cols:[X("Title"),X("Date"),X("Venue"),X("Description","textarea"),X("Status","select",["Upcoming","Past","Draft"]),X("Image","image")]},
highlights:{t:"Highlights",add:"highlight",cols:[X("Title"),X("Year"),X("Description","textarea"),X("Image","image")]}
};
const TPERM={students:"students",admissions:"students",guardians:"students",batches:"students",tt:"timetable",attendance:"attendance",leave:"attendance",invoices:"finance",payments:"finance",receipts:"finance",refunds:"finance",assessments:"assessments",announcements:"announcements",notifications:"announcements",courses:"website",gurus:"website",gallery:"website",events:"website",highlights:"website"};
const PERMS=[["attendance","Mark attendance & leave"],["students","Students & admissions"],["finance","Finance dashboard & payments"],["reports","Reports"],["timetable","Edit timetable"],["announcements","Announcements"],["assessments","Assessments"],["website","Edit website"]];

/* ================= ACCOUNTS / PERMISSIONS ================= */
const acctOf=r=>({id:r[0],name:r[1],role:r[2],email:r[3],status:r[4],linked:r[5],perms:r[6]==="all"?PERMS.map(p=>p[0]):String(r[6]).split(",").map(x=>x.trim()).filter(Boolean)});
const accounts=()=>S.t.users.map(acctOf);
function cur(){const r=S.t.users.find(u=>u[0]===sess&&u[4]==="Active");return r?acctOf(r):null}
const isStaff=a=>a&&!["student","parent"].includes(a.role);
const has=(a,k)=>!!a&&(a.role==="admin"||a.perms.includes(k));
function canEdit(a,key){if(!a||key==="audit")return false;if(a.role==="admin")return true;const p=TPERM[key];return !!p&&a.perms.includes(p)}
function log(action,target){const a=cur();S.t.audit.unshift([new Date().toLocaleString("en-IN"),a?a.name:"Visitor",action,String(target)]);if(S.t.audit.length>300)S.t.audit.length=300}
function nextId(key,prefix,w){const m=S.t[key].reduce((n,r)=>{const x=parseInt(String(r[0]).replace(/\D+/g,"").slice(-6),10);return isNaN(x)?n:Math.max(n,x)},0);return prefix+String(m+1).padStart(w||3,"0")}
const kidsOf=a=>{const ids=String(a.linked||"").split(",").map(x=>x.trim());return S.t.students.filter(s=>ids.includes(s[0]))};

/* ================= HELPERS: UI ================= */
const badgeTone=s=>{s=String(s).toLowerCase();if(["paid","present","active","approved","verified","published","delivered","issued","upcoming","marked"].includes(s))return"success";if(["overdue","absent","failed","rejected","suspended","void"].includes(s))return"danger";if(["pending","late","partial","draft","queued","review","not marked yet"].includes(s))return"warn";if(["leave","past"].includes(s))return"info";return"neutral"};
const badge=s=>`<span class="badge b-${badgeTone(s)}">${esc(s)}</span>`;
const dancer=h=>`<svg class="dancer" viewBox="0 0 120 160" style="filter:hue-rotate(${h||0}deg)" aria-hidden="true"><circle cx="60" cy="26" r="13" fill="#3b2415"/><path d="M47 18c4-12 22-12 26 0-6-5-20-5-26 0Z" fill="#c19a55"/><circle cx="60" cy="14" r="3" fill="#c8281e"/><path d="M40 48c8-6 32-6 40 0l-6 30H46Z" fill="#c8281e"/><path d="M46 78h28l16 62H30Z" fill="#f59e2b"/><path d="M46 78h28l10 62H36Z" fill="#8f1d14" opacity=".35"/><path d="M40 52 14 40l4-8 30 10Z" fill="#8b5a2b"/><path d="M80 52 106 66l-4 8-30-14Z" fill="#8b5a2b"/><path d="M32 140h56l4 12H28Z" fill="#c19a55"/></svg>`;
const SP={orange:["#f59e2b","#f26a21","#c8281e"],red:["#f26a21","#c8281e","#8f1d14"],gold:["#e8c987","#c19a55","#a47e3a"]};
let gid=0;
const splash=tn=>{const[a,b,c]=SP[tn||"orange"],id="sg"+(gid++);return`<svg viewBox="0 0 200 200" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><path fill="url(#${id})" d="M38 62c14-26 52-44 86-34 30 9 52 34 50 66-2 30-18 56-48 68-28 11-62 4-83-18C22 124 22 88 38 62Z"/><path fill="url(#${id})" opacity=".55" d="M12 120c6-14 22-20 30-8 6 10-4 26-18 28-10 1-16-8-12-20Z"/><path fill="url(#${id})" opacity=".45" d="M176 40c10-8 22 0 20 12-2 10-14 16-22 10-6-5-6-16 2-22Z"/></svg>`};
const mandala=()=>{let p="";for(let i=0;i<12;i++)p+=`<path pathLength="1" style="--i:${i}" transform="rotate(${i*30} 100 100)" d="M100 100C88 70 88 40 100 14C112 40 112 70 100 100Z"/>`;return`<svg class="mandala" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1">${p}<circle cx="100" cy="100" r="97"/><circle cx="100" cy="100" r="64" stroke-dasharray="2 4"/><circle cx="100" cy="100" r="22"/></g></svg>`};
const art=(tn,hue,size)=>`<div class="art orn" style="width:${size}px;max-width:100%">${mandala()}</div>`;
const pic=(src,tn,hue,size,alt)=>src?`<img class="cover" src="${esc(src)}" alt="${esc(alt||"")}">`:art(tn,hue,size);
const themeBtnInner=()=>theme==="night"?'☀<span class="hide-xs"> Classic</span>':'☾<span class="hide-xs"> Night</span>';
const themeBtn=()=>`<button class="btn ghost sm" data-theme-toggle aria-label="Switch theme" title="Switch theme">${themeBtnInner()}</button>`;
const marquee=()=>{const w=["Adavus","Mudras","Abhinaya","Tala","Laya","Nritta","Nritya","Arangetram"],t=w.map(x=>`<span>${x}</span><span>✦</span>`).join("");return`<div class="marquee" aria-hidden="true"><div class="track">${t}${t}</div></div>`};
const logo=light=>`<a href="#/" class="logo ${light?"light":""}" aria-label="Home"><svg viewBox="0 0 40 48" width="30" height="38" aria-hidden="true"><circle cx="20" cy="8" r="5" fill="#c19a55"/><path d="M20 14c-9 4-12 14-6 24 3 5 9 5 12 0 6-10 3-20-6-24Z" fill="none" stroke="${light?"#e8c987":"#8b5a2b"}" stroke-width="2.2"/><path d="M20 18v22M12 30c5 3 11 3 16 0" stroke="#c8281e" stroke-width="2" fill="none"/></svg><span><b>${esc(S.site.name)}</b><small>${esc(S.site.tag)}</small></span></a>`;
const EY={"Programmes":"What we teach","Our Gurus":"Our teachers","Highlights":"Milestones","Gallery":"In pictures","Events":"What's on","Why learn with us":"The academy","The learning journey":"Your path","Questions, answered":"Good to know","Visit & contact":"Find us"};
const secTitle=(t,s)=>`<div class="sec-title">${EY[t]?`<span class="eyebrow">${EY[t]}</span>`:""}<h2 class="script">${t}</h2><svg class="scribble" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M2 7C30 1 60 11 100 5S170 9 198 4"/></svg>${s?`<p>${s}</p>`:""}</div>`;
const pageHero=(t,s)=>`<section class="hero-bg page-hero"><div class="wrap in"><h1 class="script">${t}</h1>${s?`<p>${s}</p>`:""}</div><div class="kolam"></div></section>`;
function applyTheme(){const d=document.documentElement,r=d.style;d.setAttribute("data-theme",theme);r.setProperty("--crimson",S.site.c2||"#c8281e");r.setProperty("--gold",S.site.c3||"#c19a55");if(theme==="classic"){r.setProperty("--head",S.site.c1||"#8b5a2b");r.setProperty("--btn",S.site.c1||"#8b5a2b")}else{r.removeProperty("--head");r.removeProperty("--btn")}const m=document.querySelector("meta[name=theme-color]");if(m)m.setAttribute("content",theme==="night"?"#140b24":"#fffaf3")}
const bars=(items,unit,max)=>items.length?items.map(i=>`<div class="bar"><span class="muted">${esc(i[0])}</span><div class="tr"><div class="fi" style="width:${Math.min(100,(i[1]||0)/((max||Math.max(...items.map(x=>x[1]||0),1)))*100)}%"></div></div><em>${i[1]==null?"—":i[1]+(unit||"")}</em></div>`).join(""):'<p class="muted" style="font-size:14px">No data yet.</p>';
const pageH=(t,d)=>`<div class="page-h"><h1>${t}</h1>${d?`<p>${d}</p>`:""}</div>`;
const stat=(l,v,h,c)=>`<div class="card stat ${c||""}"><small>${l}</small><b>${v}</b>${h?`<i>${h}</i>`:""}</div>`;
const panel=(t,body,link)=>`<div class="card pad"><div class="panel-h"><h2>${t}</h2>${link?`<a href="#/portal/${link}">View all</a>`:""}</div>${body}</div>`;
function download(name,text,mime){const b=new Blob([text],{type:mime||"text/plain"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),500)}
const csvOf=key=>{const sc=SC[key];const q=v=>'"'+String(v).replace(/"/g,'""')+'"';return[sc.cols.map(c=>q(c.l)).join(",")].concat(S.t[key].map(r=>r.map((v,i)=>q(sc.cols[i].t==="image"?"":v)).join(","))).join("\n")};
const pct=recs=>{const d=recs.filter(r=>r[4]!=="Leave");if(!d.length)return null;return Math.round(d.filter(r=>r[4]==="Present"||r[4]==="Late").length/d.length*100)};
const tally=recs=>{const o={Present:0,Late:0,Absent:0,Leave:0};recs.forEach(r=>{if(o[r[4]]!=null)o[r[4]]++});return o};

/* ================= FORMS / MODALS ================= */
function readImg(file,cb){const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const m=900,k=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);cb(c.toDataURL("image/jpeg",.78))};im.onerror=()=>toast("Could not read that image");im.src=fr.result};fr.readAsDataURL(file)}
function fld(col,n){
if(col.t==="textarea")return`<label class="fld">${esc(col.l)}<textarea class="inp" name="${n}" style="height:90px"></textarea></label>`;
if(col.t==="select"){const o=typeof col.o==="function"?col.o():col.o;return`<label class="fld">${esc(col.l)}<select class="inp" name="${n}">${o.map(x=>`<option>${esc(x)}</option>`).join("")}</select></label>`}
if(col.t==="image")return`<div class="fld">${esc(col.l)}<div class="imgfld"><img alt="" class="prev" hidden><div style="display:grid;gap:6px;flex:1;min-width:0"><input type="file" accept="image/*" data-imgfor="${n}"><input class="inp" name="${n}" placeholder="…or paste an image URL"><button type="button" class="btn ghost sm" data-clearimg="${n}">Remove image</button></div></div></div>`;
return`<label class="fld">${esc(col.l)}<input class="inp" name="${n}" type="${col.t||"text"}"></label>`}
function setVal(form,n,v){const el=form.elements[n];if(!el)return;if(el.tagName==="SELECT"&&![...el.options].some(o=>o.value===String(v))&&v!==""&&v!=null){const o=document.createElement("option");o.textContent=v;el.appendChild(o)}el.value=v==null?"":v;syncPrev(form,n)}
function syncPrev(form,n){const el=form.elements[n];if(!el)return;const w=el.closest(".imgfld");if(!w)return;const im=w.querySelector(".prev");im.src=el.value||"";im.hidden=!el.value}
function openForm(o){const m=document.createElement("div");m.className="modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");
m.innerHTML=`<form><h3>${esc(o.title)}</h3>${o.note?`<p class="muted" style="font-size:12px">${o.note}</p>`:""}${o.cols.map((c,i)=>fld(c,"f"+i)).join("")}<div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn" type="submit">Save</button></div></form>`;
document.body.appendChild(m);const f=m.querySelector("form");o.cols.forEach((c,i)=>setVal(f,"f"+i,o.row?o.row[i]:""));
const first=f.querySelector("input:not([type=file]),select,textarea");first&&first.focus();
m.addEventListener("click",e=>{if(e.target===m||e.target.hasAttribute("data-close"))m.remove()});
f.addEventListener("submit",e=>{e.preventDefault();const row=o.cols.map((c,i)=>f.elements["f"+i].value);m.remove();o.onSave(row)})}

/* ================= DATA TABLE ================= */
const TB={};let tseq=0;
function dtable(key,opt){opt=opt||{};const id="t"+(tseq++);TB[id]={key,opt,q:"",p:0};
return`<div class="card" id="${id}"><div class="tbl-bar"><input class="inp" style="width:240px;border-radius:99px" data-search="${id}" placeholder="Search…" aria-label="Search">${opt.can?`<button class="btn sm" data-add="${id}">＋ Add ${esc(SC[key].add||"record")}</button>`:"<span></span>"}</div><div id="${id}-b">${tbody(id)}</div></div>`}
function tbody(id){const T0=TB[id],sc=SC[T0.key],can=T0.opt.can,all=S.t[T0.key];
let idx=all.map((r,i)=>i).filter(i=>!T0.opt.filter||T0.opt.filter(all[i]));
const q=T0.q.toLowerCase();if(q)idx=idx.filter(i=>all[i].filter((v,j)=>sc.cols[j].t!=="image").join(" ").toLowerCase().includes(q));
if(T0.opt.sort)idx.sort((a,b)=>T0.opt.sort(all[a],all[b]));
const size=8,pages=Math.max(1,Math.ceil(idx.length/size));if(T0.p>=pages)T0.p=pages-1;const shown=idx.slice(T0.p*size,T0.p*size+size);
const cell=(r,j)=>{const c=sc.cols[j],v=r[j],L=`data-l="${esc(c.l)}"`;if(c.t==="image")return`<td ${L}>${v?`<img class="thumb" src="${esc(v)}" alt="">`:'<span class="muted">—</span>'}</td>`;if(sc.st===j)return`<td ${L}>${badge(v)}</td>`;if(c.t==="textarea")return`<td ${L} class="trunc" title="${esc(v)}">${esc(v)}</td>`;return`<td ${L}>${esc(v)}</td>`};
return`<div class="tbl-wrap"><table class="stack"><thead><tr>${sc.cols.map(c=>`<th>${esc(c.l)}</th>`).join("")}${can?"<th>Actions</th>":""}</tr></thead><tbody>${shown.map(i=>`<tr>${all[i].map((v,j)=>cell(all[i],j)).join("")}${can?`<td class="act" data-l="Actions"><button data-ed="${id}:${i}">Edit</button><button class="del" data-del="${id}:${i}">Delete</button></td>`:""}</tr>`).join("")}</tbody></table>${shown.length?"":'<div class="empty">No records found.</div>'}</div><div class="tbl-foot"><span>${idx.length} record(s)</span><div class="pg"><button data-pg="${id}:-1" ${T0.p===0?"disabled":""}>Prev</button><span>${T0.p+1} / ${pages}</span><button data-pg="${id}:1" ${T0.p+1>=pages?"disabled":""}>Next</button></div></div>`}
const refreshTbl=id=>{const e=$("#"+id+"-b");if(e)e.innerHTML=tbody(id)};
function tblAdd(id){const T0=TB[id],sc=SC[T0.key];const row=sc.cols.map((c,i)=>{if(i===0&&sc.idp)return nextId(T0.key,sc.idp,sc.w);if(c.t==="date")return todayISO();if(c.t==="select"){const o=typeof c.o==="function"?c.o():c.o;return o[0]||""}return""});
openForm({title:"Add "+(sc.add||"record"),cols:sc.cols,row,note:"Changes are saved in this browser (demo storage).",onSave:r=>{S.t[T0.key].unshift(r);log("Added "+sc.add,r[0]);save();refreshTbl(id);toast("Added")}})}
function tblEdit(id,i){const T0=TB[id],sc=SC[T0.key],row=S.t[T0.key][i];openForm({title:"Edit "+(sc.add||"record"),cols:sc.cols,row,onSave:r=>{S.t[T0.key][i]=r;log("Edited "+sc.add,r[0]);save();refreshTbl(id);toast("Saved")}})}
function tblDel(id,i){const T0=TB[id],sc=SC[T0.key],row=S.t[T0.key][i];if(!confirm("Delete this "+(sc.add||"record")+"? ("+row[0]+")"))return;S.t[T0.key].splice(i,1);log("Deleted "+sc.add,row[0]);save();refreshTbl(id);toast("Deleted")}

/* ================= PUBLIC SITE ================= */
let catFilter="All",enqCourse="";
const eventCard=e=>`<div class="card pad row" style="gap:22px;flex-wrap:nowrap;align-items:stretch">${e[5]?`<div style="width:110px;border-radius:12px;overflow:hidden;flex-shrink:0"><img class="cover" src="${esc(e[5])}" alt=""></div>`:`<div class="event-date" style="align-self:center"><small>${esc(e[4]).toUpperCase()}</small><b>${esc(e[1])}</b></div>`}<div style="min-width:0"><h3 class="display" style="font-size:26px;color:var(--head)">${esc(e[0])}</h3><p style="font-size:13px;color:var(--gold-deep);font-weight:600">${esc(e[1])} · ${esc(e[2])}</p><p class="muted" style="font-size:14px;margin-top:4px">${esc(e[3])}</p></div></div>`;
const courseCard=(c,i)=>`<div class="card cat-card"><div class="cat-img">${c[6]?`<img class="cover" src="${esc(c[6])}" alt="">`:art(i%2?"red":"orange",i*18,170)}</div><div class="cat-body"><div class="meta"><span class="badge b-warn">${esc(c[1])}</span><span class="badge b-neutral">${esc(c[2])}</span></div><h3>${esc(c[0])}</h3><p class="muted" style="font-size:14px;flex:1">${esc(c[5])}</p><p style="font-size:12px;color:var(--gold-deep);font-weight:600">${esc(c[3])} · ${esc(c[4])}</p><div><button class="btn sm" data-enq="${esc(c[0])}">Enquire</button></div></div></div>`;
const guruCard=g=>`<div class="card pad" style="text-align:center"><div class="guru-ph">${g[3]?`<img class="cover" src="${esc(g[3])}" alt="${esc(g[0])}">`:`<span class="mono">${esc(g[0].split(" ").slice(0,2).map(w=>w[0]).join(""))}</span>`}</div><h3 class="display" style="font-size:26px;color:var(--head);margin-top:12px">${esc(g[0])}</h3><p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-deep);font-weight:600">${esc(g[1])}</p><p class="muted" style="font-size:14px;margin-top:8px">${esc(g[2])}</p></div>`;
const hlCard=h=>`<div class="card pad" style="display:grid;gap:8px">${h[3]?`<div style="height:140px;border-radius:12px;overflow:hidden"><img class="cover" src="${esc(h[3])}" alt=""></div>`:""}<span class="badge b-warn" style="justify-self:start">${esc(h[1])}</span><h3 class="display" style="font-size:25px;color:var(--head)">${esc(h[0])}</h3><p class="muted" style="font-size:14px">${esc(h[2])}</p></div>`;
const tile=(g,i)=>`<div class="tile" data-lb="${i}" role="button" tabindex="0" aria-label="${esc(g[0])}">${g[2]?`<img class="cover" src="${esc(g[2])}" alt="${esc(g[0])}">`:art(["red","orange","gold"][i%3],i*18,200)}<div class="cap">${esc(g[0])}</div></div>`;
const ICONS=[["M4 20h4v-4h4v-4h4V8h4V4"],["M8 9a3 3 0 1 0 .01 0M2.5 20c0-4 2.7-6 5.5-6s5.5 2 5.5 6M16.5 9.5a2.5 2.5 0 1 0 .01 0M15.5 14.2c3 0 6 1.6 6 5.8"],["M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5l-5.4 3 1.2-6L3.3 9.3l6.1-.7z"],["M6 4h12v16H6zM9 9h6M9 13h6M9 17h3"]];
const statsStrip=()=>{const it=[[S.t.courses.length,"Programmes"],[S.t.gurus.length,"Gurus"],[new Set(S.t.courses.map(c=>c[2])).size,"Levels"],[S.t.events.filter(e=>e[4]!=="Draft").length,"Events"]];return`<section class="stats-strip"><div class="wrap">${it.map(x=>`<div class="stat"><b data-count="${x[0]}">${x[0]}</b><span>${x[1]}</span></div>`).join("")}</div></section>`};
const why=()=>{const f=[["Structured levels","From first adavus to varnam, every student moves through clear stages."],["Children & adults","Dedicated programmes so beginners of any age can start comfortably."],["Stage & performance","Workshops, showcases and Arangetram guidance build real stage confidence."],["Exam preparation","Practical and theory training for graded Bharatanatyam examinations."]];return`<section class="why" style="background:var(--bg2);padding:64px 0"><div class="wrap">${secTitle("Why learn with us","A classical foundation, taught with care.")}<div class="grid g4">${f.map((x,i)=>`<div class="card why-card"><div class="why-ic"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[i].map(d=>`<path pathLength="1" d="${d}"/>`).join("")}</svg></div><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join("")}</div></div></section>`};
const scrollMq=()=>{const t=Array(6).fill("Nritta ✦ Nritya ✦ Natya ✦ ").join("");return`<div class="smq" aria-hidden="true"><div data-parx="-.35">${t}</div><div class="alt" data-parx=".35">${t}</div></div>`};
const journey=()=>{const st=[["Foundations","Posture, araimandi, basic adavus and hand gestures."],["Intermediate repertoire","Longer adavu sequences and the first items of the repertoire."],["Advanced & varnam","Complex jathis, abhinaya and varnam-level study."],["Arangetram","Stage craft and guidance towards the debut performance."]];return`<section class="paper-bg journey" style="padding:64px 0"><div class="wrap">${secTitle("The learning journey","Four stages from the first step to the stage.")}<ol class="path" data-path><div class="line"><i></i></div>${st.map((x,i)=>`<li class="step" data-n="${i+1}"><div class="card"><h3>${x[0]}</h3><p>${x[1]}</p></div></li>`).join("")}</ol></div></section>`};
const FAQ=[["Do I need prior dance experience?","No. Bharatanatyam Foundations and Adult Foundations start from the basics — posture, araimandi, adavus and mudras."],["Are there classes for adults?","Yes. The Adult Foundations programme is a gentle, structured introduction for adult beginners."],["How do I join a batch?","Send an admission enquiry. The academy will contact you with batch availability and the next steps."],["Do you prepare students for exams and Arangetram?","Yes. Examination Preparation and Arangetram Preparation are offered as separate programmes."],["Where do I see the timetable, attendance and fees?","After logging in. Students and parents see the timetable, attendance and fee status in their own portal."]];
const faq=()=>`<section class="paper-bg" style="padding:64px 0"><div class="wrap">${secTitle("Questions, answered")}<div class="faq-list">${FAQ.map(q=>`<div class="faq-i"><button class="faq-q" data-faq aria-expanded="false">${q[0]}</button><div class="faq-a"><div><p>${q[1]}</p></div></div></div>`).join("")}</div></div></section>`;
const contactBand=()=>`<section class="cband" style="background:var(--bg2);padding:64px 0"><div class="wrap">${secTitle("Visit & contact","Come and see a class, or send us a message.")}<div class="grid g3" style="max-width:960px;margin:auto"><div class="card"><div class="ic">☎</div><h3>Call</h3><p>${esc(S.site.phone)}</p><p>${esc(S.site.hours||"")}</p></div><div class="card"><div class="ic">✉</div><h3>Email</h3><p>${esc(S.site.email)}</p></div><div class="card"><div class="ic">⌖</div><h3>Visit</h3><p>${esc(S.site.address)}</p></div></div></div></section>`;
const PUBNAV=[["","HOME"],["about","ABOUT"],["programmes","PROGRAMMES"],["gurus","GURUS"],["gallery","GALLERY"],["events","EVENTS"],["contact","CONTACT"]];
const PUBLIC={
"":()=>{const s=S.site;return`
<section class="hero-bg hero-home"><div class="hero-photo" data-par="-.05" style="background-image:url('${PH[1].big}')"></div><div class="petals" data-petals></div><div class="strings" aria-hidden="true">${[[46,0],[55,1],[92,2],[97,3]].map(a=>`<div class="str" style="left:${a[0]}%;--len:${70+a[1]*38}px;--dl:-${a[1]*.9}s;--du:${3.4+a[1]*.55}s"><div class="sw"><span class="cord"></span>${Array.from({length:3+a[1]%2},()=>`<i class="gb"></i>`).join("")}</div></div>`).join("")}</div><i class="bell b1"></i><i class="bell b2"></i><i class="bell b3"></i><div class="wrap hero-grid"><div><p style="text-transform:uppercase;letter-spacing:.3em;font-size:12px;color:var(--amber);margin-bottom:12px">${esc(s.city)}</p>
<h1 class="script shine" style="font-size:clamp(48px,9vw,104px);line-height:1;overflow-wrap:anywhere">${esc(s.heroTitle)}</h1>
<p style="margin-top:16px;font-size:clamp(19px,2.4vw,25px);font-weight:300;color:rgba(255,255,255,.9)">${esc(s.heroSub)}</p>
<div class="row" style="margin-top:28px"><a class="btn light" href="#/programmes">Explore programmes</a><a class="btn onhero" href="#/admission">Admission enquiry</a></div><ul class="hero-points"><li>Children &amp; adults</li><li>Exam preparation</li><li>Arangetram guidance</li></ul></div>
<div class="scene-wrap"><div class="scene" data-scene>${mandala()}<div class="par" data-par="-.1"><div class="hero-img arch">${s.heroImg?`<img class="cover" src="${esc(s.heroImg)}" alt="Bharatanatyam dancer in a classical pose" fetchpriority="high">`:""}</div></div></div></div></div><div class="kolam"></div></section>
${marquee()}
<section class="intro" style="background:var(--bg2);padding:64px 0"><div class="ghost-word" data-parx=".16" aria-hidden="true">Bharatanatyam</div><div class="wrap grid g2" style="align-items:center;max-width:960px"><div class="photo-stack"><figure style="--r:-5deg"><img src="${PH[5].u}" alt="Bharatanatyam performance" loading="lazy"></figure><figure style="--r:4deg"><img src="${PH[3].u}" alt="Dancer on stage" loading="lazy"></figure></div><div><h2 class="script" style="font-size:48px;color:var(--head)">${esc(s.welcomeH)}</h2><p class="display" style="font-size:22px;color:var(--head);margin-bottom:10px">to ${esc(s.name)} – ${esc(s.tag)}</p><p class="muted">${esc(s.welcome)}</p><div style="margin-top:20px"><a class="btn" href="#/about">Our story</a></div></div></div></section>
${statsStrip()}
${why()}
<section class="paper-bg" style="padding:64px 0"><div class="wrap">${secTitle("Programmes","A catalogue of classes, workshops and performance training.")}<div class="grid g3">${S.t.courses.slice(0,3).map(courseCard).join("")}</div><div style="text-align:center;margin-top:28px"><a class="btn ghost" href="#/programmes">View full catalogue</a></div></div></section>
${scrollMq()}
${journey()}
<section style="background:var(--bg2);padding:64px 0"><div class="wrap">${secTitle("Our Gurus","The teachers who guide every student.")}<div class="grid g3" style="max-width:1000px;margin:auto">${S.t.gurus.slice(0,3).map(guruCard).join("")}</div></div></section>
<section class="paper-bg" style="padding:64px 0"><div class="wrap">${secTitle("Highlights","Performances, milestones and moments.")}<div class="grid g4">${S.t.highlights.map(hlCard).join("")}</div></div></section>
<section style="background:var(--bg2);padding:64px 0"><div class="wrap">${secTitle("Gallery")}<div class="film" data-film><div class="film-pin"><div class="film-track">${S.t.gallery.map(tile).join("")}</div></div></div><div class="film-bar" aria-hidden="true"><i></i></div><div style="text-align:center;margin-top:24px"><a class="btn ghost" href="#/gallery">Open gallery</a></div></div></section>
<section class="paper-bg" style="padding:64px 0"><div class="wrap" style="max-width:860px">${secTitle("Events","Upcoming performances and academy happenings.")}<div style="display:grid;gap:16px">${S.t.events.filter(e=>e[4]!=="Draft").slice(0,3).map(eventCard).join("")||'<p class="empty">No events right now.</p>'}</div></div></section>
${faq()}
${contactBand()}
<section class="hero-bg" style="padding:56px 0;text-align:center"><div class="wrap"><h2 class="script" style="font-size:clamp(40px,6vw,56px)">Begin your journey</h2><p style="color:rgba(255,255,255,.85);margin-top:6px">Send an admission enquiry and the academy will get in touch.</p><div style="margin-top:24px"><a class="btn light" href="#/admission">Enquire now</a></div></div></section>`},
about:()=>{const s=S.site;return pageHero("Our Story",`${esc(s.name)} – ${esc(s.tag)}, ${esc(s.city)}`)+`<section class="wrap grid g2" style="padding:56px 16px;max-width:1000px;align-items:start"><div class="card pad"><h2 class="display" style="font-size:30px;color:var(--head)">The academy</h2><p class="muted" style="margin-top:10px;white-space:pre-line">${esc(s.story)}</p></div><div class="card pad"><h2 class="display" style="font-size:30px;color:var(--head)">How we teach</h2><p class="muted" style="margin-top:10px;white-space:pre-line">${esc(s.philosophy)}</p></div></section><section class="paper-bg" style="padding:56px 0"><div class="wrap">${secTitle("Highlights")}<div class="grid g4">${S.t.highlights.map(hlCard).join("")}</div></div></section>`},
programmes:()=>{const cats=["All",...new Set(S.t.courses.map(c=>c[1]))];const list=S.t.courses.map((c,i)=>[c,i]).filter(x=>catFilter==="All"||x[0][1]===catFilter);
return pageHero("Programmes","Classes, workshops, performance and exam training.")+`<section class="wrap" style="padding:48px 16px"><div class="chips">${cats.map(c=>`<button class="chip ${c===catFilter?"on":""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div><div class="grid g3">${list.map(x=>courseCard(x[0],x[1])).join("")||'<p class="empty">No programmes in this category.</p>'}</div><p class="muted" style="text-align:center;margin-top:28px;font-size:14px">Timings and fees are shared with enrolled students inside the portal.</p></section>`},
gurus:()=>pageHero("Our Gurus","Meet the teachers.")+`<section class="wrap grid g3" style="padding:56px 16px;max-width:1000px">${S.t.gurus.map(guruCard).join("")}</section>`,
gallery:()=>pageHero("Gallery","Moments from class, stage and celebration.")+`<section class="wrap tiles" style="padding:56px 16px">${S.t.gallery.map(tile).join("")}</section>`,
events:()=>pageHero("Events & Performances")+`<section class="wrap" style="padding:56px 16px;max-width:860px;display:grid;gap:16px">${S.t.events.filter(e=>e[4]!=="Draft").map(eventCard).join("")||'<p class="empty">No events yet.</p>'}</section>`,
contact:()=>{const s=S.site;return pageHero("Contact","We'd love to hear from you.")+`<section class="wrap grid g2" style="padding:56px 16px;max-width:1000px"><div class="card pad" style="display:grid;gap:10px;font-size:14px"><h3 class="display" style="font-size:26px;color:var(--head)">Academy details</h3><p><b>Phone:</b> ${esc(s.phone)}</p><p><b>Email:</b> ${esc(s.email)}</p><p><b>Address:</b> ${esc(s.address)}</p><p><b>Hours:</b> ${esc(s.hours)}</p><div style="height:150px;border-radius:12px;background:var(--paper);display:grid;place-items:center" class="muted">Map placeholder</div></div><div class="card pad"><h3 class="display" style="font-size:26px;color:var(--head);margin-bottom:12px">Send a message</h3><form class="form-grid" id="msgForm"><input class="inp" name="n" placeholder="Your name" aria-label="Name" required><input class="inp" name="c" placeholder="Phone or email" aria-label="Contact" required><textarea class="inp" name="m" style="height:110px" placeholder="Message" aria-label="Message" required></textarea><div><button class="btn" type="submit">Send</button></div></form></div></section>`},
privacy:()=>pageHero("Privacy Policy")+`<section class="wrap" style="max-width:760px;padding:56px 16px;display:grid;gap:14px"><p><b>Draft template — requires legal review before use.</b></p><p class="muted">We collect only the personal information needed to run classes, attendance and fee collection. Children's data is processed with parent/guardian consent and is never publicly listed.</p><p class="muted">Records are retained according to the academy's retention policy and applicable Indian data-protection law. Guardians may request access or correction.</p></section>`,
terms:()=>pageHero("Terms & Conditions")+`<section class="wrap" style="max-width:760px;padding:56px 16px;display:grid;gap:14px"><p><b>Draft template — requires legal review before use.</b></p><p class="muted">Fees, refund, late-fee and leave policies are set by the academy and shown to enrolled students in the portal. Accounts are personal and must not be shared.</p></section>`,
admission:()=>{const opts=["General enquiry",...S.t.courses.map(c=>c[0])];return pageHero("Admission Enquiry","Share a few details and the academy will contact you.")+`<section class="wrap" style="max-width:760px;padding:56px 16px"><div class="card pad" style="padding:28px" id="adm"><form class="form-grid two" id="admForm">
<label class="fld">Student name<input name="n" required class="inp"></label><label class="fld">Date of birth<input name="d" required type="date" class="inp"></label>
<label class="fld">Parent / guardian name<input name="g" class="inp"></label><label class="fld">Phone<input name="p" required type="tel" class="inp"></label>
<label class="fld">Email<input name="e" type="email" class="inp"></label><label class="fld">Programme of interest<select name="c" class="inp">${opts.map(o=>`<option ${o===enqCourse?"selected":""}>${esc(o)}</option>`).join("")}</select></label>
<label class="fld span2">Message<textarea name="m" class="inp" style="height:90px"></textarea></label>
<label class="span2" style="font-size:14px;display:flex;gap:8px"><input required type="checkbox" style="margin-top:4px"> I consent to the academy processing this information (guardian consent for under-18s).</label>
<div class="span2"><button class="btn" type="submit">Submit enquiry</button></div></form></div></section>`}
};
function publicShell(route,inner){const a=cur();const act=a?`<a class="btn gold sm" href="#/portal">My portal</a><button class="btn ghost sm" data-logout>Log out</button>`:`<a class="btn gold sm" href="#/admission">Admission enquiry</a><a class="btn sm" href="#/login">Login</a>`;
return`<div id="progress" aria-hidden="true"></div><div class="ann">✦ Admissions open — <a href="#/admission">send an enquiry</a> · Classes for children &amp; adults in ${esc(S.site.city)} ✦</div><header class="pub-head"><div class="wrap in">${logo()}<nav class="pub-nav" aria-label="Main">${PUBNAV.map(n=>`<a href="#/${n[0]}" class="${route===n[0]?"on":""}">${n[1]}</a>`).join("")}</nav><div class="pub-act">${themeBtn()}${act}</div><button class="burger pubb" id="burger" aria-label="Toggle menu">☰</button></div>
<div class="mob" id="mob">${PUBNAV.map(n=>`<a href="#/${n[0]}">${n[1]}</a>`).join("")}<div class="row">${themeBtn()}${a?'<a class="btn gold sm" href="#/portal">My portal</a>':'<a class="btn gold sm" href="#/admission">Admission</a><a class="btn sm" href="#/login">Login</a>'}</div></div></header>
<main style="flex:1">${inner}</main>
<a class="sticky-cta" href="#/admission">✦ Admission enquiry</a>
<footer class="pub-foot"><div class="wrap g"><div><p class="display" style="font-size:26px;font-weight:700">${esc(S.site.name)}</p><p>${esc(S.site.tag)}, ${esc(S.site.city)}</p></div><ul><li>☎ ${esc(S.site.phone)}</li><li>✉ ${esc(S.site.email)}</li><li>⌖ ${esc(S.site.address)}</li></ul><ul class="r"><li><a href="#/privacy">Privacy Policy</a></li><li><a href="#/terms">Terms &amp; Conditions</a></li><li><a href="#/login">Student / Staff Login</a></li></ul></div><p class="copy">© 2026 ${esc(S.site.name)} – ${esc(S.site.tag)}. All rights reserved.</p><p class="copy credits">Sample photographs via Wikimedia Commons: Augustus Binu (CC BY-SA 3.0) · Arian Zwegers (CC BY 2.0) · Jean-Pierre Dalbéra (CC BY) · Shagil Kannur (CC BY-SA 4.0) · Kamran Ahmed (CC BY-SA 4.0). Replace them with the academy’s own photos in Website Editor.</p></footer>
${has(a,"website")?'<a class="btn fab" href="#/portal/website">✎ Edit website</a>':""}`}

function loginPage(){const groups={admin:"Admin",teacher:"Teachers / staff",accounts:"Accounts",student:"Students",parent:"Parents / guardians"};
return`<div class="login"><div class="left hero-bg"><img class="login-ph" src="${PH[2].u}" alt=""><p class="script" style="position:absolute;left:40px;bottom:36px;font-size:52px">${esc(S.site.name)}</p></div>
<div class="right"><div style="width:100%;max-width:420px"><div class="row" style="justify-content:space-between;flex-wrap:nowrap">${logo()}${themeBtn()}</div><h1 class="display" style="font-size:40px;color:var(--head);margin-top:24px;line-height:1.1">Sign in</h1><p class="muted" style="font-size:14px;margin-bottom:22px">Timetable, attendance and fees are available after login.</p>
<form class="form-grid" id="loginForm"><label class="fld">Email address / Phone number<input class="inp" placeholder="Enter your registered credentials"></label><label class="fld">Password<input class="inp" type="password" placeholder="••••••••"></label>
<label class="fld">Demo account<select class="inp" id="acctSel">${Object.entries(groups).map(([r,l])=>`<optgroup label="${l}">${accounts().filter(a=>a.role===r&&a.status==="Active").map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join("")}</optgroup>`).join("")}</select></label>
<button class="btn" type="submit">Sign in</button><a href="#/" class="muted" style="text-align:center;font-size:14px">← Back to website</a></form>
<p class="note" style="margin-top:20px">Frontend preview: no real authentication yet — pick a demo account to see exactly what that person is allowed to see. Real passwords and server-side permission checks arrive with the backend.</p></div></div></div>`}

/* ================= PORTAL: NAVIGATION ================= */
function navFor(a){const adm=a.role==="admin",h=k=>has(a,k),n=[["","Dashboard","▦"]];
if(a.role==="student"||a.role==="parent"){if(a.role==="parent")n.push(["children","My Children","♥"]);n.push(["timetable","Timetable","▤"],["attendance","Attendance","✓"],["fees","Fees & Payments","₹"],["receipts","Receipts","❏"],["progress","Progress","★"],["leave","Leave Requests","✈"],["announcements","Announcements","✺"],["profile","Profile","●"]);return n}
if(a.role==="teacher")n.push(["my-batches","My Batches","☰"]);
n.push(["timetable","Timetable","▤"]);
if(h("attendance"))n.push(["mark-attendance","Mark Attendance","✎"],["attendance","Attendance Records","✓"],["leave","Leave Requests","✈"]);
if(h("students"))n.push(["students","Students","☺"],["admissions","Admissions","✉"],["guardians","Guardians","♥"],["batches","Batches","☰"]);
if(adm)n.push(["teachers","Teachers","✦"]);
if(h("assessments"))n.push(["assessments","Assessments","★"]);
if(h("finance"))n.push(["finance","Finance Dashboard","₹"],["invoices","Invoices","▣"],["payments","Payments","◎"],["receipts","Receipts","❏"],["refunds","Refunds","↩"],["outstanding","Outstanding Fees","!"]);
if(h("reports"))n.push(["reports","Reports","▥"]);
n.push(["announcements","Announcements","✺"]);
if(h("announcements"))n.push(["notifications","Notifications","🔔"]);
if(h("website"))n.push(["website","Website Editor","✎"]);
if(adm)n.push(["access","Access Control","⚿"],["settings","Settings","⚙"],["audit","Audit Logs","☷"]);
n.push(["profile","Profile","●"]);return n}
const ROLE_LABEL={admin:"Academy Admin",teacher:"Teacher / Guru",accounts:"Accounts",student:"Student",parent:"Parent / Guardian"};

/* ================= PORTAL: TIMETABLE ================= */
const tmin=t=>{const m=/(\d+):(\d+)\s*(AM|PM)?/i.exec(t||"");if(!m)return 0;let h=+m[1]%12;if((m[3]||"").toUpperCase()==="PM")h+=12;return h*60+ +m[2]};
function weekly(slots,mine){const days=["Mon","Tue","Wed","Thu","Fri","Sat"];if(slots.some(s=>s[0]==="Sun"))days.push("Sun");const times=[...new Set(slots.map(s=>s[1]))].sort((a,b)=>tmin(a)-tmin(b));
if(!times.length)return'<div class="card empty">No classes scheduled.</div>';
const cell=c=>`<div class="cell ${mine&&mine(c)?"mine":""}"><b>${esc(c[2])}</b><small>${esc(c[3])} · ${esc(c[4])}</small></div>`;
const grid=`<div class="card tt tt-grid"><table><thead><tr><th>Time</th>${days.map(d=>`<th>${d}</th>`).join("")}</tr></thead><tbody>${times.map(t=>`<tr><td class="muted" style="font-weight:600">${esc(t)}</td>${days.map(d=>`<td style="vertical-align:top">${slots.filter(x=>x[0]===d&&x[1]===t).map(cell).join("")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const agenda=`<div class="tt-agenda">${days.map(d=>{const L=slots.filter(x=>x[0]===d).sort((a,b)=>tmin(a[1])-tmin(b[1]));return L.length?`<div class="card pad"><h3 class="display" style="font-size:24px;color:var(--head);margin-bottom:8px">${d}${d===todayName()?" · Today":""}</h3><ul class="list boxed">${L.map(c=>`<li><span><b style="color:var(--head)">${esc(c[2])}</b><br><small class="muted">${esc(c[3])} · ${esc(c[4])}</small></span><span class="badge b-warn">${esc(c[1])}</span></li>`).join("")}</ul></div>`:""}).join("")}</div>`;
return grid+agenda}
function timetableView(a){let slots=S.t.tt,desc="Weekly class schedule.",mine=null;
if(!isStaff(a)){const b=kidsOf(a).map(k=>k[2]);slots=slots.filter(s=>b.includes(s[2]));desc="Your class schedule."}
else if(a.role==="teacher"){mine=c=>c[3]===a.linked;desc="All classes — your own are outlined in red."}
return pageH("Timetable",desc)+weekly(slots,mine)+(canEdit(a,"tt")?`<h2 class="display" style="font-size:26px;color:var(--head);margin:28px 0 12px">Edit timetable</h2>`+dtable("tt",{can:true,sort:(x,y)=>DAYS.indexOf(x[0])-DAYS.indexOf(y[0])||tmin(x[1])-tmin(y[1])}):"")}

/* ================= PORTAL: ATTENDANCE ================= */
let mk={batch:"",date:todayISO(),draft:{},key:""};
const myBatches=a=>(a.role==="teacher"&&!has(a,"students"))?S.t.batches.filter(b=>b[3]===a.linked):S.t.batches;
function markView(a){const bs=myBatches(a);if(!bs.length)return pageH("Mark Attendance")+'<div class="card empty">No batches are assigned to you yet. Ask the admin to assign a batch.</div>';
if(!bs.some(b=>b[1]===mk.batch))mk.batch=bs[0][1];
const key=mk.batch+"|"+mk.date;if(mk.key!==key){mk.key=key;mk.draft={};S.t.attendance.filter(r=>r[0]===mk.date&&r[1]===mk.batch).forEach(r=>mk.draft[r[2]]=r[4])}
const roster=S.t.students.filter(s=>s[2]===mk.batch&&s[6]==="Active");const dn=DAYS[new Date(mk.date+"T00:00:00").getDay()];const sched=S.t.tt.some(s=>s[0]===dn&&s[2]===mk.batch);
const c=tally(roster.map(s=>["","","","",mk.draft[s[0]]||""]));const un=roster.filter(s=>!mk.draft[s[0]]).length;const saved=S.t.attendance.some(r=>r[0]===mk.date&&r[1]===mk.batch);
return pageH("Mark Attendance","Choose a batch and date, mark each student, then save. Parents and students can see this record.")+
`<div class="card pad" style="margin-bottom:16px"><div class="row"><label class="fld" style="min-width:220px">Batch<select class="inp" id="mkBatch">${bs.map(b=>`<option ${b[1]===mk.batch?"selected":""}>${esc(b[1])}</option>`).join("")}</select></label><label class="fld">Date<input class="inp" type="date" id="mkDate" value="${mk.date}"></label><div style="align-self:end" class="row">${saved?badge("Marked"):badge("Not marked yet")}${sched?"":`<span class="badge b-warn">No class scheduled on ${dn}</span>`}</div></div></div>
<div class="card"><div class="tbl-bar"><div class="row" style="font-size:14px"><span class="badge b-success">Present ${c.Present}</span><span class="badge b-warn">Late ${c.Late}</span><span class="badge b-danger">Absent ${c.Absent}</span><span class="badge b-info">Leave ${c.Leave}</span><span class="badge b-neutral">Unmarked ${un}</span></div><button class="btn ghost sm" data-markall>Mark all present</button></div>
<div class="roster">${roster.map(s=>`<div class="r"><div><b>${esc(s[1])}</b> <span class="muted" style="font-size:12px">${esc(s[0])}</span></div><div class="seg" role="group" aria-label="Status for ${esc(s[1])}">${["Present","Late","Absent","Leave"].map(st=>`<button type="button" class="${st} ${mk.draft[s[0]]===st?"on":""}" data-st="${s[0]}:${st}">${st}</button>`).join("")}</div></div>`).join("")||'<div class="empty">No active students in this batch.</div>'}</div>
<div class="tbl-foot"><span>${roster.length} student(s)</span><button class="btn" data-saveatt>Save attendance</button></div></div>`}
function saveAttendance(a){const roster=S.t.students.filter(s=>s[2]===mk.batch&&s[6]==="Active");if(!roster.length)return toast("No students to mark");if(roster.some(s=>!mk.draft[s[0]]))return toast("Please mark every student (or use “Mark all present”).");
S.t.attendance=S.t.attendance.filter(r=>!(r[0]===mk.date&&r[1]===mk.batch));roster.forEach(s=>S.t.attendance.push([mk.date,mk.batch,s[0],s[1],mk.draft[s[0]],a.name]));log("Marked attendance",mk.batch+" · "+mk.date);save();toast("Attendance saved for "+mk.batch);refreshContent()}
let attSel="",attMonth=null;
function attendanceView(a){
if(isStaff(a)){const own=(a.role==="teacher"&&!has(a,"students"))?S.t.batches.filter(b=>b[3]===a.linked).map(b=>b[1]):null;
return pageH("Attendance Records",canEdit(a,"attendance")?"Search, correct or remove records.":"Attendance history (read-only).")+dtable("attendance",{can:canEdit(a,"attendance"),filter:own?r=>own.includes(r[1]):null,sort:(x,y)=>y[0].localeCompare(x[0])})}
const kids=kidsOf(a);if(!kids.length)return pageH("Attendance")+'<div class="card empty">No student is linked to this account yet. Ask the academy admin.</div>';
if(!kids.some(k=>k[0]===attSel))attSel=kids[0][0];const kid=kids.find(k=>k[0]===attSel);const recs=S.t.attendance.filter(r=>r[2]===attSel);
if(!attMonth){const n=new Date();attMonth={y:n.getFullYear(),m:n.getMonth()}}
const mp=String(attMonth.m+1).padStart(2,"0"),pre=attMonth.y+"-"+mp,mrecs=recs.filter(r=>r[0].startsWith(pre)),t=tally(recs);
const first=new Date(attMonth.y,attMonth.m,1).getDay(),dim=new Date(attMonth.y,attMonth.m+1,0).getDate();
let cells=DAYS.map(d=>`<div class="h">${d}</div>`).join("")+'<div class="d blank"></div>'.repeat(first);
for(let d=1;d<=dim;d++){const ds=pre+"-"+String(d).padStart(2,"0"),r=recs.find(x=>x[0]===ds);cells+=`<div class="d ${r?r[4]:""}" title="${r?r[4]:""}">${d}</div>`}
const p=pct(recs),pm=pct(mrecs);
return pageH("Attendance","View-only. Attendance is marked by your teachers.")+
(kids.length>1?`<div class="chips" style="justify-content:flex-start">${kids.map(k=>`<button class="chip ${k[0]===attSel?"on":""}" data-kid="${k[0]}">${esc(k[1])}</button>`).join("")}</div>`:"")+
`<div class="stats">${stat("Overall attendance",p==null?"—":p+"%",esc(kid[1])+" · "+esc(kid[2]),p!=null&&p<75?"red":"green")}${stat("This month",pm==null?"—":pm+"%",MONTHS[attMonth.m]+" "+attMonth.y,"gold")}${stat("Present / Late",t.Present+" / "+t.Late,"classes attended","green")}${stat("Absent",t.Absent,t.Leave+" on leave","red")}</div>
<div class="panels"><div class="card pad"><div class="panel-h"><h2>${MONTHS[attMonth.m]} ${attMonth.y}</h2><div class="row" style="gap:6px"><button class="btn ghost sm" data-month="-1" aria-label="Previous month">‹</button><button class="btn ghost sm" data-month="1" aria-label="Next month">›</button></div></div><div class="cal">${cells}</div><div class="legend"><span><i style="background:rgba(63,125,78,.5)"></i>Present</span><span><i style="background:rgba(245,158,43,.6)"></i>Late</span><span><i style="background:rgba(179,38,30,.5)"></i>Absent</span><span><i style="background:rgba(42,111,151,.5)"></i>Leave</span></div></div>
<div class="card pad"><div class="panel-h"><h2>Recent classes</h2></div><div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Batch</th><th>Status</th></tr></thead><tbody>${recs.slice().sort((x,y)=>y[0].localeCompare(x[0])).slice(0,12).map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${badge(r[4])}</td></tr>`).join("")||'<tr><td colspan="3" class="muted">No records yet.</td></tr>'}</tbody></table></div></div></div>`}

/* ================= PORTAL: FEES (student / parent) ================= */
function feesView(a){const names=kidsOf(a).map(k=>k[1]);const inv=S.t.invoices.map((r,i)=>[r,i]).filter(x=>names.includes(x[0][1]));
const total=inv.reduce((n,x)=>n+amt(x[0][3]),0),paid=inv.reduce((n,x)=>n+amt(x[0][4]),0);
const pays=S.t.payments.filter(r=>names.includes(r[1]));
return pageH("Fees & Payments","Pay online (demo) and see your payment history.")+`<div class="stats">${stat("Total billed",fmt(total))}${stat("Paid",fmt(paid),"","green")}${stat("Balance due",fmt(total-paid),total-paid>0?"Please pay by the due date":"All clear",total-paid>0?"red":"green")}</div>
<div class="card" style="margin-bottom:20px"><div class="tbl-bar"><h2 class="display" style="font-size:24px;color:var(--head)">Invoices</h2></div><div class="tbl-wrap"><table class="stack"><thead><tr><th>Invoice</th><th>Student</th><th>Period</th><th>Amount</th><th>Paid</th><th>Due date</th><th>Status</th><th></th></tr></thead><tbody>${inv.map(x=>{const r=x[0],rem=amt(r[3])-amt(r[4]);return`<tr><td data-l="Invoice">${esc(r[0])}</td><td data-l="Student">${esc(r[1])}</td><td data-l="Period">${esc(r[2])}</td><td data-l="Amount">${esc(r[3])}</td><td data-l="Paid">${esc(r[4])}</td><td data-l="Due date">${esc(r[5])}</td><td data-l="Status">${badge(r[6])}</td><td>${rem>0?`<button class="btn sm" data-pay="${x[1]}">Pay ${fmt(rem)}</button>`:""}</td></tr>`}).join("")||'<tr><td colspan="8" class="muted">No invoices yet.</td></tr>'}</tbody></table></div></div>
<div class="card"><div class="tbl-bar"><h2 class="display" style="font-size:24px;color:var(--head)">Payment history</h2></div><div class="tbl-wrap"><table class="stack"><thead><tr><th>Payment</th><th>Student</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead><tbody>${pays.map(r=>`<tr><td data-l="Payment">${esc(r[0])}</td><td data-l="Student">${esc(r[1])}</td><td data-l="Amount">${esc(r[2])}</td><td data-l="Method">${esc(r[3])}</td><td data-l="Date">${esc(r[5])}</td><td data-l="Status">${badge(r[6])}</td></tr>`).join("")||'<tr><td colspan="6" class="muted">No payments yet.</td></tr>'}</tbody></table></div></div>`}
function payModal(a,i){const r=S.t.invoices[i],rem=amt(r[3])-amt(r[4]);const m=document.createElement("div");m.className="modal";
m.innerHTML=`<form><h3>Pay ${esc(r[0])}</h3><p class="muted" style="font-size:13px">${esc(r[1])} · ${esc(r[2])} · balance ${fmt(rem)}</p><label class="fld">Amount (₹)<input class="inp" name="a" type="number" min="1" max="${rem}" value="${rem}" required></label><label class="fld">Payment method<select class="inp" name="m"><option>UPI (online)</option><option>Card (online)</option><option>Net banking (online)</option></select></label><p class="note">Demo checkout — no real money moves. A real gateway (UPI/cards) is connected in the backend phase.</p><div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn green" type="submit">Pay now</button></div></form>`;
document.body.appendChild(m);m.addEventListener("click",e=>{if(e.target===m||e.target.hasAttribute("data-close"))m.remove()});
m.querySelector("form").addEventListener("submit",e=>{e.preventDefault();const f=e.target,pay=Math.min(rem,Math.max(1,parseInt(f.a.value,10)||0)),inv=S.t.invoices[i],np=amt(inv[4])+pay;inv[4]=fmt(np);inv[6]=np>=amt(inv[3])?"Paid":"Partial";const d=todayISO(),pid=nextId("payments","PAY-",4);
S.t.payments.unshift([pid,inv[1],fmt(pay),f.m.value,"demo-"+Math.random().toString(36).slice(2,8),d,"Verified"]);S.t.receipts.unshift([nextId("receipts","RCP-",4),inv[1],inv[0],fmt(pay),d,"Issued"]);log("Online payment "+fmt(pay),inv[0]);save();m.remove();toast("Payment successful (demo) — receipt issued");refreshContent()})}

/* ================= PORTAL: DASHBOARDS ================= */
const todayName=()=>DAYS[new Date().getDay()];
const finTotals=()=>{const inv=S.t.invoices.reduce((n,r)=>n+amt(r[3]),0),col=S.t.invoices.reduce((n,r)=>n+amt(r[4]),0);return{inv,col,out:inv-col,rate:inv?Math.round(col/inv*100):0}};
const batchAtt=()=>S.t.batches.map(b=>[b[1],pct(S.t.attendance.filter(r=>r[1]===b[1]))]);
function financeView(){const f=finTotals();const per={};S.t.invoices.forEach(r=>{per[r[2]]=(per[r[2]]||0)+amt(r[4])});const meth={};S.t.payments.filter(p=>p[6]==="Verified").forEach(p=>{meth[p[3]]=(meth[p[3]]||0)+amt(p[2])});
const over=S.t.invoices.filter(r=>r[6]==="Overdue");
return pageH("Finance Dashboard","Visible only to the admin and people the admin has granted finance access.")+`<div class="stats">${stat("Total invoiced",fmt(f.inv))}${stat("Collected",fmt(f.col),f.rate+"% collection rate","green")}${stat("Outstanding",fmt(f.out),S.t.invoices.filter(r=>r[6]!=="Paid").length+" open invoice(s)","red")}${stat("Pending verification",S.t.payments.filter(p=>p[6]==="Pending").length,"payments","gold")}</div>
<div class="panels">${panel("Collections by period (₹)",bars(Object.entries(per)))}${panel("Collections by method (₹)",bars(Object.entries(meth)))}
${panel("Overdue invoices",`<ul class="list">${over.map(r=>`<li><span>${esc(r[1])} · ${esc(r[2])}</span><b>${fmt(amt(r[3])-amt(r[4]))}</b></li>`).join("")||'<li class="muted">Nothing overdue</li>'}</ul>`,"outstanding")}
${panel("Recent payments",`<ul class="list">${S.t.payments.slice(0,6).map(p=>`<li><span>${esc(p[1])} · ${esc(p[3])}</span><b>${esc(p[2])}</b></li>`).join("")}</ul>`,"payments")}</div>
<div class="row" style="margin-top:20px"><a class="btn" href="#/portal/invoices">Invoices</a><a class="btn gold" href="#/portal/payments">Payments</a><a class="btn ghost" href="#/portal/outstanding">Outstanding</a></div>`}
function staffDash(a){const adm=a.role==="admin",h=k=>has(a,k);const stats=[],pan=[];
const todays=S.t.tt.filter(s=>s[0]===todayName()&&(a.role!=="teacher"||h("students")||s[3]===a.linked));
if(h("students")){stats.push(stat("Active students",S.t.students.filter(s=>s[6]==="Active").length,S.t.batches.length+" batches"),stat("Pending enquiries",S.t.admissions.filter(r=>r[6]==="Pending").length,"awaiting review","gold"))}
stats.push(stat("Classes today",todays.length,todayName()+" · "+new Date().toLocaleDateString("en-IN"),"blue"));
if(h("finance")){const f=finTotals();stats.push(stat("Collected",fmt(f.col),f.rate+"% of billed","green"),stat("Outstanding",fmt(f.out),"","red"))}
if(h("attendance")){stats.push(stat("Leave requests",S.t.leave.filter(r=>r[4]==="Pending").length,"pending approval","gold"))}
pan.push(panel("Today's classes",`<ul class="list boxed">${todays.map(c=>{const done=S.t.attendance.some(r=>r[0]===todayISO()&&r[1]===c[2]);return`<li><span><b style="color:var(--head)">${esc(c[2])}</b><br><small class="muted">${esc(c[1])} · ${esc(c[4])}</small></span>${h("attendance")?(done?badge("Marked"):`<button class="btn sm" data-mark="${esc(c[2])}">Mark attendance</button>`):""}</li>`}).join("")||'<li class="muted">No classes today.</li>'}</ul>`,"timetable"));
if(h("attendance"))pan.push(panel("Attendance by batch (%)",bars(batchAtt(),"%",100),"attendance"));
if(h("students")||h("attendance"))pan.push(panel("Needs attention",`<ul class="list">${S.t.admissions.filter(r=>r[6]==="Pending").map(r=>`<li><span>Enquiry: ${esc(r[1])} · ${esc(r[4])}</span>${h("students")?'<a class="btn ghost sm" href="#/portal/admissions">Review</a>':""}</li>`).join("")}${S.t.leave.filter(r=>r[4]==="Pending").map(r=>`<li><span>Leave: ${esc(r[1])} · ${esc(r[2])}</span><a class="btn ghost sm" href="#/portal/leave">Review</a></li>`).join("")}</ul>`));
if(h("finance"))pan.push(panel("Recent payments",`<ul class="list">${S.t.payments.slice(0,5).map(p=>`<li><span>${esc(p[1])} · ${esc(p[3])}</span><b>${esc(p[2])}</b></li>`).join("")}</ul>`,"payments"));
pan.push(panel("Announcements",`<ul class="list">${S.t.announcements.filter(x=>h("announcements")||x[5]==="Published").map(x=>`<li><span>${esc(x[1])}</span>${badge(x[5])}</li>`).join("")}</ul>`,"announcements"));
const quick=[];if(h("attendance"))quick.push('<a class="btn" href="#/portal/mark-attendance">Mark attendance</a>');if(h("students"))quick.push('<a class="btn gold" href="#/portal/students">Students</a>');if(h("finance"))quick.push('<a class="btn gold" href="#/portal/finance">Finance dashboard</a>');if(h("website"))quick.push('<a class="btn ghost" href="#/portal/website">Edit website</a>');if(adm)quick.push('<a class="btn ghost" href="#/portal/access">Access control</a>');
return pageH(adm?"Academy Dashboard":"Welcome, "+esc(a.name),adm?"Everything at a glance. You can edit any record from its page.":ROLE_LABEL[a.role]+(a.perms.length?" · access: "+a.perms.join(", "):""))+`<div class="stats">${stats.join("")}</div><div class="panels">${pan.join("")}</div><div class="row" style="margin-top:20px">${quick.join("")}</div>`}
function familyDash(a){const kids=kidsOf(a),isP=a.role==="parent";
const cards=kids.map(k=>{const recs=S.t.attendance.filter(r=>r[2]===k[0]),p=pct(recs),inv=S.t.invoices.filter(r=>r[1]===k[1]),due=inv.reduce((n,r)=>n+amt(r[3])-amt(r[4]),0),slots=S.t.tt.filter(s=>s[2]===k[2]);const nd=new Date().getDay();const nx=slots.slice().sort((x,y)=>((DAYS.indexOf(x[0])-nd+7)%7)-((DAYS.indexOf(y[0])-nd+7)%7)||tmin(x[1])-tmin(y[1]))[0];
return`<div class="card pad"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><h2 class="display" style="font-size:28px;color:var(--head)">${esc(k[1])}</h2><p class="muted" style="font-size:12px">${esc(k[0])} · ${esc(k[2])}</p></div>${due>0?`<span class="badge b-warn">Due ${fmt(due)}</span>`:'<span class="badge b-success">No dues</span>'}</div><div style="margin:14px 0">${bars([["Attendance",p]],"%",100)}</div><p style="font-size:14px" class="muted">Next class: <b style="color:var(--ink)">${nx?nx[0]+" "+nx[1]+" · "+nx[4]:"—"}</b></p><div class="row" style="margin-top:14px"><button class="btn ghost sm" data-kidgo="${k[0]}">Attendance</button><a class="btn sm" href="#/portal/fees">Fees</a></div></div>`}).join("");
const ass=S.t.assessments.filter(r=>kids.some(k=>k[1]===r[0])).slice(0,3);
return pageH("Welcome, "+esc(a.name),isP?"Your children at a glance.":(kids[0]?esc(kids[0][2])+" · "+esc(kids[0][0]):""))+(kids.length?`<div class="panels" style="margin-bottom:20px">${cards}</div>`:'<div class="card empty">No student linked to this account yet.</div>')+`<div class="panels">${panel("Latest progress",`<ul class="list">${ass.map(r=>`<li><span>${esc(r[0])} · ${esc(r[1])}</span><b>${esc(r[2])}</b></li>`).join("")||'<li class="muted">No assessments yet.</li>'}</ul>`,"progress")}${panel("Announcements",`<ul class="list">${S.t.announcements.filter(x=>x[5]==="Published").map(x=>`<li><span>${esc(x[1])}</span></li>`).join("")||'<li class="muted">Nothing new.</li>'}</ul>`,"announcements")}</div>`}

/* ================= PORTAL: OTHER VIEWS ================= */
function reportsView(a){const lv={};S.t.students.filter(s=>s[6]==="Active").forEach(s=>lv[s[3]]=(lv[s[3]]||0)+1);const per={};S.t.invoices.forEach(r=>{per[r[2]]=(per[r[2]]||0)+amt(r[4])});
const ex=(k,l)=>`<button class="btn ghost sm" data-csv="${k}">Export ${l} CSV</button>`;
return pageH("Reports","Live figures from the academy's data.")+`<div class="panels">${panel("Attendance by batch (%)",bars(batchAtt(),"%",100))}${panel("Active students by level",bars(Object.entries(lv)))}${has(a,"finance")?panel("Collections by period (₹)",bars(Object.entries(per))):""}${panel("Export data",`<div class="row">${ex("students","students")}${ex("attendance","attendance")}${has(a,"finance")?ex("invoices","invoices")+ex("payments","payments"):""}</div>`)}</div>`}
const BR=[["name","Academy name"],["tag","Tagline"],["city","City / region"],["phone","Phone"],["email","Email"],["address","Address"],["hours","Hours"],["heroTitle","Home headline"],["heroSub","Home sub-headline","textarea"],["heroImg","Home hero photo","image"],["welcomeH","Welcome heading"],["welcome","Welcome text","textarea"],["story","Our story (About page)","textarea"],["philosophy","How we teach (About page)","textarea"],["c1","Primary colour (Classic theme)","color"],["c2","Accent colour","color"],["c3","Gold / highlight colour","color"]];
let edTab="branding";
function websiteView(){const tabs=[["branding","Branding & text"],["courses","Programmes"],["gurus","Gurus"],["gallery","Gallery"],["events","Events"],["highlights","Highlights"]];
let body;if(edTab==="branding")body=`<form class="card pad form-grid two" id="brForm">${BR.map(b=>`<div class="${b[2]==="textarea"||b[2]==="image"?"span2":""}">${fld({l:b[1],t:b[2]||"text"},"b_"+b[0])}</div>`).join("")}<div class="span2 row"><button class="btn" type="submit">Save branding</button><a class="btn ghost" href="#/" target="_blank">Preview website</a></div></form>`;
else body=dtable(edTab,{can:true});
return pageH("Website Editor","Edit anything the public sees: text, colours, photos, programmes, gurus, gallery and events.")+`<div class="tabs">${tabs.map(t=>`<button class="chip ${t[0]===edTab?"on":""}" data-tab="${t[0]}">${t[1]}</button>`).join("")}</div>${body}`}
function accessView(){const staff=accounts().filter(x=>isStaff(x));
return pageH("Access Control","Choose exactly what each staff member can see and edit. Finance and website access are off unless you grant them.")+`<div class="card" style="margin-bottom:24px"><div class="tbl-wrap"><table class="perm-tbl"><thead><tr><th>Account</th>${PERMS.map(p=>`<th>${p[1]}</th>`).join("")}</tr></thead><tbody>${staff.map(x=>`<tr><td><b>${esc(x.name)}</b><br><span class="muted" style="font-size:12px">${esc(ROLE_LABEL[x.role]||x.role)}${x.status!=="Active"?" · "+esc(x.status):""}</span></td>${PERMS.map(p=>x.role==="admin"?'<td><span class="lock">always</span></td>':`<td><input type="checkbox" data-perm="${x.id}:${p[0]}" ${x.perms.includes(p[0])?"checked":""} aria-label="${esc(x.name)} – ${p[1]}"></td>`).join("")}</tr>`).join("")}</tbody></table></div></div>
<h2 class="display" style="font-size:26px;color:var(--head);margin-bottom:12px">All accounts</h2>${dtable("users",{can:true})}<p class="note" style="margin-top:14px">Students and parents never get management access. Link a student/parent account to student IDs (e.g. STU001) so they see only their own timetable, attendance and fees.</p>`}
function settingsView(){const s=S.settings;return pageH("Settings","Fee rules and data tools (admin only).")+`<form class="card pad form-grid two" id="setForm" style="margin-bottom:20px"><label class="fld">Invoice due day of month<input class="inp" name="dueDay" type="number" value="${esc(s.dueDay)}"></label><label class="fld">Late fee (₹)<input class="inp" name="lateFee" type="number" value="${esc(s.lateFee)}"></label><label class="fld">Late-arrival threshold (minutes)<input class="inp" name="lateMins" type="number" value="${esc(s.lateMins)}"></label><div class="span2"><button class="btn" type="submit">Save settings</button></div></form>
<div class="card pad"><h2 class="display" style="font-size:24px;color:var(--head);margin-bottom:6px">Data</h2><p class="muted" style="font-size:14px;margin-bottom:14px">Everything is stored in this browser. Export a backup before clearing browser data or moving to another computer.</p><div class="row"><button class="btn" data-export>Export backup (JSON)</button><label class="btn ghost" style="cursor:pointer">Import backup<input type="file" accept="application/json" id="impFile" hidden></label><button class="btn danger" data-reset>Reset to demo data</button></div></div>`}
function profileView(a){return pageH("Profile","Your account details.")+`<div class="card pad" style="max-width:560px;display:grid;gap:14px"><div class="row" style="gap:16px"><span class="avatar" style="width:64px;height:64px;font-size:26px">${esc(a.name[0])}</span><div><p class="display" style="font-size:32px;color:var(--head);line-height:1.1">${esc(a.name)}</p><p class="muted" style="font-size:14px">${esc(ROLE_LABEL[a.role]||a.role)} · ${esc(a.email)}</p></div></div>${a.perms.length&&a.role!=="admin"?`<p style="font-size:14px"><b>Access granted by admin:</b> ${a.perms.map(p=>esc((PERMS.find(x=>x[0]===p)||[0,p])[1])).join(", ")}</p>`:""}<button class="btn ghost" data-toast="Password change arrives with the backend">Change password</button></div>`}
function leaveFormHTML(a){const kids=kidsOf(a);return`<div class="card pad" style="margin-bottom:20px"><h2 class="display" style="font-size:24px;color:var(--head);margin-bottom:12px">New leave request</h2><form class="form-grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))" id="leaveForm">${kids.length>1?`<label class="fld">Student<select class="inp" name="s">${kids.map(k=>`<option>${esc(k[1])}</option>`).join("")}</select></label>`:""}<label class="fld">Date<input required type="date" name="d" class="inp"></label><label class="fld">Reason<input required name="r" class="inp"></label><div style="align-self:end"><button class="btn" type="submit">Submit request</button></div></form></div>`}

function portalView(a,view){
switch(view){
case"":return isStaff(a)?staffDash(a):familyDash(a);
case"timetable":return timetableView(a);
case"mark-attendance":return markView(a);
case"attendance":return attendanceView(a);
case"fees":return feesView(a);
case"finance":return financeView();
case"reports":return reportsView(a);
case"website":return websiteView();
case"access":return accessView();
case"settings":return settingsView();
case"profile":return profileView(a);
case"children":return pageH("My Children")+dtable("students",{filter:r=>kidsOf(a).some(k=>k[0]===r[0])});
case"my-batches":return pageH("My Batches")+dtable("batches",{filter:r=>r[3]===a.linked});
case"outstanding":return pageH("Outstanding Fees","Invoices with a balance.")+dtable("invoices",{can:canEdit(a,"invoices"),filter:r=>r[6]!=="Paid"});
case"receipts":if(!isStaff(a)){const n=kidsOf(a).map(k=>k[1]);return pageH("Receipts")+dtable("receipts",{filter:r=>n.includes(r[1])})}return pageH("Receipts")+dtable("receipts",{can:canEdit(a,"receipts")});
case"progress":{const n=kidsOf(a).map(k=>k[1]);return pageH("Progress","Teacher assessments.")+dtable("assessments",{filter:r=>n.includes(r[0])})}
case"leave":if(!isStaff(a)){const n=kidsOf(a).map(k=>k[1]);return pageH("Leave Requests","Request leave; staff will approve it.")+leaveFormHTML(a)+dtable("leave",{filter:r=>n.includes(r[1])})}return pageH("Leave Requests","Approve or reject leave.")+dtable("leave",{can:canEdit(a,"leave")});
case"announcements":return pageH("Announcements")+dtable("announcements",{can:canEdit(a,"announcements"),filter:canEdit(a,"announcements")?null:r=>r[5]==="Published"});
case"students":case"admissions":case"guardians":case"batches":case"invoices":case"payments":case"refunds":case"assessments":case"notifications":case"teachers":case"audit":
 return pageH(SC[view].t,view==="audit"?"Every change made in the system.":"")+dtable(view,{can:canEdit(a,view)});
}
return'<div class="empty">Page not found.</div>'}

function portalShell(a,view,denied){const nav=navFor(a);const links=nav.map(n=>`<a href="#/portal${n[0]?"/"+n[0]:""}" class="${n[0]===view?"on":""}" ${n[0]===view?'aria-current="page"':""}><span class="ic">${n[2]}</span>${n[1]}</a>`).join("");
const all=accounts().filter(x=>x.status==="Active");
const body=denied?`<div class="card empty"><h2 class="display" style="font-size:28px;color:var(--head)">No access</h2><p>Your account does not have permission to open this page. The admin can grant access from Access Control.</p><p style="margin-top:12px"><a class="btn" href="#/portal">Back to dashboard</a></p></div>`:portalView(a,view);
return`<div class="portal"><aside class="side"><div class="top">${logo(true)}</div><div class="kolam" style="margin:0 16px 8px"></div><nav class="snav" aria-label="Portal">${links}</nav></aside>
<div class="drawer" id="drawer"><div class="panel"><div class="top row" style="justify-content:space-between;padding:16px">${logo(true)}<button class="burger" style="color:#fff" id="closeDrawer" aria-label="Close menu">✕</button></div><nav class="snav">${links}</nav></div><button class="back" id="drawerBack" aria-label="Close menu overlay"></button></div>
<div class="main-col"><header class="topbar"><div class="row" style="gap:12px;flex-wrap:nowrap"><button class="burger menu-btn" id="openDrawer" aria-label="Open menu">☰</button><div class="t"><b>${esc(ROLE_LABEL[a.role]||a.role)}</b><small>${esc(a.name)}</small></div></div>
<div class="row" style="gap:10px">${themeBtn()}<a class="btn ghost sm hide-sm" href="#/" title="View public website">Website</a><select id="switchAcct" class="inp" style="width:auto;padding:4px 8px;font-size:13px" aria-label="Switch demo account">${all.map(x=>`<option value="${x.id}" ${x.id===a.id?"selected":""}>${esc(x.name)} (${x.role})</option>`).join("")}</select><span class="avatar hide-sm" title="${esc(a.name)}">${esc(a.name[0])}</span><button class="btn ghost sm" data-logout>Log out</button></div></header>
<main class="content" id="content">${body}</main></div></div>`}

/* ================= ROUTER ================= */
let curView="";
function afterRender(){const br=$("#brForm");if(br)BR.forEach(b=>setVal(br,"b_"+b[0],S.site[b[0]]))}
function render(){const h=(location.hash||"#/").replace(/^#\/?/,"").split("?")[0],parts=h.split("/").filter(Boolean),app=$("#app"),a=cur();
if(parts[0]==="portal"){if(!a){location.hash="#/login";return}const view=parts[1]||"";curView=view;
 app.innerHTML=portalShell(a,view,!navFor(a).some(n=>n[0]===view))}
else if(parts[0]==="login"){app.innerHTML=loginPage()}
else{const r=parts[0]||"",pg=PUBLIC[r];app.innerHTML=publicShell(r,pg?pg():`<div class="empty" style="padding:120px 16px">Page not found. <a href="#/" style="color:var(--link-hover)">Go home</a></div>`)}
document.title=(parts[0]==="portal"?"Portal – ":"")+S.site.name+" – "+S.site.tag;applyTheme();afterRender();window.scrollTo(0,0);initFX();onScroll()}
function refreshContent(){const a=cur(),c=$("#content");if(!a||!c)return;c.innerHTML=portalView(a,curView);afterRender()}
window.addEventListener("hashchange",render);

/* ================= EVENTS ================= */
document.addEventListener("click",e=>{const t=e.target.closest("[data-theme-toggle],[data-toast],[data-pg],[data-add],[data-ed],[data-del],[data-st],[data-markall],[data-saveatt],[data-mark],[data-cat],[data-enq],[data-lb],[data-pay],[data-kid],[data-kidgo],[data-month],[data-tab],[data-csv],[data-export],[data-reset],[data-logout],[data-clearimg],#burger,#openDrawer,#closeDrawer,#drawerBack");
if(!t){if(e.target.closest(".mob a,.drawer a")){const m=$("#mob"),d=$("#drawer");m&&m.classList.remove("open");d&&d.classList.remove("open")}return}
const a=cur(),D=t.dataset;
if(t.hasAttribute("data-theme-toggle")){theme=theme==="night"?"classic":"night";store.set("nritya_laya_theme",theme);applyTheme();document.querySelectorAll("[data-theme-toggle]").forEach(b=>{b.innerHTML=themeBtnInner()});return}
if(D.toast)return toast(D.toast);
if(D.pg){const[id,d]=D.pg.split(":");TB[id].p+=+d;return refreshTbl(id)}
if(D.add)return tblAdd(D.add);
if(D.ed){const[id,i]=D.ed.split(":");return tblEdit(id,+i)}
if(D.del){const[id,i]=D.del.split(":");return tblDel(id,+i)}
if(D.st){const[sid,st]=D.st.split(":");mk.draft[sid]=st;return refreshContent()}
if(t.hasAttribute("data-markall")){S.t.students.filter(s=>s[2]===mk.batch&&s[6]==="Active").forEach(s=>mk.draft[s[0]]="Present");return refreshContent()}
if(t.hasAttribute("data-saveatt"))return saveAttendance(a);
if(D.mark){mk.batch=D.mark;mk.date=todayISO();mk.key="";location.hash="#/portal/mark-attendance";return}
if(D.cat){catFilter=D.cat;return render()}
if(D.enq){enqCourse=D.enq;location.hash="#/admission";return}
if(D.lb!==undefined){const g=S.t.gallery[+D.lb];const m=document.createElement("div");m.className="modal";m.innerHTML=`<div class="box" style="max-width:760px"><div style="max-height:70vh;overflow:hidden;border-radius:12px;display:grid;place-items:center;background:var(--peach)">${g[2]?`<img src="${esc(g[2])}" alt="${esc(g[0])}" style="max-width:100%;max-height:70vh">`:art("orange",0,320)}</div><h3>${esc(g[0])}</h3><p class="muted">${esc(g[1])}</p><div style="text-align:right"><button class="btn" data-close>Close</button></div></div>`;document.body.appendChild(m);m.addEventListener("click",ev=>{if(ev.target===m||ev.target.hasAttribute("data-close"))m.remove()});return}
if(D.pay)return payModal(a,+D.pay);
if(D.kid){attSel=D.kid;return refreshContent()}
if(D.kidgo){attSel=D.kidgo;location.hash="#/portal/attendance";return}
if(D.month){const m=attMonth.m+ +D.month;attMonth={y:attMonth.y+(m<0?-1:m>11?1:0),m:(m+12)%12};return refreshContent()}
if(D.tab){edTab=D.tab;return refreshContent()}
if(D.csv)return download(D.csv+".csv",csvOf(D.csv),"text/csv");
if(t.hasAttribute("data-export"))return download("nritya-laya-backup-"+todayISO()+".json",JSON.stringify(S),"application/json");
if(t.hasAttribute("data-reset")){if(confirm("Reset ALL data in this browser back to the demo data? This cannot be undone.")){S=seed();save();toast("Demo data restored");render()}return}
if(t.hasAttribute("data-logout")){sess=null;store.del(SES);location.hash="#/";render();return}
if(D.clearimg){const f=t.closest("form");f.elements[D.clearimg].value="";syncPrev(f,D.clearimg);return}
if(t.id==="burger")return $("#mob").classList.toggle("open");
if(t.id==="openDrawer")return $("#drawer").classList.add("open");
if(t.id==="closeDrawer"||t.id==="drawerBack")return $("#drawer").classList.remove("open")});

document.addEventListener("input",e=>{const el=e.target;if(el.dataset&&el.dataset.search){TB[el.dataset.search].q=el.value;TB[el.dataset.search].p=0;refreshTbl(el.dataset.search)}
if(el.closest&&el.closest(".imgfld")&&el.type!=="file")syncPrev(el.form,el.name)});
document.addEventListener("change",e=>{const el=e.target;
if(el.dataset&&el.dataset.imgfor&&el.files[0]){const f=el.form,n=el.dataset.imgfor;readImg(el.files[0],d=>{f.elements[n].value=d;syncPrev(f,n)});return}
if(el.id==="mkBatch"){mk.batch=el.value;return refreshContent()}
if(el.id==="mkDate"){if(el.value){mk.date=el.value;refreshContent()}return}
if(el.id==="switchAcct"){sess=el.value;store.set(SES,sess);location.hash="#/portal";render();return}
if(el.dataset&&el.dataset.perm){const[id,p]=el.dataset.perm.split(":"),r=S.t.users.find(u=>u[0]===id);let ps=String(r[6]).split(",").map(x=>x.trim()).filter(Boolean);ps=el.checked?[...new Set([...ps,p])]:ps.filter(x=>x!==p);r[6]=ps.join(",");log((el.checked?"Granted ":"Revoked ")+p,r[1]);save();toast((el.checked?"Granted: ":"Revoked: ")+(PERMS.find(x=>x[0]===p)||[0,p])[1]+" — "+r[1]);return}
if(el.id==="impFile"&&el.files[0]){const fr=new FileReader();fr.onload=()=>{try{const o=JSON.parse(fr.result);if(!o||o.v!==3||!o.t||!o.site)throw 0;S=o;save();toast("Backup imported");render()}catch(x){toast("That file is not a valid backup")}};fr.readAsText(el.files[0])}});

document.addEventListener("submit",e=>{const f=e.target;
if(f.id==="loginForm"){e.preventDefault();sess=$("#acctSel").value;store.set(SES,sess);log("Signed in","");location.hash="#/portal";return}
if(f.id==="admForm"){e.preventDefault();const g=n=>f.elements[n].value;S.t.admissions.unshift([nextId("admissions","ENQ-",3),g("n"),g("p"),g("e"),g("c"),todayISO(),"Pending","DOB "+g("d")+(g("g")?" · Guardian: "+g("g"):"")+(g("m")?" · "+g("m"):"")]);save();enqCourse="";$("#adm").innerHTML='<div style="text-align:center;padding:20px"><div style="font-size:44px;color:var(--success)">✔</div><h3 class="display" style="font-size:30px;color:var(--head)">Thank you — enquiry received</h3><p class="muted">The academy will contact you soon.</p></div>';return}
if(f.id==="msgForm"){e.preventDefault();S.t.admissions.unshift([nextId("admissions","ENQ-",3),f.n.value,f.c.value,"","General message",todayISO(),"Pending",f.m.value]);save();f.reset();toast("Message sent — thank you!");return}
if(f.id==="leaveForm"){e.preventDefault();const a=cur(),k=kidsOf(a),name=f.elements.s?f.elements.s.value:k[0][1];S.t.leave.unshift([nextId("leave","LV-",3),name,f.d.value,f.r.value,"Pending"]);log("Leave requested",name);save();toast("Leave request submitted");refreshContent();return}
if(f.id==="brForm"){e.preventDefault();BR.forEach(b=>{S.site[b[0]]=f.elements["b_"+b[0]].value});log("Edited website branding","");save();applyTheme();toast("Website updated — open the public site to see it");return}
if(f.id==="setForm"){e.preventDefault();["dueDay","lateFee","lateMins"].forEach(k=>S.settings[k]=f.elements[k].value);log("Edited settings","");save();toast("Settings saved");return}});

/* ================= SCROLL EFFECTS ================= */
let io=null,ticking=false;
function initFX(){if(io){io.disconnect();io=null}
 const reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 const sel=".page-hero .in>*,main .sec-title,main section .chips,main .grid>*,main .tiles>*,.hero-grid>*,main .marquee,.content .page-h,.content .stats>*,.content .panels>*,.content>.card,.content>.tabs,.content>.tt-grid,.content>.tt-agenda";
 const els=[...document.querySelectorAll(sel)],cnt=new Map();
 if(!("IntersectionObserver" in window)||reduce){els.forEach(e=>e.classList.add("rv","in","done"));return}
 counters();
 io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){const tg=x.target;tg.classList.add("in");setTimeout(()=>tg.classList.add("done"),1500);io.unobserve(tg)}}),{threshold:.08,rootMargin:"0px 0px -6% 0px"});
 els.forEach(e=>{if(e.classList.contains("rv"))return;const p=e.parentElement,i=cnt.get(p)||0;cnt.set(p,i+1);
  const two=p.classList.contains("g2")||p.classList.contains("hero-grid");
  e.classList.add("rv");if(e.classList.contains("tile"))e.style.setProperty("--r",((Math.random()*2-1)*5).toFixed(1)+"deg");if(two)e.classList.add(i===0?"rv-l":"rv-r");else if(e.classList.contains("tile"))e.classList.add("rv-z");
  e.style.setProperty("--d",(Math.min(i,6)*0.09+Math.random()*0.05).toFixed(2)+"s");io.observe(e)});fx3d()}
function onScroll(){const y=window.scrollY||0,de=document.documentElement,max=de.scrollHeight-window.innerHeight;
 const pb=$("#progress");if(pb)pb.style.transform="scaleX("+(max>0?Math.min(1,y/max):0).toFixed(4)+")";
 vel+=(y-lastY)*.35;lastY=y;if(vel)kick();const sc=$(".sticky-cta");if(sc)sc.classList.toggle("show",y>380);document.querySelectorAll("[data-parx]").forEach(e=>{const r=e.parentElement.getBoundingClientRect(),c=r.top+r.height/2-window.innerHeight/2;e.style.setProperty("--px",(c*parseFloat(e.dataset.parx)).toFixed(1)+"px")});document.querySelectorAll("[data-path]").forEach(p=>{const r=p.getBoundingClientRect(),k=Math.max(0,Math.min(1,(innerHeight*.62-r.top)/Math.max(1,r.height)));p.style.setProperty("--prog",k.toFixed(3));p.querySelectorAll(".step").forEach(s=>{const b=s.getBoundingClientRect();s.classList.toggle("on",b.top<innerHeight*.62)})});
 document.querySelectorAll("[data-film]").forEach(f=>{const pin=f.firstElementChild,tr=pin.firstElementChild;if(innerWidth<900||(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)){f.style.height="";return}const dist=Math.max(0,tr.scrollWidth-pin.clientWidth),H=Math.round(pin.offsetHeight+dist);if(f.dataset.h!==String(H)){f.style.height=H+"px";f.dataset.h=H}const r=f.getBoundingClientRect(),p=Math.max(0,Math.min(1,(96-r.top)/Math.max(1,dist)));f.style.setProperty("--fx",(-p*dist).toFixed(1)+"px");const fb=f.parentElement.querySelector(".film-bar");if(fb)fb.style.setProperty("--fp",p.toFixed(3))});
 const dn=document.getElementById("dots");if(dn&&dn._secs){let a=0;dn._secs.forEach((s,i)=>{if(s.getBoundingClientRect().top<innerHeight*.45)a=i});dn.querySelectorAll("a").forEach((x,i)=>x.classList.toggle("on",i===a))}
 const hd=$(".pub-head");if(hd)hd.classList.toggle("scrolled",y>30);
 const o=$("#orbs");if(o)o.style.setProperty("--sy",y+"px");
 document.querySelectorAll("[data-par]").forEach(e=>{const r=e.getBoundingClientRect(),c=r.top+r.height/2-window.innerHeight/2;e.style.setProperty("--py",(c*parseFloat(e.dataset.par)).toFixed(1)+"px")})}
window.addEventListener("scroll",()=>{if(!ticking){ticking=true;requestAnimationFrame(()=>{onScroll();ticking=false})}},{passive:true});
window.addEventListener("resize",onScroll);
let cio=null;
function counters(){if(cio){cio.disconnect();cio=null}const els=[...document.querySelectorAll("[data-count]")];if(!els.length||!("IntersectionObserver" in window)||(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches))return;
 cio=new IntersectionObserver(es=>es.forEach(x=>{if(!x.isIntersecting)return;const el=x.target,n=+el.dataset.count,t0=performance.now();cio.unobserve(el);
  (function f(t){const p=Math.min(1,(t-t0)/1500),e=1-Math.pow(1-p,4);el.textContent=Math.round(n*e*(1+Math.sin(p*Math.PI)*.06));if(p<1)requestAnimationFrame(f);else el.textContent=n})(t0)}),{threshold:.6});
 els.forEach(e=>{e.textContent="0";cio.observe(e)})}
function buildDots(){const o=document.getElementById("dots");if(o)o.remove();if(location.hash&&location.hash!=="#/"||innerWidth<1100)return;
 const secs=[...document.querySelectorAll("main>section")].filter(s=>s.classList.contains("hero-home")||s.querySelector(".sec-title h2"));if(secs.length<3)return;
 const n=document.createElement("nav");n.id="dots";n.className="dots";n.setAttribute("aria-label","Page sections");
 n.innerHTML=secs.map((s,i)=>`<a href="#" data-dot="${i}" aria-label="${esc(s.classList.contains("hero-home")?"Home":s.querySelector(".sec-title h2").textContent)}"><span>${esc(s.classList.contains("hero-home")?"Home":s.querySelector(".sec-title h2").textContent)}</span></a>`).join("");
 n._secs=secs;document.body.appendChild(n);n.addEventListener("click",e=>{const a=e.target.closest("[data-dot]");if(!a)return;e.preventDefault();e.stopPropagation();secs[+a.dataset.dot].scrollIntoView({behavior:"smooth",block:"start"})})}
document.addEventListener("click",e=>{const q=e.target.closest&&e.target.closest("[data-faq]");if(!q)return;const i=q.parentElement,o=!i.classList.contains("open");i.classList.toggle("open",o);q.setAttribute("aria-expanded",o)});
document.addEventListener("pointermove",e=>{if(e.pointerType!=="mouse"||!(e.target instanceof Element))return;const m=e.target.closest("[data-mag]");if(!m)return;const r=m.getBoundingClientRect();m.style.transform=`translate(${((e.clientX-r.left-r.width/2)*.25).toFixed(1)}px,${((e.clientY-r.top-r.height/2)*.35).toFixed(1)}px)`},{passive:true});
document.addEventListener("pointerout",e=>{const m=e.target instanceof Element&&e.target.closest("[data-mag]");if(m&&!m.contains(e.relatedTarget))m.style.transform=""});
/* ===== 3D motion: spring physics with a little overshoot and idle "breathing", so it moves like a hand, not a machine ===== */
const FINE=!!(window.matchMedia&&matchMedia("(hover:hover) and (pointer:fine)").matches),REDUCE=!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);
let tilts=new Map(),scenes=[],loopOn=false,vel=0,lastY=window.scrollY||0,curT=null;
const spr=(o,tx,ty,k,d)=>{o.vx=(o.vx+(tx-o.x)*k)*d;o.vy=(o.vy+(ty-o.y)*k)*d;o.x+=o.vx;o.y+=o.vy};
function kick(){if(!loopOn){loopOn=true;requestAnimationFrame(tick)}}
function tick(t){let busy=false;
 tilts.forEach((o,el)=>{spr(o,o.tx,o.ty,.09,.78);el.style.transform=`perspective(900px) rotateX(${o.x.toFixed(2)}deg) rotateY(${o.y.toFixed(2)}deg) translateZ(${o.on?16:0}px)`;if(!o.on&&Math.abs(o.x)+Math.abs(o.y)+Math.abs(o.vx)+Math.abs(o.vy)<.03){el.style.transform="";tilts.delete(el)}else busy=true});
 scenes=scenes.filter(s=>s.el.isConnected);
 scenes.forEach(s=>{const tx=s.on?s.tx:Math.sin(t/2300)*2.4,ty=s.on?s.ty:Math.sin(t/3100+1)*4.2;spr(s,tx,ty,.045,.86);s.el.style.transform=`rotateX(${s.x.toFixed(2)}deg) rotateY(${s.y.toFixed(2)}deg)`;busy=true});
 vel*=.9;const sw=document.querySelector(".strings");if(sw){sw.style.setProperty("--vel",Math.max(-16,Math.min(16,vel*.5)).toFixed(2));if(Math.abs(vel)>.05)busy=true}
 if(busy&&!document.hidden)requestAnimationFrame(tick);else loopOn=false}
document.addEventListener("visibilitychange",kick);
function relTilt(el){const o=tilts.get(el);if(o){o.tx=o.ty=0;o.on=false}el.classList.remove("tilting")}
document.addEventListener("pointermove",e=>{if(e.pointerType!=="mouse"||REDUCE||!(e.target instanceof Element))return;const el=e.target.closest("[data-tilt]");if(curT&&curT!==el)relTilt(curT);curT=el;if(!el)return;
 const r=el.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;let o=tilts.get(el);if(!o){o={x:0,y:0,vx:0,vy:0,tx:0,ty:0,on:true};tilts.set(el,o)}
 o.tx=-py*10;o.ty=px*12;o.on=true;el.style.setProperty("--gx",((px+.5)*100).toFixed(0)+"%");el.style.setProperty("--gy",((py+.5)*100).toFixed(0)+"%");el.classList.add("tilting");kick()},{passive:true});
function fx3d(){if(REDUCE)return;
 if(FINE)document.querySelectorAll(".cat-card,.tile,.photo-stack figure,.grid.g4>.card").forEach(e=>e.setAttribute("data-tilt",""));
 document.querySelectorAll("[data-scene]").forEach(el=>{const s={el,x:0,y:0,vx:0,vy:0,tx:0,ty:0,on:false},sec=el.closest("section");scenes.push(s);
  if(sec){sec.addEventListener("pointermove",e=>{if(e.pointerType!=="mouse")return;const r=sec.getBoundingClientRect();s.on=true;s.tx=-((e.clientY-r.top)/r.height-.5)*9;s.ty=((e.clientX-r.left)/r.width-.5)*14;kick()},{passive:true});sec.addEventListener("pointerleave",()=>{s.on=false})}});
 document.querySelectorAll("[data-petals]").forEach(hh=>{if(hh.childElementCount)return;const n=innerWidth<700?7:14;for(let i=0;i<n;i++){const p=document.createElement("i");p.className="petal";p.style.cssText=`left:${(Math.random()*100).toFixed(1)}%;--dx:${((Math.random()-.5)*170).toFixed(0)}px;--dur:${(10+Math.random()*9).toFixed(1)}s;--dl:-${(Math.random()*18).toFixed(1)}s;--s:${(.6+Math.random()*.8).toFixed(2)}`;hh.appendChild(p)}});
 document.querySelectorAll("img.cover,.photo-stack img").forEach(i=>{if(!i.closest(".hero-img")&&!i.loading)i.loading="lazy";i.decoding="async";i.referrerPolicy="no-referrer"});
 document.querySelectorAll(".page-hero h1").forEach(hh=>{if(hh.dataset.sp)return;hh.dataset.sp=1;hh.innerHTML=hh.textContent.split(" ").map((w,i)=>`<span class="w"><span style="--i:${i}">${esc(w)}</span></span>`).join(" ")});
 if(FINE)document.querySelectorAll(".hero-home .btn,section.hero-bg .btn.light").forEach(b=>b.setAttribute("data-mag",""));
 buildDots();kick()}
document.addEventListener("error",e=>{const t=e.target;if(t&&t.tagName==="IMG")t.classList.add("broken")},true);

S=load();render();
})();
