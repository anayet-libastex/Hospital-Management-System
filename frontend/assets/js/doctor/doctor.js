// doctor/doctor.js
import { apiFetch } from '../api.js';
import { logout, getCurrentUser } from '../auth.js';

function showError(msg) {
  document.getElementById('errorMsg').textContent = msg;
  document.getElementById('errorMsg').classList.remove('hidden');
}

function hideError() {
  document.getElementById('errorMsg').classList.add('hidden');
}

function displayList(containerId, items, renderFn) {
  const container = document.getElementById(containerId);
  if (!items || items.length === 0) {
    container.innerHTML = '<p class="text-gray-500">No items found.</p>';
    return;
  }
  container.innerHTML = items.map(renderFn).join('');
}

// ---------- Load appointments ----------
async function loadAppointments() {
  try {
    const appointments = await apiFetch('/doctor/appointments');
    displayList('appointmentList', appointments, (a) => `
      <div class="border p-3 rounded mb-2">
        <div class="flex justify-between">
          <div>
            <strong>Patient:</strong> ${a.patientId?.name || 'N/A'}<br>
            <span class="text-sm text-gray-600">${a.date} at ${a.time}</span><br>
            <span class="text-sm">Status: <span class="font-medium">${a.status}</span></span>
          </div>
          <div>
            <select onchange="updateStatus('${a._id}', this.value)" class="border rounded px-2 py-1 text-sm">
              <option value="pending" ${a.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="confirmed" ${a.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="completed" ${a.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="cancelled" ${a.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
            <button onclick="viewPatientHistory('${a.patientId?._id}')" class="text-blue-600 hover:text-blue-800 ml-2">History</button>
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load appointments: ' + err.message);
  }
}

window.updateStatus = async function(id, status) {
  try {
    await apiFetch(`/doctor/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    loadAppointments();
  } catch (err) {
    showError('Status update failed: ' + err.message);
  }
};

window.viewPatientHistory = async function(patientId) {
  if (!patientId) return;
  try {
    const history = await apiFetch(`/doctor/patients/${patientId}/medical-history`);
    // Display in a modal or alert
    alert(JSON.stringify(history, null, 2));
  } catch (err) {
    showError('Failed to fetch history: ' + err.message);
  }
};

// ---------- Prescription ----------
document.getElementById('createPrescriptionForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  // Parse medicines if needed (we can use a simple textarea)
  try {
    await apiFetch('/doctor/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    form.reset();
    alert('Prescription created!');
  } catch (err) {
    showError('Create prescription failed: ' + err.message);
  }
});

// ---------- Lab Request ----------
document.getElementById('createLabRequestForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  try {
    await apiFetch('/doctor/lab-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    form.reset();
    loadLabRequests();
    alert('Lab request sent!');
  } catch (err) {
    showError('Lab request failed: ' + err.message);
  }
});

async function loadLabRequests() {
  try {
    const requests = await apiFetch('/doctor/lab-requests');
    displayList('labRequestList', requests, (r) => `
      <div class="border p-3 rounded mb-2">
        <div>
          <strong>Patient:</strong> ${r.patientId?.name || 'N/A'}<br>
          <strong>Test:</strong> ${r.testType}<br>
          <span class="text-sm">Status: ${r.status}</span>
          ${r.result ? `<br><span class="text-sm">Result: ${r.result}</span>` : ''}
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load lab requests: ' + err.message);
  }
}

// ---------- Tab switching ----------
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');
  if (tabId === 'tabAppointments') loadAppointments();
  else if (tabId === 'tabLabRequests') loadLabRequests();
}

window.switchTab = switchTab;

// ---------- Initial load ----------
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (!user || user.role !== 'doctor') {
    window.location.href = '../public/index.html';
    return;
  }
  document.getElementById('userName').textContent = user.name || user.email;
  switchTab('tabAppointments');
});