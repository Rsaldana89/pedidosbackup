const adminMessage = document.getElementById('adminMessage');
const uploadsTableBody = document.querySelector('#uploadsTable tbody');
const branchesTableBody = document.querySelector('#branchesTable tbody');
const branchStatusSummary = document.getElementById('branchStatusSummary');
const filterDateInput = document.getElementById('filterDate');

function showAdminMessage(text, type = 'success') {
  adminMessage.textContent = text;
  adminMessage.className = `feedback-box ${type}`;
}

function clearAdminMessage() {
  adminMessage.textContent = '';
  adminMessage.className = 'feedback-box hidden';
}

function getTodayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function handleUnauthorized(response) {
  if (response.status === 401) {
    window.location.href = 'login.html';
    return true;
  }
  return false;
}

async function readJsonSafe(response) {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
}

async function fetchDashboard(date) {
  const response = await fetch(`/api/admin/dashboard?date=${encodeURIComponent(date)}`);
  if (handleUnauthorized(response)) return null;

  const data = await readJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.message || 'No se pudo cargar el resumen');
  }

  document.getElementById('statUploadsToday').textContent = data.stats.totalUploads;
  document.getElementById('statBranchesLoaded').textContent = data.stats.branchesLoaded;
  document.getElementById('statBranchesPending').textContent = data.stats.branchesPending;
  document.getElementById('statBranchesActive').textContent = data.stats.activeBranches;

  branchStatusSummary.innerHTML = '';

  if (!data.statuses.length) {
    branchStatusSummary.innerHTML = '<div class="empty-state">No hay sucursales activas para mostrar.</div>';
    return data;
  }

  data.statuses.forEach((branch) => {
    const item = document.createElement('div');
    const loaded = Number(branch.subio_hoy) === 1;
    item.className = `status-item ${loaded ? 'ok' : 'pending'}`;
    item.innerHTML = `
      <div>
        <strong>${branch.codigo} - ${branch.nombre}</strong>
      </div>
      <span class="status-meta">${loaded ? `${branch.total_archivos} archivo(s)` : 'Pendiente'}</span>
    `;
    branchStatusSummary.appendChild(item);
  });

  return data;
}

async function fetchUploads(date = '') {
  let url = '/api/uploads';
  if (date) {
    url += `?date=${encodeURIComponent(date)}`;
  }

  const response = await fetch(url);
  if (handleUnauthorized(response)) return null;

  const data = await readJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.message || 'No se pudieron cargar los archivos');
  }

  uploadsTableBody.innerHTML = '';

  if (!data.length) {
    uploadsTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay archivos para mostrar.</td></tr>';
    return data;
  }

  data.forEach((item) => {
    const tr = document.createElement('tr');
    const branchText = item.sucursal_codigo && item.sucursal_nombre
      ? `${item.sucursal_codigo} - ${item.sucursal_nombre}`
      : item.sucursal_codigo || 'Sin sucursal';

    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${branchText}</td>
      <td>${item.filename_original || item.filename}</td>
      <td>${formatDateTime(item.created_at)}</td>
      <td><a href="/api/download/${item.id}">Descargar</a></td>
    `;
    uploadsTableBody.appendChild(tr);
  });

  return data;
}

async function fetchBranches() {
  const response = await fetch('/api/admin/sucursales');
  if (handleUnauthorized(response)) return null;

  const data = await readJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.message || 'No se pudieron cargar las sucursales');
  }

  branchesTableBody.innerHTML = '';

  if (!data.length) {
    branchesTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay sucursales registradas.</td></tr>';
    return data;
  }

  data.forEach((branch) => {
    const isActive = Number(branch.activo) === 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${branch.id}</td>
      <td>${branch.codigo}</td>
      <td>${branch.nombre}</td>
      <td><span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}">${isActive ? 'Activa' : 'Inactiva'}</span></td>
      <td>
        <button class="small-btn ${isActive ? 'secondary-btn' : 'primary-btn'} toggle-branch-btn" data-id="${branch.id}" data-next="${isActive ? 0 : 1}">
          ${isActive ? 'Desactivar' : 'Activar'}
        </button>
      </td>
    `;
    branchesTableBody.appendChild(tr);
  });

  return data;
}

async function createBranch(event) {
  event.preventDefault();
  clearAdminMessage();

  const codigo = document.getElementById('branchCode').value.trim();
  const nombre = document.getElementById('branchName').value.trim();
  const activo = document.getElementById('branchActive').value;

  try {
    const response = await fetch('/api/admin/sucursales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, nombre, activo })
    });

    if (handleUnauthorized(response)) return;

    const data = await readJsonSafe(response);
    if (!response.ok) {
      showAdminMessage(data.message || 'No se pudo agregar la sucursal.', 'error');
      return;
    }

    showAdminMessage(data.message, 'success');
    document.getElementById('branchForm').reset();
    document.getElementById('branchActive').value = '1';

    await Promise.all([
      fetchBranches(),
      fetchDashboard(filterDateInput.value || getTodayLocal())
    ]);
  } catch (error) {
    console.error(error);
    showAdminMessage('Ocurrió un error al agregar la sucursal.', 'error');
  }
}

async function toggleBranchStatus(id, activo) {
  clearAdminMessage();

  try {
    const response = await fetch(`/api/admin/sucursales/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo })
    });

    if (handleUnauthorized(response)) return;

    const data = await readJsonSafe(response);
    if (!response.ok) {
      showAdminMessage(data.message || 'No se pudo actualizar la sucursal.', 'error');
      return;
    }

    showAdminMessage(data.message, 'success');
    await Promise.all([
      fetchBranches(),
      fetchDashboard(filterDateInput.value || getTodayLocal())
    ]);
  } catch (error) {
    console.error(error);
    showAdminMessage('Error al actualizar la sucursal.', 'error');
  }
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } finally {
    window.location.href = 'login.html';
  }
}

async function refreshByDate() {
  const date = filterDateInput.value || getTodayLocal();
  filterDateInput.value = date;
  clearAdminMessage();

  try {
    await Promise.all([
      fetchDashboard(date),
      fetchUploads(date)
    ]);
  } catch (error) {
    console.error(error);
    showAdminMessage(error.message || 'No se pudieron cargar los datos del panel.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  filterDateInput.value = getTodayLocal();

  try {
    await Promise.all([
      refreshByDate(),
      fetchBranches()
    ]);
  } catch (error) {
    console.error(error);
  }

  document.getElementById('filterBtn').addEventListener('click', refreshByDate);
  document.getElementById('todayBtn').addEventListener('click', async () => {
    filterDateInput.value = getTodayLocal();
    await refreshByDate();
  });

  document.getElementById('downloadAllBtn').addEventListener('click', () => {
    const date = filterDateInput.value || getTodayLocal();
    window.location.href = `/api/download-all?date=${encodeURIComponent(date)}`;
  });

  document.getElementById('branchForm').addEventListener('submit', createBranch);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  branchesTableBody.addEventListener('click', (event) => {
    if (event.target.classList.contains('toggle-branch-btn')) {
      toggleBranchStatus(event.target.dataset.id, event.target.dataset.next);
    }
  });
});
