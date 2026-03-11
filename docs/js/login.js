/**
 * Login page logic - ITCO Trade Management
 * Requires: Firebase SDK and firebase-config.js (auth, db)
 */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
    } else {
        passwordInput.type = 'password';
    }
}

function showLogin(event) {
    event.preventDefault();
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('forgotPasswordContainer').classList.add('hidden');
    hideMessages();
}

function showForgotPassword(event) {
    event.preventDefault();
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('forgotPasswordContainer').classList.remove('hidden');
    hideMessages();
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
    document.getElementById('successMessage').classList.add('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    successText.textContent = message;
    successDiv.classList.remove('hidden');
    document.getElementById('errorMessage').classList.add('hidden');
    setTimeout(() => successDiv.classList.add('hidden'), 5000);
}

function hideMessages() {
    document.getElementById('errorMessage').classList.add('hidden');
    document.getElementById('successMessage').classList.add('hidden');
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const loginButton = document.getElementById('loginButton');

    loginButton.disabled = true;
    loginButton.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

    try {
        const persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
        await auth.setPersistence(persistence);
        await auth.signInWithEmailAndPassword(email, password);
        showSuccess('Login successful! Redirecting...');
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        switch (error.code) {
            case 'auth/user-not-found': errorMessage = 'No account found with this email.'; break;
            case 'auth/wrong-password': errorMessage = 'Incorrect password. Please try again.'; break;
            case 'auth/invalid-email': errorMessage = 'Invalid email address format.'; break;
            case 'auth/user-disabled': errorMessage = 'This account has been disabled.'; break;
            case 'auth/too-many-requests': errorMessage = 'Too many failed attempts. Please try again later.'; break;
            case 'auth/network-request-failed': errorMessage = 'Network error. Please check your connection.'; break;
        }
        showError(errorMessage);
        loginButton.disabled = false;
        loginButton.textContent = 'Sign In';
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();
    const resetButton = document.getElementById('resetButton');

    resetButton.disabled = true;
    resetButton.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

    try {
        await auth.sendPasswordResetEmail(email);
        showSuccess('Password reset email sent! Check your inbox.');
        document.getElementById('resetEmail').value = '';
        setTimeout(() => showLogin(new Event('click')), 3000);
    } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'Failed to send reset email. Please try again.';
        switch (error.code) {
            case 'auth/user-not-found': errorMessage = 'No account found with this email.'; break;
            case 'auth/invalid-email': errorMessage = 'Invalid email address format.'; break;
            case 'auth/network-request-failed': errorMessage = 'Network error. Please check your connection.'; break;
        }
        showError(errorMessage);
    } finally {
        resetButton.disabled = false;
        resetButton.textContent = 'Send Reset Link';
    }
}

auth.onAuthStateChanged((user) => {
    if (user) {
        window.location.href = 'index.html';
    }
});
