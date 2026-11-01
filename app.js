"use strict";
/* CollabSpace - app.js (plain JavaScript, no libraries)
   MAP: 1 Storage | 2 Helpers | 3 Sample data | 4 Router | 5 Home | 6 Collaborate
        7 Learn & Mentor | 8 Communities | 9 Profile & Activity | 10 Start
   Rule for teammates: every page is a function that returns HTML text.
   Buttons call functions by name (onclick). Data lives in the one object `db`. */

/* ===== 1. STORAGE ===== */
const KEY = 'collabspace_v1', DAY = 864e5;
let db, ui = { tab: 'mentors', lq: '', comm: 'all', sort: 'new' };

function load() {
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }   // bad or missing data -> start fresh
  if (!db || !db.users) db = seed();
  db.requests.forEach(r => { if (r.status === 'open' && Date.now() > new Date(r.at).getTime() + r.days * DAY) r.status = 'expired'; });
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('Storage unavailable: changes will be lost on refresh'); } }
function commit(msg) { save(); if (msg) toast(msg); route(); }   // save, show message, redraw page
function resetData() { if (confirm('Reset all demo data?')) { localStorage.removeItem(KEY); db = seed(); commit('Demo data restored'); } }

/* ===== 2. HELPERS ===== */
const $ = s => document.querySelector(s);
const uid = p => p + '_' + Math.random().toString(36).slice(2, 8);
const now = () => new Date().toISOString();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const by = (arr, id) => arr.find(x => x.id === id);
const U = id => by(db.users, id) || { name: 'Unknown', known: [], teach: [], learning: [], modes: [] };
const me = () => U(db.me);
const day = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const list = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
const chips = (a, cls = '') => (a || []).map(s => `<span class="chip ${cls}">${esc(s)}</span>`).join('');
const badge = s => `<span class="badge ${s}">${esc(s.replace('_', ' '))}</span>`;
const empty = m => `<div class="empty">${m}</div>`;
const CATS = ['Robotics', 'Web', 'AI/ML', 'Research', 'Campus', 'Other'];
const LEVELS = ['Beginner-friendly', 'Mixed level', 'Experience needed'];
const FORMATS = ['Mentor support', 'Peer group', 'Either'];

function notify(to, msg) { if (to && to !== db.me) db.notes.push({ id: uid('n'), to, msg, at: now(), read: false }); }
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); }
function closeModal() { $('#modal').classList.remove('show'); }

/* One popup form for the whole app.
   fields: {n:name, l:label, t:type (text|area|number|date|select), r:required, o:options}
   onOk(data) returns an error text to keep the popup open, or nothing to finish. */
function openForm(title, fields, onOk, vals = {}) {
  const input = f => {
    const v = vals[f.n] ?? '';
    if (f.t === 'select') return `<select name="${f.n}">${f.o.map(o => { const [val, lab] = typeof o === 'string' ? [o, o] : [o.v, o.l]; return `<option value="${esc(val)}" ${v === val ? 'selected' : ''}>${esc(lab)}</option>`; }).join('')}</select>`;
    if (f.t === 'area') return `<textarea name="${f.n}" rows="3">${esc(v)}</textarea>`;
    return `<input name="${f.n}" type="${f.t || 'text'}" value="${esc(v)}">`;
  };
  $('#mbody').innerHTML = `<h3>${esc(title)}</h3><form id="f" novalidate>${fields.map(f => `<label>${f.l}${f.r ? ' *' : ''}${input(f)}</label>`).join('')}<p class="err" id="ferr"></p><div class="row"><button type="button" class="btn" onclick="closeModal()">Cancel</button><button class="btn pri">Save</button></div></form>`;
  $('#f').onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    for (const f of fields) {
      d[f.n] = (d[f.n] || '').trim();
      if (f.r && !d[f.n]) return $('#ferr').textContent = f.l + ' is required.';
      if (f.t === 'number' && d[f.n] && !(+d[f.n] >= 1)) return $('#ferr').textContent = f.l + ' must be 1 or more.';
    }
    const err = onOk(d);
    if (err) return $('#ferr').textContent = err;
    closeModal();
  };
  $('#modal').classList.add('show');
}

