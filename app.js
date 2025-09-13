// Minimal student-friendly SQL learning app (vanilla JS + sql.js)

// Global state
let SQL = null;
let db = null;
let activeLesson = "intro";
let results = [];
let progress = {};
try { progress = JSON.parse(localStorage.getItem("sql_learn_progress_static") || "{}"); } catch {}

const lessons = [
  {
    id: "intro",
    title: "Intro: SELECT & FROM",
    level: "Beginner",
    time: "10 min",
    tags: ["SELECT","FROM","Basics"],
    content: `The <code>SELECT</code> statement retrieves rows from one or more tables. 
      Start by exploring the <code>Employees</code> table. Try changing the query and hit <b>Run</b>.
      <div class="small muted" style="margin-top:6px;">
        Tables: <code>Employees(emp_id, emp_name, role, dept_id, manager_id, email, hire_date, salary)</code>,
        <code>Departments(dept_id, dept_name)</code>, <code>Sales(sale_id, emp_id, amount, sale_date)</code>
      </div>`,
    starterSQL: "SELECT emp_id, emp_name, role FROM Employees LIMIT 5;",
    examples: [
      { sql:"SELECT * FROM Employees;", note:"Return all columns (be mindful of large outputs)." },
      { sql:"SELECT emp_name, salary FROM Employees WHERE salary > 1000000;", note:"Projection + filter." },
      { sql:"SELECT emp_name AS name, hire_date AS joined FROM Employees ORDER BY joined DESC;", note:"Alias & sorting." },
    ],
    exercises: [
      { title:"Show first 3 employees", sql:"SELECT * FROM Employees LIMIT 3;" },
      { title:"Show names and emails", sql:"SELECT emp_name, email FROM Employees;" },
    ],
  },
  {
    id: "filters",
    title: "Filtering with WHERE",
    level: "Beginner",
    time: "12 min",
    tags: ["WHERE","Comparison","AND/OR"],
    content: `Use <code>WHERE</code> to restrict rows. For example, list Engineers hired in 2024 or later.
      Then click <em>Check Answer</em>.`,
    starterSQL: "SELECT emp_name, role, hire_date FROM Employees WHERE role='Engineer' AND hire_date >= '2024-01-01';",
    examples: [
      { sql:"SELECT emp_name, role FROM Employees WHERE role IN ('Engineer','Analyst');", note:"IN operator." },
      { sql:"SELECT emp_name FROM Employees WHERE email LIKE '%@example.com';", note:"LIKE wildcard." },
      { sql:"SELECT emp_name, salary FROM Employees WHERE salary BETWEEN 800000 AND 1200000;", note:"BETWEEN range." },
    ],
    check: async (db) => {
      const res = db.exec("SELECT emp_name, role, hire_date FROM Employees WHERE role='Engineer' AND hire_date >= '2024-01-01' ORDER BY emp_name;");
      return res?.[0]?.values?.length >= 1;
    },
    exercises: [
      { title:"Engineers hired in 2024+", sql:"SELECT emp_name, hire_date FROM Employees WHERE role='Engineer' AND hire_date >= '2024-01-01';" },
      { title:"Salary between 8–12L", sql:"SELECT emp_name, salary FROM Employees WHERE salary BETWEEN 800000 AND 1200000;" },
    ],
  },
  {
    id: "joins",
    title: "Inner JOIN: Employees ↔ Departments",
    level: "Intermediate",
    time: "15 min",
    tags: ["JOIN","INNER JOIN"],
    content: `Combine data from multiple tables with <code>JOIN</code>. Match employees with their department names.
      <div class="small muted" style="margin-top:6px;">Hint: <code>SELECT e.emp_name, d.dept_name FROM Employees e INNER JOIN Departments d ON e.dept_id = d.dept_id;</code></div>`,
    starterSQL: "SELECT e.emp_name, d.dept_name FROM Employees e INNER JOIN Departments d ON e.dept_id = d.dept_id ORDER BY 1;",
    examples: [
      { sql:"SELECT e.emp_name, d.dept_name FROM Employees e JOIN Departments d ON e.dept_id=d.dept_id;", note:"Classic INNER JOIN." },
      { sql:"SELECT e.emp_name, d.dept_name FROM Employees e LEFT JOIN Departments d ON e.dept_id=d.dept_id;", note:"LEFT JOIN keeps all employees." },
    ],
    check: async (db) => {
      const res = db.exec("SELECT e.emp_name, d.dept_name FROM Employees e INNER JOIN Departments d ON e.dept_id = d.dept_id;");
      return res?.[0]?.values?.length >= 1 && res[0].columns.includes("dept_name");
    },
    exercises: [
      { title:"Employee with department name", sql:"SELECT e.emp_name, d.dept_name FROM Employees e JOIN Departments d ON e.dept_id=d.dept_id;" },
    ],
  },
  {
    id: "agg",
    title: "GROUP BY & HAVING",
    level: "Intermediate",
    time: "20 min",
    tags: ["GROUP BY","HAVING","Aggregate"],
    content: `Aggregations summarize data. Use <code>GROUP BY</code> with <code>COUNT</code>, <code>SUM</code>, etc.
      Use <code>HAVING</code> to filter groups. Exercise: Find departments with <em>at least 2 employees</em>.`,
    starterSQL: "SELECT d.dept_name, COUNT(*) AS people FROM Employees e JOIN Departments d ON e.dept_id=d.dept_id GROUP BY d.dept_name HAVING COUNT(*) >= 2 ORDER BY people DESC;",
    examples: [
      { sql:"SELECT role, COUNT(*) AS people FROM Employees GROUP BY role ORDER BY people DESC;", note:"Count per role." },
      { sql:"SELECT d.dept_name, ROUND(AVG(e.salary),0) AS avg_salary FROM Employees e JOIN Departments d ON e.dept_id=d.dept_id GROUP BY d.dept_name;", note:"Average salary by dept." },
    ],
    check: async (db) => {
      const res = db.exec("SELECT d.dept_name, COUNT(*) AS people FROM Employees e JOIN Departments d ON e.dept_id=d.dept_id GROUP BY d.dept_name HAVING COUNT(*) >= 2;");
      return res?.[0]?.values?.length >= 1 && res[0].columns.includes("people");
    },
    exercises: [
      { title:"People per dept (>=2)", sql:"SELECT d.dept_name, COUNT(*) AS people FROM Employees e JOIN Departments d ON e.dept_id=d.dept_id GROUP BY d.dept_name HAVING COUNT(*) >= 2;" },
      { title:"Avg salary by dept", sql:"SELECT d.dept_name, ROUND(AVG(e.salary),0) AS avg_salary FROM Employees e JOIN Departments d ON e.dept_id=d.dept_id GROUP BY d.dept_name;" },
    ],
  },
  {
    id: "selfjoin",
    title: "Self JOIN: Employee → Manager",
    level: "Intermediate",
    time: "15 min",
    tags: ["SELF JOIN","Hierarchy"],
    content: `A <em>self join</em> joins a table to itself. Show each employee with their manager name.
      <div class="small muted" style="margin-top:6px;">Hint: <code>Employees e JOIN Employees m ON e.manager_id = m.emp_id</code></div>`,
    starterSQL: "SELECT e.emp_name AS employee, m.emp_name AS manager FROM Employees e LEFT JOIN Employees m ON e.manager_id = m.emp_id ORDER BY employee;",
    examples: [
      { sql:"SELECT e.emp_name AS employee, m.emp_name AS manager FROM Employees e LEFT JOIN Employees m ON e.manager_id=m.emp_id;", note:"Self join pattern." },
    ],
    check: async (db) => {
      const res = db.exec("SELECT e.emp_name AS employee, m.emp_name AS manager FROM Employees e LEFT JOIN Employees m ON e.manager_id = m.emp_id;");
      return res?.[0]?.columns?.includes("manager");
    },
    exercises: [
      { title:"List employee ↔ manager", sql:"SELECT e.emp_name AS employee, m.emp_name AS manager FROM Employees e LEFT JOIN Employees m ON e.manager_id = m.emp_id;" },
      { title:"Pairs in same department", sql:"SELECT a.emp_name AS emp1, b.emp_name AS emp2, a.dept_id FROM Employees a JOIN Employees b ON a.dept_id = b.dept_id AND a.emp_id < b.emp_id;" },
    ],
  },
  {
    id: "date",
    title: "Dates & ORDER BY",
    level: "Beginner",
    time: "10 min",
    tags: ["ORDER BY","DATE"],
    content: `Sort rows with <code>ORDER BY</code>. Try ordering employees by <code>hire_date</code> descending.`,
    starterSQL: "SELECT emp_name, hire_date FROM Employees ORDER BY hire_date DESC;",
    examples: [
      { sql:"SELECT * FROM Employees ORDER BY hire_date DESC;", note:"Newest first." },
      { sql:"SELECT strftime('%Y', hire_date) AS year, COUNT(*) FROM Employees GROUP BY year;", note:"Group by year (SQLite)." },
    ],
    exercises: [
      { title:"Newest hires first", sql:"SELECT emp_name, hire_date FROM Employees ORDER BY hire_date DESC;" },
    ],
  },
  {
    id: "sales",
    title: "Practice: Who sold the most?",
    level: "Challenge",
    time: "15 min",
    tags: ["JOIN","SUM","ORDER BY"],
    content: `Combine <code>Sales</code> and <code>Employees</code> to find total sales by person and list the top seller.`,
    starterSQL: "SELECT e.emp_name, SUM(s.amount) AS total FROM Sales s JOIN Employees e ON s.emp_id=e.emp_id GROUP BY e.emp_name ORDER BY total DESC;",
    examples: [
      { sql:"SELECT e.emp_name, SUM(s.amount) AS total FROM Sales s JOIN Employees e ON s.emp_id=e.emp_id GROUP BY e.emp_name ORDER BY total DESC;", note:"Leaderboard." },
    ],
    check: async (db) => {
      const res = db.exec("SELECT e.emp_name, SUM(s.amount) AS total FROM Sales s JOIN Employees e ON s.emp_id=e.emp_id GROUP BY e.emp_name ORDER BY total DESC LIMIT 1;");
      const name = res?.[0]?.values?.[0]?.[0];
      return name === "Nicole Reyes" || name === "Arun Singh";
    },
    exercises: [
      { title:"Top seller", sql:"SELECT e.emp_name, SUM(s.amount) AS total FROM Sales s JOIN Employees e ON s.emp_id=e.emp_id GROUP BY e.emp_name ORDER BY total DESC LIMIT 1;" },
    ],
  },
];

