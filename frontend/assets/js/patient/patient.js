// patient/patient.js
import { apiFetch } from '../api.js';
import { logout, getCurrentUser } from '../auth.js';

function showError(msg) {
  const errEl = document.getElementById('errorMsg');
  if (errEl) {
    errEl.querySelector('span').textContent = msg;
    errEl.classList.add('show');
  }
}

function hideError() {
  const errEl = document.getElementById('errorMsg');
  if (errEl) errEl.classList.remove('show');
}

function displayList(containerId, items, renderFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-lg shadow-sm">
        <i class="fas fa-calendar-check text-5xl text-gray-300 mb-3 block"></i>
        <p class="text-gray-500 font-medium">No appointments found</p>
        <p class="text-sm text-gray-400">You haven't booked any appointments yet.</p>
      </div>
    `;
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

// ---------- Load appointments (professional card design) ----------
export async function loadAppointments() {
  try {
    const appointments = await apiFetch('/patient/appointments');
    displayList('appointmentList', appointments, (a) => {
      // Status badge configuration
      const statusConfig = {
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Pending' },
        confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Confirmed' },
        completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
        cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Cancelled' }
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

      // Doctor name & specialization
      const doctorName = a.doctorId?.name || 'N/A';
      const doctorSpecialization = a.doctorId?.specialization || '';

      return `
        <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden mb-4">
          <div class="p-4">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <!-- Left side: Doctor & details -->
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <i class="fas fa-user-md text-blue-600 text-lg"></i>
                  <span class="font-semibold text-gray-800">${doctorName}</span>
                  ${doctorSpecialization ? `<span class="text-sm text-gray-500">(${doctorSpecialization})</span>` : ''}
                </div>
                <div class="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span><i class="far fa-calendar-alt text-blue-400 mr-1"></i>${formattedDate}</span>
                  <span><i class="far fa-clock text-blue-400 mr-1"></i>${a.time}</span>
                  <span><i class="fas fa-building text-blue-400 mr-1"></i>${a.departmentId?.name || 'N/A'}</span>
                </div>
                ${a.reason ? `
                  <div class="mt-1 text-sm text-gray-600">
                    <i class="fas fa-comment-medical text-blue-400 mr-1"></i>Reason: ${a.reason}
                  </div>
                ` : ''}
                ${a.appointmentType ? `
                  <div class="text-sm text-gray-500">
                    <i class="fas fa-tag text-blue-400 mr-1"></i>Type: ${a.appointmentType.charAt(0).toUpperCase() + a.appointmentType.slice(1)}
                  </div>
                ` : ''}
                ${a.notes ? `
                  <div class="mt-1 text-sm text-gray-500">
                    <i class="fas fa-sticky-note text-gray-400 mr-1"></i>${a.notes}
                  </div>
                ` : ''}
              </div>

              <!-- Right side: Status & Actions -->
              <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div class="flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg}">
                  <span class="w-2 h-2 rounded-full ${config.dot}"></span>
                  <span class="text-xs font-medium ${config.text} capitalize">${config.label}</span>
                </div>
                ${a.status === 'pending' ? `
                  <div class="flex items-center gap-2">
                    <button onclick="openEditAppointmentModal('${a._id}')" 
                            class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 hover:underline">
                      <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="cancelAppointment('${a._id}')" 
                            class="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1 hover:underline">
                      <i class="fas fa-times"></i> Cancel
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    });
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
    document.getElementById('editReason').value = appointment.reason || '';
    document.getElementById('editAppointmentType').value = appointment.appointmentType || 'general';
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

// Handle edit form submission (with all fields)
document.getElementById('editAppointmentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editAppointmentId').value;
  const departmentId = document.getElementById('editDepartment').value;
  const doctorId = document.getElementById('editDoctor').value;
  const date = document.getElementById('editDate').value;
  const time = document.getElementById('editTime').value;
  const reason = document.getElementById('editReason').value;
  const appointmentType = document.getElementById('editAppointmentType').value;
  const notes = document.getElementById('editNotes').value;

  if (!departmentId || !doctorId || !date || !time) {
    showError('Please fill all required fields.');
    return;
  }

  try {
    await apiFetch(`/patient/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ departmentId, doctorId, date, time, reason, appointmentType, notes }),
    });
    closeEditAppointmentModal();
    loadAppointments();
    alert('Appointment updated!');
  } catch (err) {
    showError('Update failed: ' + err.message);
  }
});