/* ===== 3. SAMPLE DATA (clearly fake demo records) ===== */
function seed() {
  const t = now();
  return {
    me: 'u1',
    users: [
      { id: 'u1', name: 'Aarav Nair', year: '2nd year', branch: 'ECE', bio: 'Robotics hobbyist. Demo account.', known: ['Embedded C', 'Arduino'], learning: ['STM32', 'Python'], teach: ['Arduino basics'], hours: 6, modes: ['mentor', 'contributor'] },
      { id: 'u2', name: 'Meera Iyer', year: '3rd year', branch: 'CSE', bio: 'Web developer. Demo account.', known: ['Python', 'HTML/CSS', 'Git'], learning: ['Machine learning'], teach: ['Python', 'Git basics'], hours: 8, modes: ['mentor', 'contributor'] },
      { id: 'u3', name: 'Rohan Das', year: '1st year', branch: 'ECE', bio: 'Beginner who loves to learn. Demo account.', known: ['C basics'], learning: ['Python', 'Embedded systems'], teach: [], hours: 5, modes: ['learner', 'peer learner'] },
      { id: 'u4', name: 'Campus Moderator', year: 'Staff', branch: 'Admin', bio: 'Demo admin: can pin notices and review reports.', known: [], learning: [], teach: [], hours: 0, modes: [], mod: true }
    ],
    opps: [{
      id: 'opp_1', owner: 'u1', title: 'Line-following robot', desc: 'Build a small robot that follows a track using IR sensors.', outcome: 'A working robot demo',
      cat: 'Robotics', days: 21, deadline: '2026-11-30', hours: 4, level: 'Beginner-friendly', status: 'open', summary: '',
      roles: [
        { id: 'r1', title: 'Embedded C contributor', openings: 2, req: ['C basics'], pref: ['Arduino'], beginner: true, deliverable: 'Sensor reading code' },
        { id: 'r2', title: 'Chassis designer', openings: 1, req: ['CAD'], pref: [], beginner: false, deliverable: 'Chassis design' }]
    }],
    apps: [], tasks: [],
    offers: [{ id: 'of_1', mentor: 'u1', topic: 'STM32 guidance', desc: 'Two weekly sessions on STM32 basics.', level: 'Beginner', format: 'Mentor support', avail: 'Weekends', status: 'open' }],
    requests: [{ id: 'lr_1', owner: 'u3', topic: 'Python for data analysis', level: 'Beginner', outcome: 'Finish a small analysis', days: 14, hours: 5, format: 'Peer group', status: 'open', at: t }],
    mreqs: [],
    circles: [{ id: 'ci_1', owner: 'u2', topic: 'Beginner Python circle', outcome: 'Finish a small analysis task', days: 14, members: ['u2'], status: 'open', summary: '',
      miles: [{ id: 'm1', title: 'Python basics', desc: 'Variables, loops, functions', link: '', done: [] }, { id: 'm2', title: 'Data handling', desc: 'Lists, dictionaries, CSV files', link: '', done: [] }] }],
    comms: [
      { id: 'c1', name: 'General Campus', type: 'General', desc: 'Events, hostel and clubs.', members: ['u1', 'u2', 'u3', 'u4'] },
      { id: 'c2', name: 'AI/ML', type: 'Topic', desc: 'Machine learning discussion.', members: ['u2'] },
      { id: 'c3', name: 'ECE Branch', type: 'Branch', desc: 'ECE notices and questions.', members: ['u1', 'u3'] },
      { id: 'c4', name: 'Second Year', type: 'Batch', desc: 'Batch-specific discussion.', members: ['u1'] }],
    posts: [
      { id: 'p1', comm: 'c1', author: 'u4', type: 'Announcement', title: 'Demo notice: library open late during exams', content: 'This is a sample announcement.', url: '', options: [], pinned: true, status: 'published', at: t },
      { id: 'p2', comm: 'c2', author: 'u2', type: 'Question', title: 'Good beginner resources for machine learning?', content: 'Looking for free courses or books to start with.', url: '', options: [], pinned: false, status: 'published', at: t },
      { id: 'p3', comm: 'c1', author: 'u2', type: 'Poll', title: 'Best time for weekend workshops?', content: '', url: '', options: ['Saturday morning', 'Saturday evening', 'Sunday'], pinned: false, status: 'published', at: t },
      { id: 'p4', comm: 'c3', author: 'u3', type: 'Idea', title: 'Shared component shelf for ECE labs', content: 'Students could lend spare sensors and boards to each other for projects.', url: '', options: [], pinned: false, status: 'published', at: t }],
    comments: [{ id: 'cm1', post: 'p2', author: 'u1', parent: '', text: 'Try a free introductory course first, then build one small project.', at: t, status: 'published' }],
    reacts: [], votes: [], reports: [], notes: []
  };
}

/* ===== 4. ROUTER (address bar decides the page) ===== */
function route() {
  const [, pg = 'home', id] = location.hash.split('/');
  const pages = { home, projects: id ? projectPage : projectsPage, learn, community, profile, activity };
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.dataset.p === pg));
  $('#who').innerHTML = db.users.map(u => `<option value="${u.id}" ${u.id === db.me ? 'selected' : ''}>${esc(u.name)}</option>`).join('');
  const unread = db.notes.filter(n => n.to === db.me && !n.read).length;
  $('#bell').textContent = unread || '';
  const v = $('#view');
  v.classList.remove('fade'); void v.offsetWidth; v.classList.add('fade');
  try { v.innerHTML = (pages[pg] || home)(id); }
  catch (e) { console.error(e); v.innerHTML = empty('Something went wrong. <button class="btn sm" onclick="resetData()">Reset demo data</button>'); }
  if ($('#plist')) filterProjects();
  if ($('#mlist')) fillMentors();
}

/* ===== 5. HOME ===== */
function home() {
  const m = me(), mineOpps = db.opps.filter(o => o.owner === m.id).map(o => o.id);
  const pend = db.apps.filter(a => a.status === 'pending' && mineOpps.includes(a.opp)).length;
  const openOpps = db.opps.filter(o => o.status === 'open'), openReq = db.requests.filter(r => r.status === 'open');
  const pinned = db.posts.filter(p => p.pinned && p.status !== 'removed');
  return `<section class="hero"><h1>Find people. Share goals. Build together.</h1><p>Welcome, ${esc(m.name)}. Post a short-term goal, find collaborators, learn together and share campus information.</p></section>
  <div class="grid3">
    <a class="card link" href="#/projects"><h3>Collaborate</h3><p class="mut">${openOpps.length} open projects. ${pend} applications waiting for you.</p></a>
    <a class="card link" href="#/learn"><h3>Learn &amp; Mentor</h3><p class="mut">${openReq.length} open learning requests, ${db.offers.filter(o => o.status === 'open').length} mentor offers.</p></a>
    <a class="card link" href="#/community"><h3>Communities</h3><p class="mut">${db.posts.filter(p => p.status !== 'removed').length} posts in ${db.comms.length} communities.</p></a>
  </div>
  <h2>Pinned announcements</h2>${pinned.map(p => `<div class="card pin" style="margin-top:10px"><b>${esc(p.title)}</b><p class="mut">${esc(p.content)}</p></div>`).join('') || empty('No pinned announcements.')}
  <h2>Latest projects</h2><div class="grid2">${db.opps.filter(o => o.status !== 'archived').slice(-4).reverse().map(oppCard).join('') || empty('No projects yet.')}</div>`;
}

