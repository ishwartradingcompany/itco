/**
 * Authentication: auth state, logout, user display
 */
let currentUser = null;
let currentUserEmail = '';
let currentUserName = '';

auth.onAuthStateChanged(async (user) => {
    const loadingScreen = document.getElementById('authLoadingScreen');
    const mainContent = document.getElementById('mainAppContent');

    if (user) {
        console.log('User authenticated:', user.email);
        currentUser = user;
        currentUserEmail = user.email;
        currentUserName = user.displayName || user.email;

        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                currentUserName = userData.name || user.displayName || user.email;
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }

        if (typeof updateUserDisplay === 'function') {
            updateUserDisplay();
        }

        loadingScreen.classList.add('hidden');
        mainContent.classList.remove('hidden');

        if (typeof loadData === 'function') {
            loadData();
        }
    } else {
        console.log('No user authenticated, redirecting to login...');
        window.location.href = 'login.html';
    }
});

function updateUserDisplay() {
    const dateTimeContainer = document.querySelector('.date-time-container');
    if (dateTimeContainer && currentUserName) {
        const userBadge = document.createElement('div');
        userBadge.className = 'text-xs mt-1 opacity-75';
        userBadge.innerHTML = `👤 ${currentUserName}`;
        dateTimeContainer.appendChild(userBadge);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.signOut().then(() => {
            console.log('User signed out');
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Logout error:', error);
            alert('Error logging out. Please try again.');
        });
    }
}

window.addEventListener('popstate', function () {
    if (!currentUser) {
        window.location.href = 'login.html';
    }
});
