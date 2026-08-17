// admin/admin.js
import { apiFetch } from "../api.js";
import { getCurrentUser } from "../auth.js";

// ---------- Helpers ----------
function showError(msg) {
  const el = document.getElementById("errorMsg");
  if (el) {
    el.querySelector("span").textContent = msg;
    el.classList.add("show");
  }
}

function hideError() {
  const el = document.getElementById("errorMsg");
  if (el) el.classList.remove("show");
}

function displayList(containerId, items, renderFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!items || items.length === 0) {
    container.innerHTML = '<p class="text-gray-500">No items found.</p>';
    return;
  }
  container.innerHTML = items.map(renderFn).join("");
}

// =====================================================
//  সময় ফরম্যাট কনভার্টার
// =====================================================
function convertTo12Hour(timeStr) {
  if (!timeStr) return '';
  if (/AM|PM/i.test(timeStr)) return timeStr;
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

// =====================================================
//  1. ডিপার্টমেন্ট ড্রপডাউন লোড
// =====================================================
export async function loadDepartmentDropdowns() {
  try {
    const departments = await apiFetch("/admin/departments");
    const selects = ["doctorDeptSelect", "staffDeptSelect", "userDeptSelect"];
    selects.forEach((id) => {
      const select = document.getElementById(id);
      if (!select) return;
      select.innerHTML = '<option value="">Select Department</option>';
      departments.forEach((dept) => {
        const option = document.createElement("option");
        option.value = dept._id;
        option.textContent = dept.name;
        select.appendChild(option);
      });
    });
  } catch (err) {
    showError("Failed to load departments: " + err.message);
  }
}

// =====================================================
//  2. ডিপার্টমেন্ট হেড ড্রপডাউন লোড
// =====================================================
export async function loadDeptHeadDropdown() {
  try {
    const doctors = await apiFetch("/admin/doctors");
    const selects = ["headDoctorSelect", "deptHeadSelect", "editDeptHead"];
    selects.forEach((id) => {
      const select = document.getElementById(id);
      if (!select) return;
      select.innerHTML = '<option value="">Select Head Doctor (optional)</option>';
      doctors.forEach((doc) => {
        const option = document.createElement("option");
        option.value = doc._id;
        option.textContent = `${doc.name} (${doc.specialization})`;
        select.appendChild(option);
      });
    });
  } catch (err) {
    showError("Failed to load head doctors: " + err.message);
  }
}

// =====================================================
//  3. রিপোর্ট লোড
// =====================================================
export async function loadReports() {
  try {
    const stats = await apiFetch("/admin/reports");
    document.getElementById("totalPatients").textContent = stats.totalPatients || 0;
    document.getElementById("totalDoctors").textContent = stats.totalDoctors || 0;
    document.getElementById("totalStaff").textContent = stats.totalStaff || 0;
    document.getElementById("totalDepartments").textContent = stats.totalDepartments || 0;
    document.getElementById("totalAppointments").textContent = stats.totalAppointments || 0;
  } catch (err) {
    showError("Failed to load reports: " + err.message);
  }
}

// =====================================================
//  4. ডক্টর লোড
// =====================================================
export async function loadDoctors() {
  try {
    const doctors = await apiFetch("/admin/doctors");
    displayList(
      "doctorList",
      doctors,
      (doc) => {
        const schedule = doc.schedule || {};
        const days = schedule.days?.join(', ') || 'N/A';
        const start = convertTo12Hour(schedule.startTime || '');
        const end = convertTo12Hour(schedule.endTime || '');
        return `
          <div class="list-item">
            <div>
              <strong>${doc.name}</strong> (${doc.specialization})<br>
              <span class="text-sm text-gray-600">Email: ${doc.email}</span><br>
              <span class="text-sm text-gray-600">Department: ${doc.departmentId?.name || 'N/A'}</span><br>
              <span class="text-sm text-gray-600">Qualification: ${doc.qualification || 'N/A'}</span><br>
              <span class="text-sm text-gray-600">Phone: ${doc.phone || 'N/A'}</span><br>
              <span class="text-sm text-gray-600">Address: ${doc.address || 'N/A'}</span><br>
              <span class="text-sm text-gray-600">Schedule: ${days} ${start ? `(${start} - ${end})` : ''}</span>
            </div>
            <div>
              <button onclick="openEditModalForDoctor('${doc._id}')" class="btn-warning mr-1">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="deleteDoctor('${doc._id}')" class="btn-danger">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      },
    );
  } catch (err) {
    showError("Failed to load doctors: " + err.message);
  }
}

window.deleteDoctor = async function (id) {
  if (!confirm("Delete this doctor?")) return;
  try {
    await apiFetch(`/admin/doctors/${id}`, { method: "DELETE" });
    loadDoctors();
    loadDeptHeadDropdown();
  } catch (err) {
    showError("Delete failed: " + err.message);
  }
};

// =====================================================
//  ডক্টর এডিট
// =====================================================
window.openEditModalForDoctor = async function (id) {
  try {
    const doctor = await apiFetch(`/admin/doctors/${id}`);
    await loadDepartmentDropdownsForModal('editDoctorDepartment');
    document.getElementById('editDoctorId').value = doctor._id;
    document.getElementById('editDoctorName').value = doctor.name || '';
    document.getElementById('editDoctorEmail').value = doctor.email || '';
    document.getElementById('editDoctorSpecialization').value = doctor.specialization || '';
    document.getElementById('editDoctorQualification').value = doctor.qualification || '';
    document.getElementById('editDoctorPhone').value = doctor.phone || '';
    document.getElementById('editDoctorAddress').value = doctor.address || '';
    const schedule = doctor.schedule || {};
    document.getElementById('editDoctorScheduleDays').value = schedule.days?.join(', ') || '';
    document.getElementById('editDoctorScheduleStart').value = schedule.startTime || '';
    document.getElementById('editDoctorScheduleEnd').value = schedule.endTime || '';
    const deptSelect = document.getElementById('editDoctorDepartment');
    deptSelect.value = doctor.departmentId?._id || doctor.departmentId || '';
    document.getElementById('editDoctorModal').classList.add('active');
  } catch (err) {
    showError('Failed to load doctor details: ' + err.message);
  }
};

async function loadDepartmentDropdownsForModal(selectId) {
  try {
    const departments = await apiFetch('/admin/departments');
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Select Department</option>';
    departments.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept._id;
      option.textContent = dept.name;
      select.appendChild(option);
    });
  } catch (err) {
    showError('Failed to load departments for modal: ' + err.message);
  }
}

document.getElementById('editDoctorForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editDoctorId').value;
  const name = document.getElementById('editDoctorName').value.trim();
  const email = document.getElementById('editDoctorEmail').value.trim();
  const specialization = document.getElementById('editDoctorSpecialization').value.trim();
  const departmentId = document.getElementById('editDoctorDepartment').value;
  const qualification = document.getElementById('editDoctorQualification').value.trim();
  const phone = document.getElementById('editDoctorPhone').value.trim();
  const address = document.getElementById('editDoctorAddress').value.trim();
  const scheduleDays = document.getElementById('editDoctorScheduleDays').value.trim();
  const scheduleStart = document.getElementById('editDoctorScheduleStart').value;
  const scheduleEnd = document.getElementById('editDoctorScheduleEnd').value;
  const schedule = {};
  if (scheduleDays) schedule.days = scheduleDays.split(',').map(d => d.trim());
  if (scheduleStart) schedule.startTime = scheduleStart;
  if (scheduleEnd) schedule.endTime = scheduleEnd;

  if (!name || !specialization || !departmentId) {
    showError('Name, Specialization, and Department are required.');
    return;
  }

  try {
    await apiFetch(`/admin/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, email, specialization, departmentId, qualification, phone, address, schedule }),
    });
    document.getElementById('editDoctorModal').classList.remove('active');
    loadDoctors();
    loadDeptHeadDropdown();
    hideError();
  } catch (err) {
    showError('Update failed: ' + err.message);
  }
});