// Seed database
function seedDatabase(_db){
  const schema = `
    PRAGMA foreign_keys = ON;
    CREATE TABLE Departments(dept_id INTEGER PRIMARY KEY, dept_name TEXT);
    CREATE TABLE Employees(
      emp_id INTEGER PRIMARY KEY,
      emp_name TEXT NOT NULL,
      role TEXT,
      dept_id INTEGER,
      manager_id INTEGER,
      email TEXT,
      hire_date TEXT,
      salary REAL,
      FOREIGN KEY(dept_id) REFERENCES Departments(dept_id)
    );
    CREATE TABLE Sales(
      sale_id INTEGER PRIMARY KEY,
      emp_id INTEGER,
      amount REAL,
      sale_date TEXT,
      FOREIGN KEY(emp_id) REFERENCES Employees(emp_id)
    );
  `;
  _db.run(schema);
  const departments = [
    [10,"Analytics"],[20,"Engineering"],[30,"Sales"],[40,"HR"]
  ];
  const employees = [
    [1,"Amit Maurya","Analyst",10,null,"amit@example.com","2022-02-01",1050000],
    [2,"Obaid Khan","Analyst",10,1,"obaid@example.com","2023-05-15",850000],
    [3,"Claire Watson","Manager",30,null,"claire@example.com","2021-07-10",1600000],
    [4,"Mayank Sharma","Engineer",20,7,"mayank@example.com","2024-01-11",1200000],
    [5,"Nicole Reyes","Sales",30,3,"nicole@example.com","2020-11-20",900000],
    [6,"Waleed Ahmed","Analyst",10,1,"waleed@example.com","2023-09-09",800000],
    [7,"David Harris","Manager",20,null,"david@example.com","2019-03-05",1750000],
    [8,"Arun Singh","Sales",30,3,"arun@example.com","2024-03-18",780000],
    [9,"Ram Bhawan","HR",40,null,"ram@example.com","2018-12-01",700000],
    [10,"Yasmin Ali","Engineer",20,7,"yasmin@example.com","2025-06-01",1100000],
  ];
  const sales = [
    [1001,5,250000,"2025-07-12"],
    [1002,8,180000,"2025-07-20"],
    [1003,5,320000,"2025-08-02"],
    [1004,8,150000,"2025-08-11"],
    [1005,5,210000,"2025-09-01"],
    [1006,8,195000,"2025-09-05"],
  ];
  const deptStmt = _db.prepare("INSERT INTO Departments VALUES (?, ?)");
  departments.forEach(row => deptStmt.run(row));
  deptStmt.free();
  const empStmt = _db.prepare("INSERT INTO Employees VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  employees.forEach(row => empStmt.run(row));
  empStmt.free();
  const saleStmt = _db.prepare("INSERT INTO Sales VALUES (?, ?, ?, ?)");
  sales.forEach(row => saleStmt.run(row));
  saleStmt.free();
}

// UI helpers
const $ = sel => document.querySelector(sel);
function html(strings, ...values){ return strings.map((s,i)=>s+(values[i]??"")).join(""); }

function setProgressDone(key){
  progress[key] = true;
  localStorage.setItem("sql_learn_progress_static", JSON.stringify(progress));
  renderProgress();
}
function renderProgress(){
  const pct = Math.round(100 * Object.keys(progress).length / lessons.length);
  $("#progressBar").style.width = pct + "%";
}

function renderLessons(filter=""){
  const L = lessons.filter(l => {
    const q = filter.trim().toLowerCase();
    if(!q) return true;
    return l.title.toLowerCase().includes(q) || l.tags.join(" ").toLowerCase().includes(q);
  });
  $("#lessons").innerHTML = L.map(l => html`
    <button class="lesson-btn ${activeLesson===l.id?"active":""}" data-id="${l.id}">
      <div class="row-flex" style="justify-content:space-between;">
        <div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-weight:600; font-size:14px;">${l.title}</span>
            ${progress[l.id] ? '<span title="Completed">✅</span>' : ''}
          </div>
          <div class="small muted">${l.level} • ${l.time}</div>
          <div class="chips">${l.tags.slice(0,3).map(t=>`<span class="chip">${t}</span>`).join("")}</div>
        </div>
        <span>›</span>
      </div>
    </button>
  `).join("");
  // add listeners
  [...document.querySelectorAll(".lesson-btn")].forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      activeLesson = id;
      const l = lessons.find(x=>x.id===id);
      $("#lessonTitle").innerHTML = "🏁 " + l.title + (progress[l.id] ? ' <span class="badge">Completed</span>' : '');
      $("#lessonMeta").innerText = `Level: ${l.level} • Estimated time: ${l.time}`;
      $("#lessonContent").innerHTML = l.content;
      $("#editor").value = l.starterSQL || "";
      // show/hide check button
      $("#checkBtn").style.display = l.check ? "inline-flex" : "none";
      renderExamples();
      renderExercises();
      renderLessons($("#search").value || "");
    });
  });
}