/* ===== 6. COLLABORATE (projects) ===== */
const STAT = ['open', 'forming', 'active', 'completed', 'archived'];
const T = { open: ['forming', 'active', 'archived'], forming: ['active', 'archived'], active: ['completed'], completed: ['archived'], archived: [] };   // allowed status changes
const accepted = rid => db.apps.filter(a => a.role === rid && a.status === 'accepted').length;
const openLeft = o => o.roles.reduce((s, r) => s + Math.max(0, r.openings - accepted(r.id)), 0);

const oppCard = o => `<a class="card link" href="#/projects/${o.id}"><div class="between"><h3>${esc(o.title)}</h3>${badge(o.status)}</div><p class="mut">${esc(o.desc.slice(0, 110))}${o.desc.length > 110 ? '...' : ''}</p><div class="meta"><span>${esc(o.cat)}</span><span>${o.days} days</span><span>Due ${day(o.deadline)}</span><span>${esc(o.level)}</span><span>${openLeft(o)} openings</span></div></a>`;

function projectsPage() {
  return `<div class="head"><div><h1>Collaborate</h1><p class="mut">Find a project, join a role, build together.</p></div><button class="btn pri" onclick="newOpp()">New project</button></div>
  <div class="filters"><input id="q" placeholder="Search projects, roles, skills" oninput="filterProjects()">
  <select id="st" onchange="filterProjects()"><option value="all">All (not archived)</option>${STAT.map(s => `<option>${s}</option>`).join('')}</select>
  <select id="ct" onchange="filterProjects()"><option value="all">All categories</option>${CATS.map(c => `<option>${c}</option>`).join('')}</select></div><div id="plist" class="grid2"></div>`;
}
function filterProjects() {
  const q = $('#q').value.toLowerCase(), st = $('#st').value, ct = $('#ct').value;
  const l = db.opps.filter(o => (st === 'all' ? o.status !== 'archived' : o.status === st) && (ct === 'all' || o.cat === ct) &&
    (o.title + o.desc + o.roles.map(r => r.title + r.req).join()).toLowerCase().includes(q));
  $('#plist').innerHTML = l.length ? l.map(oppCard).join('') : empty('No projects match your search.');
}

const OPP_FIELDS = [
  { n: 'title', l: 'Title', r: 1 }, { n: 'desc', l: 'Problem statement', t: 'area', r: 1 }, { n: 'outcome', l: 'Expected outcome', r: 1 },
  { n: 'cat', l: 'Category', t: 'select', o: CATS }, { n: 'days', l: 'Duration (days)', t: 'number', r: 1 }, { n: 'deadline', l: 'Deadline', t: 'date', r: 1 },
  { n: 'hours', l: 'Weekly hours expected', t: 'number', r: 1 }, { n: 'level', l: 'Experience', t: 'select', o: LEVELS }];

function newOpp(prefill = {}, source = '') {
  openForm('New project', OPP_FIELDS, d => {
    if (d.deadline < new Date().toISOString().slice(0, 10)) return 'Deadline cannot be in the past.';
    const o = { id: uid('opp'), owner: db.me, ...d, days: +d.days, hours: +d.hours, status: 'open', summary: '', roles: [], source, createdAt: now() };
    db.opps.push(o); save(); location.hash = '#/projects/' + o.id; toast('Project created. Now add roles.');
  }, prefill);
}
function editOpp(id) {
  const o = by(db.opps, id);
  openForm('Edit project', OPP_FIELDS, d => { Object.assign(o, d, { days: +d.days, hours: +d.hours }); commit('Project updated'); }, o);
}
function addRole(id) {
  const o = by(db.opps, id);
  openForm('Add role', [{ n: 'title', l: 'Role title', r: 1 }, { n: 'openings', l: 'Openings', t: 'number', r: 1 }, { n: 'req', l: 'Required skills (comma separated)' }, { n: 'pref', l: 'Preferred skills' },
    { n: 'beginner', l: 'Beginner-friendly?', t: 'select', o: ['Yes', 'No'] }, { n: 'deliverable', l: 'Expected deliverable', r: 1 }],
  d => { o.roles.push({ id: uid('r'), title: d.title, openings: +d.openings, req: list(d.req), pref: list(d.pref), beginner: d.beginner === 'Yes', deliverable: d.deliverable }); commit('Role added'); });
}
function apply(oid, rid) {
  const o = by(db.opps, oid);
  if (db.apps.some(a => a.role === rid && a.user === db.me && ['pending', 'accepted'].includes(a.status))) return toast('You already have an active application for this role.');
  openForm('Apply for role', [{ n: 'msg', l: 'How will you contribute?', t: 'area', r: 1 }, { n: 'known', l: 'Skills you know (comma separated)' }, { n: 'learn', l: 'Skills you want to learn' }, { n: 'hours', l: 'Weekly hours available', t: 'number', r: 1 }],
  d => { db.apps.push({ id: uid('app'), opp: oid, role: rid, user: db.me, msg: d.msg, known: list(d.known), learn: list(d.learn), hours: +d.hours, status: 'pending', at: now() }); notify(o.owner, U(db.me).name + ' applied to ' + o.title); commit('Application sent'); });
}
function decide(id, st) {
  const a = by(db.apps, id), o = by(db.opps, a.opp), r = by(o.roles, a.role);
  if (st === 'accepted' && accepted(r.id) >= r.openings) return toast('This role has no openings left.');
  a.status = st; notify(a.user, `Your application for ${r.title} was ${st}`); commit('Application ' + st);
}
function withdraw(id) { if (confirm('Withdraw this application?')) { by(db.apps, id).status = 'withdrawn'; commit('Application withdrawn'); } }
function moveOpp(id, to) {
  const o = by(db.opps, id);
  if (!T[o.status].includes(to)) return toast('That status change is not allowed.');
  const team = db.apps.filter(a => a.opp === id && a.status === 'accepted');
  if (to === 'completed') return openForm('Complete project', [{ n: 's', l: 'Outcome summary', t: 'area', r: 1 }], d => { o.status = 'completed'; o.summary = d.s; o.doneAt = now(); team.forEach(a => notify(a.user, o.title + ' was completed')); commit('Project completed'); });
  if (to === 'archived' && !confirm('Archive this project?')) return;
  o.status = to; if (to === 'archived') o.archivedAt = now(); commit('Status is now ' + to);
}
function addTask(id) {
  const o = by(db.opps, id), mem = [{ v: o.owner, l: U(o.owner).name + ' (owner)' }, ...db.apps.filter(a => a.opp === id && a.status === 'accepted').map(a => ({ v: a.user, l: U(a.user).name }))];
  openForm('Add task', [{ n: 'title', l: 'Task title', r: 1 }, { n: 'desc', l: 'Description', t: 'area' }, { n: 'assignee', l: 'Assign to', t: 'select', o: mem }, { n: 'due', l: 'Due date', t: 'date', r: 1 }, { n: 'res', l: 'Learning resources (links, comma separated)' }],
  d => { db.tasks.push({ id: uid('task'), opp: id, title: d.title, desc: d.desc, assignee: d.assignee, due: d.due, res: list(d.res), status: 'not_started' }); notify(d.assignee, 'New task: ' + d.title); commit('Task added'); });
}
function setTask(id, st) { const t = by(db.tasks, id); t.status = st; notify(by(db.opps, t.opp).owner, `Task "${t.title}" is now ${st.replace('_', ' ')}`); notify(t.assignee, `Task "${t.title}" is now ${st.replace('_', ' ')}`); commit('Task updated'); }

