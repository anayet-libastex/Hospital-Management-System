// patient/patient.js
import { apiFetch } from '../api.js';
import { logout, getCurrentUser } from '../auth.js';

function showError(msg) {
  const errEl = document.getElementById('errorMsg');
  if (errEl) { errEl.textContent = msg; errEl.classList.remove('hidden'); }
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

// ---------- Load departments & doctors for booking ----------
async function loadBookingOptions() {
  try {
    const [depts, doctors] = await Promise.all([
      apiFetch('/departments'),
      apiFetch('/doctors')
    ]);
    const deptSelect = document.getElementById('bookingDepartment');
    const docSelect = document.getElementById('bookingDoctor');
    if (deptSelect) {
      deptSelect.innerHTML = depts.map(d => `<option value="${d._id}">${d.name}</option>`).join('');
    }
    if (docSelect) {
      docSelect.innerHTML = doctors.map(d => `<option value="${d._id}">${d.name} (${d.specialization})</option>`).join('');
    }
  } catch (err) {
    showError('Failed to load booking options: ' + err.message);
  }
}

// ---------- Book appointment ----------
document.getElementById('bookAppointmentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  try {
    await apiFetch('/patient/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    form.reset();
    loadAppointments();
    alert('Appointment booked!');
  } catch (err) {
    showError('Booking failed: ' + err.message);
  }
});

// ---------- Load appointments ----------
async function loadAppointments() {
  try {
    const appointments = await apiFetch('/patient/appointments');
    displayList('appointmentList', appointments, (a) => `
      <div class="border p-3 rounded mb-2 flex justify-between items-center">
        <div>
          <strong>Dr.</strong> ${a.doctorId?.name || 'N/A'} (${a.doctorId?.specialization || ''})<br>
          <span class="text-sm">${a.date} at ${a.time}</span><br>
          <span class="text-sm">Status: <span class="font-medium">${a.status}</span></span>
        </div>
        ${a.status === 'pending' ? `
          <button onclick="cancelAppointment('${a._id}')" class="text-red-600 hover:text-red-800">Cancel</button>
        ` : ''}
      </div>
    `);
  } catch (err) {
    showError('Failed to load appointments: ' + err.message);
  }
}

window.cancelAppointment = async function(id) {
  if (!confirm('Cancel this appointment?')) return;
  try {
    await apiFetch(`/patient/appointments/${id}`, { method: 'DELETE' });
    loadAppointments();
  } catch (err) {
    showError('Cancel failed: ' + err.message);
  }
};

// ---------- Load prescriptions ----------
async function loadPrescriptions() {
  try {
    const prescriptions = await apiFetch('/patient/prescriptions');
    displayList('prescriptionList', prescriptions, (p) => `
      <div class="border p-3 rounded mb-2">
        <div>
          <strong>Dr.</strong> ${p.doctorId?.name || 'N/A'}<br>
          <span class="text-sm">Diagnosis: ${p.diagnosis || 'N/A'}</span><br>
          <span class="text-sm">Medicines:</span>
          <ul class="list-disc ml-4 text-sm">
            ${p.medicines.map(m => `<li>${m.name} ${m.dosage || ''} ${m.duration || ''}</li>`).join('')}
          </ul>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load prescriptions: ' + err.message);
  }
}

// ---------- Load medical history ----------
async function loadMedicalHistory() {
  try {
    const history = await apiFetch('/patient/medical-history');
    const container = document.getElementById('historyList');
    if (!container) return;
    if (!history || !history.records || history.records.length === 0) {
      container.innerHTML = '<p class="text-gray-500">No medical history found.</p>';
      return;
    }
    container.innerHTML = history.records.map((r, idx) => `
      <div class="border p-3 rounded mb-2">
        <div>
          <span class="font-medium">${new Date(r.date).toLocaleDateString()}</span><br>
          <span class="text-sm">Diagnosis: ${r.diagnosis || 'N/A'}</span><br>
          <span class="text-sm">Treatment: ${r.treatment || 'N/A'}</span><br>
          <span class="text-sm">Dr. ${r.doctorId?.name || 'Unknown'}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    showError('Failed to load medical history: ' + err.message);
  }
}

// ---------- Payment ----------
document.getElementById('paymentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  try {
    const payment = await apiFetch('/patient/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    alert(`Payment successful! Transaction ID: ${payment.transactionId}`);
    form.reset();
  } catch (err) {
    showError('Payment failed: ' + err.message);
  }
});

// ---------- Download report ----------
window.downloadReport = async function(reportId) {
  try {
    const response = await apiFetch(`/patient/reports/download/${reportId}`);
    // For demo, show report in alert
    alert(`Report: ${response.report || 'No content'}\nDate: ${response.reportDate || 'N/A'}`);
  } catch (err) {
    showError('Failed to download report: ' + err.message);
  }
};

// (Optional) Load lab reports for patient – we can list lab requests where patient is involved.
async function loadLabReports() {
  // We don't have a direct endpoint for patient to get lab reports, but we can reuse lab requests.
  // For simplicity, we'll fetch all lab requests for the patient? We don't have that endpoint.
  // We'll skip for now.
}

// ---------- Tab switching ----------
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');
  if (tabId === 'tabAppointments') loadAppointments();
  else if (tabId === 'tabPrescriptions') loadPrescriptions();
  else if (tabId === 'tabHistory') loadMedicalHistory();
  else if (tabId === 'tabBooking') loadBookingOptions();
  // No need to load other tabs automatically.
}

window.switchTab = switchTab;

// ---------- Initial load ----------
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (!user || user.role !== 'patient') {
    window.location.href = '../public/index.html';
    return;
  }
  document.getElementById('userName').textContent = user.name || user.email;
  // Load default tab (appointments)
  switchTab('tabAppointments');
});