function renderExamples(){
  const l = lessons.find(x=>x.id===activeLesson);
  const ex = l?.examples || [];
  $("#examples").innerHTML = ex.map((it, i) => html`
    <div class="card">
      <p class="small" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${it.sql}</p>
      <div class="row-flex" style="justify-content:space-between;">
        <span class="small muted">${it.note}</span>
        <button class="btn small" data-idx="${i}" id="ex-${i}">Load in editor</button>
      </div>
    </div>
  `).join("");
  ex.forEach((_, i) => {
    const lsn = lessons.find(x=>x.id===activeLesson);
    const btn = document.getElementById("ex-"+i);
    if(btn) btn.addEventListener("click", ()=>{
      $("#editor").value = lsn.examples[i].sql;
      // switch to Playground tab if needed
      showTab("playground");
    });
  });
}

function renderExercises(){
  const l = lessons.find(x=>x.id===activeLesson);
  const ex = (l?.exercises || []).slice();
  // add common extras
  ex.push(
    { title:"List employee names with their manager’s name", sql:"SELECT e.emp_name AS employee, m.emp_name AS manager FROM Employees e LEFT JOIN Employees m ON e.manager_id = m.emp_id;" },
    { title:"Pairs of employees in the same department", sql:`SELECT a.emp_name AS emp1, b.emp_name AS emp2, a.dept_id
FROM Employees a
JOIN Employees b ON a.dept_id = b.dept_id AND a.emp_id < b.emp_id;` },
  );
  $("#exercises").innerHTML = ex.map((it, i) => html`
    <div class="card">
      <div class="row-flex" style="justify-content:space-between; align-items:flex-start;">
        <div>
          <p style="font-weight:600;">${it.title}</p>
        </div>
        <button class="btn small" data-idx="${i}" id="task-${i}">Try it</button>
      </div>
    </div>
  `).join("");
  ex.forEach((_, i) => {
    const btn = document.getElementById("task-"+i);
    if(btn) btn.addEventListener("click", ()=>{
      $("#editor").value = ex[i].sql;
      showTab("playground");
    });
  });
}

