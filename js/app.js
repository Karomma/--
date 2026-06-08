// ==========================================================================
// AssignFlow Application JavaScript (SPA Logic & Simulation Engine)
// ==========================================================================

// Global Application State
let state = {
  currentRole: 'teacher',
  assignments: [],
  submissions: [],
  simTimeEnabled: false,
  simTimeOffset: 0 // Milliseconds difference between simulated time and real time
};

// ==========================================================================
// Seeding Mock Data
// ==========================================================================
const MOCK_ASSIGNMENTS = [
  {
    id: 'assign-1',
    title: 'การบ้านบทที่ 1: เขียน HTML & CSS เบื้องต้น',
    description: 'ให้นักเรียนออกแบบหน้าเว็บประวัติส่วนตัว (Portfolio) แบบเรียบง่าย\n- ใช้โครงสร้าง HTML5 ที่ถูกต้อง\n- ตกแต่งด้วย CSS (Grid/Flexbox)\n- ส่งโดยการแนบลิงก์ GitHub หรือ Google Drive',
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    id: 'assign-2',
    title: 'โครงงานกลางภาค: พัฒนาแอป AssignFlow',
    description: 'พัฒนาแอปพลิเคชันระบบส่งงานจำลอง (AssignFlow)\n- รองรับฟังก์ชันจำลองเวลาปัจจุบัน (System Time Tester)\n- บันทึกข้อมูลผ่าน LocalStorage\n- ทำหน้าเว็บแบบ Premium Glassmorphism',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
  }
];

