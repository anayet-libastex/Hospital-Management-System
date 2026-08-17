// labStaff/labStaff.js
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
    container.innerHTML = '<p class="text-gray-500">No items found.</p>';
    return;
  }
  container.innerHTML = items.map(renderFn).join('');
}

// ---------- Load assigned requests ----------
export async function loadRequests() {
  try {
    const requests = await apiFetch('/labstaff/requests');
    displayList('requestList', requests, (r) => `
      <div class="border p-3 rounded mb-2">
        <div>
          <strong>Patient:</strong> ${r.patientId?.name || 'N/A'}<br>
          <strong>Doctor:</strong> ${r.doctorId?.name || 'N/A'}<br>
          <strong>Test:</strong> ${r.testType}<br>
          <span class="text-sm">Status: 
            <span class="badge-${r.status}">${r.status}</span>
          </span>
          ${r.result ? `<br><span class="text-sm">Result: ${r.result}</span>` : ''}
        </div>
        ${r.status !== 'reported' && r.status !== 'completed' ? `
          <div class="mt-2">
            <input type="text" id="result_${r._id}" placeholder="Enter result" class="border rounded px-2 py-1 text-sm w-full" />
            <button onclick="updateRequest('${r._id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm mt-1">
              Submit Result
            </button>
          </div>
        ` : ''}
      </div>
    `);
  } catch (err) {
    showError('Failed to load requests: ' + err.message);
  }
}

// ---------- Submit result and update status ----------
window.updateRequest = async function(id) {
  const resultInput = document.getElementById(`result_${id}`);
  if (!resultInput) return;
  const result = resultInput.value.trim();
  if (!result) {
    alert('Please enter a result.');
    return;
  }
  try {
    await apiFetch(`/labstaff/requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'reported', result }),
    });
    loadRequests();
    loadReports(); // Also refresh reports list
  } catch (err) {
    showError('Update failed: ' + err.message);
  }
};

// ---------- Load reports (reported requests) ----------
export async function loadReports() {
  try {
    const reports = await apiFetch('/labstaff/reports');
    displayList('reportList', reports, (r) => `
      <div class="border p-3 rounded mb-2">
        <div>
          <strong>Patient:</strong> ${r.patientId?.name || 'N/A'}<br>
          <strong>Doctor:</strong> ${r.doctorId?.name || 'N/A'}<br>
          <strong>Test:</strong> ${r.testType}<br>
          <span class="text-sm">Reported on: ${new Date(r.reportDate).toLocaleDateString()}</span><br>
          <span class="text-sm">Result: ${r.result || 'N/A'}</span>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load reports: ' + err.message);
  }
}

// ---------- Attach to window for inline script ----------
window.loadRequests = loadRequests;
window.loadReports = loadReports;

// ---------- No automatic load – HTML will handle ----------