function taskRow(t, o) {
  const mineT = t.assignee === db.me, own = o.owner === db.me, b = (s, l) => `<button class="btn sm" onclick="setTask('${t.id}','${s}')">${l}</button>`;
  let btns = '';
  if (mineT && t.status === 'not_started') btns += b('in_progress', 'Start');
  if (mineT && t.status === 'in_progress') btns += b('submitted', 'Submit for review');
  if (own && t.status === 'submitted') btns += b('completed', 'Accept') + b('in_progress', 'Send back');
  return `<div class="sub"><span><b>${esc(t.title)}</b> ${badge(t.status)}<br><span class="mut">${esc(U(t.assignee).name)} · due ${day(t.due)} ${esc(t.desc)}</span>${t.res.length ? '<br>' + chips(t.res, 'soft') : ''}</span><span class="row">${btns}</span></div>`;
}

function projectPage(id) {
  const o = by(db.opps, id);
  if (!o) return empty('Project not found.') + '<a class="btn" href="#/projects">Back to projects</a>';
  const mine = o.owner === db.me, rec = ['open', 'forming'].includes(o.status);
  const apps = db.apps.filter(a => a.opp === id), team = apps.filter(a => a.status === 'accepted'), src = o.source && by(db.posts, o.source);
  const roles = o.roles.map(r => {
    const left = r.openings - accepted(r.id), my = apps.find(a => a.role === r.id && a.user === db.me && ['pending', 'accepted'].includes(a.status));
    return `<div class="card"><div class="between"><h4>${esc(r.title)}</h4><span class="mut">${left} of ${r.openings} open</span></div><p class="mut">Deliverable: ${esc(r.deliverable)}</p><div>${chips(r.req)}${chips(r.pref, 'soft')}${r.beginner ? '<span class="chip ok">Beginner-friendly</span>' : ''}</div>
    <div class="row">${my ? `${badge(my.status)}<button class="btn sm" onclick="withdraw('${my.id}')">Withdraw</button>` : (!mine && rec && left > 0 ? `<button class="btn pri sm" onclick="apply('${id}','${r.id}')">Apply</button>` : '')}</div></div>`;
  }).join('') || empty('No roles defined yet.');
  const inbox = apps.map(a => `<div class="card"><div class="between"><b>${esc(U(a.user).name)}</b>${badge(a.status)}</div><p class="mut">${esc(by(o.roles, a.role)?.title)} · ${a.hours} h/week</p><p>${esc(a.msg)}</p><div>${chips(a.known)}${chips(a.learn, 'soft')}</div>
    ${a.status === 'pending' ? `<div class="row"><button class="btn pri sm" onclick="decide('${a.id}','accepted')">Accept</button><button class="btn sm" onclick="decide('${a.id}','declined')">Decline</button></div>` : ''}</div>`).join('') || empty('No applications yet.');
  const tasks = db.tasks.filter(t => t.opp === id);
  return `<a class="mut" href="#/projects">&larr; All projects</a>
  <div class="head" style="margin-top:12px"><div><h1>${esc(o.title)}</h1><div class="meta"><span>${badge(o.status)}</span><span>By ${esc(U(o.owner).name)}</span><span>${esc(o.cat)}</span><span>${o.days} days</span><span>Due ${day(o.deadline)}</span><span>${o.hours} h/week</span><span>${esc(o.level)}</span></div></div>
  ${mine ? `<div class="row" style="margin:0"><button class="btn" onclick="editOpp('${id}')">Edit</button>${T[o.status].map(s => `<button class="btn" onclick="moveOpp('${id}','${s}')">Mark ${s}</button>`).join('')}</div>` : ''}</div>
  <div class="card"><p>${esc(o.desc)}</p><p class="mut">Expected outcome: ${esc(o.outcome)}</p>${src ? `<p class="mut">From community post: <a href="#/community">${esc(src.title)}</a></p>` : ''}${o.summary ? `<p><b>Outcome summary:</b> ${esc(o.summary)}</p>` : ''}</div>
  <div class="between"><h2>Roles</h2>${mine && o.status !== 'archived' ? `<button class="btn sm" onclick="addRole('${id}')">Add role</button>` : ''}</div><div class="grid2">${roles}</div>
  ${mine ? `<h2>Applications</h2><div class="grid2">${inbox}</div>` : ''}
  <h2>Team</h2><div class="card"><b>${esc(U(o.owner).name)}</b> <span class="mut">owner</span>${team.map(a => `<div class="sub"><span>${esc(U(a.user).name)}</span><span class="mut">${esc(by(o.roles, a.role)?.title)}</span></div>`).join('')}</div>
  <div class="between"><h2>Tasks</h2>${mine && ['open', 'forming', 'active'].includes(o.status) ? `<button class="btn sm" onclick="addTask('${id}')">Add task</button>` : ''}</div><div class="card">${tasks.map(t => taskRow(t, o)).join('') || 'No tasks yet.'}</div>`;
}

