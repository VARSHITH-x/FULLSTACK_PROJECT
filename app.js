/* =====================================================
   CollabSpace - app.js  (basic JavaScript, no libraries)
   HOW IT WORKS: all data lives in one object called "data".
   Each page is a function that returns HTML text.
   Buttons in the HTML call the functions below by name.
   SECTIONS: 1 Data | 2 Small helper functions | 3 Popup form | 4 Pages and navigation
             5 Home | 6 Collaborate (projects) | 7 Learn and Mentor
             8 Communities | 9 Profile and Activity | 10 Start the app
   ===================================================== */


/* ================= 1. DATA ================= */

const STORAGE_KEY = "collabspace_simple_v2";
let data;                      // everything the app knows
let currentPage = "home";      // which page is showing
let openProjectId = "";        // which project is open ("" = project list)
let learnTab = "mentors";      // which tab is open on the Learn page
let communityFilter = "All";   // which community is selected

// Load saved data from the browser. If nothing is saved, use the sample data.
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { data = JSON.parse(saved); } catch (error) { data = null; }
  }
  if (!data) { data = makeSampleData(); }
}

// Save data in the browser so it is still there after a refresh.
function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch (error) { showMessage("Could not save: browser storage is unavailable"); }
}

// Sample (demo) records. These are fake and clearly labelled.
function makeSampleData() {
  return {
    currentUserId: "u1",
    users: [
      { id: "u1", name: "Aarav Nair", year: "2nd year", branch: "ECE", bio: "Robotics hobbyist (demo account).", skills: "Embedded C, Arduino", learning: "STM32, Python", isModerator: false },
      { id: "u2", name: "Meera Iyer", year: "3rd year", branch: "CSE", bio: "Web developer (demo account).", skills: "Python, HTML, Git", learning: "Machine learning", isModerator: false },
      { id: "u3", name: "Rohan Das", year: "1st year", branch: "ECE", bio: "Beginner who loves to learn (demo account).", skills: "C basics", learning: "Python, Embedded systems", isModerator: false },
      { id: "u4", name: "Campus Moderator", year: "Staff", branch: "Admin", bio: "Demo admin: can pin and remove posts.", skills: "", learning: "", isModerator: true }
    ],
    projects: [
      {
        id: "p1", ownerId: "u1", title: "Line-following robot", description: "Build a small robot that follows a track using IR sensors.",
        outcome: "A working robot demo", category: "Robotics", days: 21, deadline: "2026-11-30", level: "Beginner-friendly", status: "open", summary: "", fromPostId: "",
        roles: [
          { id: "r1", title: "Embedded C contributor", openings: 2, skills: "C basics", deliverable: "Sensor reading code" },
          { id: "r2", title: "Chassis designer", openings: 1, skills: "CAD", deliverable: "Chassis design" }
        ]
      }
    ],
    applications: [],
    tasks: [],
    offers: [{ id: "o1", mentorId: "u1", topic: "STM32 guidance", description: "Two weekly sessions on STM32 basics.", availability: "Weekends", status: "open" }],
    learningRequests: [{ id: "l1", ownerId: "u3", topic: "Python for data analysis", goal: "Finish a small analysis", days: 14, status: "open" }],
    responses: [],   // mentorship requests and offers to help
    circles: [{
      id: "c1", ownerId: "u2", topic: "Beginner Python circle", goal: "Finish a small analysis task", members: ["u2"], status: "open",
      milestones: [{ title: "Python basics", doneBy: [] }, { title: "Data handling", doneBy: [] }]
    }],
    communities: ["General Campus", "AI/ML", "ECE Branch", "Second Year"],
    posts: [
      { id: "s1", community: "General Campus", authorId: "u4", type: "Announcement", title: "Demo notice: library open late during exams", text: "This is a sample announcement.", options: [], pinned: true, removed: false, reports: [] },
      { id: "s2", community: "AI/ML", authorId: "u2", type: "Question", title: "Good beginner resources for machine learning?", text: "Looking for free courses or books.", options: [], pinned: false, removed: false, reports: [] },
      { id: "s3", community: "General Campus", authorId: "u2", type: "Poll", title: "Best time for weekend workshops?", text: "", options: ["Saturday morning", "Saturday evening", "Sunday"], pinned: false, removed: false, reports: [] },
      { id: "s4", community: "ECE Branch", authorId: "u3", type: "Idea", title: "Shared component shelf for ECE labs", text: "Students could lend spare sensors and boards.", options: [], pinned: false, removed: false, reports: [] }
    ],
    comments: [{ id: "m1", postId: "s2", authorId: "u1", text: "Try a free intro course, then build one small project." }],
    votes: [],     // poll votes: { postId, userId, option }
    upvotes: [],   // upvotes: { postId, userId }
    notes: []      // notifications
  };
}

// Save, show a message and redraw the current page.
function refresh(message) {
  saveData();
  if (message) { showMessage(message); }
  showPage(currentPage);
}

function resetDemoData() {
  if (confirm("Reset all demo data?")) {
    data = makeSampleData();
    openProjectId = "";
    refresh("Demo data restored");
  }
}

function switchUser(userId) {
  data.currentUserId = userId;
  refresh();
}


/* ================= 2. SMALL HELPER FUNCTIONS ================= */

function makeId(prefix) { return prefix + Date.now() + Math.floor(Math.random() * 1000); }

// Find one record in a list using its id.
function findById(list, id) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) { return list[i]; }
  }
  return null;
}

