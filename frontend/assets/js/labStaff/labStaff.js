// labStaff/labStaff.js
import { apiFetch } from '../api.js';
import { logout, getCurrentUser } from '../auth.js';

function showError(msg) {
  document.getElementById('errorMsg').textContent = msg;
  document.getElementById('errorMsg').classList.remove('hidden');
}

function displayList(containerId, items, renderFn) {
  const container = document.getElementById(containerId);
  if (!items || items.length === 0) {
    container.innerHTML = '<p class="text-gray-500">No requests found.</p>';
    return;
  }
  container.innerHTML = items.map(renderFn).join('');
}

async function loadRequests() {
  try {
    const requests = await apiFetch('/labstaff/requests');
    displayList('requestList', requests, (r) => `
      <div class="border p-3 rounded mb-2">
        <div>
          <strong>Patient:</strong> ${r.patientId?.name || 'N/A'}<br>
          <strong>Doctor:</strong> ${r.doctorId?.name || 'N/A'}<br>
          <strong>Test:</strong> ${r.testType}<br>
          <span class="text-sm">Status: ${r.status}</span>
          ${r.result ? `<br><span class="text-sm">Result: ${r.result}</span>` : ''}
        </div>
        ${r.status !== 'reported' ? `
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
  } catch (err) {
    showError('Update failed: ' + err.message);
  }
};

// ---------- Initial load ----------
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (!user || user.role !== 'labstaff') {
    window.location.href = '../public/index.html';
    return;
  }
  document.getElementById('userName').textContent = user.name || user.email;
  loadRequests();
});