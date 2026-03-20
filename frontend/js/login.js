const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

function showLoginMessage(text, type = 'error') {
  loginMessage.textContent = text;
  loginMessage.className = `feedback-box ${type}`;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showLoginMessage('Ingresa usuario y contraseña.', 'error');
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showLoginMessage(data.message || 'No fue posible iniciar sesión.', 'error');
      return;
    }

    showLoginMessage('Acceso correcto. Redirigiendo...', 'success');
    window.setTimeout(() => {
      window.location.href = 'admin.html';
    }, 500);
  } catch (error) {
    console.error(error);
    showLoginMessage('Ocurrió un error en la autenticación.', 'error');
  }
});