window.closeEditDoctorModal = function () {
  document.getElementById('editDoctorModal').classList.remove('active');
};

// =====================================================
//  5. ডক্টর তৈরি ফর্ম সাবমিট
// =====================================================
document
  .getElementById("createDoctorForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    if (!data.name?.trim()) {
      showError("Please enter doctor's full name.");
      return;
    }
    if (!data.email?.trim()) {
      showError("Please enter doctor's email.");
      return;
    }
    if (!data.password?.trim()) {
      showError("Please enter a password.");
      return;
    }
    if (!data.specialization?.trim()) {
      showError("Please enter specialization.");
      return;
    }
    if (!data.departmentId || data.departmentId === "") {
      showError("Please select a department.");
      return;
    }

    const schedule = {};
    if (data.scheduleDays) {
      schedule.days = data.scheduleDays.split(',').map(d => d.trim());
    }
    if (data.scheduleStartTime) {
      schedule.startTime = data.scheduleStartTime.trim();
    }
    if (data.scheduleEndTime) {
      schedule.endTime = data.scheduleEndTime.trim();
    }
    delete data.scheduleDays;
    delete data.scheduleStartTime;
    delete data.scheduleEndTime;
    data.schedule = schedule;

    try {
      await apiFetch("/admin/doctors", {
        method: "POST",
        body: JSON.stringify(data),
      });
      form.reset();
      loadDoctors();
      loadDepartmentDropdowns();
      loadDeptHeadDropdown();
      hideError();
    } catch (err) {
      showError("Create doctor failed: " + err.message);
    }
  });