// Make text safe to show inside HTML.
function safe(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function currentUser() { return findById(data.users, data.currentUserId); }
function userName(id) { const user = findById(data.users, id); return user ? user.name : "Unknown"; }

// Send a notification to another user.
function addNote(userId, text) {
  if (userId !== data.currentUserId) { data.notes.push({ id: makeId("n"), userId: userId, text: text, read: false }); }
}

// Turn "a, b, c" into small tags.
function makeTags(text) {
  let html = "";
  const parts = String(text).split(",");
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].trim() !== "") { html += `<span class="tag">${safe(parts[i].trim())}</span>`; }
  }
  return html;
}

function emptyBox(text) { return `<div class="empty">${text}</div>`; }

function showMessage(text) {
  const box = document.getElementById("message");
  box.textContent = text;
  box.classList.add("show");
  setTimeout(function () { box.classList.remove("show"); }, 2500);
}


/* ================= 3. POPUP FORM (used for every "create" button) ================= */

let formFields = [];
let formOnSave = null;

// fields: list of { name, label, type, required, value, options }
// onSave gets the typed values; it returns an error text to keep the popup open.
function openForm(title, fields, onSave) {
  formFields = fields;
  formOnSave = onSave;
  let html = `<h3>${title}</h3>`;
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const value = f.value || "";
    html += `<label>${f.label}${f.required ? " *" : ""}`;
    if (f.type === "textarea") {
      html += `<textarea id="field_${f.name}" rows="3">${safe(value)}</textarea>`;
    } else if (f.type === "select") {
      html += `<select id="field_${f.name}">`;
      for (let j = 0; j < f.options.length; j++) {
        // each option is [value, label]
        html += `<option value="${f.options[j][0]}">${safe(f.options[j][1])}</option>`;
      }
      html += `</select>`;
    } else {
      html += `<input id="field_${f.name}" type="${f.type || "text"}" value="${safe(value)}">`;
    }
    html += `</label>`;
  }
  html += `<p class="error" id="formError"></p>
           <button class="main-btn" onclick="submitForm()">Save</button>
           <button class="small-btn" onclick="closeForm()">Cancel</button>`;
  document.getElementById("popupBox").innerHTML = html;
  document.getElementById("popup").classList.add("show");
}

function submitForm() {
  const values = {};
  for (let i = 0; i < formFields.length; i++) {
    const f = formFields[i];
    const typed = document.getElementById("field_" + f.name).value.trim();
    if (f.required && typed === "") { document.getElementById("formError").textContent = f.label + " is required."; return; }
    if (f.type === "number" && typed !== "" && Number(typed) < 1) { document.getElementById("formError").textContent = f.label + " must be 1 or more."; return; }
    values[f.name] = typed;
  }
  const errorText = formOnSave(values);
  if (errorText) { document.getElementById("formError").textContent = errorText; return; }
  closeForm();
}

function closeForm() { document.getElementById("popup").classList.remove("show"); }

// Helper: turn a plain list of words into [value, label] pairs for a dropdown.
function plainOptions(words) {
  const pairs = [];
  for (let i = 0; i < words.length; i++) { pairs.push([words[i], words[i]]); }
  return pairs;
}


/* ================= 4. PAGES AND NAVIGATION ================= */

function showPage(page) {
  currentPage = page;
  if (page !== "projects") { openProjectId = ""; }

  // Highlight the active navbar button
  const names = ["home", "projects", "learn", "community", "profile", "activity"];
  for (let i = 0; i < names.length; i++) {
    document.getElementById("nav-" + names[i]).classList.toggle("active", names[i] === page);
  }

  // Fill the demo-user dropdown and unread counter
  let options = "";
  let unread = 0;
  for (let i = 0; i < data.users.length; i++) {
    const u = data.users[i];
    options += `<option value="${u.id}" ${u.id === data.currentUserId ? "selected" : ""}>${safe(u.name)}</option>`;
  }
  for (let i = 0; i < data.notes.length; i++) {
    if (data.notes[i].userId === data.currentUserId && !data.notes[i].read) { unread++; }
  }
  document.getElementById("userSelect").innerHTML = options;
  document.getElementById("unreadCount").textContent = unread > 0 ? unread : "";

  // Pick the page to show
  let html = "";
  if (page === "home") { html = homePage(); }
  else if (page === "projects") { html = openProjectId ? projectDetailPage() : projectsPage(); }
  else if (page === "learn") { html = learnPage(); }
  else if (page === "community") { html = communityPage(); }
  else if (page === "profile") { html = profilePage(); }
  else if (page === "activity") { html = activityPage(); }

  // Show it with a small fade-in animation
  const box = document.getElementById("content");
  box.innerHTML = html;
  box.classList.remove("fade");
  void box.offsetWidth;
  box.classList.add("fade");

  if (page === "projects" && !openProjectId) { showProjectList(); }
}


/* ================= 5. HOME ================= */

function homePage() {
  let openProjects = 0, openRequests = 0, visiblePosts = 0;
  for (let i = 0; i < data.projects.length; i++) { if (data.projects[i].status === "open") { openProjects++; } }
  for (let i = 0; i < data.learningRequests.length; i++) { if (data.learningRequests[i].status === "open") { openRequests++; } }
  for (let i = 0; i < data.posts.length; i++) { if (!data.posts[i].removed) { visiblePosts++; } }

  let html = `<section class="hero">
    <h1>Find people. Share goals. Build together.</h1>
    <p class="muted">Welcome, ${safe(currentUser().name)}. Post a short-term goal, find teammates, learn together and share campus news.</p>
  </section>
  <div class="grid">
    <div class="card" onclick="showPage('projects')"><h3>Collaborate</h3><p class="muted">${openProjects} projects are looking for people.</p></div>
    <div class="card" onclick="showPage('learn')"><h3>Learn &amp; Mentor</h3><p class="muted">${openRequests} learning requests, ${data.offers.length} mentor offers.</p></div>
    <div class="card" onclick="showPage('community')"><h3>Communities</h3><p class="muted">${visiblePosts} posts in ${data.communities.length} communities.</p></div>
  </div>
  <h2>Pinned announcements</h2>`;

  let pinnedCount = 0;
  for (let i = 0; i < data.posts.length; i++) {
    const post = data.posts[i];
    if (post.pinned && !post.removed) {
      html += `<div class="card pinned"><b>${safe(post.title)}</b><p class="muted">${safe(post.text)}</p></div>`;
      pinnedCount++;
    }
  }
  if (pinnedCount === 0) { html += emptyBox("No pinned announcements."); }
  return html;
}