const getMockSubmissions = (assigns) => [
  {
    id: 'sub-1',
    assignmentId: assigns[0].id,
    studentName: 'นายสมชาย เรียนดี',
    content: 'https://github.com/somchaicodes/my-portfolio',
    submittedAt: new Date(new Date(assigns[0].deadline).getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours before deadline
    status: 'reviewed', // 'pending' | 'reviewed'
    timeliness: 'on-time', // 'on-time' | 'late'
    fileName: null,
    fileData: null,
    fileSize: 0
  },
  {
    id: 'sub-2',
    assignmentId: assigns[0].id,
    studentName: 'นางสาวสมศรี ชัยชนะ',
    content: 'ส่งงานย้อนหลังค่ะ ลิงก์ไดรฟ์: https://drive.google.com/drive/folders/som-sri-folder',
    submittedAt: new Date(new Date(assigns[0].deadline).getTime() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours after deadline
    status: 'pending',
    timeliness: 'late',
    fileName: null,
    fileData: null,
    fileSize: 0
  },
  {
    id: 'sub-3',
    assignmentId: assigns[1].id,
    studentName: 'นายวิชัย ขยันเรียน',
    content: 'พัฒนา AssignFlow เสร็จเรียบร้อย พร้อมใช้งานบน LocalStorage ครับ: https://github.com/vichai-codes/assign-flow',
    submittedAt: new Date(new Date(assigns[1].deadline).getTime() - 1.5 * 24 * 60 * 60 * 1000).toISOString(), // 1.5 days before deadline
    status: 'pending',
    timeliness: 'on-time',
    fileName: 'design-mockup.txt',
    fileData: 'data:text/plain;base64,VGhpcyBpcyBhIG1vY2sgZmlsZSBhdHRhY2htZW50IGZvciBBc3NpZ25GbG93ISBZb3VyIGZpbGUgdXBsb2FkIHdvcmtzIHBlcmZlY3RseS4=',
    fileSize: 93
  }
];

// ==========================================================================
// Initialization & LocalStorage Management
// ==========================================================================
function initApp() {
  // Load data from LocalStorage
  const savedAssignments = localStorage.getItem('assignflow_assignments');
  const savedSubmissions = localStorage.getItem('assignflow_submissions');
  const savedRole = localStorage.getItem('assignflow_role');
  const savedSimEnabled = localStorage.getItem('assignflow_sim_enabled');
  const savedSimOffset = localStorage.getItem('assignflow_sim_offset');

  if (savedAssignments) {
    state.assignments = JSON.parse(savedAssignments);
  } else {
    state.assignments = MOCK_ASSIGNMENTS;
    localStorage.setItem('assignflow_assignments', JSON.stringify(state.assignments));
  }

  if (savedSubmissions) {
    state.submissions = JSON.parse(savedSubmissions);
  } else {
    state.submissions = getMockSubmissions(state.assignments);
    localStorage.setItem('assignflow_submissions', JSON.stringify(state.submissions));
  }

  if (savedRole) {
    state.currentRole = savedRole;
  }

  if (savedSimEnabled === 'true') {
    state.simTimeEnabled = true;
    state.simTimeOffset = parseInt(savedSimOffset || '0', 10);
    document.getElementById('sim-time-enable').checked = true;
    document.getElementById('sim-controls').classList.remove('sim-controls-disabled');
    enableSimulationControls(true);
  }

  // Pre-fill Create Assignment form date & time with today/now+1hr
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('assign-deadline-date').value = tomorrow.toISOString().split('T')[0];
  document.getElementById('assign-deadline-time').value = '18:00';

  // Apply Initial UI Role
  switchRole(state.currentRole);

  // Set up Simulated Time Ticker
  setInterval(tickTime, 1000);
  tickTime(); // Run once immediately

  // Render everything
  renderUI();
}

function saveData() {
  localStorage.setItem('assignflow_assignments', JSON.stringify(state.assignments));
  localStorage.setItem('assignflow_submissions', JSON.stringify(state.submissions));
  localStorage.setItem('assignflow_role', state.currentRole);
  localStorage.setItem('assignflow_sim_enabled', state.simTimeEnabled);
  localStorage.setItem('assignflow_sim_offset', state.simTimeOffset);
}

// ==========================================================================
// Time Engine Functions
// ==========================================================================
function getCurrentTime() {
  if (state.simTimeEnabled) {
    return new Date(Date.now() + state.simTimeOffset);
  }
  return new Date();
}

function tickTime() {
  const realTime = new Date();
  const simTime = getCurrentTime();

  // Update navbar time
  const timeStr = formatTimeClock(simTime);
  document.getElementById('nav-current-time').textContent = timeStr;

  // Update time displays in simulator panel
  document.getElementById('real-time-display').textContent = formatTimeClock(realTime);

  if (state.simTimeEnabled) {
    document.getElementById('sim-time-display').textContent = formatTimeClock(simTime);
    document.getElementById('nav-sim-badge').classList.remove('hidden');

    // Keep the datetime-local value synchronized if user is not actively editing it
    const input = document.getElementById('sim-datetime-input');
    if (document.activeElement !== input) {
      // Adjust to local time zone for input element value (yyyy-MM-ddThh:mm)
      const tzOffset = simTime.getTimezoneOffset() * 60000;
      const localISOTime = new Date(simTime.getTime() - tzOffset).toISOString().slice(0, 16);
      input.value = localISOTime;
    }
  } else {
    document.getElementById('sim-time-display').textContent = 'ปิดการใช้งาน';
    document.getElementById('nav-sim-badge').classList.add('hidden');
  }

  // Live countdown update for Student list and submit dropdown details
  if (state.currentRole === 'student') {
    updateCountdownTimers();
    updateSelectedAssignmentInfo();
  }
}

function enableSimulationControls(enabled) {
  const inputs = document.querySelectorAll('#sim-controls input, #sim-controls button');
  inputs.forEach(el => {
    if (enabled) {
      el.removeAttribute('disabled');
    } else {
      el.setAttribute('disabled', 'true');
    }
  });
}

function toggleSimTime(enabled) {
  state.simTimeEnabled = enabled;
  const simControls = document.getElementById('sim-controls');
  
  if (enabled) {
    simControls.classList.remove('sim-controls-disabled');
    enableSimulationControls(true);
    // Default simulated time is current real time
    state.simTimeOffset = 0;
    showToast('เปิดการจำลองเวลาสำเร็จ!', 'success');
  } else {
    simControls.classList.add('sim-controls-disabled');
    enableSimulationControls(false);
    state.simTimeOffset = 0;
    showToast('ปิดการจำลองเวลาแล้ว ใช้เวลาจริงของระบบ', 'info');
  }
  
  saveData();
  tickTime();
  renderUI();
}

function setSimTimeFromInput(value) {
  if (!value) return;
  const targetTime = new Date(value).getTime();
  const realTime = Date.now();
  state.simTimeOffset = targetTime - realTime;
  
  showToast(`เปลี่ยนเวลาจำลองเป็น: ${formatDateTime(new Date(targetTime))}`, 'warning');
  saveData();
  tickTime();
  renderUI();
}

function adjustSimTime(seconds) {
  state.simTimeOffset += (seconds * 1000);
  const newTime = getCurrentTime();
  showToast(`ปรับเวลาเพิ่มขึ้น: +${formatDuration(seconds)}`, 'warning');
  saveData();
  tickTime();
  renderUI();
}

function resetSimTime() {
  state.simTimeOffset = 0;
  // Sync input value to current time
  const tzOffset = getCurrentTime().getTimezoneOffset() * 60000;
  document.getElementById('sim-datetime-input').value = new Date(Date.now() - tzOffset).toISOString().slice(0, 16);
  showToast('รีเซ็ตเวลาจำลองเท่ากับเวลาเครื่องแล้ว', 'success');
  saveData();
  tickTime();
  renderUI();
}

// ==========================================================================
// Role Switching
// ==========================================================================
function switchRole(role) {
  state.currentRole = role;
  
  // Update Navbar Buttons
  document.getElementById('role-teacher-btn').classList.toggle('active', role === 'teacher');
  document.getElementById('role-student-btn').classList.toggle('active', role === 'student');

  // Update Sections Visibility
  document.getElementById('teacher-dashboard').classList.toggle('hidden', role !== 'teacher');
  document.getElementById('student-dashboard').classList.toggle('hidden', role !== 'student');

  saveData();
  renderUI();
}

// ==========================================================================
// Event Handlers
// ==========================================================================

// Create Assignment (Teacher)
function handleCreateAssignment(e) {
  e.preventDefault();
  const title = document.getElementById('assign-title').value.trim();
  const desc = document.getElementById('assign-desc').value.trim();
  const dateVal = document.getElementById('assign-deadline-date').value;
  const timeVal = document.getElementById('assign-deadline-time').value;

  if (!title || !dateVal || !timeVal) {
    showToast('กรุณากรอกข้อมูลงานและวันเวลาสิ้นสุดให้ครบถ้วน', 'danger');
    return;
  }

  // Combine Date & Time
  const deadlineISO = new Date(`${dateVal}T${timeVal}`).toISOString();

  const newAssignment = {
    id: 'assign-' + Date.now(),
    title: title,
    description: desc,
    deadline: deadlineISO
  };

  state.assignments.unshift(newAssignment);
  saveData();
  renderUI();

  // Reset form inputs except date/time
  document.getElementById('assign-title').value = '';
  document.getElementById('assign-desc').value = '';
  showToast(`สร้างช่องส่งงาน "${title}" เรียบร้อยแล้ว`, 'success');
}

// Send Submission (Student)
function handleSendSubmission(e) {
  e.preventDefault();
  const assignSelect = document.getElementById('submit-assign-select');
  const assignmentId = assignSelect.value;
  const studentName = document.getElementById('submit-student-name').value.trim();
  const content = document.getElementById('submit-content').value.trim();
  const fileInput = document.getElementById('submit-file');
  const file = fileInput.files ? fileInput.files[0] : null;

  if (!assignmentId || !studentName || !content) {
    showToast('กรุณาเลือกวิชาและใส่ข้อมูลส่งงานให้ครบถ้วน', 'danger');
    return;
  }

  const assignment = state.assignments.find(a => a.id === assignmentId);
  if (!assignment) {
    showToast('ไม่พบงานที่เลือกในระบบ', 'danger');
    return;
  }

  const simulatedNow = getCurrentTime();
  const deadlineTime = new Date(assignment.deadline).getTime();
  
  // Decide timeliness
  const timeliness = (simulatedNow.getTime() <= deadlineTime) ? 'on-time' : 'late';
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (file) {
    // Validate size (1.5 MB limit to fit inside LocalStorage)
    const MAX_SIZE = 1.5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('ขนาดไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 1.5 MB สำหรับ LocalStorage)', 'danger');
      return;
    }

    // Set UI to uploading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังอัปโหลดไฟล์...';
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      const fileData = event.target.result;
      const fileName = file.name;
      const fileSize = file.size;
      
      executeSubmission(assignmentId, studentName, content, timeliness, simulatedNow, fileData, fileName, fileSize);
      
      // Reset button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-upload"></i> ส่งงานตอนนี้';
      }
      // Clear file input
      fileInput.value = '';
    };
    reader.onerror = function() {
      showToast('เกิดข้อผิดพลาดในการอ่านไฟล์', 'danger');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-upload"></i> ส่งงานตอนนี้';
      }
    };
    reader.readAsDataURL(file);
  } else {
    executeSubmission(assignmentId, studentName, content, timeliness, simulatedNow, null, null, 0);
  }
}