// =====================================================
//  6. স্টাফ লোড (এডিট বাটন সহ)
// =====================================================
export async function loadStaff() {
  try {
    const staff = await apiFetch("/admin/staff");
    displayList(
      "staffList",
      staff,
      (s) => `
      <div class="list-item">
        <div>
          <strong>${s.name}</strong> (${s.qualification || "N/A"})<br>
          <span class="text-sm text-gray-600">Email: ${s.email}</span><br>
          <span class="text-sm text-gray-600">Department: ${s.departmentId?.name || 'N/A'}</span><br>
          <span class="text-sm text-gray-600">Phone: ${s.phone || 'N/A'}</span><br>
          <span class="text-sm text-gray-600">Address: ${s.address || 'N/A'}</span>
        </div>
        <div>
          <button onclick="openEditModalForStaff('${s._id}')" class="btn-warning mr-1">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteStaff('${s._id}')" class="btn-danger">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `,
    );
  } catch (err) {
    showError("Failed to load staff: " + err.message);
  }
}

window.deleteStaff = async function (id) {
  if (!confirm("Delete this staff?")) return;
  try {
    await apiFetch(`/admin/staff/${id}`, { method: "DELETE" });
    loadStaff();
    loadDepartmentDropdowns();
  } catch (err) {
    showError("Delete failed: " + err.message);
  }
};

// =====================================================
//  স্টাফ এডিট
// =====================================================
window.openEditModalForStaff = async function (id) {
  console.log("🔵 openEditModalForStaff called with ID:", id);
  try {
    const staff = await apiFetch(`/admin/staff/${id}`);
    console.log("🟢 Staff data received:", staff);

    try {
      await loadDepartmentDropdownsForModal('editStaffDepartment');
    } catch (deptErr) {
      console.warn("⚠️ Failed to load departments for modal, but continuing:", deptErr.message);
    }

    document.getElementById('editStaffId').value = staff._id;
    document.getElementById('editStaffName').value = staff.name || '';
    document.getElementById('editStaffEmail').value = staff.email || '';
    document.getElementById('editStaffQualification').value = staff.qualification || '';
    document.getElementById('editStaffPhone').value = staff.phone || '';
    document.getElementById('editStaffAddress').value = staff.address || '';

    const deptSelect = document.getElementById('editStaffDepartment');
    if (staff.departmentId) {
      deptSelect.value = staff.departmentId._id || staff.departmentId;
    } else {
      deptSelect.value = '';
    }

    const modal = document.getElementById('editStaffModal');
    if (modal) {
      modal.classList.add('active');
      console.log("✅ Modal 'editStaffModal' opened");
    } else {
      console.error("❌ Modal element with id 'editStaffModal' not found!");
      showError("Modal element not found.");
    }
  } catch (err) {
    console.error("❌ Error in openEditModalForStaff:", err);
    showError('Failed to load staff details: ' + err.message);
  }
};

