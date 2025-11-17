// js/login.js  (use with <script defer>)
(function(){
  function $(id){ return document.getElementById(id); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init(){
    const form = $('loginForm');
    const usernameInput = $('username');
    const passwordInput = $('password');
    const toggleBtn = $('togglePwd');
    const remember = $('remember');
    const demoBtn = $('demoBtn');

    if (!form) {
      console.error('login.js: #loginForm missing');
      return;
    }

    // toggle password visibility
    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener('click', () => {
        const t = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = t;
        toggleBtn.textContent = t === 'password' ? 'Show' : 'Hide';
      });
    }

    // demo fill
    if (demoBtn && usernameInput && passwordInput) {
      demoBtn.addEventListener('click', () => {
        usernameInput.value = 'demo';
        passwordInput.value = 'demo123';
      });
    }

    // load remembered username into field if present
    try {
      const rem = localStorage.getItem('attendance_remembered_user');
      if (rem && usernameInput) {
        usernameInput.value = rem;
        if (remember) remember.checked = true;
      }
    } catch(e){ /* ignore */ }

    form.onsubmit = function(ev){
      ev.preventDefault();
      const username = (usernameInput?.value || '').trim();
      const password = (passwordInput?.value || '').trim();

      if (!username || !password) {
        alert('Provide both username and password.');
        return;
      }

      try {
        sessionStorage.setItem('loggedInUser', username);
        console.log('login.js: session saved =', username);
      } catch(e) {
        console.warn('login.js: sessionStorage write failed', e);
      }

      try {
        if (remember && remember.checked) localStorage.setItem('attendance_remembered_user', username);
        else localStorage.removeItem('attendance_remembered_user');
      } catch(e) {
        console.warn('login.js: localStorage op failed', e);
      }

      // redirect to attendance page (project: lib/attendance.html)
      window.location.assign('lib/attendance.html');
    };
  }
})();
