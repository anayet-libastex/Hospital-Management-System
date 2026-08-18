// labStaff/labStaff.js
import { apiFetch } from '../api.js';

function showError(msg) {
  const el = document.getElementById('errorMsg');
  if (el) {
    el.querySelector('span').textContent = msg;
    el.classList.add('show');
  }
}

function displayList(containerId, items, renderFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-lg shadow-sm">
        <i class="fas fa-flask text-5xl text-gray-300 mb-3 block"></i>
        <p class="text-gray-500 font-medium">No requests found</p>
        <p class="text-sm text-gray-400">You have no lab requests assigned or pending.</p>
      </div>
    `;
    return;
  }
  container.innerHTML = items.map(renderFn).join('');
}

export async function loadRequests() {
  try {
    const requests = await apiFetch('/labstaff/requests');
    displayList('requestList', requests, (r) => {
      // Determine test display
      let testDisplay = 'N/A';
      if (r.testTypes && Array.isArray(r.testTypes) && r.testTypes.length > 0) {
        const validTests = r.testTypes.filter(t => t && t.trim() !== '');
        testDisplay = validTests.length > 0 ? validTests.join(', ') : 'N/A';
      } else if (r.testType) {
        testDisplay = r.testType;
      }

      const isAssigned = r.labStaffId ? true : false;
      const canReport = (isAssigned && r.status !== 'reported' && r.status !== 'completed');

      // Build test result input fields for each test
      let resultInputsHtml = '';
      if (canReport && r.testTypes && r.testTypes.length > 0) {
        resultInputsHtml = r.testTypes.map((testName, idx) => `
          <div class="flex items-center gap-2 mt-2">
            <span class="text-sm font-medium text-gray-700 w-1/3">${testName}:</span>
            <input type="text" id="result_${r._id}_${idx}" placeholder="Enter result for ${testName}" class="input-field text-sm flex-1" />
          </div>
        `).join('');
      } else if (canReport) {
        // fallback if no testTypes array but has testType
        resultInputsHtml = `
          <div class="flex items-center gap-2 mt-2">
            <span class="text-sm font-medium text-gray-700 w-1/3">Result:</span>
            <input type="text" id="result_${r._id}_0" placeholder="Enter result" class="input-field text-sm flex-1" />
          </div>
        `;
      }

      const statusClass = r.status === 'reported' ? 'badge-reported' :
                          r.status === 'completed' ? 'badge-completed' : 'badge-pending';

      return `
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3 hover:shadow-md transition-shadow">
          <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
            <div class="flex-1">
              <div class="font-medium text-gray-800">Patient: ${r.patientId?.name || 'N/A'}</div>
              <div class="text-sm text-gray-600">Doctor: ${r.doctorId?.name || 'N/A'}</div>
              <div class="text-sm text-gray-600">Test(s): ${testDisplay}</div>
              <div class="text-sm text-gray-500">Status: <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusClass} capitalize">${r.status}</span></div>
              ${r.testResults && r.testResults.length > 0 ? `
                <div class="mt-1 text-sm text-gray-600">
                  <span class="font-medium">Results:</span>
                  ${r.testResults.map(tr => `${tr.testName}: ${tr.result || 'N/A'}`).join(' | ')}
                </div>
              ` : ''}
              ${r.notes ? `<div class="text-sm text-gray-500 mt-1">Notes: ${r.notes}</div>` : ''}
            </div>
            <div class="flex flex-col items-end gap-2">
              ${!isAssigned && r.status === 'pending' ? `
                <button onclick="assignToMe('${r._id}')" class="btn-success text-sm px-3 py-1 rounded">
                  <i class="fas fa-user-check"></i> Assign to Me
                </button>
              ` : ''}
              ${canReport ? `
                <div class="w-full">
                  <div class="bg-gray-50 p-3 rounded border border-gray-200">
                    <div class="text-sm font-medium text-gray-700 mb-2">Submit Results</div>
                    ${resultInputsHtml}
                    <button onclick="submitResults('${r._id}')" class="btn-primary text-sm px-4 py-1 rounded mt-3 w-full">
                      <i class="fas fa-check"></i> Submit All Results
                    </button>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    showError('Failed to load requests: ' + err.message);
  }
}

// Assign to me
window.assignToMe = async function(id) {
  try {
    await apiFetch(`/labstaff/requests/${id}/assign`, { method: 'PUT' });
    loadRequests();
  } catch (err) {
    showError('Assignment failed: ' + err.message);
  }
};

// Submit results for each test
window.submitResults = async function(id) {
  // Gather test results from input fields
  const request = await apiFetch('/labstaff/requests');
  const reqData = request.find(r => r._id === id);
  if (!reqData) {
    showError('Request not found');
    return;
  }

  const testNames = reqData.testTypes || [];
  const testResults = [];

  if (testNames.length > 0) {
    testNames.forEach((testName, idx) => {
      const input = document.getElementById(`result_${id}_${idx}`);
      if (input) {
        testResults.push({
          testName: testName,
          result: input.value.trim(),
        });
      }
    });
  } else {
    // Fallback: single result field
    const input = document.getElementById(`result_${id}_0`);
    if (input) {
      testResults.push({
        testName: reqData.testType || 'Test',
        result: input.value.trim(),
      });
    }
  }

  // Check if all results are filled (optional: can be made non-mandatory)
  const hasEmpty = testResults.some(tr => !tr.result);
  if (hasEmpty) {
    if (!confirm('Some results are empty. Do you want to submit anyway?')) {
      return;
    }
  }

  try {
    await apiFetch(`/labstaff/requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ testResults, status: 'reported' }),
    });
    loadRequests();
    loadReports();
    alert('Results submitted successfully!');
  } catch (err) {
    showError('Submission failed: ' + err.message);
  }
};