/* ===== 7. LEARN & MENTOR ===== */
function learn() {
  const names = { mentors: 'Mentor directory', requests: 'Learning requests', circles: 'Learning circles' };
  return `<div class="head"><h1>Learn &amp; Mentor</h1></div><div class="tabs">${Object.keys(names).map(x => `<button class="tab ${ui.tab === x ? 'on' : ''}" onclick="ui.tab='${x}';route()">${names[x]}</button>`).join('')}</div>` +
    ({ mentors: mentorsTab, requests: requestsTab, circles: circlesTab }[ui.tab])();
}
function mreqRows(l, canDecide) {
  return l.map(r => `<div class="sub"><span><b>${esc(U(r.from).name)}</b> ${badge(r.status)}<br><span class="mut">${esc(r.msg)}</span></span><span class="row">
    ${canDecide && r.status === 'pending' ? `<button class="btn pri sm" onclick="decideM('${r.id}','accepted')">Accept</button><button class="btn sm" onclick="decideM('${r.id}','declined')">Decline</button>` : ''}
    ${r.from === db.me && ['pending', 'accepted'].includes(r.status) ? `<button class="btn sm" onclick="withdrawM('${r.id}')">Withdraw</button>` : ''}</span></div>`).join('');
}
function mentorsTab() {
  return `<div class="filters"><input placeholder="Search by subject or skill" value="${esc(ui.lq)}" oninput="ui.lq=this.value;fillMentors()"><button class="btn pri" onclick="newOffer()">Offer to mentor</button></div><div id="mlist" class="grid2"></div>`;
}
function fillMentors() {
  const q = ui.lq.toLowerCase();
  const l = db.offers.filter(o => o.status === 'open' && (o.topic + o.desc + U(o.mentor).known + U(o.mentor).teach).toLowerCase().includes(q));
  $('#mlist').innerHTML = l.length ? l.map(o => {
    const mine = o.mentor === db.me, rs = db.mreqs.filter(r => r.offer === o.id && (mine || r.from === db.me)), busy = rs.some(r => ['pending', 'accepted'].includes(r.status));
    return `<div class="card"><div class="between"><h3>${esc(o.topic)}</h3><span class="chip">${esc(o.level)}</span></div><p class="mut">${esc(U(o.mentor).name)} · ${esc(U(o.mentor).branch)}, ${esc(U(o.mentor).year)}</p><p>${esc(o.desc)}</p><div class="meta"><span>${esc(o.format)}</span><span>${esc(o.avail)}</span></div>${mreqRows(rs, mine)}
    <div class="row">${mine ? `<button class="btn sm" onclick="closeOffer('${o.id}')">Close offer</button>` : (busy ? '' : `<button class="btn pri sm" onclick="sendM('offer','${o.id}')">Request mentorship</button>`)}</div></div>`;
  }).join('') : empty('No mentor offers match your search.');
}
function newOffer() {
  openForm('Offer to mentor', [{ n: 'topic', l: 'Topic', r: 1 }, { n: 'desc', l: 'What can you help with, and what are the limits?', t: 'area', r: 1 }, { n: 'level', l: 'Audience level', t: 'select', o: ['Beginner', 'Intermediate', 'Any'] }, { n: 'format', l: 'Format', t: 'select', o: FORMATS }, { n: 'avail', l: 'Availability', r: 1 }],
  d => { db.offers.push({ id: uid('of'), mentor: db.me, ...d, status: 'open' }); commit('Offer published'); });
}
function closeOffer(id) { if (confirm('Close this offer?')) { by(db.offers, id).status = 'completed'; commit('Offer closed'); } }
function sendM(kind, id) {
  openForm('Send request', [{ n: 'msg', l: 'Message', t: 'area', r: 1 }], d => {
    db.mreqs.push({ id: uid('mr'), [kind]: id, from: db.me, msg: d.msg, status: 'pending', at: now() });
    const t = by(kind === 'offer' ? db.offers : db.requests, id); notify(t.mentor || t.owner, U(db.me).name + ' sent you a request'); commit('Request sent');
  });
}
function decideM(id, st) {
  const r = by(db.mreqs, id); r.status = st; notify(r.from, 'Your request was ' + st);
  if (st === 'accepted' && r.request) by(db.requests, r.request).status = 'accepted';
  commit('Request ' + st);
}
function withdrawM(id) { if (confirm('Withdraw this request?')) { by(db.mreqs, id).status = 'withdrawn'; commit('Request withdrawn'); } }

