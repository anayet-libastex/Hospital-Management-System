// patient/patient.js
import { apiFetch } from '../api.js';
import { logout, getCurrentUser } from '../auth.js';

function showError(msg) {
  const errEl = document.getElementById('errorMsg');
  if (errEl) { errEl.textContent = msg; errEl.classList.remove('hidden'); }
}

function hideError() {
  const errEl = document.getElementById('errorMsg');
  if (errEl) errEl.classList.add('hidden');
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
let allDoctors = [];

export async function loadBookingOptions() {
  try {
    const [depts, doctors] = await Promise.all([
      apiFetch('/departments'),
      apiFetch('/doctors')
    ]);
    allDoctors = doctors;

    const deptSelect = document.getElementById('bookingDepartment');
    const docSelect = document.getElementById('bookingDoctor');
    
    if (deptSelect) {
      deptSelect.innerHTML = '<option value="">Select Department</option>' + 
        depts.map(d => `<option value="${d._id}">${d.name}</option>`).join('');
    }

    updateDoctorDropdown(allDoctors, false);

    if (deptSelect) {
      deptSelect.addEventListener('change', function() {
        const selectedDept = this.value;
        if (selectedDept) {
          const filtered = allDoctors.filter(doc => doc.departmentId?._id === selectedDept);
          updateDoctorDropdown(filtered, true);
        } else {
          updateDoctorDropdown(allDoctors, false);
        }
      });
    }

    // Also populate edit modal dropdowns
    populateEditDropdowns();

  } catch (err) {
    showError('Failed to load booking options: ' + err.message);
  }
}

function updateDoctorDropdown(doctors, selectFirst = false) {
  const docSelect = document.getElementById('bookingDoctor');
  if (!docSelect) return;
  
  if (!doctors || doctors.length === 0) {
    docSelect.innerHTML = '<option value="">No doctors available</option>';
    return;
  }

  const options = '<option value="">Select Doctor</option>' + 
    doctors.map(d => `<option value="${d._id}">${d.name} (${d.specialization})</option>`).join('');
  docSelect.innerHTML = options;

  if (selectFirst && doctors.length > 0) {
    docSelect.value = doctors[0]._id;
  }
}

// Populate edit modal department & doctor dropdowns
async function populateEditDropdowns() {
  try {
    const [depts, doctors] = await Promise.all([
      apiFetch('/departments'),
      apiFetch('/doctors')
    ]);
    const deptSelect = document.getElementById('editDepartment');
    const docSelect = document.getElementById('editDoctor');
    if (deptSelect) {
      deptSelect.innerHTML = '<option value="">Select Department</option>' + 
        depts.map(d => `<option value="${d._id}">${d.name}</option>`).join('');
    }
    if (docSelect) {
      docSelect.innerHTML = '<option value="">Select Doctor</option>' + 
        doctors.map(d => `<option value="${d._id}">${d.name} (${d.specialization})</option>`).join('');
    }
  } catch (err) {
    console.warn('Failed to populate edit dropdowns:', err);
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
    // Refresh appointments list after booking
    await loadAppointments();
    alert('Appointment booked!');
  } catch (err) {
    showError('Booking failed: ' + err.message);
  }
});

// ---------- Load appointments (with Edit & Cancel buttons) ----------
export async function loadAppointments() {
  try {
    const appointments = await apiFetch('/patient/appointments');
    console.log('Appointments loaded:', appointments); // debug
    displayList('appointmentList', appointments, (a) => `
      <div class="border p-3 rounded mb-2">
        <div class="flex justify-between items-start">
          <div>
            <strong>Dr.</strong> ${a.doctorId?.name || 'N/A'} (${a.doctorId?.specialization || ''})<br>
            <span class="text-sm">${new Date(a.date).toLocaleDateString()} at ${a.time}</span><br>
            <span class="text-sm">Status: <span class="font-medium ${a.status === 'pending' ? 'text-yellow-600' : a.status === 'confirmed' ? 'text-blue-600' : a.status === 'completed' ? 'text-green-600' : 'text-red-600'}">${a.status}</span></span>
            ${a.notes ? `<br><span class="text-sm text-gray-500">Notes: ${a.notes}</span>` : ''}
          </div>
          <div class="flex gap-2">
            ${a.status === 'pending' ? `
              <button onclick="openEditAppointmentModal('${a._id}')" class="text-blue-600 hover:text-blue-800 text-sm">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button onclick="cancelAppointment('${a._id}')" class="text-red-600 hover:text-red-800 text-sm">
                <i class="fas fa-times"></i> Cancel
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load appointments: ' + err.message);
  }
}

// ---------- Cancel appointment ----------
window.cancelAppointment = async function(id) {
  if (!confirm('Cancel this appointment?')) return;
  try {
    await apiFetch(`/patient/appointments/${id}`, { method: 'DELETE' });
    loadAppointments();
    alert('Appointment cancelled.');
  } catch (err) {
    showError('Cancel failed: ' + err.message);
  }
};

// ---------- Edit Appointment Modal ----------
window.openEditAppointmentModal = async function(id) {
  try {
    // Fetch appointment details
    const appointment = await apiFetch(`/patient/appointments/${id}`);
    // Populate modal fields
    document.getElementById('editAppointmentId').value = appointment._id;
    document.getElementById('editDepartment').value = appointment.departmentId || '';
    document.getElementById('editDoctor').value = appointment.doctorId || '';
    document.getElementById('editDate').value = appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : '';
    document.getElementById('editTime').value = appointment.time || '';
    document.getElementById('editNotes').value = appointment.notes || '';
    // Show modal
    document.getElementById('editAppointmentModal').classList.add('active');
  } catch (err) {
    showError('Failed to load appointment details: ' + err.message);
  }
};

window.closeEditAppointmentModal = function() {
  document.getElementById('editAppointmentModal').classList.remove('active');
};

// Handle edit form submission
document.getElementById('editAppointmentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editAppointmentId').value;
  const departmentId = document.getElementById('editDepartment').value;
  const doctorId = document.getElementById('editDoctor').value;
  const date = document.getElementById('editDate').value;
  const time = document.getElementById('editTime').value;
  const notes = document.getElementById('editNotes').value;

  if (!departmentId || !doctorId || !date || !time) {
    showError('Please fill all required fields.');
    return;
  }

  try {
    await apiFetch(`/patient/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ departmentId, doctorId, date, time, notes }),
    });
    closeEditAppointmentModal();
    loadAppointments();
    alert('Appointment updated!');
  } catch (err) {
    showError('Update failed: ' + err.message);
  }
});

// ---------- Load prescriptions ----------
export async function loadPrescriptions() {
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
export async function loadMedicalHistory() {
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
    alert(`Report: ${response.report || 'No content'}\nDate: ${response.reportDate || 'N/A'}`);
  } catch (err) {
    showError('Failed to download report: ' + err.message);
  }
};

// ---------- Attach all load functions to window ----------
window.loadBookingOptions = loadBookingOptions;
window.loadAppointments = loadAppointments;
window.loadPrescriptions = loadPrescriptions;
window.loadMedicalHistory = loadMedicalHistory;