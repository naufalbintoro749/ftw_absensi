// Auth helper - pakai localStorage, simple dan reliable
function getSession() {
  try {
    var s = localStorage.getItem('currentUser');
    return s ? JSON.parse(s) : null;
  } catch(e) { return null; }
}

function saveSession(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('currentUser');
}