// ---------- Load prescriptions (PROFESSIONAL DESIGN) ----------
export async function loadPrescriptions() {
  try {
    const prescriptions = await apiFetch('/patient/prescriptions');
    const container = document.getElementById('prescriptionList');
    if (!container) return;
    if (!prescriptions || prescriptions.length === 0) {
      container.innerHTML = `
        <div class="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-prescription-bottle text-3xl text-blue-400"></i>
          </div>
          <p class="text-gray-500 font-medium text-lg">No prescriptions yet</p>
          <p class="text-sm text-gray-400 mt-1">Your prescriptions will appear here once prescribed by a doctor.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = prescriptions.map((p, index) => {
      const doctorName = p.doctorId?.name || 'Unknown Doctor';
      const doctorSpecialization = p.doctorId?.specialization || '';
      const date = new Date(p.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      const time = new Date(p.date).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
      });

      // Build medicine list with professional design
      let medicinesHtml = '';
      if (p.medicines && p.medicines.length > 0) {
        medicinesHtml = p.medicines.map((m, idx) => {
          // Build schedule badges
          let scheduleBadges = '';
          if (m.times && m.times.length > 0) {
            const timeColors = {
              'Morning': 'bg-blue-100 text-blue-700',
              'Afternoon': 'bg-amber-100 text-amber-700',
              'Night': 'bg-indigo-100 text-indigo-700'
            };
            scheduleBadges += m.times.map(t => 
              `<span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium ${timeColors[t] || 'bg-gray-100 text-gray-600'}">${t}</span>`
            ).join(' ');
          }
          // Meal relation badge
          let mealBadge = '';
          if (m.mealRelation) {
            const mealColors = {
              'before meal': 'bg-green-100 text-green-700',
              'after meal': 'bg-orange-100 text-orange-700',
              'with meal': 'bg-purple-100 text-purple-700',
              'empty stomach': 'bg-rose-100 text-rose-700'
            };
            const mealLabels = {
              'before meal': 'Before meal',
              'after meal': 'After meal',
              'with meal': 'With meal',
              'empty stomach': 'Empty stomach'
            };
            mealBadge = `<span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium ${mealColors[m.mealRelation] || 'bg-gray-100 text-gray-600'}">${mealLabels[m.mealRelation] || m.mealRelation}</span>`;
          }
          // Duration & instructions
          let extraInfo = '';
          if (m.duration) extraInfo += `<span class="text-gray-500 text-xs"><i class="far fa-clock mr-1"></i>${m.duration}</span>`;
          if (m.instructions) extraInfo += `<span class="text-gray-500 text-xs"><i class="fas fa-info-circle mr-1"></i>${m.instructions}</span>`;

          return `
            <div class="flex items-start gap-3 py-2 ${idx < p.medicines.length - 1 ? 'border-b border-gray-100' : ''}">
              <div class="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-xs font-bold text-blue-600">${idx + 1}</span>
              </div>
              <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-semibold text-gray-800">${m.name}</span>
                  <span class="text-sm text-gray-500">${m.dosage || ''}</span>
                </div>
                <div class="flex flex-wrap items-center gap-1.5 mt-1">
                  ${scheduleBadges}
                  ${mealBadge}
                  ${extraInfo ? `<span class="text-gray-400 text-xs">·</span> ${extraInfo}` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        medicinesHtml = `
          <div class="text-gray-400 text-sm py-2">
            <i class="fas fa-info-circle mr-1"></i> No medicines listed
          </div>
        `;
      }

      // Prescription card with professional design - removed "Dr." prefix
      return `
        <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden mb-5">
          <!-- Header with gradient accent -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-gray-100">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  ${doctorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div class="font-semibold text-gray-800">${doctorName}</div>
                  ${doctorSpecialization ? `<div class="text-xs text-gray-500">${doctorSpecialization}</div>` : ''}
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-gray-700">${date}</div>
                <div class="text-xs text-gray-400">${time}</div>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="px-5 py-4">
            <!-- Diagnosis -->
            <div class="mb-3">
              <div class="flex items-center gap-2">
                <i class="fas fa-stethoscope text-blue-500 text-sm"></i>
                <span class="text-sm font-medium text-gray-600">Diagnosis</span>
              </div>
              <div class="mt-1 text-gray-800 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                ${p.diagnosis || 'N/A'}
              </div>
            </div>

            <!-- Medicines -->
            <div>
              <div class="flex items-center gap-2 mb-2">
                <i class="fas fa-pills text-emerald-500 text-sm"></i>
                <span class="text-sm font-medium text-gray-600">Medicines</span>
                ${p.medicines && p.medicines.length > 0 ? `<span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">${p.medicines.length}</span>` : ''}
              </div>
              <div class="bg-gray-50 rounded-lg border border-gray-100 px-3 py-2">
                ${medicinesHtml}
              </div>
            </div>
          </div>

          <!-- Footer with prescription ID -->
          <div class="bg-gray-50/50 px-5 py-2 border-t border-gray-100 flex justify-between items-center">
            <span class="text-xs text-gray-400">
              <i class="far fa-file-alt mr-1"></i> Prescription #${p._id ? p._id.slice(-6).toUpperCase() : 'N/A'}
            </span>
            <span class="text-xs text-gray-400">
              <i class="far fa-calendar-alt mr-1"></i> ${new Date(p.createdAt || p.date).toLocaleDateString()}
            </span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    showError('Failed to load prescriptions: ' + err.message);
  }
}