/* ================= 6. COLLABORATE (projects) ================= */

// How many people are already accepted for a role?
function acceptedCount(roleId) {
  let count = 0;
  for (let i = 0; i < data.applications.length; i++) {
    if (data.applications[i].roleId === roleId && data.applications[i].status === "accepted") { count++; }
  }
  return count;
}

function openSlots(project) {
  let slots = 0;
  for (let i = 0; i < project.roles.length; i++) { slots += project.roles[i].openings - acceptedCount(project.roles[i].id); }
  return slots;
}

function projectsPage() {
  return `<div class="row"><div><h1>Collaborate</h1><p class="muted">Find a project, join a role, build together.</p></div>
    <button class="main-btn" onclick="newProject('', '', '')">New project</button></div>
    <div class="filters" style="margin-top:18px">
      <input id="searchBox" placeholder="Search projects or roles" oninput="showProjectList()">
      <select id="statusFilter" onchange="showProjectList()">
        <option value="">All (not archived)</option><option>open</option><option>active</option><option>completed</option><option>archived</option>
      </select>
    </div>
    <div id="projectList" class="grid"></div>`;
}

// Fill the list of project cards using the search box and status filter.
function showProjectList() {
  const search = document.getElementById("searchBox").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;
  let html = "";
  for (let i = 0; i < data.projects.length; i++) {
    const p = data.projects[i];
    let text = p.title + " " + p.description;
    for (let j = 0; j < p.roles.length; j++) { text += " " + p.roles[j].title; }
    const statusOk = (status === "") ? (p.status !== "archived") : (p.status === status);
    if (statusOk && text.toLowerCase().indexOf(search) !== -1) {
      html += `<div class="card" onclick="openProject('${p.id}')">
        <span class="status ${p.status}">${p.status}</span>
        <h3>${safe(p.title)}</h3><p class="muted">${safe(p.description)}</p>
        <p class="small muted">${safe(p.category)} | ${p.days} days | ${safe(p.level)} | ${openSlots(p)} openings</p></div>`;
    }
  }
  document.getElementById("projectList").innerHTML = html || emptyBox("No projects match your search.");
}

function openProject(id) { openProjectId = id; showPage("projects"); }

// Popup to create a project. fromPostId is set when it comes from a community idea.
function newProject(title, description, fromPostId) {
  openForm("New project", [
    { name: "title", label: "Title", required: true, value: title },
    { name: "description", label: "Problem statement", type: "textarea", required: true, value: description },
    { name: "outcome", label: "Expected outcome", required: true },
    { name: "category", label: "Category", type: "select", options: plainOptions(["Robotics", "Web", "AI/ML", "Research", "Campus", "Other"]) },
    { name: "days", label: "Duration (days)", type: "number", required: true },
    { name: "deadline", label: "Deadline", type: "date", required: true },
    { name: "level", label: "Experience", type: "select", options: plainOptions(["Beginner-friendly", "Mixed level", "Experience needed"]) }
  ], function (v) {
    if (v.deadline < new Date().toISOString().slice(0, 10)) { return "Deadline cannot be in the past."; }
    const project = { id: makeId("p"), ownerId: data.currentUserId, title: v.title, description: v.description, outcome: v.outcome, category: v.category,
      days: Number(v.days), deadline: v.deadline, level: v.level, status: "open", summary: "", fromPostId: fromPostId, roles: [] };
    data.projects.push(project);
    openProjectId = project.id;
    currentPage = "projects";
    refresh("Project created. Now add roles.");
  });
}

function addRole(projectId) {
  const project = findById(data.projects, projectId);
  openForm("Add role", [
    { name: "title", label: "Role title", required: true },
    { name: "openings", label: "Number of openings", type: "number", required: true },
    { name: "skills", label: "Skills needed (comma separated)" },
    { name: "deliverable", label: "Expected deliverable", required: true }
  ], function (v) {
    project.roles.push({ id: makeId("r"), title: v.title, openings: Number(v.openings), skills: v.skills, deliverable: v.deliverable });
    refresh("Role added");
  });
}

// A student applies to a role. The same student cannot apply twice.
function applyToRole(projectId, roleId) {
  const project = findById(data.projects, projectId);
  for (let i = 0; i < data.applications.length; i++) {
    const a = data.applications[i];
    if (a.roleId === roleId && a.userId === data.currentUserId && (a.status === "pending" || a.status === "accepted")) {
      showMessage("You already applied for this role.");
      return;
    }
  }
  openForm("Apply for role", [
    { name: "message", label: "How will you contribute?", type: "textarea", required: true },
    { name: "skills", label: "Skills you know" },
    { name: "toLearn", label: "Skills you want to learn" }
  ], function (v) {
    data.applications.push({ id: makeId("a"), projectId: projectId, roleId: roleId, userId: data.currentUserId, message: v.message, skills: v.skills, toLearn: v.toLearn, status: "pending" });
    addNote(project.ownerId, userName(data.currentUserId) + " applied to " + project.title);
    refresh("Application sent");
  });
}