function executeSubmission(assignmentId, studentName, content, timeliness, simulatedNow, fileData, fileName, fileSize) {
  const newSubmission = {
    id: 'sub-' + Date.now(),
    assignmentId: assignmentId,
    studentName: studentName,
    content: content,
    submittedAt: simulatedNow.toISOString(),
    status: 'pending', // default: waiting for teacher review
    timeliness: timeliness,
    fileData: fileData,
    fileName: fileName,
    fileSize: fileSize
  };

  state.submissions.unshift(newSubmission);
  saveData();
  renderUI();

  // Reset submit text
  document.getElementById('submit-content').value = '';
  
  if (timeliness === 'late') {
    showToast('ส่งงานเสร็จสิ้น (ส่งล่าช้ากว่ากำหนด)', 'warning');
  } else {
    showToast('ส่งงานสำเร็จ (ทันเวลา)', 'success');
  }
}

// Mark Submission Reviewed (Teacher)
function reviewSubmission(subId) {
  const sub = state.submissions.find(s => s.id === subId);
  if (sub) {
    sub.status = 'reviewed';
    saveData();
    renderUI();
    showToast(`ตรวจงานของ ${sub.studentName} เรียบร้อยแล้ว`, 'success');
  }
}

// Delete Assignment Channel (Teacher)
function deleteAssignment(assignId) {
  const assign = state.assignments.find(a => a.id === assignId);
  if (!assign) return;

  const confirmMsg = `คุณต้องการลบช่องส่งงาน "${assign.title}" ใช่หรือไม่?\n\n*คำเตือน: ประวัติการส่งงานทั้งหมดของช่องทางนี้จะถูกลบออกถาวร!`;
  if (confirm(confirmMsg)) {
    // Cascade delete related submissions
    state.submissions = state.submissions.filter(s => s.assignmentId !== assignId);
    
    // Delete assignment
    state.assignments = state.assignments.filter(a => a.id !== assignId);
    
    saveData();
    renderUI();
    showToast(`ลบช่องส่งงาน "${assign.title}" เรียบร้อยแล้ว`, 'success');
  }
}