function showTab(which){
  $("#tabPlayground").classList.toggle("primary", which==="playground");
  $("#tabExamples").classList.toggle("primary", which==="examples");
  $("#tabExercises").classList.toggle("primary", which==="exercises");
  $("#panelPlayground").style.display = which==="playground" ? "block" : "none";
  $("#panelExamples").style.display = which==="examples" ? "block" : "none";
  $("#panelExercises").style.display = which==="exercises" ? "block" : "none";
}

// Render results
function renderResults(res){
  const wrap = $("#results");
  if(!res || res.length===0){ wrap.innerHTML = `<p class="small muted">No result sets to display.</p>`; return; }
  wrap.innerHTML = res.map((r, idx) => {
    const head = `<tr>${r.columns.map(c=>`<th>${c}</th>`).join("")}</tr>`;
    const body = r.values.slice(0,200).map(row=>`<tr>${row.map(cell=>`<td>${String(cell)}</td>`).join("")}</tr>`).join("");
    const more = r.values.length>200 ? `<p class="small muted">Showing first 200 rows… refine your query to see more.</p>` : "";
    return `<div class="card">
      <p class="small muted">Result set #${idx+1} • ${r.columns.length} columns • ${r.values.length} rows</p>
      <div style="overflow:auto;"><table>${head}<tbody>${body}</tbody></table></div>
      ${more}
    </div>`;
  }).join("");
}

