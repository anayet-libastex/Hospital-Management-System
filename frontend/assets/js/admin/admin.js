// admin/admin.js
import { apiFetch } from '../api.js';
import { logout, getCurrentUser } from '../auth.js';

// ---------- Helpers ----------
function showError(msg) {
  const el = document.getElementById('errorMsg');
  if (el) {
    el.querySelector('span').textContent = msg;
    el.classList.add('show');
  }
}

function hideError() {
  const el = document.getElementById('errorMsg');
  if (el) el.classList.remove('show');
}

function displayList(containerId, items, renderFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!items || items.length === 0) {
    container.innerHTML = '<p class="text-gray-500">No items found.</p>';
    return;
  }
  container.innerHTML = items.map(renderFn).join('');
}

// ---------- Load Reports ----------
export async function loadReports() {
  try {
    const stats = await apiFetch('/admin/reports');
    document.getElementById('totalPatients').textContent = stats.totalPatients || 0;
    document.getElementById('totalDoctors').textContent = stats.totalDoctors || 0;
    document.getElementById('totalStaff').textContent = stats.totalStaff || 0;
    document.getElementById('totalDepartments').textContent = stats.totalDepartments || 0;
    document.getElementById('totalAppointments').textContent = stats.totalAppointments || 0;
  } catch (err) {
    showError('Failed to load reports: ' + err.message);
  }
}

// ---------- Load Doctors ----------
export async function loadDoctors() {
  try {
    const doctors = await apiFetch('/admin/doctors');
    displayList('doctorList', doctors, (doc) => `
      <div class="list-item">
        <div>
          <strong>${doc.name}</strong> (${doc.specialization})<br>
          <span class="text-sm text-gray-600">${doc.email}</span>
        </div>
        <div>
          <button onclick="editDoctor('${doc._id}')" class="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
          <button onclick="deleteDoctor('${doc._id}')" class="text-red-600 hover:text-red-800">Delete</button>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load doctors: ' + err.message);
  }
}

window.deleteDoctor = async function(id) {
  if (!confirm('Delete this doctor?')) return;
  try {
    await apiFetch(`/admin/doctors/${id}`, { method: 'DELETE' });
    loadDoctors();
  } catch (err) {
    showError('Delete failed: ' + err.message);
  }
};

window.editDoctor = function(id) {
  alert('Edit doctor ' + id + ' (implement modal)');
};

document.getElementById('createDoctorForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  try {
    await apiFetch('/admin/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    form.reset();
    loadDoctors();
  } catch (err) {
    showError('Create doctor failed: ' + err.message);
  }
});

// ---------- Load Staff ----------
export async function loadStaff() {
  try {
    const staff = await apiFetch('/admin/staff');
    displayList('staffList', staff, (s) => `
      <div class="list-item">
        <div>
          <strong>${s.name}</strong> (${s.qualification || 'N/A'})<br>
          <span class="text-sm text-gray-600">${s.email}</span>
        </div>
        <div>
          <button onclick="editStaff('${s._id}')" class="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
          <button onclick="deleteStaff('${s._id}')" class="text-red-600 hover:text-red-800">Delete</button>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load staff: ' + err.message);
  }
}

window.deleteStaff = async function(id) {
  if (!confirm('Delete this staff?')) return;
  try {
    await apiFetch(`/admin/staff/${id}`, { method: 'DELETE' });
    loadStaff();
  } catch (err) {
    showError('Delete failed: ' + err.message);
  }
};

document.getElementById('createStaffForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  try {
    await apiFetch('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    form.reset();
    loadStaff();
  } catch (err) {
    showError('Create staff failed: ' + err.message);
  }
});

// ---------- Load Departments ----------
export async function loadDepartments() {
  try {
    const depts = await apiFetch('/admin/departments');
    displayList('deptList', depts, (d) => `
      <div class="list-item">
        <div>
          <strong>${d.name}</strong><br>
          <span class="text-sm text-gray-600">${d.description || ''}</span>
        </div>
        <div>
          <button onclick="editDept('${d._id}')" class="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
          <button onclick="deleteDept('${d._id}')" class="text-red-600 hover:text-red-800">Delete</button>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load departments: ' + err.message);
  }
}

window.deleteDept = async function(id) {
  if (!confirm('Delete this department?')) return;
  try {
    await apiFetch(`/admin/departments/${id}`, { method: 'DELETE' });
    loadDepartments();
  } catch (err) {
    showError('Delete failed: ' + err.message);
  }
};

document.getElementById('createDeptForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  try {
    await apiFetch('/admin/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    form.reset();
    loadDepartments();
  } catch (err) {
    showError('Create department failed: ' + err.message);
  }
});

// ---------- Load Patients ----------
export async function loadPatients() {
  try {
    const patients = await apiFetch('/admin/patients');
    displayList('patientList', patients, (p) => `
      <div class="list-item">
        <div>
          <strong>${p.name}</strong> (${p.email})<br>
          <span class="text-sm text-gray-600">${p.phone || ''}</span>
        </div>
        <div>
          <button onclick="editPatient('${p._id}')" class="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
          <button onclick="deletePatient('${p._id}')" class="text-red-600 hover:text-red-800">Delete</button>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load patients: ' + err.message);
  }
}

window.deletePatient = async function(id) {
  if (!confirm('Delete this patient?')) return;
  try {
    await apiFetch(`/admin/patients/${id}`, { method: 'DELETE' });
    loadPatients();
  } catch (err) {
    showError('Delete failed: ' + err.message);
  }
};

// ---------- User Management ----------
document.getElementById('createUserForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  try {
    await apiFetch('/admin/user-management', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    form.reset();
    alert('User created successfully!');
  } catch (err) {
    showError('Create user failed: ' + err.message);
  }
});

// ---------- EXPOSE LOAD FUNCTIONS TO WINDOW ----------
// (so the inline switchTab can call them)
window.loadReports = loadReports;
window.loadDoctors = loadDoctors;
window.loadStaff = loadStaff;
window.loadDepartments = loadDepartments;
window.loadPatients = loadPatients;

// ----- NO window.switchTab defined here – let the HTML handle it -----

// ---------- On load: check auth, set user name ----------
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.href = '../public/index.html';
    return;
  }
  // Set user name (the HTML already does this via its own DOMContentLoaded)
  // but we can also do it here if needed.
});