// The owner accepts or declines an application.
function answerApplication(applicationId, newStatus) {
  const application = findById(data.applications, applicationId);
  const project = findById(data.projects, application.projectId);
  const role = findById(project.roles, application.roleId);
  if (newStatus === "accepted" && acceptedCount(role.id) >= role.openings) { showMessage("This role has no openings left."); return; }
  application.status = newStatus;
  addNote(application.userId, "Your application for " + role.title + " was " + newStatus);
  refresh("Application " + newStatus);
}

function withdrawApplication(applicationId) {
  if (confirm("Withdraw this application?")) { findById(data.applications, applicationId).status = "withdrawn"; refresh("Application withdrawn"); }
}

// Move the project to its next stage: open -> active -> completed -> archived
function nextStage(projectId) {
  const project = findById(data.projects, projectId);
  if (project.status === "open") { project.status = "active"; refresh("Project is now active"); }
  else if (project.status === "active") {
    openForm("Complete project", [{ name: "summary", label: "Outcome summary", type: "textarea", required: true }], function (v) {
      project.status = "completed"; project.summary = v.summary; refresh("Project completed");
    });
  } else if (project.status === "completed" && confirm("Archive this project?")) { project.status = "archived"; refresh("Project archived"); }
}

function addTask(projectId) {
  const project = findById(data.projects, projectId);
  const people = [[project.ownerId, userName(project.ownerId) + " (owner)"]];
  for (let i = 0; i < data.applications.length; i++) {
    const a = data.applications[i];
    if (a.projectId === projectId && a.status === "accepted") { people.push([a.userId, userName(a.userId)]); }
  }
  openForm("Add task", [
    { name: "title", label: "Task title", required: true },
    { name: "assignee", label: "Assign to", type: "select", options: people },
    { name: "due", label: "Due date", type: "date", required: true }
  ], function (v) {
    data.tasks.push({ id: makeId("t"), projectId: projectId, title: v.title, assigneeId: v.assignee, due: v.due, status: "not_started" });
    addNote(v.assignee, "New task: " + v.title);
    refresh("Task added");
  });
}

function changeTask(taskId, newStatus) {
  const task = findById(data.tasks, taskId);
  task.status = newStatus;
  addNote(findById(data.projects, task.projectId).ownerId, "Task \"" + task.title + "\" is now " + newStatus);
  refresh("Task updated");
}

// One project page: details, roles, applications, team and tasks.
function projectDetailPage() {
  const project = findById(data.projects, openProjectId);
  if (!project) { return emptyBox("Project not found."); }
  const isOwner = project.ownerId === data.currentUserId;
  const canApply = (project.status === "open");
  const nextNames = { open: "Start project", active: "Complete project", completed: "Archive project" };

  let html = `<button class="small-btn" onclick="showPage('projects')">&larr; All projects</button>
    <div class="row" style="margin-top:12px"><div><h1>${safe(project.title)}</h1>
    <span class="status ${project.status}">${project.status}</span>
    <span class="muted small">by ${safe(userName(project.ownerId))} | ${safe(project.category)} | ${project.days} days | due ${project.deadline}</span></div>`;
  if (isOwner && nextNames[project.status]) { html += `<button class="main-btn" onclick="nextStage('${project.id}')">${nextNames[project.status]}</button>`; }
  html += `</div><div class="card"><p>${safe(project.description)}</p><p class="muted">Expected outcome: ${safe(project.outcome)}</p>`;
  if (project.fromPostId) { html += `<p class="muted small">Started from a community post.</p>`; }
  if (project.summary) { html += `<p><b>Outcome summary:</b> ${safe(project.summary)}</p>`; }
  html += `</div><div class="row"><h2>Roles</h2>`;
  if (isOwner && (project.status === "open" || project.status === "active")) { html += `<button class="small-btn" onclick="addRole('${project.id}')">Add role</button>`; }
  html += `</div><div class="grid">`;

  // Roles
  for (let i = 0; i < project.roles.length; i++) {
    const role = project.roles[i];
    const left = role.openings - acceptedCount(role.id);
    html += `<div class="card"><div class="row"><b>${safe(role.title)}</b><span class="muted small">${left} of ${role.openings} open</span></div>
      <p class="muted small">Deliverable: ${safe(role.deliverable)}</p>${makeTags(role.skills)}`;
    let myApplication = null;
    for (let j = 0; j < data.applications.length; j++) {
      const a = data.applications[j];
      if (a.roleId === role.id && a.userId === data.currentUserId && (a.status === "pending" || a.status === "accepted")) { myApplication = a; }
    }
    if (myApplication) {
      html += `<div class="line"><span class="status ${myApplication.status}">${myApplication.status}</span><button class="small-btn" onclick="withdrawApplication('${myApplication.id}')">Withdraw</button></div>`;
    } else if (!isOwner && canApply && left > 0) {
      html += `<button class="small-btn" onclick="applyToRole('${project.id}','${role.id}')">Apply</button>`;
    }
    html += `</div>`;
  }
  if (project.roles.length === 0) { html += emptyBox("No roles yet."); }
  html += `</div>`;

  // Applications (owner only) and team
  let team = `<b>${safe(userName(project.ownerId))}</b> <span class="muted">owner</span>`;
  let inbox = "";
  for (let i = 0; i < data.applications.length; i++) {
    const a = data.applications[i];
    if (a.projectId !== project.id) { continue; }
    const roleTitle = findById(project.roles, a.roleId).title;
    if (a.status === "accepted") { team += `<div class="line">${safe(userName(a.userId))} <span class="muted">- ${safe(roleTitle)}</span></div>`; }
    inbox += `<div class="card"><div class="row"><b>${safe(userName(a.userId))}</b><span class="status ${a.status}">${a.status}</span></div>
      <p class="muted small">${safe(roleTitle)}</p><p>${safe(a.message)}</p>${makeTags(a.skills)}`;
    if (a.status === "pending") {
      inbox += `<button class="small-btn" onclick="answerApplication('${a.id}','accepted')">Accept</button><button class="small-btn" onclick="answerApplication('${a.id}','declined')">Decline</button>`;
    }
    inbox += `</div>`;
  }
  if (isOwner) { html += `<h2>Applications</h2><div class="grid">${inbox || emptyBox("No applications yet.")}</div>`; }
  html += `<h2>Team</h2><div class="card">${team}</div>`;

  // Tasks
  html += `<div class="row"><h2>Tasks</h2>`;
  if (isOwner && (project.status === "open" || project.status === "active")) { html += `<button class="small-btn" onclick="addTask('${project.id}')">Add task</button>`; }
  html += `</div><div class="card">`;
  let taskCount = 0;
  for (let i = 0; i < data.tasks.length; i++) {
    const task = data.tasks[i];
    if (task.projectId !== project.id) { continue; }
    taskCount++;
    html += `<div class="row line"><span><b>${safe(task.title)}</b> <span class="status ${task.status}">${task.status.replace("_", " ")}</span>
      <br><span class="muted small">${safe(userName(task.assigneeId))} | due ${task.due}</span></span><span>`;
    if (task.assigneeId === data.currentUserId && task.status === "not_started") { html += `<button class="small-btn" onclick="changeTask('${task.id}','in_progress')">Start</button>`; }
    if (task.assigneeId === data.currentUserId && task.status === "in_progress") { html += `<button class="small-btn" onclick="changeTask('${task.id}','submitted')">Submit</button>`; }
    if (isOwner && task.status === "submitted") {
      html += `<button class="small-btn" onclick="changeTask('${task.id}','completed')">Accept</button><button class="small-btn" onclick="changeTask('${task.id}','in_progress')">Send back</button>`;
    }
    html += `</span></div>`;
  }
  if (taskCount === 0) { html += `<span class="muted">No tasks yet.</span>`; }
  return html + `</div>`;
}