document.getElementById('editStaffForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editStaffId').value;
  const name = document.getElementById('editStaffName').value.trim();
  const email = document.getElementById('editStaffEmail').value.trim();
  let departmentId = document.getElementById('editStaffDepartment').value;
  if (departmentId === "") departmentId = null;
  const qualification = document.getElementById('editStaffQualification').value.trim();
  const phone = document.getElementById('editStaffPhone').value.trim();
  const address = document.getElementById('editStaffAddress').value.trim();

  if (!name || !departmentId) {
    showError('Name and Department are required.');
    return;
  }

  try {
    await apiFetch(`/admin/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, email, departmentId, qualification, phone, address }),
    });
    document.getElementById('editStaffModal').classList.remove('active');
    loadStaff();
    loadDepartmentDropdowns();
    hideError();
  } catch (err) {
    showError('Update failed: ' + err.message);
  }
});

window.closeEditStaffModal = function () {
  document.getElementById('editStaffModal').classList.remove('active');
};

// =====================================================
//  7. স্টাফ তৈরি ফর্ম সাবমিট
// =====================================================
document
  .getElementById("createStaffForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));

    if (!data.name?.trim()) {
      showError("Please enter staff name.");
      return;
    }
    if (!data.email?.trim()) {
      showError("Please enter staff email.");
      return;
    }
    if (!data.password?.trim()) {
      showError("Please enter a password.");
      return;
    }
    if (!data.departmentId || data.departmentId === "") {
      showError("Please select a department.");
      return;
    }

    try {
      await apiFetch("/admin/staff", {
        method: "POST",
        body: JSON.stringify(data),
      });
      form.reset();
      loadStaff();
      loadDepartmentDropdowns();
    } catch (err) {
      showError("Create staff failed: " + err.message);
    }
  });

// =====================================================
//  8. ডিপার্টমেন্ট লোড
// =====================================================
export async function loadDepartments() {
  try {
    const depts = await apiFetch("/admin/departments");
    const tbody = document.getElementById("deptTableBody");
    const emptyMsg = document.getElementById("deptEmptyMessage");
    if (!tbody) return;
    if (!depts || depts.length === 0) {
      tbody.innerHTML = "";
      if (emptyMsg) emptyMsg.style.display = "block";
      return;
    }
    if (emptyMsg) emptyMsg.style.display = "none";
    tbody.innerHTML = depts
      .map(
        (d, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${d.name}</strong></td>
        <td>${d.description || "—"}</td>
        <td>${d.headDoctor?.name || "—"}</td>
        <td class="action-cell">
          <button onclick="openEditModalForDept('${d._id}')" class="btn-warning mr-1">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteDept('${d._id}')" class="btn-danger">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `,
      )
      .join("");
  } catch (err) {
    showError("Failed to load departments: " + err.message);
  }
}

window.deleteDept = async function (id) {
  if (!confirm("Delete this department?")) return;
  try {
    await apiFetch(`/admin/departments/${id}`, { method: "DELETE" });
    loadDepartments();
    loadDepartmentDropdowns();
    loadDeptHeadDropdown();
  } catch (err) {
    showError("Delete failed: " + err.message);
  }
};

window.openEditModalForDept = async function (id) {
  try {
    const dept = await apiFetch(`/admin/departments/${id}`);
    await loadDeptHeadDropdown();
    document.getElementById("editDeptId").value = dept._id;
    document.getElementById("editDeptName").value = dept.name || "";
    document.getElementById("editDeptDesc").value = dept.description || "";
    const headSelect = document.getElementById("editDeptHead");
    headSelect.value = dept.headDoctor?._id || dept.headDoctor || "";
    document.getElementById("editDeptModal").classList.add("active");
  } catch (err) {
    showError("Failed to load department details: " + err.message);
  }
};

