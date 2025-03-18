// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            initDashboard(user);
        } else {
            // User is not signed in, redirect to index
            window.location.href = '../index.html';
        }
    });

    // Initialize dashboard
    function initDashboard(user) {
        // Display user name
        const userNameElement = document.getElementById('user-name');
        const welcomeNameElement = document.getElementById('welcome-name');
        
        const userName = user.displayName || user.email || 'User';
        const firstName = userName.split(' ')[0]; // Get first name
        
        if (userNameElement) userNameElement.textContent = userName;
        if (welcomeNameElement) welcomeNameElement.textContent = firstName;
        
        // Mobile menu toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                document.querySelector('.nav-links').classList.toggle('active');
            });
        }
        
        // Event listener for logout button already handled in auth.js
        
        // Set current date
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            currentDateElement.textContent = today.toLocaleDateString('en-US', options);
        }

        // Fetch and display data
        fetchCards(user.uid);
        fetchTransactions(user.uid);
        
        // Set date filters listener
        const periodSelect = document.getElementById('period-select');
        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                updateDashboardData(user.uid);
            });
        }
        
        // Quick Action: Add Payment Reminder
        const addPaymentBtn = document.getElementById('add-payment');
        if (addPaymentBtn) {
            addPaymentBtn.addEventListener('click', () => {
                showAddPaymentModal();
            });
        }
        
        // Export data functionality
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', (e) => {
                e.preventDefault();
                exportUserData();
            });
        }
    }
    
    // Function to export user data
    function exportUserData() {
        // Get data from localStorage (for demo)
        const cards = JSON.parse(localStorage.getItem('creditCards')) || [];
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        
        const exportData = {
            cards,
            transactions,
            exportDate: new Date().toISOString()
        };
        
        // Create a file to download
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'credit-card-manager-data.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        // Show success message
        showToast('Data exported successfully!');
    }
    
    // Show toast notification
    function showToast(message, type = 'success') {
        // Check if toast container exists, if not create it
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
            <div class="toast-progress"></div>
        `;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Show then remove after delay
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3000);
        }, 10);
    }
    
    // Show add payment reminder modal
    function showAddPaymentModal() {
        // Create modal if it doesn't exist
        let paymentModal = document.getElementById('payment-modal');
        if (!paymentModal) {
            paymentModal = document.createElement('div');
            paymentModal.id = 'payment-modal';
            paymentModal.className = 'modal';
            
            paymentModal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Add Payment Reminder</h2>
                    <form id="payment-reminder-form">
                        <div class="form-group">
                            <label for="reminder-card">Card</label>
                            <select id="reminder-card" required>
                                <option value="">Select Card</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="reminder-amount">Amount ($)</label>
                                <input type="number" id="reminder-amount" placeholder="0.00" min="0.01" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label for="reminder-date">Due Date</label>
                                <input type="date" id="reminder-date" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="reminder-notes">Notes</label>
                            <input type="text" id="reminder-notes" placeholder="E.g., Minimum payment">
                        </div>
                        <div class="form-actions">
                            <button type="button" id="cancel-reminder" class="btn secondary-btn">Cancel</button>
                            <button type="submit" class="btn primary-btn">Save Reminder</button>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(paymentModal);
            
            // Populate card select
            populateCardSelect('reminder-card');
            
            // Set default date to 15 days from now
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 15);
            document.getElementById('reminder-date').value = defaultDate.toISOString().split('T')[0];
            
            // Add event listeners
            document.querySelector('#payment-modal .close').addEventListener('click', () => {
                paymentModal.style.display = 'none';
            });
            
            document.getElementById('cancel-reminder').addEventListener('click', () => {
                paymentModal.style.display = 'none';
            });
            
            document.getElementById('payment-reminder-form').addEventListener('submit', (e) => {
                e.preventDefault();
                savePaymentReminder();
                paymentModal.style.display = 'none';
            });
            
            // Close when clicking outside
            window.addEventListener('click', (e) => {
                if (e.target === paymentModal) {
                    paymentModal.style.display = 'none';
                }
            });
        }
        
        // Show modal
        paymentModal.style.display = 'flex';
    }
    
    // Populate card select dropdown
    function populateCardSelect(selectId) {
        const select = document.getElementById(selectId);
        const cards = JSON.parse(localStorage.getItem('creditCards')) || [];
        
        // Clear existing options (except first one)
        select.innerHTML = '<option value="">Select Card</option>';
        
        // Add card options
        cards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = `${card.name} (*${card.number})`;
            select.appendChild(option);
        });
    }
    
    // Save payment reminder
    function savePaymentReminder() {
        const cardId = document.getElementById('reminder-card').value;
        const amount = document.getElementById('reminder-amount').value;
        const date = document.getElementById('reminder-date').value;
        const notes = document.getElementById('reminder-notes').value;
        
        // Get existing reminders
        const reminders = JSON.parse(localStorage.getItem('paymentReminders')) || [];
        
        // Add new reminder
        reminders.push({
            id: Date.now().toString(),
            cardId,
            amount,
            dueDate: date,
            notes,
            completed: false,
            createdAt: new Date().toISOString()
        });
        
        // Save to localStorage
        localStorage.setItem('paymentReminders', JSON.stringify(reminders));
        
        // Refresh upcoming payments
        initUpcomingPayments();
        
        // Show success message
        showToast('Payment reminder added successfully!');
    }

    // Fetch cards from Firebase or localStorage
    function fetchCards(userId) {
        try {
            // Try to get from localStorage first (for demo)
            const cards = JSON.parse(localStorage.getItem('creditCards')) || [];
            updateCardStats(cards);
            
            // Replace with Firebase when ready
            /*
            db.collection('users').doc(userId).collection('cards')
                .get()
                .then((snapshot) => {
                    const cards = [];
                    snapshot.forEach(doc => {
                        cards.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    updateCardStats(cards);
                })
                .catch(error => {
                    console.error('Error fetching cards:', error);
                });
            */
        } catch (error) {
            console.error('Error fetching cards:', error);
            showToast('Error loading card data', 'error');
        }
    }

    // Fetch transactions from Firebase or localStorage
    function fetchTransactions(userId) {
        try {
            // Try to get from localStorage first (for demo)
            const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            updateTransactionStats(transactions);
            renderRecentTransactions(transactions);
            renderCharts(transactions);
            
            // Initialize upcoming payments
            initUpcomingPayments();
            
            // Replace with Firebase when ready
            /*
            db.collection('users').doc(userId).collection('transactions')
                .orderBy('date', 'desc')
                .get()
                .then((snapshot) => {
                    const transactions = [];
                    snapshot.forEach(doc => {
                        transactions.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    updateTransactionStats(transactions);
                    renderRecentTransactions(transactions);
                    renderCharts(transactions);
                })
                .catch(error => {
                    console.error('Error fetching transactions:', error);
                });
            */
        } catch (error) {
            console.error('Error fetching transactions:', error);
            showToast('Error loading transaction data', 'error');
        }
    }

    // Update card statistics
    function updateCardStats(cards) {
        document.getElementById('active-cards').textContent = cards.length;
        
        const totalBalance = cards.reduce((total, card) => total + parseFloat(card.balance || 0), 0);
        document.getElementById('total-balance').textContent = `$${totalBalance.toFixed(2)}`;
        
        const totalLimit = cards.reduce((total, card) => total + parseFloat(card.limit || 0), 0);
        const avgUtilization = totalLimit > 0 ? ((totalBalance / totalLimit) * 100).toFixed(1) : 0;
        document.getElementById('avg-utilization').textContent = `${avgUtilization}%`;
        
        // Add indicator colors based on utilization
        const utilizationElement = document.getElementById('avg-utilization');
        if (utilizationElement) {
            if (avgUtilization > 75) {
                utilizationElement.style.color = '#e74c3c'; // accent-color
            } else if (avgUtilization > 30) {
                utilizationElement.style.color = '#f39c12'; // warning-color
            } else {
                utilizationElement.style.color = '#2ecc71'; // success-color
            }
        }
    }

    // Update transaction statistics based on selected period
    function updateTransactionStats(transactions) {
        const periodSelect = document.getElementById('period-select');
        const selectedPeriod = periodSelect ? periodSelect.value : 'this-month';
        
        const filteredTransactions = filterTransactionsByPeriod(transactions, selectedPeriod);
        
        const totalSpend = filteredTransactions.reduce((total, transaction) => 
            total + parseFloat(transaction.amount || 0), 0);
            
        const monthlySpendElement = document.getElementById('monthly-spend');
        if (monthlySpendElement) {
            monthlySpendElement.textContent = `$${totalSpend.toFixed(2)}`;
        }
        
        // Calculate spending trend compared to previous period
        const trendElement = document.querySelector('.trend');
        if (trendElement) {
            let previousPeriodTransactions = [];
            const now = new Date();
            
            switch(selectedPeriod) {
                case 'this-month':
                    // Compare with last month
                    previousPeriodTransactions = transactions.filter(t => {
                        const transactionDate = new Date(t.date);
                        return transactionDate.getMonth() === now.getMonth() - 1 && 
                               transactionDate.getFullYear() === now.getFullYear();
                    });
                    break;
                case 'last-month':
                    // Compare with 2 months ago
                    previousPeriodTransactions = transactions.filter(t => {
                        const transactionDate = new Date(t.date);
                        return transactionDate.getMonth() === now.getMonth() - 2 && 
                               transactionDate.getFullYear() === now.getFullYear();
                    });
                    break;
                // Add cases for other periods as needed
            }
            
            const previousTotalSpend = previousPeriodTransactions.reduce((total, transaction) => 
                total + parseFloat(transaction.amount || 0), 0);
                
            let percentChange = 0;
            if (previousTotalSpend > 0) {
                percentChange = ((totalSpend - previousTotalSpend) / previousTotalSpend) * 100;
            }
            
            // Update trend display
            if (percentChange < 0) {
                // Spending decreased
                trendElement.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(percentChange).toFixed(1)}% vs last period`;
                trendElement.className = 'trend positive';
            } else if (percentChange > 0) {
                // Spending increased
                trendElement.innerHTML = `<i class="fas fa-arrow-up"></i> ${percentChange.toFixed(1)}% vs last period`;
                trendElement.className = 'trend negative';
            } else {
                // No change
                trendElement.innerHTML = `<i class="fas fa-equals"></i> No change vs last period`;
                trendElement.className = 'trend';
            }
        }
    }

    // Filter transactions by selected period
    function filterTransactionsByPeriod(transactions, period) {
        const now = new Date();
        let startDate;
        
        switch(period) {
            case 'this-month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last-month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                return transactions.filter(transaction => {
                    const transactionDate = new Date(transaction.date);
                    return transactionDate >= startDate && transactionDate <= endDate;
                });
            case 'last-3-months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
            case 'this-year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Default to this month
        }
        
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= startDate;
        });
    }

    // Update dashboard data based on selected period
    function updateDashboardData(userId) {
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        updateTransactionStats(transactions);
        renderCharts(transactions);
        renderRecentTransactions(transactions);
        
        // Replace with Firebase when ready
        /*
        const periodSelect = document.getElementById('period-select');
        const selectedPeriod = periodSelect.value;
        
        let startDate;
        const now = new Date();
        
        switch(selectedPeriod) {
            case 'this-month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last-month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                break;
            case 'last-3-months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
            case 'this-year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
        }
        
        db.collection('users').doc(userId).collection('transactions')
            .where('date', '>=', startDate)
            .orderBy('date', 'desc')
            .get()
            .then((snapshot) => {
                const transactions = [];
                snapshot.forEach(doc => {
                    transactions.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                updateTransactionStats(transactions);
                renderCharts(transactions);
                renderRecentTransactions(transactions);
            });
        */
    }

    // Render recent transactions
    function renderRecentTransactions(transactions) {
        const transactionsList = document.getElementById('transactions-list');
        if (!transactionsList) return;
        
        // Sort by date (newest first) and take top 5
        const recentTransactions = [...transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        
        if (recentTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No recent transactions</p>
                </div>
            `;
            return;
        }
        
        transactionsList.innerHTML = '';
        
        // Get cards for reference
        const cards = JSON.parse(localStorage.getItem('creditCards')) || [];
        
        recentTransactions.forEach(transaction => {
            const card = cards.find(card => card.id === transaction.cardId) || { name: 'Unknown Card' };
            
            let iconClass = 'fa-receipt';
            switch (transaction.category) {
                case 'food': iconClass = 'fa-utensils'; break;
                case 'shopping': iconClass = 'fa-shopping-bag'; break;
                case 'bills': iconClass = 'fa-file-invoice-dollar'; break;
                case 'entertainment': iconClass = 'fa-film'; break;
                case 'travel': iconClass = 'fa-plane'; break;
                case 'health': iconClass = 'fa-heartbeat'; break;
                case 'education': iconClass = 'fa-graduation-cap'; break;
            }
            
            const transactionEl = document.createElement('div');
            transactionEl.className = 'transaction-item';
            
            transactionEl.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-icon">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.description || 'Unnamed Transaction'}</h4>
                        <p>${formatDate(transaction.date)} • ${card.name}</p>
                    </div>
                </div>
                <div class="transaction-amount">$${parseFloat(transaction.amount || 0).toFixed(2)}</div>
            `;
            
            transactionsList.appendChild(transactionEl);
        });
    }

    // Render charts
    function renderCharts(transactions) {
        renderSpendingChart(transactions);
        renderCategoryChart(transactions);
    }

    // Render spending chart
    function renderSpendingChart(allTransactions) {
        const ctx = document.getElementById('spending-chart');
        if (!ctx) return;
        
        const periodSelect = document.getElementById('period-select');
        const selectedPeriod = periodSelect ? periodSelect.value : 'this-month';
        
        const filteredTransactions = filterTransactionsByPeriod(allTransactions, selectedPeriod);
        
        // Prepare data based on period
        const chartData = prepareChartData(filteredTransactions, selectedPeriod);
        
        // Destroy existing chart if it exists
        if (window.spendingChart instanceof Chart) {
            window.spendingChart.destroy();
        }
        
        window.spendingChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Spending',
                    data: chartData.values,
                    backgroundColor: 'rgba(58, 123, 213, 0.7)',
                    borderColor: 'rgba(58, 123, 213, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    hoverBackgroundColor: 'rgba(58, 123, 213, 0.9)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '$ ' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        },
                        grid: {
                            display: true,
                            drawBorder: false,
                            color: 'rgba(200, 200, 200, 0.15)'
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        }
                    }
                }
            }
        });
    }

    // Prepare chart data based on period
    function prepareChartData(transactions, period) {
        const now = new Date();
        const labels = [];
        const values = [];
        
        if (period === 'this-month' || period === 'last-month') {
            // Daily breakdown
            const year = now.getFullYear();
            const month = period === 'this-month' ? now.getMonth() : now.getMonth() - 1;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                labels.push(day);
                
                const dayTransactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate.getDate() === day && 
                           transactionDate.getMonth() === month &&
                           transactionDate.getFullYear() === year;
                });
                
                const dayTotal = dayTransactions.reduce((total, t) => total + parseFloat(t.amount || 0), 0);
                values.push(dayTotal);
            }
        } else if (period === 'last-3-months') {
            // Weekly breakdown
            for (let week = 0; week < 12; week++) {
                const endDate = new Date(now);
                endDate.setDate(now.getDate() - (week * 7));
                const startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 6);
                
                const weekLabel = `${formatDate(startDate, 'short')} - ${formatDate(endDate, 'short')}`;
                labels.unshift(weekLabel);
                
                const weekTransactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= startDate && transactionDate <= endDate;
                });
                
                const weekTotal = weekTransactions.reduce((total, t) => total + parseFloat(t.amount || 0), 0);
                values.unshift(weekTotal);
            }
        } else if (period === 'this-year') {
            // Monthly breakdown
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            for (let i = 0; i < 12; i++) {
                labels.push(months[i]);
                
                const monthTransactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate.getMonth() === i && transactionDate.getFullYear() === now.getFullYear();
                });
                
                const monthTotal = monthTransactions.reduce((total, t) => total + parseFloat(t.amount || 0), 0);
                values.push(monthTotal);
            }
        }
        
        return { labels, values };
    }

    // Render category chart
    function renderCategoryChart(allTransactions) {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;
        
        const periodSelect = document.getElementById('period-select');
        const selectedPeriod = periodSelect ? periodSelect.value : 'this-month';
        
        const filteredTransactions = filterTransactionsByPeriod(allTransactions, selectedPeriod);
        
        // Group by category
        const categories = {};
        const categoryNames = {
            'food': 'Food & Dining',
            'shopping': 'Shopping',
            'bills': 'Bills & Utilities',
            'entertainment': 'Entertainment',
            'travel': 'Travel',
            'health': 'Health & Medical',
            'education': 'Education',
            'other': 'Other'
        };
        
        const colors = [
            'rgba(58, 123, 213, 0.8)',
            'rgba(46, 204, 113, 0.8)',
            'rgba(155, 89, 182, 0.8)',
            'rgba(241, 196, 15, 0.8)',
            'rgba(230, 126, 34, 0.8)',
            'rgba(231, 76, 60, 0.8)',
            'rgba(149, 165, 166, 0.8)',
            'rgba(52, 73, 94, 0.8)'
        ];
        
        filteredTransactions.forEach(transaction => {
            const category = transaction.category || 'other';
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category] += parseFloat(transaction.amount || 0);
        });
        
        const labels = [];
        const data = [];
        const backgroundColors = [];
        
        // Sort categories by amount
        const sortedCategories = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);  // Only show top 5 categories
            
        // Add "Other" category for the rest
        const otherCategories = Object.entries(categories)
            .filter(([key]) => !sortedCategories.some(([sortedKey]) => sortedKey === key))
            .reduce((sum, [_, value]) => sum + value, 0);
            
        if (otherCategories > 0 && sortedCategories.length >= 5) {
            sortedCategories.pop();  // Remove the smallest of top 5
            sortedCategories.push(['other', otherCategories]);  // Add "Other"
        }
        
        sortedCategories.forEach(([category, amount], index) => {
            labels.push(categoryNames[category] || category);
            data.push(amount);
            backgroundColors.push(colors[index % colors.length]);
        });
        
        // Destroy existing chart if it exists
        if (window.categoryChart instanceof Chart) {
            window.categoryChart.destroy();
        }
        
        window.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '70%',
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }

    // Initialize upcoming payments
    function initUpcomingPayments() {
        // Get reminders from localStorage
        const reminders = JSON.parse(localStorage.getItem('paymentReminders')) || [];
        
        // Get cards
        const cards = JSON.parse(localStorage.getItem('creditCards')) || [];
        
        // If we have cards but no reminders, generate default reminders based on card due dates
        if (cards.length > 0 && reminders.length === 0) {
            const now = new Date();
            
            cards.forEach(card => {
                // Assume due date is stored as a number (day of month)
                if (card.dueDate) {
                    let dueDate = new Date(now.getFullYear(), now.getMonth(), card.dueDate);
                    
                    // If due date has passed, use next month
                    if (dueDate < now) {
                        dueDate = new Date(now.getFullYear(), now.getMonth() + 1, card.dueDate);
                    }
                    
                    reminders.push({
                        id: Date.now().toString() + card.id,
                        cardId: card.id,
                        amount: card.balance || 0,
                        dueDate: dueDate.toISOString().split('T')[0],
                        notes: 'Auto-generated payment reminder',
                        completed: false,
                        createdAt: new Date().toISOString()
                    });
                }
            });
            
            // Save generated reminders
            localStorage.setItem('paymentReminders', JSON.stringify(reminders));
        }
        
        const paymentsList = document.getElementById('payments-list');
        if (!paymentsList) return;
        
        if (reminders.length === 0) {
            paymentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <p>No upcoming payments</p>
                </div>
            `;
            return;
        }
        
        // Show all reminders sorted by due date (closest first)
        const sortedReminders = [...reminders]
            .filter(reminder => !reminder.completed)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            
        paymentsList.innerHTML = '';
        
        sortedReminders.slice(0, 3).forEach(reminder => {
            const card = cards.find(c => c.id === reminder.cardId) || { name: 'Unknown Card' };
            const dueDate = new Date(reminder.dueDate);
            const now = new Date();
            const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            
            const paymentEl = document.createElement('div');
            paymentEl.className = 'payment-item';
            
            // Apply appropriate class based on urgency
            if (daysUntilDue <= 3) {
                paymentEl.classList.add('urgent');
            } else if (daysUntilDue <= 7) {
                paymentEl.classList.add('soon');
            }
            
            paymentEl.innerHTML = `
                <div class="payment-info">
                    <div class="payment-card">${card.name}</div>
                    <div class="payment-date">Due in ${daysUntilDue} days (${formatDate(dueDate)})</div>
                </div>
                <div class="payment-amount">$${parseFloat(reminder.amount).toFixed(2)}</div>
            `;
            
            paymentsList.appendChild(paymentEl);
        });
        
        // Add "View All" link if there are more reminders
        if (sortedReminders.length > 3) {
            const viewAllEl = document.createElement('div');
            viewAllEl.className = 'view-all-link';
            viewAllEl.innerHTML = `<a href="#" id="view-all-payments">View all ${sortedReminders.length} payments</a>`;
            paymentsList.appendChild(viewAllEl);
            
            // Add event listener to view all payments
            document.getElementById('view-all-payments').addEventListener('click', (e) => {
                e.preventDefault();
                // Show all payments modal or redirect to a dedicated page
                alert('This feature will be available soon!');
            });
        }
    }

    // Helper function to format dates
    function formatDate(dateString, style = 'medium') {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (style === 'short') {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
}); 