// Actions
async function initSQL(){
  try {
    SQL = await window.initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
    db = new SQL.Database();
    seedDatabase(db);
  } catch(e){
    $("#error").textContent = "Failed to load the SQL engine. Please check your internet connection and refresh.";
    console.error(e);
  }
}

function runQuery(){
  if(!db) return;
  $("#error").textContent = "";
  try{
    const sqlText = $("#editor").value;
    const res = db.exec(sqlText);
    renderResults(res);
    autoCheck();
  }catch(e){
    renderResults([]);
    $("#error").textContent = String(e.message || e);
  }
}

function resetDatabase(){
  if(!SQL) return;
  db = new SQL.Database();
  seedDatabase(db);
  renderResults([]);
  $("#error").textContent = "";
}

// Auto-check
function autoCheck(){
  const lesson = lessons.find(l => l.id===activeLesson);
  if(!lesson?.check || !db) return;
  setTimeout(async ()=>{
    try{
      const ok = await lesson.check(db);
      if(ok) setProgressDone(lesson.id);
    }catch{}
  }, 80);
}

// Event bindings
document.addEventListener("DOMContentLoaded", async () => {
  // theme
  const themeBtn = $("#themeBtn");
  let dark = localStorage.getItem("theme") === "dark";
  if(dark) document.documentElement.classList.add("dark");
  themeBtn.addEventListener("click", ()=>{
    dark = !dark;
    localStorage.setItem("theme", dark ? "dark":"light");
    document.documentElement.classList.toggle("dark", dark);
  });

  // init SQL
  await initSQL();

  // initial render
  renderLessons();
  renderProgress();
  // select first lesson
  const l = lessons.find(x=>x.id===activeLesson);
  $("#lessonTitle").innerHTML = "🏁 " + l.title + (progress[l.id] ? ' <span class="badge">Completed</span>' : '');
  $("#lessonMeta").innerText = `Level: ${l.level} • Estimated time: ${l.time}`;
  $("#lessonContent").innerHTML = l.content;
  $("#editor").value = l.starterSQL || "";
  $("#checkBtn").style.display = l.check ? "inline-flex" : "none";
  renderExamples();
  renderExercises();

  // search
  $("#search").addEventListener("input", (e)=> renderLessons(e.target.value));

  // tabs
  $("#tabPlayground").addEventListener("click", ()=>showTab("playground"));
  $("#tabExamples").addEventListener("click", ()=>showTab("examples"));
  $("#tabExercises").addEventListener("click", ()=>showTab("exercises"));

  // actions
  $("#runBtn").addEventListener("click", runQuery);
  $("#loadStarter").addEventListener("click", ()=>{
    const l = lessons.find(x=>x.id===activeLesson);
    $("#editor").value = l.starterSQL || "";
  });
  $("#checkBtn").addEventListener("click", async ()=>{
    const l = lessons.find(x=>x.id===activeLesson);
    if(!l?.check || !db) return;
    const ok = await l.check(db);
    alert(ok ? "Looks good! Marked as completed." : "Not quite yet. Compare with the hint or examples.");
    if(ok) setProgressDone(l.id);
  });
  $("#resetBtn").addEventListener("click", resetDatabase);
});