// ---------- Load medical history (PROFESSIONAL DESIGN) ----------
export async function loadMedicalHistory() {
  try {
    const history = await apiFetch('/patient/medical-history');
    const container = document.getElementById('historyList');
    if (!container) return;
    if (!history || !history.records || history.records.length === 0) {
      container.innerHTML = `
        <div class="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-notes-medical text-3xl text-blue-400"></i>
          </div>
          <p class="text-gray-500 font-medium text-lg">No medical history</p>
          <p class="text-sm text-gray-400 mt-1">Your medical history will appear here as you receive treatments.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = history.records.map((r, idx) => {
      const doctorName = r.doctorId?.name || 'Unknown Doctor';
      const date = new Date(r.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      const time = new Date(r.date).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
      });

      return `
        <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden mb-4">
          <!-- Header -->
          <div class="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-3 border-b border-gray-100">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  <i class="fas fa-user-md"></i>
                </div>
                <div>
                  <div class="font-semibold text-gray-800">${doctorName}</div>
                  <div class="text-xs text-gray-500">Medical Record #${idx + 1}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-gray-700">${date}</div>
                <div class="text-xs text-gray-400">${time}</div>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="px-5 py-4">
            <!-- Diagnosis -->
            <div class="mb-2">
              <div class="flex items-center gap-2">
                <i class="fas fa-stethoscope text-emerald-500 text-sm"></i>
                <span class="text-sm font-medium text-gray-600">Diagnosis</span>
              </div>
              <div class="mt-1 text-gray-800 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                ${r.diagnosis || 'N/A'}
              </div>
            </div>

            <!-- Additional details if available -->
            ${r.treatment ? `
              <div class="mt-3">
                <div class="flex items-center gap-2">
                  <i class="fas fa-notes-medical text-emerald-500 text-sm"></i>
                  <span class="text-sm font-medium text-gray-600">Treatment</span>
                </div>
                <div class="mt-1 text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  ${r.treatment}
                </div>
              </div>
            ` : ''}

            ${r.notes ? `
              <div class="mt-3">
                <div class="flex items-center gap-2">
                  <i class="fas fa-comment text-emerald-500 text-sm"></i>
                  <span class="text-sm font-medium text-gray-600">Notes</span>
                </div>
                <div class="mt-1 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 text-sm">
                  ${r.notes}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div class="bg-gray-50/50 px-5 py-2 border-t border-gray-100 flex justify-between items-center">
            <span class="text-xs text-gray-400">
              <i class="far fa-file-alt mr-1"></i> Record ID: ${r._id ? r._id.slice(-6).toUpperCase() : 'N/A'}
            </span>
            <span class="text-xs text-gray-400">
              <i class="far fa-calendar-alt mr-1"></i> ${new Date(r.createdAt || r.date).toLocaleDateString()}
            </span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    showError('Failed to load medical history: ' + err.message);
  }
}

// ---------- Payment: load appointments for dropdown ----------
export async function loadPaymentAppointments() {
  try {
    const appointments = await apiFetch('/patient/appointments');
    const select = document.getElementById('paymentAppointmentSelect');
    const hiddenInput = document.getElementById('paymentAppointmentId');
    if (!select) return;

    // Filter only pending or confirmed
    const valid = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');

    select.innerHTML = '<option value="">-- Select Appointment --</option>';
    valid.forEach(a => {
      const docName = a.doctorId?.name || 'Unknown';
      const date = new Date(a.date).toLocaleDateString();
      const time = a.time || '';
      select.innerHTML += `<option value="${a._id}">${docName} - ${date} ${time}</option>`;
    });

    select.onchange = function() {
      hiddenInput.value = this.value;
    };
  } catch (err) {
    showError('Failed to load appointments for payment: ' + err.message);
  }
}

// ---------- Load payment history (without "Dr." prefix) ----------
export async function loadPaymentHistory() {
  try {
    const payments = await apiFetch('/patient/payments');
    const container = document.getElementById('paymentHistoryList');
    if (!container) return;
    if (!payments || payments.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <p class="text-gray-500">No payment history found.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = payments.map(p => {
      const doctorName = p.appointmentId?.doctorId?.name || 'N/A';
      const date = new Date(p.createdAt).toLocaleDateString();
      const time = new Date(p.createdAt).toLocaleTimeString();
      return `
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <div>
              <div class="font-medium">${doctorName}</div>
              <div class="text-sm text-gray-500">Amount: ৳${p.amount}</div>
              <div class="text-sm text-gray-500">Method: ${p.method.toUpperCase()}</div>
              <div class="text-sm text-gray-500">Transaction ID: ${p.transactionId}</div>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-500">${date} ${time}</div>
              <span class="inline-block px-2 py-1 text-xs rounded-full ${p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">${p.status}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    // If endpoint not available, silently ignore
    console.warn('Payment history not available:', err);
  }
}

// ---------- Payment form submit (with duplicate check) ----------
document.getElementById('paymentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const hiddenId = document.getElementById('paymentAppointmentId');
  if (hiddenId) {
    data.appointmentId = hiddenId.value;
  }
  if (!data.appointmentId) {
    showError('Please select an appointment.');
    return;
  }

  // Check for duplicate transaction ID (frontend check)
  const txnId = data.transactionId;
  try {
    const existingPayments = await apiFetch('/patient/payments');
    const duplicate = existingPayments.some(p => p.transactionId === txnId);
    if (duplicate) {
      document.getElementById('duplicateTxnError').classList.add('show');
      return;
    } else {
      document.getElementById('duplicateTxnError').classList.remove('show');
    }
  } catch (err) {
    // If payment history API fails, proceed with backend check only
    console.warn('Frontend duplicate check skipped:', err);
  }

  try {
    const payment = await apiFetch('/patient/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Clear error
    document.getElementById('duplicateTxnError').classList.remove('show');
    alert(`Payment successful! Transaction ID: ${payment.transactionId}`);
    form.reset();
    document.getElementById('paymentAppointmentSelect').selectedIndex = 0;
    document.getElementById('paymentAppointmentId').value = '';
    // Reload payment history
    loadPaymentHistory();
  } catch (err) {
    if (err.message && err.message.includes('duplicate')) {
      document.getElementById('duplicateTxnError').classList.add('show');
    } else {
      showError('Payment failed: ' + err.message);
    }
  }
});

// ---------- Load Lab Requests (for Download Reports) ----------
export async function loadLabRequests() {
  try {
    const requests = await apiFetch('/patient/lab-requests');
    const container = document.getElementById('labRequestList');
    if (!container) return;
    if (!requests || requests.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 bg-white rounded-lg shadow-sm">
          <i class="fas fa-flask text-5xl text-gray-300 mb-3 block"></i>
          <p class="text-gray-500 font-medium">No lab requests found</p>
          <p class="text-sm text-gray-400">Your doctor hasn't requested any lab tests for you yet.</p>
        </div>
      `;
      return;
    }
    container.innerHTML = requests.map(r => {
      // ✅ Better handling: filter out empty/undefined values
      let testDisplay = 'N/A';
      if (r.testTypes && Array.isArray(r.testTypes) && r.testTypes.length > 0) {
        // Filter out falsy values (null, undefined, empty string)
        const validTests = r.testTypes.filter(t => t && t.trim() !== '');
        if (validTests.length > 0) {
          testDisplay = validTests.join(', ');
        } else if (r.testType) {
          testDisplay = r.testType;
        }
      } else if (r.testType) {
        testDisplay = r.testType;
      }

      const doctorName = r.doctorId?.name || 'Unknown Doctor';
      const statusColor = r.status === 'reported' ? 'text-emerald-600' : 'text-amber-600';
      return `
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3 hover:shadow-md transition-shadow">
          <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <div>
              <div class="font-medium text-gray-800">Test(s): ${testDisplay}</div>
              <div class="text-sm text-gray-500">Requested by: Dr. ${doctorName}</div>
              <div class="text-sm text-gray-500">Requested on: ${new Date(r.createdAt).toLocaleDateString()}</div>
              <div class="text-sm text-gray-500">Status: <span class="font-medium ${statusColor} capitalize">${r.status}</span></div>
              ${r.notes ? `<div class="text-sm text-gray-500 mt-1">Notes: ${r.notes}</div>` : ''}
              ${r.result ? `<div class="text-sm text-emerald-600 mt-1">Result: ${r.result}</div>` : ''}
            </div>
            <div>
              <div class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">ID: ${r._id}</div>
              <button onclick="window.copyToClipboard('${r._id}')" class="text-blue-600 hover:text-blue-800 text-sm mt-1 block">
                <i class="fas fa-copy"></i> Copy ID
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    showError('Failed to load lab requests: ' + err.message);
  }
}

// ---------- Copy to clipboard helper ----------
window.copyToClipboard = function(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Request ID copied to clipboard!');
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Request ID copied to clipboard!');
    });
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Request ID copied to clipboard!');
  }
};

// ---------- Download report ----------
window.downloadReport = async function(reportId) {
  if (!reportId) {
    showError('Please enter a Lab Request ID.');
    return;
  }
  try {
    const response = await apiFetch(`/patient/reports/download/${reportId}`);
    if (response.report) {
      alert(`Report: ${response.report}\nDate: ${response.reportDate || 'N/A'}`);
    } else {
      alert('No report content available for this ID.');
    }
  } catch (err) {
    showError('Failed to download report: ' + err.message);
  }
};

// ---------- Attach all load functions to window ----------
window.loadBookingOptions = loadBookingOptions;
window.loadAppointments = loadAppointments;
window.loadPrescriptions = loadPrescriptions;
window.loadMedicalHistory = loadMedicalHistory;
window.loadPaymentAppointments = loadPaymentAppointments;
window.loadPaymentHistory = loadPaymentHistory;
window.loadLabRequests = loadLabRequests;