/* ================= 7. LEARN AND MENTOR ================= */

function learnPage() {
  const tabs = [["mentors", "Mentor offers"], ["requests", "Learning requests"], ["circles", "Learning circles"]];
  let html = `<h1>Learn &amp; Mentor</h1><div class="tabs">`;
  for (let i = 0; i < tabs.length; i++) {
    html += `<button class="tab ${learnTab === tabs[i][0] ? "active" : ""}" onclick="learnTab='${tabs[i][0]}';showPage('learn')">${tabs[i][1]}</button>`;
  }
  html += `</div>`;
  if (learnTab === "mentors") { html += mentorOffersHtml(); }
  else if (learnTab === "requests") { html += learningRequestsHtml(); }
  else { html += circlesHtml(); }
  return html;
}

// Shows the requests attached to one offer or one learning request.
// The owner sees all of them; everyone else sees only their own.
function responsesHtml(targetId, ownerId) {
  let html = "";
  for (let i = 0; i < data.responses.length; i++) {
    const r = data.responses[i];
    if (r.targetId !== targetId) { continue; }
    if (ownerId !== data.currentUserId && r.fromId !== data.currentUserId) { continue; }
    html += `<div class="line"><b>${safe(userName(r.fromId))}</b> <span class="status ${r.status}">${r.status}</span><br><span class="muted small">${safe(r.message)}</span><br>`;
    if (ownerId === data.currentUserId && r.status === "pending") {
      html += `<button class="small-btn" onclick="answerResponse('${r.id}','accepted')">Accept</button><button class="small-btn" onclick="answerResponse('${r.id}','declined')">Decline</button>`;
    }
    if (r.fromId === data.currentUserId && (r.status === "pending" || r.status === "accepted")) {
      html += `<button class="small-btn" onclick="withdrawResponse('${r.id}')">Withdraw</button>`;
    }
    html += `</div>`;
  }
  return html;
}

// Can the current user send a new request? (not the owner, and no active request yet)
function canRespond(targetId, ownerId) {
  if (ownerId === data.currentUserId) { return false; }
  for (let i = 0; i < data.responses.length; i++) {
    const r = data.responses[i];
    if (r.targetId === targetId && r.fromId === data.currentUserId && (r.status === "pending" || r.status === "accepted")) { return false; }
  }
  return true;
}

function sendResponse(targetId, ownerId) {
  openForm("Send request", [{ name: "message", label: "Message", type: "textarea", required: true }], function (v) {
    data.responses.push({ id: makeId("x"), targetId: targetId, fromId: data.currentUserId, message: v.message, status: "pending" });
    addNote(ownerId, userName(data.currentUserId) + " sent you a request");
    refresh("Request sent");
  });
}

function answerResponse(responseId, newStatus) {
  const response = findById(data.responses, responseId);
  response.status = newStatus;
  addNote(response.fromId, "Your request was " + newStatus);
  const request = findById(data.learningRequests, response.targetId);
  if (request && newStatus === "accepted") { request.status = "accepted"; }
  refresh("Request " + newStatus);
}

function withdrawResponse(responseId) {
  if (confirm("Withdraw this request?")) { findById(data.responses, responseId).status = "withdrawn"; refresh("Request withdrawn"); }
}

