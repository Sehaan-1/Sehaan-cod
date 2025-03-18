// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-app",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Encryption helper using CryptoJS
const encryptionKey = "your-secure-key"; // Store this securely in environment variables

const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
};

const decryptData = (encryptedData) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// Auth related functionality for the Credit Card Manager application
document.addEventListener('DOMContentLoaded', () => {
    // Firebase auth state observer
    firebase.auth().onAuthStateChanged(user => {
        const currentPage = window.location.pathname;
        const isIndexPage = currentPage === '/' || currentPage.includes('index.html');
        
        if (user) {
            // User is signed in
            if (isIndexPage) {
                window.location.href = 'pages/dashboard.html';
            } else {
                // Update UI for logged in user
                updateUIForUser(user);
            }
        } else {
            // User is not signed in
            if (!isIndexPage) {
                // If not on the index page, redirect to login
                window.location.href = '../index.html';
            }
        }
    });
    
    // Update UI elements for logged in user
    function updateUIForUser(user) {
        // Update user name display
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.displayName || user.email || 'User';
        }
        
        // Handle logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Highlight active nav link based on current page
        highlightActiveNavLink();
    }
    
    // Logout functionality
    function handleLogout() {
        // Show confirmation dialog
        if (confirm('Are you sure you want to log out?')) {
            // Show loading state
            const logoutBtn = document.getElementById('logout-btn');
            logoutBtn.innerHTML = '<div class="loading-spinner"></div>';
            logoutBtn.disabled = true;
            
            // Sign out user
            firebase.auth().signOut()
                .then(() => {
                    // Redirect to login page after signout
                    window.location.href = '../index.html';
                })
                .catch(error => {
                    console.error('Error signing out:', error);
                    alert('Failed to log out. Please try again.');
                    logoutBtn.textContent = 'Logout';
                    logoutBtn.disabled = false;
                });
        }
    }
    
    // Highlight the current page in the navigation
    function highlightActiveNavLink() {
        const currentPage = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            // Remove active class from all links
            link.classList.remove('active');
            
            // Add active class to current page link
            if (currentPage.includes('dashboard.html') && link.href.includes('dashboard.html')) {
                link.classList.add('active');
            } else if (currentPage.includes('cards.html') && link.href.includes('cards.html')) {
                link.classList.add('active');
            } else if (currentPage.includes('transactions.html') && link.href.includes('transactions.html')) {
                link.classList.add('active');
            } else if (currentPage.includes('analytics.html') && link.href.includes('analytics.html')) {
                link.classList.add('active');
            }
        });
    }
    
    // You can add more auth-related functions here as needed
    
    // Demo functions (remove in production)
    
    // Create demo data if none exists
    function createDemoData() {
        // Only create demo data if localStorage is empty
        if (!localStorage.getItem('creditCards')) {
            const demoCards = [
                {
                    id: '1',
                    name: 'Amazon Rewards',
                    type: 'visa',
                    number: '4321',
                    limit: 5000,
                    apr: 18.99,
                    dueDate: 15,
                    color: '#2e86de',
                    balance: 1250.75,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    name: 'Chase Sapphire',
                    type: 'mastercard',
                    number: '8765',
                    limit: 10000,
                    apr: 16.5,
                    dueDate: 20,
                    color: '#8e44ad',
                    balance: 3200.50,
                    createdAt: new Date().toISOString()
                }
            ];
            
            localStorage.setItem('creditCards', JSON.stringify(demoCards));
            
            // Create some demo transactions
            const today = new Date();
            const lastMonth = new Date(today);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            const demoTransactions = [
                {
                    id: '1',
                    cardId: '1',
                    amount: 79.99,
                    date: today.toISOString().slice(0, 10),
                    category: 'shopping',
                    description: 'Amazon Purchase',
                    createdAt: today.toISOString()
                },
                {
                    id: '2',
                    cardId: '1',
                    amount: 45.50,
                    date: today.toISOString().slice(0, 10),
                    category: 'food',
                    description: 'Grocery Store',
                    createdAt: today.toISOString()
                },
                {
                    id: '3',
                    cardId: '2',
                    amount: 120.00,
                    date: lastMonth.toISOString().slice(0, 10),
                    category: 'bills',
                    description: 'Electric Bill',
                    createdAt: lastMonth.toISOString()
                },
                {
                    id: '4',
                    cardId: '2',
                    amount: 35.78,
                    date: lastMonth.toISOString().slice(0, 10),
                    category: 'entertainment',
                    description: 'Movie Tickets',
                    createdAt: lastMonth.toISOString()
                }
            ];
            
            localStorage.setItem('transactions', JSON.stringify(demoTransactions));
        }
    }
    
    // Load demo data when in dashboard page
    if (window.location.pathname.includes('dashboard.html')) {
        createDemoData();
    }
});

// Sign Up function
async function signUp(email, password, name) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({
            displayName: name
        });
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Sign In function
async function signIn(email, password) {
    try {
        await auth.signInWithEmailAndPassword(email, password);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Sign Out function
function signOut() {
    auth.signOut();
} 