document.getElementById('editDeptForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editDeptId').value;
  const name = document.getElementById('editDeptName').value.trim();
  const description = document.getElementById('editDeptDesc').value.trim();
  const headDoctor = document.getElementById('editDeptHead').value || null;
  if (!name) {
    showError("Department name is required.");
    return;
  }
  try {
    await apiFetch(`/admin/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, description, headDoctor }),
    });
    document.getElementById("editDeptModal").classList.remove("active");
    loadDepartments();
    loadDepartmentDropdowns();
    loadDeptHeadDropdown();
    hideError();
  } catch (err) {
    showError("Update failed: " + err.message);
  }
});

// =====================================================
//  9. ডিপার্টমেন্ট তৈরি
// =====================================================
document
  .getElementById("createDeptForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("deptNameInput")?.value?.trim();
    const description = document.getElementById("deptDescInput")?.value?.trim();
    const headDoctor = document.getElementById("deptHeadSelect")?.value || null;

    if (!name) {
      showError("Please enter a department name.");
      return;
    }
    try {
      await apiFetch("/admin/departments", {
        method: "POST",
        body: JSON.stringify({ name, description, headDoctor }),
      });
      document.getElementById("deptNameInput").value = "";
      document.getElementById("deptDescInput").value = "";
      document.getElementById("deptHeadSelect").value = "";
      loadDepartments();
      loadDepartmentDropdowns();
      loadDeptHeadDropdown();
      hideError();
    } catch (err) {
      showError("Create department failed: " + err.message);
    }
  });

// =====================================================
//  10. পেশন্ট লোড
// =====================================================
export async function loadPatients() {
  try {
    const patients = await apiFetch("/admin/patients");
    displayList(
      "patientList",
      patients,
      (p) => `
      <div class="list-item">
        <div>
          <strong>${p.name}</strong> (${p.email})<br>
          <span class="text-sm text-gray-600">${p.phone || ""}</span>
        </div>
        <div>
          <button onclick="editPatient('${p._id}')" class="btn-warning mr-1">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deletePatient('${p._id}')" class="btn-danger">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `,
    );
  } catch (err) {
    showError("Failed to load patients: " + err.message);
  }
}

window.deletePatient = async function (id) {
  if (!confirm("Delete this patient?")) return;
  try {
    await apiFetch(`/admin/patients/${id}`, { method: "DELETE" });
    loadPatients();
  } catch (err) {
    showError("Delete failed: " + err.message);
  }
};

// =====================================================
//  11. ইউজার ম্যানেজমেন্ট – ইউজার তৈরি
// =====================================================
document
  .getElementById("createUserForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));

    if (data.role === "depthead" && !data.departmentId) {
      showError("Department is required for Department Head");
      return;
    }

    try {
      await apiFetch("/admin/user-management", {
        method: "POST",
        body: JSON.stringify(data),
      });
      form.reset();
      alert("User created successfully!");
      loadDepartmentDropdowns();
      loadDeptHeadDropdown();
      loadUsers();   // লিস্ট রিফ্রেশ
    } catch (err) {
      showError("Create user failed: " + err.message);
    }
  });

// =====================================================
//  12. ইউজার লোড (লিস্ট) – সার্চ ফিচার সহ
// =====================================================
let allUsers = [];

export async function loadUsers() {
  try {
    const users = await apiFetch('/admin/users');
    allUsers = users;
    renderUsers(users);
  } catch (err) {
    showError('Failed to load users: ' + err.message);
  }
}