// ----- Mentor offers -----
function mentorOffersHtml() {
  let html = `<div class="row"><p class="muted">Find a mentor, or offer your own help.</p><button class="main-btn" onclick="newOffer()">Offer to mentor</button></div><div class="grid">`;
  for (let i = 0; i < data.offers.length; i++) {
    const offer = data.offers[i];
    if (offer.status !== "open") { continue; }
    html += `<div class="card"><h3>${safe(offer.topic)}</h3><p class="muted small">${safe(userName(offer.mentorId))} | ${safe(offer.availability)}</p>
      <p>${safe(offer.description)}</p>${responsesHtml(offer.id, offer.mentorId)}`;
    if (canRespond(offer.id, offer.mentorId)) { html += `<button class="small-btn" onclick="sendResponse('${offer.id}','${offer.mentorId}')">Request mentorship</button>`; }
    if (offer.mentorId === data.currentUserId) { html += `<button class="small-btn" onclick="closeOffer('${offer.id}')">Close offer</button>`; }
    html += `</div>`;
  }
  return html + `</div>`;
}

function newOffer() {
  openForm("Offer to mentor", [
    { name: "topic", label: "Topic", required: true },
    { name: "description", label: "What can you help with?", type: "textarea", required: true },
    { name: "availability", label: "Availability", required: true }
  ], function (v) {
    data.offers.push({ id: makeId("o"), mentorId: data.currentUserId, topic: v.topic, description: v.description, availability: v.availability, status: "open" });
    refresh("Offer published");
  });
}

function closeOffer(offerId) { if (confirm("Close this offer?")) { findById(data.offers, offerId).status = "completed"; refresh("Offer closed"); } }

// ----- Learning requests -----
function learningRequestsHtml() {
  let html = `<div class="row"><p class="muted">Say what you want to learn. Mentors and peers can respond.</p><button class="main-btn" onclick="newLearningRequest()">New learning request</button></div><div class="grid">`;
  for (let i = 0; i < data.learningRequests.length; i++) {
    const request = data.learningRequests[i];
    const isOwner = request.ownerId === data.currentUserId;
    if (request.status !== "open" && !isOwner) { continue; }   // closed requests are only shown to their owner
    html += `<div class="card"><div class="row"><h3>${safe(request.topic)}</h3><span class="status ${request.status}">${request.status}</span></div>
      <p class="muted small">${safe(userName(request.ownerId))} | ${request.days} days</p><p>Goal: ${safe(request.goal)}</p>${responsesHtml(request.id, request.ownerId)}`;
    if (request.status === "open" && canRespond(request.id, request.ownerId)) { html += `<button class="small-btn" onclick="sendResponse('${request.id}','${request.ownerId}')">Offer help / join</button>`; }
    if (isOwner && (request.status === "open" || request.status === "accepted")) { html += `<button class="small-btn" onclick="finishRequest('${request.id}')">Mark completed</button>`; }
    html += `</div>`;
  }
  return html + `</div>`;
}

function newLearningRequest() {
  openForm("New learning request", [
    { name: "topic", label: "Topic", required: true },
    { name: "goal", label: "Target outcome", required: true },
    { name: "days", label: "Duration (days)", type: "number", required: true }
  ], function (v) {
    data.learningRequests.push({ id: makeId("l"), ownerId: data.currentUserId, topic: v.topic, goal: v.goal, days: Number(v.days), status: "open" });
    refresh("Request posted");
  });
}

function finishRequest(requestId) { findById(data.learningRequests, requestId).status = "completed"; refresh("Marked completed"); }

// ----- Learning circles -----
function circlesHtml() {
  let html = `<div class="row"><p class="muted">Small groups with a goal and milestones.</p><button class="main-btn" onclick="newCircle()">New circle</button></div><div class="grid">`;
  for (let i = 0; i < data.circles.length; i++) {
    const circle = data.circles[i];
    const isMember = circle.members.indexOf(data.currentUserId) !== -1;
    let doneCount = 0;
    html += `<div class="card"><div class="row"><h3>${safe(circle.topic)}</h3><span class="status ${circle.status}">${circle.status}</span></div>
      <p>Goal: ${safe(circle.goal)}</p><p class="muted small">${circle.members.length}/6 members: `;
    for (let j = 0; j < circle.members.length; j++) { html += safe(userName(circle.members[j])) + (j < circle.members.length - 1 ? ", " : ""); }
    html += `</p>`;
    for (let j = 0; j < circle.milestones.length; j++) {
      const milestone = circle.milestones[j];
      const done = milestone.doneBy.indexOf(data.currentUserId) !== -1;
      if (done) { doneCount++; }
      html += `<div class="row line"><span>${safe(milestone.title)}</span>`;
      if (isMember && circle.status === "open") { html += `<button class="small-btn" onclick="toggleMilestone('${circle.id}',${j})">${done ? "Done" : "Mark done"}</button>`; }
      html += `</div>`;
    }
    if (isMember && circle.milestones.length > 0) {
      html += `<div class="bar"><div style="width:${Math.round(doneCount / circle.milestones.length * 100)}%"></div></div><p class="muted small">Your progress: ${doneCount} of ${circle.milestones.length}</p>`;
    }
    if (!isMember && circle.status === "open" && circle.members.length < 6) { html += `<button class="small-btn" onclick="joinCircle('${circle.id}')">Join</button>`; }
    if (isMember && circle.ownerId !== data.currentUserId && circle.status === "open") { html += `<button class="small-btn" onclick="leaveCircle('${circle.id}')">Leave</button>`; }
    if (circle.ownerId === data.currentUserId && circle.status === "open") { html += `<button class="small-btn" onclick="finishCircle('${circle.id}')">Complete circle</button>`; }
    html += `</div>`;
  }
  return html + `</div>`;
}