function requestsTab() {
  const l = db.requests.filter(r => r.status === 'open' || r.owner === db.me);
  return `<div class="head"><p class="mut">Post what you want to learn. Mentors and peers can respond.</p><button class="btn pri" onclick="newReq()">New learning request</button></div><div class="grid2">` +
    (l.map(r => {
      const mine = r.owner === db.me, rs = db.mreqs.filter(x => x.request === r.id && (mine || x.from === db.me)), busy = rs.some(x => ['pending', 'accepted'].includes(x.status));
      return `<div class="card"><div class="between"><h3>${esc(r.topic)}</h3>${badge(r.status)}</div><p class="mut">${esc(U(r.owner).name)} · level: ${esc(r.level)}</p><p>Goal: ${esc(r.outcome)}</p><div class="meta"><span>${r.days} days</span><span>${r.hours} h/week</span><span>${esc(r.format)}</span></div>${mreqRows(rs, mine)}
      <div class="row">${mine && ['open', 'accepted'].includes(r.status) ? `<button class="btn sm" onclick="doneReq('${r.id}')">Mark completed</button>` : ''}${!mine && r.status === 'open' && !busy ? `<button class="btn pri sm" onclick="sendM('request','${r.id}')">Offer help / join</button>` : ''}</div></div>`;
    }).join('') || empty('No learning requests yet.')) + '</div>';
}
function newReq() {
  openForm('New learning request', [{ n: 'topic', l: 'Topic', r: 1 }, { n: 'level', l: 'Your current level', t: 'select', o: ['Beginner', 'Some experience', 'Intermediate'] }, { n: 'outcome', l: 'Target outcome', r: 1 }, { n: 'days', l: 'Duration (days)', t: 'number', r: 1 }, { n: 'hours', l: 'Weekly hours', t: 'number', r: 1 }, { n: 'format', l: 'Preferred help', t: 'select', o: FORMATS }],
  d => { db.requests.push({ id: uid('lr'), owner: db.me, ...d, days: +d.days, hours: +d.hours, status: 'open', at: now() }); commit('Request posted'); });
}
function doneReq(id) { by(db.requests, id).status = 'completed'; commit('Marked completed'); }

