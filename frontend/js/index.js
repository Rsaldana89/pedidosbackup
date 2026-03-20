const uploadForm = document.getElementById('uploadForm');
const messageEl = document.getElementById('message');
const sucursalSelect = document.getElementById('sucursal');
const helpToggle = document.getElementById('helpToggle');
const helpImagePanel = document.getElementById('helpImagePanel');

function showMessage(text, type = 'success') {
  messageEl.textContent = text;
  messageEl.className = `feedback-box ${type}`;
}

function hideMessage() {
  messageEl.textContent = '';
  messageEl.className = 'feedback-box hidden';
}

function setHelpVisible(visible) {
  helpImagePanel.classList.toggle('hidden', !visible);
  helpToggle.setAttribute('aria-expanded', visible ? 'true' : 'false');
}

async function readJsonSafe(response) {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
}

async function cargarSucursales() {
  try {
    const response = await fetch('/api/sucursales');
    const data = await readJsonSafe(response);

    if (!response.ok) {
      throw new Error(data.message || 'No se pudo cargar el catálogo');
    }

    sucursalSelect.innerHTML = '<option value="">Selecciona una sucursal</option>';

    data.forEach((sucursal) => {
      const option = document.createElement('option');
      option.value = sucursal.codigo;
      option.textContent = `${sucursal.codigo} - ${sucursal.nombre}`;
      sucursalSelect.appendChild(option);
    });
  } catch (error) {
    console.error(error);
    sucursalSelect.innerHTML = '<option value="">No se pudieron cargar las sucursales</option>';
    showMessage('No se pudo cargar el catálogo de sucursales. Revisa la base de datos o vuelve a intentar.', 'error');
  }
}

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();

  const sucursal = sucursalSelect.value;
  const fileInput = document.getElementById('file');

  if (!sucursal) {
    showMessage('Por favor selecciona una sucursal.', 'error');
    return;
  }

  if (!fileInput.files || fileInput.files.length === 0) {
    showMessage('Por favor selecciona un archivo Excel.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('sucursal', sucursal);
  formData.append('file', fileInput.files[0]);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const data = await readJsonSafe(response);

    if (!response.ok) {
      showMessage(data.message || 'Error al subir el archivo.', 'error');
      return;
    }

    showMessage(`${data.message} (${data.sucursal})`, 'success');
    uploadForm.reset();
    setHelpVisible(false);
  } catch (error) {
    console.error(error);
    showMessage('Ocurrió un error al subir el archivo.', 'error');
  }
});

helpToggle.addEventListener('click', () => {
  const nextVisible = helpToggle.getAttribute('aria-expanded') !== 'true';
  setHelpVisible(nextVisible);
});

document.addEventListener('DOMContentLoaded', () => {
  setHelpVisible(false);
  cargarSucursales();
});
