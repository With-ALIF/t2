(function() {
  const STUDENTS_KEY = 'students';
  const RECORDS_KEY = 'attendance_records';

  const el = {
    search: document.getElementById('studentSearch'),
    datalist: document.getElementById('studentsList'),
    date: document.getElementById('attendanceDate'),
    saveBtn: document.getElementById('saveBtn'),
    clearBtn: document.getElementById('clearBtn'),
    tbody: document.getElementById('tbody'),
    who: document.getElementById('who'),
    logoutBtn: document.getElementById('logoutBtn')
  };

  if (el.who) {
    el.who.textContent = '';
  }

  const broadcast = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('students_channel') : null;

  function readStudents() {
    try {
      const raw = localStorage.getItem(STUDENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function readRecords() {
    try {
      const raw = localStorage.getItem(RECORDS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveRecords(obj) {
    try {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(obj));
      if (broadcast) {
        try { broadcast.postMessage({ type: 'attendance-updated' }); } catch (ee) {}
      }
    } catch (e) {}
  }

  function setTodayDateInput() {
    if (!el.date) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    el.date.value = `${yyyy}-${mm}-${dd}`;
  }

  function populateDataList() {
    if (!el.datalist) return;
    const students = readStudents();
    el.datalist.innerHTML = '';
    students.forEach(s => {
      const opt = document.createElement('option');
      opt.value = `${s.name} - ${s.id}`;
      el.datalist.appendChild(opt);
    });
  }

  function normalizeInputForId(text) {
    if (!text) return text;
    return text.replace(/\u2014/g, '-').replace(/\u2013/g, '-').replace(/\s*-\s*/g, '-').trim();
  }

  function findStudentFormInput(text) {
    const students = readStudents();
    if (!text) return null;
    text = String(text).trim();
    const normalized = normalizeInputForId(text);
    const lower = normalized.toLowerCase();
    const dashIdx = normalized.lastIndexOf('-');
    if (dashIdx !== -1) {
      const maybeId = normalized.slice(dashIdx + 1).trim();
      if (maybeId) {
        const byId = students.find(s => String(s.id).toLowerCase() === maybeId.toLowerCase());
        if (byId) return byId;
      }
    }
    let byId = students.find(s => String(s.id).toLowerCase() === lower);
    if (byId) return byId;
    const byName = students.find(s => String(s.name).toLowerCase().includes(lower) || String(s.id).toLowerCase().includes(lower));
    return byName || null;
  }

  function computeTotals() {
    const students = readStudents();
    const records = readRecords();
    const totals = {};
    students.forEach(s => totals[s.id] = { present: 0, absent: 0 });
    Object.keys(records).forEach(date => {
      const day = records[date];
      Object.keys(day).forEach(id => {
        if (!totals[id]) totals[id] = { present: 0, absent: 0 };
        const status = day[id];
        if (status === 'present') totals[id].present += 1;
        else if (status === 'absent') totals[id].absent += 1;
      });
    });
    return totals;
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function renderTable() {
    const students = readStudents();
    const totals = computeTotals();
    const tbody = el.tbody;
    if (!tbody) return;
    tbody.innerHTML = '';
    if (students.length === 0) {
      const tr = document.createElement('tr');
      tr.className = 'empty-row';
      tr.innerHTML = `<td colspan="7">No Students Found</td>`;
      tbody.appendChild(tr);
      return;
    }
    students.forEach((s, i) => {
      const t = totals[s.id] || { present: 0, absent: 0 };
      const totalClasses = (t.present || 0) + (t.absent || 0);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="width:36px">${i + 1}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.id)}</td>
        <td>${totalClasses}</td>
        <td class="cell-num">${t.present || 0}</td>
        <td class="cell-num">${t.absent || 0}</td>
        <td class="actions">
          <button class="action-btn" data-action="mark" data-id="${s.id}">Mark</button>
          <button class="action-btn" data-action="reset" data-id="${s.id}">Reset</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  function saveAttendanceForDate(student, dateStr, status) {
    if (!student || !dateStr || !status) return false;
    const records = readRecords();
    if (!records[dateStr]) records[dateStr] = {};
    records[dateStr][student.id] = status;
    saveRecords(records);
    return true;
  }

  if (el.saveBtn) {
    el.saveBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const input = el.search && el.search.value ? el.search.value.trim() : '';
      const student = findStudentFormInput(input);
      if (!student) {
        alert('No student found - input valid name or id.');
        return;
      }
      const dateValue = el.date && el.date.value ? el.date.value : '';
      if (!dateValue) {
        alert('Select Date.');
        return;
      }
      const checked = document.querySelector('input[name="status"]:checked');
      const status = checked ? checked.value : null;
      if (!status) {
        alert('Select Present or Absent');
        return;
      }
      const ok = saveAttendanceForDate(student, dateValue, status);
      if (ok) {
        alert(`${student.name} (${student.id}) - ${status === 'present' ? 'Present' : 'Absent'} saved for ${dateValue}`);
        renderTable();
        if (el.search) el.search.value = '';
      } else {
        alert('Could not save. Try again.');
      }
    });
  }

  if (el.tbody) {
    el.tbody.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const students = readStudents();
      const s = students.find(x => String(x.id) === String(id));
      if (!s) return;
      if (action === 'mark') {
        if (el.search) el.search.value = `${s.name} - ${s.id}`;
        const presentRadio = document.getElementById('rdPresent');
        if (presentRadio) presentRadio.checked = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (action === 'reset') {
        if (!confirm(`Reset counts for ${s.name} (${s.id}) across all dates? This will delete all day entries for this student.`)) return;
        const records = readRecords();
        let changed = false;
        Object.keys(records).forEach(date => {
          if (records[date] && records[date][s.id]) {
            delete records[date][s.id];
            changed = true;
            if (Object.keys(records[date]).length === 0) delete records[date];
          }
        });
        if (changed) saveRecords(records);
        renderTable();
      }
    });
  }

  if (el.clearBtn) {
    el.clearBtn.addEventListener('click', () => { if (el.search) el.search.value = ''; });
  }

  function renderTableByDate(dateStr) {
    const students = readStudents();
    const tbody = el.tbody;
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!dateStr) {
      renderTable();
      return;
    }
    const records = readRecords();
    const day = records[dateStr] || {};
    if (students.length === 0) {
      const tr = document.createElement('tr');
      tr.className = 'empty-row';
      tr.innerHTML = `<td colspan="7">No Student Found.</td>`;
      tbody.appendChild(tr);
      return;
    }
    students.forEach((s, i) => {
      const status = day[s.id] || '—';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="width:36px">${i + 1}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.id)}</td>
        <td colspan="4">${status === 'present' ? 'Present' : (status === 'absent' ? 'Absent' : '—')}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  if (broadcast) {
    broadcast.onmessage = (ev) => {
      const data = ev.data || {};
      if (data.type === 'students-updated' || data.type === 'attendance-updated') {
        populateDataList();
        renderTable();
      }
    };
  }

  window.addEventListener('storage', (e) => {
    if (!e) return;
    if (e.key === STUDENTS_KEY || e.key === RECORDS_KEY || e.key === null) {
      populateDataList();
      renderTable();
    }
  });

  function init() {
    setTodayDateInput();
    populateDataList();
    renderTable();
    if (el.date) {
      el.date.addEventListener('change', () => {
        renderTableByDate(el.date.value);
      });
    }
    if (el.logoutBtn) {
      el.logoutBtn.addEventListener('click', () => {
        try { localStorage.removeItem('attendance_remembered_user'); } catch (e) {}
        if (typeof window !== 'undefined') window.location.href = '../index.html';
      });
    }
  }

  init();

  window.__attendance = { readRecords, readStudents, saveRecords, computeTotals, renderTable, renderTableByDate };
})();
