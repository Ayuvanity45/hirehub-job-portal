// ============================================
// Session helpers - shared across all pages
// ============================================

function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function isLoggedIn() {
  return !!localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

// Redirects to login if not authenticated; optionally enforces a role
function requireAuth(requiredRole = null) {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return null;
  }
  const user = getUser();
  if (requiredRole && user.role !== requiredRole) {
    alert(`This page is only available to ${requiredRole}s.`);
    window.location.href = user.role === "recruiter" ? "dashboard-recruiter.html" : "dashboard-candidate.html";
    return null;
  }
  return user;
}

// Renders the shared navbar into <div id="navbar"></div>, adapting to login state / role
function renderNavbar() {
  const el = document.getElementById("navbar");
  if (!el) return;

  const user = getUser();

  let links = `<a href="jobs.html">Browse Jobs</a>`;

  if (!user) {
    links += `<a href="login.html">Log In</a><a href="register.html" class="pill">Sign Up</a>`;
  } else if (user.role === "recruiter") {
    links += `
      <a href="dashboard-recruiter.html">Dashboard</a>
      <a href="post-job.html">Post a Job</a>
      <span class="nav-user">${user.name}</span>
<a href="#" id="logoutBtn" class="pill">Log Out</a>    `;
  } else {
    links += `
      <a href="dashboard-candidate.html">My Applications</a>
      <span class="nav-user">${user.name}</span>
<a href="#" id="logoutBtn" class="pill">Log Out</a>    `;
  }

  el.innerHTML = `
    <nav class="navbar">
      <div class="container">
        <a href="index.html" class="brand"><span class="brand-mark"></span>HireHub</a>
        <div class="nav-links">${links}</div>
      </div>
    </nav>
  `;
  const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        logout();
    });
}
}

document.addEventListener("DOMContentLoaded", renderNavbar);
