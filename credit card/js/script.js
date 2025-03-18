// Main script for the Credit Card Manager application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase (replace with your config)
    /*
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "your-app.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-storage-bucket",
        messagingSenderId: "your-sender-id",
        appId: "your-app-id"
    };
    firebase.initializeApp(firebaseConfig);
    */
    
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('app-content').style.display = 'block';
            
            // If user accesses the index page while already logged in, redirect to dashboard
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                window.location.href = 'pages/dashboard.html';
            }
        } else {
            // User is not signed in
            document.getElementById('auth-section').style.display = 'flex';
            document.getElementById('app-content').style.display = 'none';
            setupAuthForms();
        }
    });

    // Set up auth forms (login and signup)
    function setupAuthForms() {
        // Auth tabs functionality
        const authTabs = document.querySelectorAll('.auth-tab');
        const authForms = document.querySelectorAll('.auth-form');
        
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Update active tab
                authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show the correct form
                authForms.forEach(form => {
                    if (form.id === `${targetTab}-form`) {
                        form.classList.add('active');
                    } else {
                        form.classList.remove('active');
                    }
                });
            });
        });
        
        // Switch between login and signup forms using links
        document.getElementById('switch-to-signup')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('[data-tab="signup"]').click();
        });
        
        document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('[data-tab="login"]').click();
        });
        
        // Password strength meter
        const passwordInput = document.getElementById('signup-password');
        if (passwordInput) {
            passwordInput.addEventListener('input', updatePasswordStrength);
        }
        
        // Login form
        const loginForm = document.getElementById('login-form');
        const loginError = document.getElementById('login-error');
        
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                
                try {
                    // Show loading state
                    const submitBtn = loginForm.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<div class="loading-spinner"></div> Logging in...';
                    submitBtn.disabled = true;
                    
                    // Demo authentication for testing
                    // For a real app, you would need to verify credentials with Firebase
                    if (email && password) {
                        // You can enable this when Firebase is set up
                        // await firebase.auth().signInWithEmailAndPassword(email, password);
                        
                        // Simulate delay for demo
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // For now, just redirect to the dashboard
                        window.location.href = 'pages/dashboard.html';
                    } else {
                        loginError.textContent = 'Please enter both email and password.';
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }
                } catch (error) {
                    loginError.textContent = error.message;
                    const submitBtn = loginForm.querySelector('button[type="submit"]');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
        
        // Signup form
        const signupForm = document.getElementById('signup-form');
        const signupError = document.getElementById('signup-error');
        
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const name = document.getElementById('signup-name').value;
                const email = document.getElementById('signup-email').value;
                const password = document.getElementById('signup-password').value;
                
                try {
                    // Show loading state
                    const submitBtn = signupForm.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<div class="loading-spinner"></div> Creating account...';
                    submitBtn.disabled = true;
                    
                    // Demo authentication for testing
                    // For a real app, you would create a new user with Firebase
                    if (name && email && password) {
                        // You can enable this when Firebase is set up
                        /*
                        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                        await userCredential.user.updateProfile({
                            displayName: name
                        });
                        
                        // Create user document in Firestore
                        await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
                            name,
                            email,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        */
                        
                        // Simulate delay for demo
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        
                        // For now, just redirect to the dashboard
                        window.location.href = 'pages/dashboard.html';
                    } else {
                        signupError.textContent = 'Please fill in all fields.';
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }
                } catch (error) {
                    signupError.textContent = error.message;
                    const submitBtn = signupForm.querySelector('button[type="submit"]');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
        
        // Forgot password functionality
        const forgotPasswordLink = document.getElementById('forgot-password');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                
                // Show modal or prompt for email
                const promptEmail = email || prompt('Please enter your email address:');
                
                if (promptEmail) {
                    // You can enable this when Firebase is set up
                    // firebase.auth().sendPasswordResetEmail(promptEmail);
                    
                    alert(`Password reset link sent to ${promptEmail}! (Demo Mode)`);
                }
            });
        }
        
        // Social auth buttons
        const googleBtn = document.querySelector('.social-btn.google');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                // You can enable this when Firebase is set up
                /*
                const provider = new firebase.auth.GoogleAuthProvider();
                firebase.auth().signInWithPopup(provider);
                */
                
                alert('Google login functionality will be available soon! (Demo Mode)');
            });
        }
        
        const githubBtn = document.querySelector('.social-btn.github');
        if (githubBtn) {
            githubBtn.addEventListener('click', () => {
                // You can enable this when Firebase is set up
                /*
                const provider = new firebase.auth.GithubAuthProvider();
                firebase.auth().signInWithPopup(provider);
                */
                
                alert('GitHub login functionality will be available soon! (Demo Mode)');
            });
        }
    }
    
    // Password strength meter
    function updatePasswordStrength() {
        const password = document.getElementById('signup-password').value;
        const strengthSegments = document.querySelectorAll('.strength-segment');
        const strengthText = document.querySelector('.strength-text');
        
        // Reset all segments
        strengthSegments.forEach(segment => {
            segment.className = 'strength-segment';
        });
        
        // Check password strength
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        // Update UI based on strength
        for (let i = 0; i < strength && i < 3; i++) {
            if (strength === 1) {
                strengthSegments[i].classList.add('weak');
            } else if (strength === 2) {
                strengthSegments[i].classList.add('medium');
            } else {
                strengthSegments[i].classList.add('strong');
            }
        }
        
        // Update text
        if (password.length === 0) {
            strengthText.textContent = 'Password strength';
        } else if (strength <= 1) {
            strengthText.textContent = 'Weak password';
        } else if (strength === 2) {
            strengthText.textContent = 'Medium strength';
        } else {
            strengthText.textContent = 'Strong password';
        }
    }

    // Set up navigation links
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.id;
            
            // Set target section based on nav link id
            let targetPage;
            
            switch (targetId) {
                case 'dashboard-link':
                    targetPage = 'pages/dashboard.html';
                    break;
                case 'cards-link':
                    targetPage = 'pages/cards.html';
                    break;
                case 'transactions-link':
                    targetPage = 'pages/transactions.html';
                    break;
                case 'analytics-link':
                    targetPage = 'pages/analytics.html';
                    break;
                default:
                    targetPage = 'pages/dashboard.html';
            }
            
            window.location.href = targetPage;
        });
    });
    
    // Additional functionalities for dashboard page in index.html
    const viewAllTransactionsBtn = document.getElementById('view-all-transactions');
    if (viewAllTransactionsBtn) {
        viewAllTransactionsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'pages/transactions.html';
        });
    }
}); 