function circlesTab() {
  return `<div class="head"><p class="mut">Small learning groups with a topic, a finish line and milestones.</p><button class="btn pri" onclick="newCircle()">New circle</button></div><div class="grid2">` +
    (db.circles.map(c => {
      const mem = c.members.includes(db.me), own = c.owner === db.me, done = c.miles.filter(m => m.done.includes(db.me)).length, pct = c.miles.length ? Math.round(done / c.miles.length * 100) : 0;
      return `<div class="card"><div class="between"><h3>${esc(c.topic)}</h3>${badge(c.status)}</div><p>Goal: ${esc(c.outcome)}</p><div class="meta"><span>${c.days} days</span><span>${c.members.length}/6 members</span></div><div>${c.members.map(m => `<span class="chip">${esc(U(m).name)}</span>`).join('')}</div>
      ${c.miles.map(m => `<div class="sub"><span><b>${esc(m.title)}</b><br><span class="mut">${esc(m.desc)} ${m.link ? `· <a href="${esc(m.link)}" target="_blank" rel="noopener">resource</a>` : ''}</span></span>${mem && c.status === 'open' ? `<button class="btn sm ${m.done.includes(db.me) ? 'on' : ''}" onclick="toggleMs('${c.id}','${m.id}')">${m.done.includes(db.me) ? 'Done' : 'Mark done'}</button>` : `<span class="mut">${m.done.length} done</span>`}</div>`).join('') || '<p class="mut">No milestones yet.</p>'}
      ${mem ? `<div class="bar"><i style="width:${pct}%"></i></div><p class="mut">Your progress: ${done} of ${c.miles.length}</p>` : ''}${c.summary ? `<p><b>Outcome:</b> ${esc(c.summary)}</p>` : ''}
      <div class="row">${!mem && c.status === 'open' && c.members.length < 6 ? `<button class="btn pri sm" onclick="joinCircle('${c.id}')">Join</button>` : ''}${mem && !own && c.status === 'open' ? `<button class="btn sm" onclick="leaveCircle('${c.id}')">Leave</button>` : ''}
      ${own && c.status === 'open' ? `<button class="btn sm" onclick="addMs('${c.id}')">Add milestone</button><button class="btn sm" onclick="endCircle('${c.id}')">Complete circle</button>` : ''}</div></div>`;
    }).join('') || empty('No learning circles yet.')) + '</div>';
}
function newCircle() {
  openForm('New learning circle', [{ n: 'topic', l: 'Topic', r: 1 }, { n: 'outcome', l: 'Target outcome', r: 1 }, { n: 'days', l: 'Duration (days)', t: 'number', r: 1 }],
  d => { db.circles.push({ id: uid('ci'), owner: db.me, ...d, days: +d.days, members: [db.me], status: 'open', miles: [], summary: '' }); commit('Circle created'); });
}
function joinCircle(id) { const c = by(db.circles, id); c.members.push(db.me); notify(c.owner, U(db.me).name + ' joined ' + c.topic); commit('You joined the circle'); }
function leaveCircle(id) { if (confirm('Leave this circle?')) { const c = by(db.circles, id); c.members = c.members.filter(m => m !== db.me); commit('You left the circle'); } }
function addMs(id) {
  const c = by(db.circles, id);
  openForm('Add milestone', [{ n: 'title', l: 'Title', r: 1 }, { n: 'desc', l: 'Short description' }, { n: 'link', l: 'Resource link (optional)' }],
  d => { if (d.link && !/^https?:\/\//.test(d.link)) return 'Link must start with http:// or https://'; c.miles.push({ id: uid('m'), ...d, done: [] }); commit('Milestone added'); });
}
function toggleMs(cid, mid) { const m = by(by(db.circles, cid).miles, mid); m.done = m.done.includes(db.me) ? m.done.filter(x => x !== db.me) : [...m.done, db.me]; commit(); }
function endCircle(id) { const c = by(db.circles, id); openForm('Complete circle', [{ n: 's', l: 'Short learning outcome', t: 'area', r: 1 }], d => { c.status = 'completed'; c.summary = d.s; commit('Circle completed'); }); }

/* ===== 8. COMMUNITIES ===== */
const POST_TYPES = ['Discussion', 'Question', 'Resource', 'Poll', 'Idea', 'Announcement'];
const votesOf = p => db.votes.filter(v => v.post === p), likes = p => db.reacts.filter(r => r.post === p).length;

function community() {
  const c = ui.comm, cm = by(db.comms, c), m = me();
  const chips2 = [['all', 'All']].concat(db.comms.map(x => [x.id, x.name])).map(([id, n]) => `<button class="tab ${c === id ? 'on' : ''}" onclick="ui.comm='${id}';route()">${esc(n)}</button>`).join('');
  const posts = db.posts.filter(p => p.status !== 'removed' && (c === 'all' || p.comm === c))
    .sort((a, b) => (b.pinned - a.pinned) || (ui.sort === 'top' ? likes(b.id) - likes(a.id) : b.at.localeCompare(a.at)));
  const reports = db.reports.filter(r => r.status === 'open');
  return `<div class="head"><div><h1>Communities</h1><p class="mut">Structured discussions instead of buried chat messages.</p></div><button class="btn pri" onclick="newPost()">New post</button></div><div class="tabs">${chips2}</div>
  <div class="between">${cm ? `<span class="mut">${esc(cm.desc)} · ${cm.members.length} members</span><button class="btn sm" onclick="joinComm('${c}')">${cm.members.includes(db.me) ? 'Leave community' : 'Join community'}</button>` : '<span></span>'}
  <select style="width:auto" onchange="ui.sort=this.value;route()"><option value="new">Newest</option><option value="top" ${ui.sort === 'top' ? 'selected' : ''}>Most upvoted</option></select></div>
  <div class="stack">${posts.map(postCard).join('') || empty('No posts here yet. Be the first to post.')}</div>
  ${m.mod ? `<h2>Moderation: open reports</h2>${reports.map(r => `<div class="card" style="margin-top:10px"><b>${esc(r.type)}</b> reported by ${esc(U(r.by).name)}<p class="mut">Reason: ${esc(r.reason)}</p><div class="row"><button class="btn sm" onclick="modAct('${r.id}','reviewed')">Mark reviewed</button><button class="btn sm" onclick="modAct('${r.id}','actioned')">Remove item</button><button class="btn sm" onclick="modAct('${r.id}','dismissed')">Dismiss</button></div></div>`).join('') || empty('No open reports.')}` : ''}`;
}
function joinComm(id) { const c = by(db.comms, id); c.members = c.members.includes(db.me) ? c.members.filter(x => x !== db.me) : [...c.members, db.me]; commit(); }

function commentHtml(c, all) {
  return `<div class="sub ${c.parent ? 'reply' : ''}" style="display:block"><b>${esc(U(c.author).name)}</b> <span class="mut">${day(c.at)}</span><br>${esc(c.text)}
  <div class="row" style="margin-top:4px"><button class="btn sm" onclick="addComment('${c.post}','${c.id}')">Reply</button><button class="btn sm" onclick="report('comment','${c.id}')">Report</button></div>
  ${all.filter(x => x.parent === c.id).map(x => commentHtml(x, all)).join('')}</div>`;
}
function postCard(p) {
  const mod = me().mod, mineVote = votesOf(p.id).find(v => v.user === db.me), tot = votesOf(p.id).length, liked = db.reacts.some(r => r.post === p.id && r.user === db.me);
  const cs = db.comments.filter(c => c.post === p.id && c.status !== 'removed');
  const poll = p.type === 'Poll' ? p.options.map((o, i) => { const n = votesOf(p.id).filter(v => v.opt === i).length;
    return `<div class="sub" style="display:block"><div class="between"><span>${esc(o)}</span><span class="row" style="margin:0"><span class="mut">${n} vote${n === 1 ? '' : 's'}</span><button class="btn sm" ${mineVote ? 'disabled' : ''} onclick="vote('${p.id}',${i})">${mineVote && mineVote.opt === i ? 'Your vote' : 'Vote'}</button></span></div><div class="bar"><i style="width:${tot ? n / tot * 100 : 0}%"></i></div></div>`; }).join('') : '';
  return `<div class="card ${p.pinned ? 'pin' : ''}"><div class="between"><span><span class="chip">${esc(p.type)}</span>${p.pinned ? '<span class="chip ok">Pinned</span>' : ''}${p.status === 'reported' ? badge('reported') : ''}</span><span class="mut">${esc(by(db.comms, p.comm)?.name)} · ${esc(U(p.author).name)} · ${day(p.at)}</span></div>
  <h3 style="margin-top:8px">${esc(p.title)}</h3>${p.content ? `<p>${esc(p.content)}</p>` : ''}${p.url ? `<p><a href="${esc(p.url)}" target="_blank" rel="noopener" style="color:var(--ac)">${esc(p.url)}</a></p>` : ''}${poll}
  <div class="row"><button class="btn sm ${liked ? 'on' : ''}" onclick="like('${p.id}')">Upvote · ${likes(p.id)}</button><button class="btn sm" onclick="addComment('${p.id}','')">Comment</button><button class="btn sm" onclick="report('post','${p.id}')">Report</button>
  ${['Idea', 'Discussion'].includes(p.type) ? `<button class="btn sm" onclick="toProject('${p.id}')">Turn into project</button>` : ''}${mod ? `<button class="btn sm" onclick="pinPost('${p.id}')">${p.pinned ? 'Unpin' : 'Pin'}</button><button class="btn sm" onclick="removePost('${p.id}')">Remove</button>` : ''}</div>
  ${cs.filter(c => !c.parent).map(c => commentHtml(c, cs)).join('')}</div>`;
}
function newPost() {
  const first = ui.comm !== 'all' ? ui.comm : db.comms[0].id;
  openForm('New post', [{ n: 'comm', l: 'Community', t: 'select', o: db.comms.map(c => ({ v: c.id, l: c.name })) }, { n: 'type', l: 'Type', t: 'select', o: POST_TYPES }, { n: 'title', l: 'Title', r: 1 }, { n: 'content', l: 'Content', t: 'area' }, { n: 'url', l: 'Link (for resources, optional)' }, { n: 'opts', l: 'Poll options (comma separated, for polls)' }],
  d => {
    const c = by(db.comms, d.comm);
    if (!c.members.includes(db.me)) return 'Join this community before posting.';
    if (d.type === 'Announcement' && !me().mod) return 'Only the moderator can post announcements. Use "Idea" for suggestions.';
    if (d.type !== 'Poll' && !d.content && !d.url) return 'Please add some content or a link.';
    if (d.url && !/^https?:\/\//.test(d.url)) return 'Link must start with http:// or https://';
    const options = list(d.opts); if (d.type === 'Poll' && options.length < 2) return 'A poll needs at least 2 options.';
    db.posts.push({ id: uid('p'), comm: d.comm, author: db.me, type: d.type, title: d.title, content: d.content, url: d.url, options: d.type === 'Poll' ? options : [], pinned: d.type === 'Announcement', status: 'published', at: now() });
    ui.comm = d.comm; commit('Post published');
  }, { comm: first });
}
function like(id) { const i = db.reacts.findIndex(r => r.post === id && r.user === db.me); i < 0 ? db.reacts.push({ post: id, user: db.me }) : db.reacts.splice(i, 1); commit(); }
function vote(id, opt) { if (votesOf(id).some(v => v.user === db.me)) return toast('You already voted.'); db.votes.push({ post: id, user: db.me, opt }); commit('Vote recorded'); }
function addComment(pid, parent) {
  openForm(parent ? 'Reply' : 'Comment', [{ n: 'text', l: 'Your comment', t: 'area', r: 1 }], d => {
    db.comments.push({ id: uid('cm'), post: pid, author: db.me, parent, text: d.text, at: now(), status: 'published' });
    notify(by(db.posts, pid).author, U(db.me).name + ' commented on your post'); commit('Comment added');
  });
}
function report(type, id) {
  openForm('Report ' + type, [{ n: 'reason', l: 'Reason', r: 1 }], d => {
    db.reports.push({ id: uid('rp'), type, target: id, by: db.me, reason: d.reason, status: 'open', at: now() });
    if (type === 'post') by(db.posts, id).status = 'reported'; commit('Report sent to the moderator');
  });
}
function modAct(id, st) {
  if (!me().mod) return;
  const r = by(db.reports, id), item = by(r.type === 'post' ? db.posts : db.comments, r.target);
  r.status = st; if (item) item.status = st === 'actioned' ? 'removed' : 'published'; commit('Report ' + st);
}
function pinPost(id) { if (me().mod) { const p = by(db.posts, id); p.pinned = !p.pinned; commit(p.pinned ? 'Pinned' : 'Unpinned'); } }
function removePost(id) { if (me().mod && confirm('Remove this post?')) { by(db.posts, id).status = 'removed'; commit('Post removed'); } }
function toProject(id) { const p = by(db.posts, id); newOpp({ title: p.title, desc: p.content, cat: 'Campus' }, id); }   // bridge: community idea -> project

/* ===== 9. PROFILE & ACTIVITY ===== */
const profCard = u => `<div class="card"><div class="between"><h3>${esc(u.name)}</h3><span class="mut">${esc(u.year)} · ${esc(u.branch)}</span></div><p class="mut">${esc(u.bio)}</p>
  ${u.known.length ? `<p class="mut">Knows</p>${chips(u.known)}` : ''}${u.learning.length ? `<p class="mut">Learning</p>${chips(u.learning, 'soft')}` : ''}${u.teach.length ? `<p class="mut">Can teach</p>${chips(u.teach, 'ok')}` : ''}
  <div class="meta"><span>${u.hours} h/week</span><span>${esc(u.modes.join(', ') || 'no roles set')}</span></div></div>`;
function profile() {
  const m = me();
  return `<div class="head"><h1>My Profile</h1><button class="btn pri" onclick="editProfile()">Edit profile</button></div>${profCard(m)}<h2>Students</h2><div class="grid2">${db.users.filter(u => u.id !== m.id).map(profCard).join('')}</div>`;
}
function editProfile() {
  const m = me(), j = a => a.join(', ');
  openForm('Edit profile', [{ n: 'name', l: 'Display name', r: 1 }, { n: 'year', l: 'Year', r: 1 }, { n: 'branch', l: 'Branch', r: 1 }, { n: 'bio', l: 'Short introduction', t: 'area' }, { n: 'known', l: 'Skills you know (comma separated)' }, { n: 'learning', l: 'Skills you are learning' }, { n: 'teach', l: 'Topics you can teach' }, { n: 'hours', l: 'Weekly hours available', t: 'number', r: 1 }, { n: 'modes', l: 'Participation (mentor, learner, peer learner, contributor)' }],
  d => { Object.assign(m, { name: d.name, year: d.year, branch: d.branch, bio: d.bio, known: list(d.known), learning: list(d.learning), teach: list(d.teach), hours: +d.hours, modes: list(d.modes) }); commit('Profile saved'); },
  { ...m, known: j(m.known), learning: j(m.learning), teach: j(m.teach), modes: j(m.modes) });
}
function activity() {
  const l = db.notes.filter(n => n.to === db.me).reverse();
  return `<div class="head"><h1>Activity</h1><button class="btn" onclick="readAll()">Mark all read</button></div>${l.map(n => `<div class="card" style="margin-top:10px;${n.read ? 'opacity:.6' : ''}">${esc(n.msg)}<p class="mut">${day(n.at)}</p></div>`).join('') || empty('Nothing yet. Updates about your applications, tasks and comments appear here.')}`;
}
function readAll() { db.notes.forEach(n => { if (n.to === db.me) n.read = true; }); commit(); }

/* ===== 10. START ===== */
load();
$('#who').onchange = e => { db.me = e.target.value; commit(); };
$('#modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
window.addEventListener('hashchange', route);
route();