function renderUsers(users) {
  const container = document.getElementById('userList');
  if (!container) return;
  if (!users || users.length === 0) {
    container.innerHTML = '<p class="text-gray-500">No users found.</p>';
    return;
  }
  container.innerHTML = users.map(user => `
    <div class="list-item">
      <div>
        <strong>${user.name}</strong> (${user.role})<br>
        <span class="text-sm text-gray-600">Email: ${user.email}</span><br>
        <span class="text-sm text-gray-600">Phone: ${user.phone || 'N/A'}</span>
      </div>
      <div>
        <button onclick="openEditModalForUser('${user._id}')" class="btn-warning mr-1">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="deleteUser('${user._id}')" class="btn-danger">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// =====================================================
//  13. ইউজার সার্চ
// =====================================================
document.getElementById('searchUserBtn')?.addEventListener('click', function() {
  const term = document.getElementById('searchUserInput').value.trim().toLowerCase();
  if (!term) {
    renderUsers(allUsers);
    return;
  }
  const filtered = allUsers.filter(user => 
    user.name.toLowerCase().includes(term) || 
    user.email.toLowerCase().includes(term) || 
    user.role.toLowerCase().includes(term)
  );
  renderUsers(filtered);
});

document.getElementById('clearSearchBtn')?.addEventListener('click', function() {
  document.getElementById('searchUserInput').value = '';
  renderUsers(allUsers);
});

document.getElementById('searchUserInput')?.addEventListener('keyup', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('searchUserBtn').click();
  }
});

// =====================================================
//  14. ইউজার ডিলিট
// =====================================================
window.deleteUser = async function (id) {
  if (!confirm('Delete this user? This action cannot be undone.')) return;
  try {
    await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
    loadUsers();
  } catch (err) {
    showError('Delete failed: ' + err.message);
  }
};

// =====================================================
//  15. ইউজার এডিট – মডাল খোলা
// =====================================================
window.openEditModalForUser = async function (id) {
  try {
    const user = await apiFetch(`/admin/users/${id}`);
    // ডিপার্টমেন্ট ড্রপডাউন পপুলেট
    await loadDepartmentDropdownsForModal('editUserDepartment');

    document.getElementById('editUserId').value = user._id;
    document.getElementById('editUserName').value = user.name || '';
    document.getElementById('editUserEmail').value = user.email || '';
    document.getElementById('editUserPhone').value = user.phone || '';
    document.getElementById('editUserAddress').value = user.address || '';
    document.getElementById('editUserRole').value = user.role || '';

    // ডিপার্টমেন্ট সিলেক্ট
    const deptSelect = document.getElementById('editUserDepartment');
    const roleData = user.roleData || {};
    if (roleData.departmentId) {
      deptSelect.value = roleData.departmentId._id || roleData.departmentId;
    } else {
      deptSelect.value = '';
    }

    // রোল-নির্ভর ফিল্ড দেখান/লুকান
    const isDoctor = user.role === 'doctor';
    const isLabStaff = user.role === 'labstaff';
    const isDeptHead = user.role === 'depthead';

    document.getElementById('editUserSpecializationGroup').classList.toggle('hidden', !isDoctor);
    document.getElementById('editUserScheduleGroup').classList.toggle('hidden', !isDoctor);

    if (isDoctor) {
      document.getElementById('editUserSpecialization').value = roleData.specialization || '';
      const schedule = roleData.schedule || {};
      document.getElementById('editUserScheduleDays').value = schedule.days?.join(', ') || '';
      document.getElementById('editUserScheduleStart').value = schedule.startTime || '';
      document.getElementById('editUserScheduleEnd').value = schedule.endTime || '';
    }
    if (isLabStaff || isDeptHead) {
      document.getElementById('editUserQualification').value = roleData.qualification || '';
    }

    document.getElementById('editUserModal').classList.add('active');
  } catch (err) {
    showError('Failed to load user details: ' + err.message);
  }
};

// =====================================================
//  16. ইউজার এডিট ফর্ম সাবমিট
// =====================================================
document.getElementById('editUserForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editUserId').value;
  const name = document.getElementById('editUserName').value.trim();
  const email = document.getElementById('editUserEmail').value.trim();
  const phone = document.getElementById('editUserPhone').value.trim();
  const address = document.getElementById('editUserAddress').value.trim();
  const departmentId = document.getElementById('editUserDepartment').value;

  // রোল-নির্ভর ফিল্ড
  const role = document.getElementById('editUserRole').value;
  let specialization = '';
  let qualification = '';
  let schedule = {};

  if (role === 'doctor') {
    specialization = document.getElementById('editUserSpecialization').value.trim();
    const days = document.getElementById('editUserScheduleDays').value.trim();
    const start = document.getElementById('editUserScheduleStart').value;
    const end = document.getElementById('editUserScheduleEnd').value;
    if (days) schedule.days = days.split(',').map(d => d.trim());
    if (start) schedule.startTime = start;
    if (end) schedule.endTime = end;
  }
  if (role === 'labstaff' || role === 'depthead') {
    qualification = document.getElementById('editUserQualification').value.trim();
  }

  if (!name || !departmentId) {
    showError('Name and Department are required.');
    return;
  }

  const payload = { name, email, phone, address, departmentId, specialization, qualification, schedule };
  try {
    await apiFetch(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    document.getElementById('editUserModal').classList.remove('active');
    loadUsers();
    hideError();
  } catch (err) {
    showError('Update failed: ' + err.message);
  }
});

window.closeEditUserModal = function () {
  document.getElementById('editUserModal').classList.remove('active');
};

// =====================================================
//  এক্সপোর্ট
// =====================================================
window.loadReports = loadReports;
window.loadDoctors = loadDoctors;
window.loadStaff = loadStaff;
window.loadDepartments = loadDepartments;
window.loadPatients = loadPatients;
window.loadUsers = loadUsers;   // ✅ Export
window.loadDepartmentDropdowns = loadDepartmentDropdowns;
window.loadDeptHeadDropdown = loadDeptHeadDropdown;

// =====================================================
//  অন লোড
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    window.location.href = "../public/index.html";
    return;
  }
});