function newCircle() {
  openForm("New learning circle", [
    { name: "topic", label: "Topic", required: true },
    { name: "goal", label: "Target outcome", required: true },
    { name: "milestones", label: "Milestones (comma separated)", required: true }
  ], function (v) {
    const parts = v.milestones.split(",");
    const milestones = [];
    for (let i = 0; i < parts.length; i++) { if (parts[i].trim() !== "") { milestones.push({ title: parts[i].trim(), doneBy: [] }); } }
    data.circles.push({ id: makeId("c"), ownerId: data.currentUserId, topic: v.topic, goal: v.goal, members: [data.currentUserId], status: "open", milestones: milestones });
    refresh("Circle created");
  });
}

function joinCircle(circleId) { const c = findById(data.circles, circleId); c.members.push(data.currentUserId); addNote(c.ownerId, userName(data.currentUserId) + " joined " + c.topic); refresh("You joined the circle"); }

function leaveCircle(circleId) {
  if (!confirm("Leave this circle?")) { return; }
  const c = findById(data.circles, circleId);
  c.members.splice(c.members.indexOf(data.currentUserId), 1);
  refresh("You left the circle");
}

function toggleMilestone(circleId, index) {
  const doneBy = findById(data.circles, circleId).milestones[index].doneBy;
  const position = doneBy.indexOf(data.currentUserId);
  if (position === -1) { doneBy.push(data.currentUserId); } else { doneBy.splice(position, 1); }
  refresh();
}

function finishCircle(circleId) { findById(data.circles, circleId).status = "completed"; refresh("Circle completed"); }


/* ================= 8. COMMUNITIES ================= */

function communityPage() {
  const me = currentUser();
  let html = `<div class="row"><div><h1>Communities</h1><p class="muted">Organised discussions instead of buried chat messages.</p></div><button class="main-btn" onclick="newPost()">New post</button></div>
    <div class="tabs">`;
  const names = ["All"].concat(data.communities);
  for (let i = 0; i < names.length; i++) {
    html += `<button class="tab ${communityFilter === names[i] ? "active" : ""}" onclick="communityFilter='${names[i]}';showPage('community')">${names[i]}</button>`;
  }
  html += `</div>`;

  // Pinned posts first, then the rest
  let shown = 0;
  for (let round = 0; round < 2; round++) {
    for (let i = data.posts.length - 1; i >= 0; i--) {
      const post = data.posts[i];
      const wantPinned = (round === 0);
      if (post.removed || post.pinned !== wantPinned) { continue; }
      if (communityFilter !== "All" && post.community !== communityFilter) { continue; }
      html += postHtml(post, me);
      shown++;
    }
  }
  if (shown === 0) { html += emptyBox("No posts here yet. Be the first to post."); }
  return html;
}

function countUpvotes(postId) {
  let count = 0;
  for (let i = 0; i < data.upvotes.length; i++) { if (data.upvotes[i].postId === postId) { count++; } }
  return count;
}

function postHtml(post, me) {
  let html = `<div class="card ${post.pinned ? "pinned" : ""}"><span class="tag">${post.type}</span>${post.pinned ? '<span class="tag">Pinned</span>' : ""}
    <span class="muted small">${safe(post.community)} | ${safe(userName(post.authorId))}</span><h3>${safe(post.title)}</h3>`;
  if (post.text) { html += `<p>${safe(post.text)}</p>`; }

  // Poll: one vote per user
  if (post.type === "Poll") {
    let myVote = -1, total = 0;
    for (let i = 0; i < data.votes.length; i++) {
      if (data.votes[i].postId === post.id) { total++; if (data.votes[i].userId === data.currentUserId) { myVote = data.votes[i].option; } }
    }
    for (let i = 0; i < post.options.length; i++) {
      let count = 0;
      for (let j = 0; j < data.votes.length; j++) { if (data.votes[j].postId === post.id && data.votes[j].option === i) { count++; } }
      html += `<div class="line"><div class="row"><span>${safe(post.options[i])}</span><span class="muted small">${count} votes
        <button class="small-btn" ${myVote !== -1 ? "disabled" : ""} onclick="votePoll('${post.id}',${i})">${myVote === i ? "Your vote" : "Vote"}</button></span></div>
        <div class="bar"><div style="width:${total ? count / total * 100 : 0}%"></div></div></div>`;
    }
  }

  // Buttons
  html += `<button class="small-btn" onclick="toggleUpvote('${post.id}')">Upvote (${countUpvotes(post.id)})</button>
    <button class="small-btn" onclick="addComment('${post.id}')">Comment</button>
    <button class="small-btn" onclick="reportPost('${post.id}')">Report</button>`;
  if (post.type === "Idea" || post.type === "Discussion") { html += `<button class="small-btn" onclick="postToProject('${post.id}')">Turn into project</button>`; }
  if (me.isModerator) {
    html += `<button class="small-btn" onclick="togglePin('${post.id}')">${post.pinned ? "Unpin" : "Pin"}</button><button class="small-btn" onclick="removePost('${post.id}')">Remove</button>`;
    if (post.reports.length > 0) { html += `<p class="error">Reports: ${safe(post.reports.join(" / "))} <button class="small-btn" onclick="clearReports('${post.id}')">Dismiss</button></p>`; }
  }

  // Comments
  for (let i = 0; i < data.comments.length; i++) {
    const comment = data.comments[i];
    if (comment.postId === post.id) { html += `<div class="line small"><b>${safe(userName(comment.authorId))}</b>: ${safe(comment.text)}</div>`; }
  }
  return html + `</div>`;
}

