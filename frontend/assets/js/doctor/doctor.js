// doctor/doctor.js
import { apiFetch } from '../api.js';
import { logout, getCurrentUser } from '../auth.js';

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
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-lg shadow-sm">
        <i class="fas fa-calendar-check text-5xl text-gray-300 mb-3 block"></i>
        <p class="text-gray-500 font-medium">No appointments scheduled</p>
        <p class="text-sm text-gray-400">You have no upcoming appointments at this time.</p>
      </div>
    `;
    return;
  }
  container.innerHTML = items.map(renderFn).join('');
}

// ---------- Load appointments ----------
export async function loadAppointments() {
  try {
    const appointments = await apiFetch('/doctor/appointments');
    displayList('appointmentList', appointments, (a) => {
      // Status badge colors
      const statusConfig = {
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
        confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
        completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' }
      };
      const status = a.status || 'pending';
      const config = statusConfig[status] || statusConfig.pending;

      // Format date
      const dateObj = new Date(a.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Patient initials for avatar
      const patientName = a.patientId?.name || 'Unknown';
      const initials = patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

      return `
        <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden mb-4">
          <div class="flex flex-col lg:flex-row lg:items-center p-4 gap-4">
            <!-- Avatar & Patient Info -->
            <div class="flex items-center gap-3 lg:min-w-[220px]">
              <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                ${initials || 'P'}
              </div>
              <div>
                <h4 class="font-semibold text-gray-800 text-base">${patientName}</h4>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <span><i class="far fa-envelope mr-1"></i>${a.patientId?.email || 'no email'}</span>
                </div>
              </div>
            </div>

            <!-- Appointment Details -->
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div class="flex items-center gap-2 text-gray-600">
                <i class="far fa-calendar-alt text-blue-400 w-4"></i>
                <span>${formattedDate}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <i class="far fa-clock text-blue-400 w-4"></i>
                <span>${a.time}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <i class="fas fa-building text-blue-400 w-4"></i>
                <span>${a.departmentId?.name || 'N/A'}</span>
              </div>
            </div>

            <!-- ✅ New Fields: Reason & Appointment Type -->
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-500">
              ${a.reason ? `
                <div class="flex items-center gap-1">
                  <i class="fas fa-comment-medical text-gray-400 w-3"></i>
                  <span>Reason: ${a.reason}</span>
                </div>
              ` : ''}
              ${a.appointmentType ? `
                <div class="flex items-center gap-1">
                  <i class="fas fa-tag text-gray-400 w-3"></i>
                  <span>Type: ${a.appointmentType.charAt(0).toUpperCase() + a.appointmentType.slice(1)}</span>
                </div>
              ` : ''}
            </div>

            <!-- Status & Actions -->
            <div class="flex flex-wrap items-center gap-3 lg:justify-end min-w-[180px]">
              <div class="flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg}">
                <span class="w-2 h-2 rounded-full ${config.dot}"></span>
                <span class="text-xs font-medium ${config.text} capitalize">${status}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <select onchange="updateStatus('${a._id}', this.value)" 
                        class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none">
                  <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>Confirm</option>
                  <option value="completed" ${status === 'completed' ? 'selected' : ''}>Complete</option>
                  <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancel</option>
                </select>
                <button onclick="viewPatientHistory('${a.patientId?._id}')" 
                        class="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-blue-50 transition">
                  <i class="fas fa-history"></i>
                </button>
              </div>
            </div>
          </div>
          ${a.notes ? `
            <div class="border-t border-gray-100 px-4 py-2 bg-gray-50/50 text-xs text-gray-500 flex items-center gap-2">
              <i class="fas fa-sticky-note text-gray-400"></i>
              <span>${a.notes}</span>
            </div>
          ` : ''}
        </div>
      `;
    });
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
    const records = history.records || [];
    if (records.length === 0) {
      alert('No medical history found for this patient.');
      return;
    }
    const historyText = records.map((r, i) => 
      `${i+1}. ${new Date(r.date).toLocaleDateString()} - ${r.diagnosis || 'N/A'}`
    ).join('\n');
    alert(`Medical History for ${history.patientId?.name || 'Patient'}:\n\n${historyText}`);
  } catch (err) {
    showError('Failed to fetch history: ' + err.message);
  }
};

// ---------- Prescription ----------
document.getElementById('createPrescriptionForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  try {
    await apiFetch('/doctor/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    form.reset();
    alert('Prescription created successfully!');
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
    alert('Lab request sent successfully!');
  } catch (err) {
    showError('Lab request failed: ' + err.message);
  }
});

export async function loadLabRequests() {
  try {
    const requests = await apiFetch('/doctor/lab-requests');
    const container = document.getElementById('labRequestList');
    if (!container) return;
    if (!requests || requests.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 bg-white rounded-lg shadow-sm">
          <i class="fas fa-flask text-4xl text-gray-300 mb-3 block"></i>
          <p class="text-gray-500 font-medium">No lab requests</p>
          <p class="text-sm text-gray-400">You haven't requested any lab tests yet.</p>
        </div>
      `;
      return;
    }
    container.innerHTML = requests.map((r) => {
      const statusColor = r.status === 'reported' ? 'text-emerald-600' : 'text-amber-600';
      return `
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3 hover:shadow-md transition-shadow">
          <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <div>
              <div class="font-medium text-gray-800">${r.patientId?.name || 'N/A'}</div>
              <div class="text-sm text-gray-500">Test: ${r.testType}</div>
              <div class="text-sm text-gray-500">Status: <span class="font-medium ${statusColor} capitalize">${r.status}</span></div>
              ${r.result ? `<div class="text-sm text-emerald-600 mt-1">Result: ${r.result}</div>` : ''}
            </div>
            <div class="text-sm text-gray-400">
              ${r.status === 'reported' ? '<i class="fas fa-check-circle text-emerald-500 mr-1"></i> Completed' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    showError('Failed to load lab requests: ' + err.message);
  }
}

// ---------- Attach to window ----------
window.loadAppointments = loadAppointments;
window.loadLabRequests = loadLabRequests;