// Helper to expand content block in table
function toggleContentExpansion(el) {
  const textEl = el.previousElementSibling;
  if (textEl.classList.contains('expanded')) {
    textEl.classList.remove('expanded');
    el.textContent = '[แสดงเพิ่มเติม]';
  } else {
    textEl.classList.add('expanded');
    el.textContent = '[ย่อลง]';
  }
}

// ==========================================================================
// Rendering Engine
// ==========================================================================
function renderUI() {
  if (state.currentRole === 'teacher') {
    renderTeacherAssignments();
    populateAssignmentFilter();
    renderSubmissionsTable();
  } else if (state.currentRole === 'student') {
    populateStudentAssignmentSelect();
    renderStudentAssignments();
    renderStudentHistoryTable();
  }
}

// TEACHER VIEW RENDERS
function renderTeacherAssignments() {
  const listEl = document.getElementById('teacher-assignments-list');
  if (state.assignments.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <p>ยังไม่มีการสร้างช่องงานใดๆ</p>
      </div>`;
    return;
  }

  let html = '';
  state.assignments.forEach(assign => {
    // Count submissions details
    const relatedSubs = state.submissions.filter(s => s.assignmentId === assign.id);
    const onTimeCount = relatedSubs.filter(s => s.timeliness === 'on-time').length;
    const lateCount = relatedSubs.filter(s => s.timeliness === 'late').length;

    html += `
      <div class="assignment-item">
        <div class="assign-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
          <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 0.35rem; max-width: calc(100% - 40px);">
            <span class="assign-title-text" style="word-break: break-word;">${escapeHtml(assign.title)}</span>
            <div class="assign-stats">
              <span class="assign-stat-badge text-muted">ส่งแล้ว: ${relatedSubs.length}</span>
              <span class="assign-stat-badge text-success">ทันกำหนด: ${onTimeCount}</span>
              <span class="assign-stat-badge text-warning">ล่าช้า: ${lateCount}</span>
            </div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteAssignment('${assign.id}')" title="ลบช่องส่งงาน" style="padding: 4px 7px; font-size: 0.75rem; border-radius: 6px; flex-shrink: 0;">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
        ${assign.description ? `<p class="assign-desc-text" style="margin-top:0.75rem;">${escapeHtml(assign.description)}</p>` : ''}
        <div class="assign-footer">
          <div class="deadline-text">
            <i class="fa-regular fa-calendar-xmark text-danger"></i> กำหนดส่ง: 
            <span class="deadline-time">${formatDateTime(new Date(assign.deadline))}</span>
          </div>
        </div>
      </div>
    `;
  });
  listEl.innerHTML = html;
}

function populateAssignmentFilter() {
  const filterSelect = document.getElementById('filter-assignment');
  const currentValue = filterSelect.value;
  
  let html = '<option value="all">ทั้งหมด</option>';
  state.assignments.forEach(assign => {
    html += `<option value="${assign.id}">${escapeHtml(assign.title)}</option>`;
  });
  
  filterSelect.innerHTML = html;
  
  // Re-apply filter value if it still exists
  if (state.assignments.some(a => a.id === currentValue) || currentValue === 'all') {
    filterSelect.value = currentValue;
  } else {
    filterSelect.value = 'all';
  }
}

function renderSubmissionsTable() {
  const filterVal = document.getElementById('filter-assignment').value;
  const tbody = document.getElementById('submissions-tbody');
  
  let filteredSubs = state.submissions;
  if (filterVal !== 'all') {
    filteredSubs = state.submissions.filter(s => s.assignmentId === filterVal);
  }

  if (filteredSubs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">ไม่พบข้อมูลการส่งงาน</td>
      </tr>`;
    return;
  }

  let html = '';
  filteredSubs.forEach(sub => {
    const assign = state.assignments.find(a => a.id === sub.assignmentId);
    const assignTitle = assign ? assign.title : 'ไม่พบชื่องาน (อาจถูกลบ)';

    // Check if content looks like a URL
    let contentDisplay = escapeHtml(sub.content);
    const isUrl = /^(http|https):\/\/[^\s]+$/.test(sub.content.trim());
    if (isUrl) {
      contentDisplay = `<a href="${escapeHtml(sub.content.trim())}" target="_blank" class="text-primary-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${escapeHtml(sub.content.trim())}</a>`;
    }

    let fileDisplay = '';
    if (sub.fileName && sub.fileData) {
      fileDisplay = `
        <div style="margin-top: 0.5rem;">
          <a href="${sub.fileData}" download="${escapeHtml(sub.fileName)}" class="btn btn-sm btn-outline" style="font-size:0.75rem; padding: 2px 6px; display: inline-flex; align-items: center; gap: 0.25rem;">
            <i class="fa-solid fa-file-arrow-down" style="color: var(--color-success);"></i> ${escapeHtml(sub.fileName)} (${formatBytes(sub.fileSize)})
          </a>
        </div>
      `;
    }

    const timelinessBadge = sub.timeliness === 'on-time'
      ? '<span class="badge badge-on-time"><i class="fa-solid fa-circle-check"></i> ตรงเวลา</span>'
      : '<span class="badge badge-late"><i class="fa-solid fa-circle-exclamation"></i> ส่งล่าช้า</span>';

    const statusBadge = sub.status === 'reviewed'
      ? '<span class="badge badge-reviewed"><i class="fa-solid fa-square-check"></i> ตรวจแล้ว</span>'
      : '<span class="badge badge-pending"><i class="fa-solid fa-hourglass-half"></i> รอตรวจ</span>';

    const actionButton = sub.status === 'reviewed'
      ? `<button class="btn btn-sm btn-outline" disabled><i class="fa-solid fa-check"></i> ตรวจแล้ว</button>`
      : `<button class="btn btn-sm btn-success" onclick="reviewSubmission('${sub.id}')"><i class="fa-solid fa-check-double"></i> ยืนยันตรวจ</button>`;

    html += `
      <tr>
        <td style="font-weight:600;">${escapeHtml(assignTitle)}</td>
        <td>${escapeHtml(sub.studentName)}</td>
        <td>
          <div class="submission-content-text">${contentDisplay}</div>
          ${sub.content.length > 45 ? `<span class="expand-link" onclick="toggleContentExpansion(this)">[แสดงเพิ่มเติม]</span>` : ''}
          ${fileDisplay}
        </td>
        <td class="text-muted" style="font-family: monospace;">${formatDateTime(new Date(sub.submittedAt))}</td>
        <td>${timelinessBadge}</td>
        <td>${statusBadge}</td>
        <td>${actionButton}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// STUDENT VIEW RENDERS
function populateStudentAssignmentSelect() {
  const select = document.getElementById('submit-assign-select');
  if (state.assignments.length === 0) {
    select.innerHTML = '<option value="">-- ยังไม่มีการบ้านให้เลือกส่ง --</option>';
    return;
  }

  let html = '<option value="">-- เลือกงานที่ต้องการส่ง --</option>';
  state.assignments.forEach(assign => {
    html += `<option value="${assign.id}">${escapeHtml(assign.title)}</option>`;
  });
  select.innerHTML = html;
}

function updateSelectedAssignmentInfo() {
  const select = document.getElementById('submit-assign-select');
  const infoDiv = document.getElementById('selected-assign-info');
  const assignmentId = select.value;

  if (!assignmentId) {
    infoDiv.classList.add('hidden');
    return;
  }

  const assign = state.assignments.find(a => a.id === assignmentId);
  if (!assign) {
    infoDiv.classList.add('hidden');
    return;
  }

  const deadlineTime = new Date(assign.deadline).getTime();
  const simulatedNow = getCurrentTime().getTime();
  
  infoDiv.classList.remove('hidden');
  
  if (simulatedNow > deadlineTime) {
    infoDiv.innerHTML = `
      <span class="text-warning" style="font-weight:600;">
        <i class="fa-solid fa-exclamation-triangle"></i> เลยกำหนดส่งแล้ว: ล่าช้ากว่ากำหนด (Late Submit)
      </span><br>
      <small class="text-muted">กำหนดส่งเมื่อ: ${formatDateTime(new Date(assign.deadline))}</small>
    `;
  } else {
    const diff = deadlineTime - simulatedNow;
    infoDiv.innerHTML = `
      <span class="text-success" style="font-weight:600;">
        <i class="fa-solid fa-clock"></i> ทันเวลาส่ง: เหลือเวลา ${formatRemainingTime(diff)}
      </span><br>
      <small class="text-muted">กำหนดส่งในวันที่: ${formatDateTime(new Date(assign.deadline))}</small>
    `;
  }
}

function renderStudentAssignments() {
  const listEl = document.getElementById('student-assignments-list');
  if (state.assignments.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <p>ยังไม่มีการบ้านหรือโครงการที่ต้องส่งในขณะนี้</p>
      </div>`;
    return;
  }

  let html = '';
  state.assignments.forEach(assign => {
    const deadlineTime = new Date(assign.deadline).getTime();
    const simulatedNow = getCurrentTime().getTime();
    let badgeClass = 'active-time';
    let badgeIcon = '<i class="fa-regular fa-clock"></i>';
    let countdownText = '';

    if (simulatedNow > deadlineTime) {
      badgeClass = 'overdue-time';
      badgeIcon = '<i class="fa-solid fa-calendar-times"></i>';
      countdownText = 'หมดเวลา (Late Submit)';
    } else {
      const diff = deadlineTime - simulatedNow;
      countdownText = formatRemainingTime(diff);
      
      // If remaining time is less than 6 hours, show warning style
      if (diff < 6 * 60 * 60 * 1000) {
        badgeClass = 'warning-time';
        badgeIcon = '<i class="fa-solid fa-hourglass-half"></i>';
      }
    }

    html += `
      <div class="assignment-item">
        <div class="assign-header">
          <span class="assign-title-text">${escapeHtml(assign.title)}</span>
          <span class="time-left-badge ${badgeClass}" data-deadline="${assign.deadline}">
            ${badgeIcon} ${countdownText}
          </span>
        </div>
        ${assign.description ? `<p class="assign-desc-text">${escapeHtml(assign.description)}</p>` : ''}
        <div class="assign-footer">
          <div class="deadline-text">
            <i class="fa-regular fa-calendar-alt"></i> กำหนดส่ง: 
            <span class="deadline-time">${formatDateTime(new Date(assign.deadline))}</span>
          </div>
        </div>
      </div>
    `;
  });
  listEl.innerHTML = html;
}

// Function to dynamically update countdowns on the page without rebuilding the entire list DOM (every tick)
function updateCountdownTimers() {
  const badges = document.querySelectorAll('.time-left-badge[data-deadline]');
  const simulatedNow = getCurrentTime().getTime();

  badges.forEach(badge => {
    const deadlineISO = badge.getAttribute('data-deadline');
    const deadlineTime = new Date(deadlineISO).getTime();
    
    let badgeClass = 'active-time';
    let badgeIcon = '<i class="fa-regular fa-clock"></i>';
    let countdownText = '';

    if (simulatedNow > deadlineTime) {
      badgeClass = 'overdue-time';
      badgeIcon = '<i class="fa-solid fa-calendar-times"></i>';
      countdownText = 'หมดเวลา (Late Submit)';
    } else {
      const diff = deadlineTime - simulatedNow;
      countdownText = formatRemainingTime(diff);
      
      if (diff < 6 * 60 * 60 * 1000) {
        badgeClass = 'warning-time';
        badgeIcon = '<i class="fa-solid fa-hourglass-half"></i>';
      }
    }

    badge.className = `time-left-badge ${badgeClass}`;
    badge.innerHTML = `${badgeIcon} ${countdownText}`;
  });
}

function renderStudentHistoryTable() {
  const tbody = document.getElementById('student-history-tbody');
  
  if (state.submissions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-muted">ยังไม่มีประวัติการส่งงานของคุณในเบราว์เซอร์นี้</td>
      </tr>`;
    return;
  }

  let html = '';
  state.submissions.forEach(sub => {
    const assign = state.assignments.find(a => a.id === sub.assignmentId);
    const assignTitle = assign ? assign.title : 'ไม่พบชื่องาน (อาจถูกลบ)';

    let contentDisplay = escapeHtml(sub.content);
    const isUrl = /^(http|https):\/\/[^\s]+$/.test(sub.content.trim());
    if (isUrl) {
      contentDisplay = `<a href="${escapeHtml(sub.content.trim())}" target="_blank" class="text-primary-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${escapeHtml(sub.content.trim())}</a>`;
    }

    let fileDisplay = '';
    if (sub.fileName && sub.fileData) {
      fileDisplay = `
        <div style="margin-top: 0.5rem;">
          <a href="${sub.fileData}" download="${escapeHtml(sub.fileName)}" class="btn btn-sm btn-outline" style="font-size:0.75rem; padding: 2px 6px; display: inline-flex; align-items: center; gap: 0.25rem;">
            <i class="fa-solid fa-file-arrow-down" style="color: var(--color-success);"></i> ${escapeHtml(sub.fileName)} (${formatBytes(sub.fileSize)})
          </a>
        </div>
      `;
    }

    const timelinessBadge = sub.timeliness === 'on-time'
      ? '<span class="badge badge-on-time"><i class="fa-solid fa-circle-check"></i> ตรงเวลา</span>'
      : '<span class="badge badge-late"><i class="fa-solid fa-circle-exclamation"></i> ส่งล่าช้า</span>';

    const statusBadge = sub.status === 'reviewed'
      ? '<span class="badge badge-reviewed"><i class="fa-solid fa-square-check"></i> ตรวจสอบแล้ว</span>'
      : '<span class="badge badge-pending"><i class="fa-solid fa-hourglass-half"></i> รอการตรวจสอบ</span>';

    html += `
      <tr>
        <td style="font-weight:600;">${escapeHtml(assignTitle)}</td>
        <td>
          <div class="submission-content-text">${contentDisplay}</div>
          ${sub.content.length > 45 ? `<span class="expand-link" onclick="toggleContentExpansion(this)">[แสดงเพิ่มเติม]</span>` : ''}
          ${fileDisplay}
        </td>
        <td class="text-muted" style="font-family: monospace;">${formatDateTime(new Date(sub.submittedAt))}</td>
        <td>${timelinessBadge}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// ==========================================================================
// Time Display Formatter Helpers
// ==========================================================================
function formatTimeClock(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  
  const d = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();

  return `${d}/${mo}/${y} ${h}:${m}:${s}`;
}

function formatDateTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  
  const d = date.getDate();
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const month = months[date.getMonth()];
  const y = date.getFullYear() + 543; // Thai Buddhist Era

  return `${d} ${month} ${y} (เวลา ${h}:${m} น.)`;
}

function formatRemainingTime(ms) {
  if (ms <= 0) return 'หมดเวลาส่ง';
  
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hrs = Math.floor(min / 60);
  const days = Math.floor(hrs / 24);

  if (days > 0) {
    return `เหลือ ${days} วัน ${hrs % 24} ชม.`;
  }
  if (hrs > 0) {
    return `เหลือ ${hrs} ชม. ${min % 60} นาที`;
  }
  if (min > 0) {
    return `เหลือ ${min} นาที ${sec % 60} วินาที`;
  }
  return `เหลือ ${sec} วินาที`;
}

function formatDuration(seconds) {
  if (seconds >= 24 * 3600) {
    const days = Math.floor(seconds / (24 * 3600));
    return `${days} วัน`;
  }
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} ชั่วโมง`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes} นาที`;
}

// ==========================================================================
// Toast & Utility Helpers
// ==========================================================================
function toggleTimeTester() {
  const panel = document.getElementById('time-tester-panel');
  const icon = panel.querySelector('.toggle-icon i');
  
  if (panel.classList.contains('minimized')) {
    panel.classList.remove('minimized');
    icon.className = 'fa-solid fa-chevron-down';
  } else {
    panel.classList.add('minimized');
    icon.className = 'fa-solid fa-chevron-up';
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconClass = 'fa-circle-info';
  if (type === 'success') iconClass = 'fa-circle-check';
  if (type === 'warning') iconClass = 'fa-triangle-exclamation';
  if (type === 'danger') iconClass = 'fa-circle-xmark';

  toast.innerHTML = `
    <span class="toast-icon"><i class="fa-solid ${iconClass}"></i></span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // Automatically fade and remove toast
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"']/g, function(match) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return map[match];
  });
}

function resetAllData() {
  if (confirm('คุณต้องการรีเซ็ตข้อมูลงานส่งและการบ้านทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
    localStorage.removeItem('assignflow_assignments');
    localStorage.removeItem('assignflow_submissions');
    localStorage.removeItem('assignflow_role');
    localStorage.removeItem('assignflow_sim_enabled');
    localStorage.removeItem('assignflow_sim_offset');
    showToast('รีเซ็ตข้อมูลแล้ว กำลังรีโหลดแอปพลิเคชัน...', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

function formatBytes(bytes) {
  if (bytes === 0 || bytes === null || bytes === undefined) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==========================================================================
// Bootstrap application on page load
// ==========================================================================
window.addEventListener('DOMContentLoaded', initApp);