// Load reports (unchanged)
export async function loadReports() {
  try {
    const reports = await apiFetch('/labstaff/reports');
    const container = document.getElementById('reportList');
    if (!container) return;
    if (!reports || reports.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 bg-white rounded-lg shadow-sm">
          <i class="fas fa-file-alt text-5xl text-gray-300 mb-3 block"></i>
          <p class="text-gray-500 font-medium">No reports found</p>
          <p class="text-sm text-gray-400">You haven't generated any reports yet.</p>
        </div>
      `;
      return;
    }
    container.innerHTML = reports.map((r) => {
      let testDisplay = 'N/A';
      if (r.testTypes && Array.isArray(r.testTypes) && r.testTypes.length > 0) {
        const validTests = r.testTypes.filter(t => t && t.trim() !== '');
        testDisplay = validTests.length > 0 ? validTests.join(', ') : 'N/A';
      } else if (r.testType) {
        testDisplay = r.testType;
      }
      return `
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3 hover:shadow-md transition-shadow">
          <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
            <div>
              <div class="font-medium text-gray-800">Patient: ${r.patientId?.name || 'N/A'}</div>
              <div class="text-sm text-gray-600">Doctor: ${r.doctorId?.name || 'N/A'}</div>
              <div class="text-sm text-gray-600">Test(s): ${testDisplay}</div>
              <div class="text-sm text-gray-500">Reported on: ${new Date(r.reportDate).toLocaleDateString()}</div>
              ${r.testResults && r.testResults.length > 0 ? `
                <div class="mt-1 text-sm text-gray-600">
                  <span class="font-medium">Results:</span>
                  ${r.testResults.map(tr => `${tr.testName}: ${tr.result || 'N/A'}`).join(' | ')}
                </div>
              ` : r.result ? `
                <div class="text-sm text-emerald-600 mt-1">Result: ${r.result}</div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    showError('Failed to load reports: ' + err.message);
  }
}

// Attach to window
window.loadRequests = loadRequests;
window.loadReports = loadReports;
window.assignToMe = assignToMe;
window.submitResults = submitResults;