function newPost() {
  openForm("New post", [
    { name: "community", label: "Community", type: "select", options: plainOptions(data.communities) },
    { name: "type", label: "Type", type: "select", options: plainOptions(["Discussion", "Question", "Resource", "Poll", "Idea", "Announcement"]) },
    { name: "title", label: "Title", required: true },
    { name: "text", label: "Content", type: "textarea" },
    { name: "options", label: "Poll options (comma separated, polls only)" }
  ], function (v) {
    if (v.type === "Announcement" && !currentUser().isModerator) { return "Only the moderator can post announcements. Use Idea instead."; }
    if (v.type !== "Poll" && v.text === "") { return "Please write some content."; }
    const options = [];
    const parts = v.options.split(",");
    for (let i = 0; i < parts.length; i++) { if (parts[i].trim() !== "") { options.push(parts[i].trim()); } }
    if (v.type === "Poll" && options.length < 2) { return "A poll needs at least 2 options."; }
    data.posts.push({ id: makeId("s"), community: v.community, authorId: data.currentUserId, type: v.type, title: v.title, text: v.text,
      options: v.type === "Poll" ? options : [], pinned: v.type === "Announcement", removed: false, reports: [] });
    refresh("Post published");
  });
}

function toggleUpvote(postId) {
  for (let i = 0; i < data.upvotes.length; i++) {
    if (data.upvotes[i].postId === postId && data.upvotes[i].userId === data.currentUserId) { data.upvotes.splice(i, 1); refresh(); return; }
  }
  data.upvotes.push({ postId: postId, userId: data.currentUserId });
  refresh();
}

function votePoll(postId, optionNumber) {
  for (let i = 0; i < data.votes.length; i++) {
    if (data.votes[i].postId === postId && data.votes[i].userId === data.currentUserId) { showMessage("You already voted."); return; }
  }
  data.votes.push({ postId: postId, userId: data.currentUserId, option: optionNumber });
  refresh("Vote recorded");
}

function addComment(postId) {
  openForm("Add comment", [{ name: "text", label: "Your comment", type: "textarea", required: true }], function (v) {
    data.comments.push({ id: makeId("m"), postId: postId, authorId: data.currentUserId, text: v.text });
    addNote(findById(data.posts, postId).authorId, userName(data.currentUserId) + " commented on your post");
    refresh("Comment added");
  });
}

function reportPost(postId) {
  openForm("Report post", [{ name: "reason", label: "Reason", required: true }], function (v) {
    findById(data.posts, postId).reports.push(v.reason);
    refresh("Report sent to the moderator");
  });
}

function togglePin(postId) { const p = findById(data.posts, postId); p.pinned = !p.pinned; refresh(p.pinned ? "Pinned" : "Unpinned"); }
function removePost(postId) { if (confirm("Remove this post?")) { findById(data.posts, postId).removed = true; refresh("Post removed"); } }
function clearReports(postId) { findById(data.posts, postId).reports = []; refresh("Reports dismissed"); }

// Bridge: turn a community idea into a project (title and text are copied over)
function postToProject(postId) {
  const post = findById(data.posts, postId);
  newProject(post.title, post.text, post.id);
}


/* ================= 9. PROFILE AND ACTIVITY ================= */

function profileCard(user) {
  return `<div class="card"><div class="row"><h3>${safe(user.name)}</h3><span class="muted small">${safe(user.year)} | ${safe(user.branch)}</span></div>
    <p class="muted">${safe(user.bio)}</p>
    ${user.skills ? `<p class="small muted">Knows</p>${makeTags(user.skills)}` : ""}
    ${user.learning ? `<p class="small muted">Learning</p>${makeTags(user.learning)}` : ""}</div>`;
}

function profilePage() {
  let html = `<div class="row"><h1>My Profile</h1><button class="main-btn" onclick="editProfile()">Edit profile</button></div>${profileCard(currentUser())}<h2>Other students</h2><div class="grid">`;
  for (let i = 0; i < data.users.length; i++) {
    if (data.users[i].id !== data.currentUserId) { html += profileCard(data.users[i]); }
  }
  return html + `</div>`;
}

function editProfile() {
  const me = currentUser();
  openForm("Edit profile", [
    { name: "name", label: "Display name", required: true, value: me.name },
    { name: "year", label: "Year", required: true, value: me.year },
    { name: "branch", label: "Branch", required: true, value: me.branch },
    { name: "bio", label: "Short introduction", type: "textarea", value: me.bio },
    { name: "skills", label: "Skills you know (comma separated)", value: me.skills },
    { name: "learning", label: "Skills you are learning", value: me.learning }
  ], function (v) {
    me.name = v.name; me.year = v.year; me.branch = v.branch; me.bio = v.bio; me.skills = v.skills; me.learning = v.learning;
    refresh("Profile saved");
  });
}

function activityPage() {
  let html = `<div class="row"><h1>Activity</h1><button class="small-btn" onclick="markAllRead()">Mark all read</button></div>`;
  let count = 0;
  for (let i = data.notes.length - 1; i >= 0; i--) {
    const note = data.notes[i];
    if (note.userId === data.currentUserId) { html += `<div class="card" style="${note.read ? "opacity:0.6" : ""}">${safe(note.text)}</div>`; count++; }
  }
  if (count === 0) { html += emptyBox("Nothing yet. Updates about applications, tasks and comments appear here."); }
  return html;
}

function markAllRead() {
  for (let i = 0; i < data.notes.length; i++) { if (data.notes[i].userId === data.currentUserId) { data.notes[i].read = true; } }
  refresh();
}


/* ================= 10. START THE APP ================= */

loadData();
document.getElementById("popup").onclick = function (event) { if (event.target.id === "popup") { closeForm(); } };
showPage("home");
