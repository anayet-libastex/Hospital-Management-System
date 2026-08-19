// doctor/doctor.js
import { apiFetch } from '../api.js';
import { logout, getCurrentUser } from '../auth.js';

function showError(msg) {
  const el = document.getElementById('errorMsg');
  if (el) {
    el.querySelector('span').textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 5000);
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
      const statusConfig = {
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
        confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
        completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' }
      };
      const status = a.status || 'pending';
      const config = statusConfig[status] || statusConfig.pending;

      const dateObj = new Date(a.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
      });

      const patientName = a.patientId?.name || 'Unknown';
      const initials = patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

      return `
        <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden mb-4">
          <div class="flex flex-col lg:flex-row lg:items-center p-4 gap-4">
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
                <button onclick="openPatientHistoryModal('${a._id}')" 
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

// ---------- Update status ----------
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

// ---------- Open Patient History Modal ----------
window.openPatientHistoryModal = async function(appointmentId) {
  try {
    const appointments = await apiFetch('/doctor/appointments');
    const appointment = appointments.find(a => a._id === appointmentId);
    if (!appointment) {
      showError('Appointment not found');
      return;
    }

    const patientId = appointment.patientId?._id;
    let historyData = { records: [] };
    if (patientId) {
      try {
        historyData = await apiFetch(`/doctor/patients/${patientId}/medical-history`);
      } catch (err) {
        if (err.message && err.message.includes('No medical history found')) {
          historyData = { records: [] };
        } else {
          console.warn('Failed to fetch medical history:', err);
        }
      }
    }

    const modalBody = document.getElementById('historyModalBody');
    const records = historyData.records || [];

    const patientName = appointment.patientId?.name || 'Unknown Patient';
    const deptName = appointment.departmentId?.name || 'N/A';
    const docName = appointment.doctorId?.name || 'N/A';
    const date = new Date(appointment.date).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
    const time = appointment.time || '';

    let historyHtml = `
      <div class="mb-4">
        <div class="section-title"><i class="fas fa-user mr-2"></i> Patient Details</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Name</span>
            <span class="value">${patientName}</span>
          </div>
          <div class="info-item">
            <span class="label">Department</span>
            <span class="value">${deptName}</span>
          </div>
          <div class="info-item">
            <span class="label">Doctor</span>
            <span class="value">${docName}</span>
          </div>
          <div class="info-item">
            <span class="label">Date & Time</span>
            <span class="value">${date} · ${time}</span>
          </div>
          ${appointment.reason ? `
            <div class="info-item">
              <span class="label">Reason</span>
              <span class="value">${appointment.reason}</span>
            </div>
          ` : ''}
          ${appointment.appointmentType ? `
            <div class="info-item">
              <span class="label">Type</span>
              <span class="value">${appointment.appointmentType.charAt(0).toUpperCase() + appointment.appointmentType.slice(1)}</span>
            </div>
          ` : ''}
          ${appointment.notes ? `
            <div class="info-item" style="grid-column: span 2;">
              <span class="label">Notes</span>
              <span class="value">${appointment.notes}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    let historyListHtml = '';
    if (records.length === 0) {
      historyListHtml = `<div class="empty-history">No previous medical records found.</div>`;
    } else {
      historyListHtml = records.map((rec, idx) => {
        const recDate = new Date(rec.date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        });
        const docNameHist = rec.doctorId?.name || 'Unknown Doctor';
        return `
          <div class="history-item">
            <div class="h-date">${recDate}</div>
            <div class="h-diagnosis">${rec.diagnosis || 'N/A'}</div>
            <div class="h-doctor"><i class="fas fa-user-md mr-1"></i> ${docNameHist}</div>
          </div>
        `;
      }).join('');
    }

    historyHtml += `
      <div class="mt-3">
        <div class="section-title"><i class="fas fa-notes-medical mr-2"></i> Medical History (${records.length} records)</div>
        <div class="history-list">
          ${historyListHtml}
        </div>
      </div>
    `;

    modalBody.innerHTML = historyHtml;
    document.getElementById('patientHistoryModal').classList.add('active');
  } catch (err) {
    showError('Failed to load patient history: ' + err.message);
  }
};

// ---------- close history modal ----------
window.closeHistoryModal = function() {
  document.getElementById('patientHistoryModal').classList.remove('active');
};

// ---------- Load lab patients (for dropdown) ----------
window.loadLabPatients = async function() {
  try {
    const appointments = await apiFetch('/doctor/appointments');
    const patientMap = new Map();
    appointments.forEach(a => {
      if (a.patientId && a.patientId._id) {
        if (!patientMap.has(a.patientId._id)) {
          patientMap.set(a.patientId._id, {
            _id: a.patientId._id,
            name: a.patientId.name || 'Unknown'
          });
        }
      }
    });
    const patients = Array.from(patientMap.values());

    const select = document.getElementById('labPatientSelect');
    const hiddenInput = document.getElementById('labPatientId');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select Patient --</option>';
    patients.forEach(p => {
      select.innerHTML += `<option value="${p._id}">${p.name}</option>`;
    });

    select.onchange = function() {
      hiddenInput.value = this.value;
    };
  } catch (err) {
    showError('Failed to load patients: ' + err.message);
  }
};

// ---------- Lab request form submit ----------
document.getElementById('createLabRequestForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  const hiddenId = document.getElementById('labPatientId');
  if (hiddenId) {
    data.patientId = hiddenId.value;
  }
  if (!data.patientId) {
    showError('Please select a patient.');
    return;
  }

  try {
    await apiFetch('/doctor/lab-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    form.reset();
    document.getElementById('labPatientSelect').selectedIndex = 0;
    document.getElementById('labPatientId').value = '';
    loadLabRequests();
    alert('Lab request sent successfully!');
  } catch (err) {
    showError('Lab request failed: ' + err.message);
  }
});

// ---------- Load lab requests ----------
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

// ---------- Prescription (আপডেটেড – ডিবাগ লগসহ) ----------
document.getElementById('createPrescriptionForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  console.log('📤 Sending prescription data:', data);

  try {
    const response = await apiFetch('/doctor/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    console.log('✅ Server response:', response);
    form.reset();
    // Reset medicine list (if function exists)
    if (typeof window.resetPrescriptionForm === 'function') {
      window.resetPrescriptionForm();
    }
    alert('Prescription created successfully!');
    // Reload appointments to update status if needed
    if (typeof loadAppointments === 'function') loadAppointments();
  } catch (err) {
    console.error('❌ Prescription error:', err);
    showError('Create prescription failed: ' + err.message);
  }
});

// ---------- Attach to window ----------
window.loadAppointments = loadAppointments;
window.loadLabRequests = loadLabRequests;
window.loadLabPatients = loadLabPatients;
window.openPatientHistoryModal = openPatientHistoryModal;
window.closeHistoryModal = closeHistoryModal;
window.updateStatus = updateStatus;

