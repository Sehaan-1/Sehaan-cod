// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    const dashboardLink = document.getElementById('dashboard-link');
    const cardsLink = document.getElementById('cards-link');
    const transactionsLink = document.getElementById('transactions-link');
    const analyticsLink = document.getElementById('analytics-link');
    
    // Sections
    const dashboardSection = document.getElementById('dashboard');
    const cardsSection = document.getElementById('cards');
    const transactionsSection = document.getElementById('transactions');
    const analyticsSection = document.getElementById('analytics');
    
    // Cards
    const addCardBtn = document.getElementById('add-card-btn');
    const cardModal = document.getElementById('card-modal');
    const cardForm = document.getElementById('card-form');
    const cardsContainer = document.getElementById('cards-container');
    const closeCardModal = cardModal.querySelector('.close');
    const cancelCardBtn = document.getElementById('cancel-card');
    
    // Transactions
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const transactionModal = document.getElementById('transaction-modal');
    const transactionForm = document.getElementById('transaction-form');
    const transactionsList = document.getElementById('transactions-list');
    const closeTransactionModal = transactionModal.querySelector('.close');
    const cancelTransactionBtn = document.getElementById('cancel-transaction');
    const transactionCardSelect = document.getElementById('transaction-card');
    const filterCardSelect = document.getElementById('filter-card');
    const filterDateSelect = document.getElementById('filter-date');
    
    // Dashboard
    const totalCardsEl = document.getElementById('total-cards');
    const totalBalanceEl = document.getElementById('total-balance');
    const monthSpendingEl = document.getElementById('month-spending');
    const recentTransactionsList = document.getElementById('recent-transactions-list');
    
    // Charts
    const spendingChart = document.getElementById('spending-chart');
    const monthlySpendingChart = document.getElementById('monthly-spending-chart');
    const categorySpendingChart = document.getElementById('category-spending-chart');
    const creditUtilizationChart = document.getElementById('credit-utilization-chart');
    
    // Data Storage
    let cards = JSON.parse(localStorage.getItem('creditCards')) || [];
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    // Navigation Functions
    function showSection(section) {
        dashboardSection.classList.remove('active-section');
        cardsSection.classList.remove('active-section');
        transactionsSection.classList.remove('active-section');
        analyticsSection.classList.remove('active-section');
        
        dashboardLink.classList.remove('active');
        cardsLink.classList.remove('active');
        transactionsLink.classList.remove('active');
        analyticsLink.classList.remove('active');
        
        section.classList.add('active-section');
        
        if (section === dashboardSection) {
            dashboardLink.classList.add('active');
            renderDashboard();
        } else if (section === cardsSection) {
            cardsLink.classList.add('active');
            renderCards();
        } else if (section === transactionsSection) {
            transactionsLink.classList.add('active');
            renderTransactions();
        } else if (section === analyticsSection) {
            analyticsLink.classList.add('active');
            renderAnalytics();
        }
    }
    
    // Event Listeners - Navigation
    dashboardLink.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(dashboardSection);
    });
    
    cardsLink.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(cardsSection);
    });
    
    transactionsLink.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(transactionsSection);
    });
    
    analyticsLink.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(analyticsSection);
    });
    
    // Card Functions
    function openCardModal(card = null) {
        const modalTitle = document.getElementById('modal-title');
        const cardIdInput = document.getElementById('card-id');
        const cardNameInput = document.getElementById('card-name');
        const cardTypeInput = document.getElementById('card-type');
        const cardNumberInput = document.getElementById('card-number');
        const expiryDateInput = document.getElementById('expiry-date');
        const creditLimitInput = document.getElementById('credit-limit');
        const currentBalanceInput = document.getElementById('current-balance');
        const cardColorInput = document.getElementById('card-color');
        
        if (card) {
            modalTitle.textContent = 'Edit Card';
            cardIdInput.value = card.id;
            cardNameInput.value = card.name;
            cardTypeInput.value = card.type;
            cardNumberInput.value = card.number;
            expiryDateInput.value = card.expiry;
            creditLimitInput.value = card.limit;
            currentBalanceInput.value = card.balance;
            cardColorInput.value = card.color;
        } else {
            modalTitle.textContent = 'Add New Card';
            cardForm.reset();
            cardIdInput.value = '';
            cardColorInput.value = '#2c3e50';
        }
        
        cardModal.style.display = 'flex';
    }
    
    function closeCardModal() {
        cardModal.style.display = 'none';
    }
    
    function saveCard(e) {
        e.preventDefault();
        
        const cardId = document.getElementById('card-id').value;
        const cardName = document.getElementById('card-name').value;
        const cardType = document.getElementById('card-type').value;
        const cardNumber = document.getElementById('card-number').value;
        const expiryDate = document.getElementById('expiry-date').value;
        const creditLimit = document.getElementById('credit-limit').value;
        const currentBalance = document.getElementById('current-balance').value;
        const cardColor = document.getElementById('card-color').value;
        
        if (cardId) {
            // Edit existing card
            const cardIndex = cards.findIndex(card => card.id === cardId);
            if (cardIndex !== -1) {
                cards[cardIndex] = {
                    ...cards[cardIndex],
                    name: cardName,
                    type: cardType,
                    number: cardNumber,
                    expiry: expiryDate,
                    limit: parseFloat(creditLimit),
                    balance: parseFloat(currentBalance),
                    color: cardColor
                };
            }
        } else {
            // Add new card
            const newCard = {
                id: Date.now().toString(),
                name: cardName,
                type: cardType,
                number: cardNumber,
                expiry: expiryDate,
                limit: parseFloat(creditLimit),
                balance: parseFloat(currentBalance),
                color: cardColor,
                dateAdded: new Date().toISOString()
            };
            
            cards.push(newCard);
        }
        
        localStorage.setItem('creditCards', JSON.stringify(cards));
        closeCardModal();
        renderCards();
        updateCardSelects();
        renderDashboard();
    }
    
    function deleteCard(cardId) {
        if (confirm('Are you sure you want to delete this card? This will also delete all associated transactions.')) {
            cards = cards.filter(card => card.id !== cardId);
            transactions = transactions.filter(transaction => transaction.cardId !== cardId);
            
            localStorage.setItem('creditCards', JSON.stringify(cards));
            localStorage.setItem('transactions', JSON.stringify(transactions));
            
            renderCards();
            updateCardSelects();
            renderDashboard();
        }
    }
    
    function renderCards() {
        if (cards.length === 0) {
            cardsContainer.innerHTML = '<p class="empty-state">No cards added yet</p>';
            return;
        }
        
        cardsContainer.innerHTML = '';
        
        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card-item';
            cardEl.style.backgroundColor = card.color;
            
            cardEl.innerHTML = `
                <div class="card-header">
                    <span class="card-type">${card.type}</span>
                    <div class="card-actions">
                        <button class="edit-card" data-id="${card.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-card" data-id="${card.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="card-number">**** **** **** ${card.number}</div>
                <div class="card-details">
                    <div>
                        <div class="card-name">${card.name}</div>
                        <div class="card-expires">Expires: ${formatExpiryDate(card.expiry)}</div>
                    </div>
                </div>
                <div class="card-balance">
                    <div>Balance: $${card.balance.toFixed(2)}</div>
                    <div>Credit Limit: $${card.limit.toFixed(2)}</div>
                </div>
            `;
            
            cardsContainer.appendChild(cardEl);
            
            // Add event listeners
            const editBtn = cardEl.querySelector('.edit-card');
            const deleteBtn = cardEl.querySelector('.delete-card');
            
            editBtn.addEventListener('click', () => {
                const cardToEdit = cards.find(c => c.id === card.id);
                openCardModal(cardToEdit);
            });
            
            deleteBtn.addEventListener('click', () => {
                deleteCard(card.id);
            });
        });
    }
    
    // Transaction Functions
    function openTransactionModal(transaction = null) {
        const modalTitle = document.getElementById('transaction-modal-title');
        const transactionIdInput = document.getElementById('transaction-id');
        const transactionCardSelect = document.getElementById('transaction-card');
        const transactionAmountInput = document.getElementById('transaction-amount');
        const transactionDateInput = document.getElementById('transaction-date');
        const transactionDescriptionInput = document.getElementById('transaction-description');
        const transactionCategoryInput = document.getElementById('transaction-category');
        
        // Set today's date as default
        if (!transaction) {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            transactionDateInput.value = formattedDate;
        }
        
        if (transaction) {
            modalTitle.textContent = 'Edit Transaction';
            transactionIdInput.value = transaction.id;
            transactionCardSelect.value = transaction.cardId;
            transactionAmountInput.value = transaction.amount;
            transactionDateInput.value = transaction.date;
            transactionDescriptionInput.value = transaction.description;
            transactionCategoryInput.value = transaction.category;
        } else {
            modalTitle.textContent = 'Add New Transaction';
            transactionForm.reset();
            transactionIdInput.value = '';
            // Set today's date
            const today = new Date();
            transactionDateInput.value = today.toISOString().split('T')[0];
        }
        
        transactionModal.style.display = 'flex';
    }
    
    function closeTransactionModal() {
        transactionModal.style.display = 'none';
    }
    
    function saveTransaction(e) {
        e.preventDefault();
        
        const transactionId = document.getElementById('transaction-id').value;
        const cardId = document.getElementById('transaction-card').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const date = document.getElementById('transaction-date').value;
        const description = document.getElementById('transaction-description').value;
        const category = document.getElementById('transaction-category').value;
        
        if (transactionId) {
            // Edit existing transaction
            const transactionIndex = transactions.findIndex(t => t.id === transactionId);
            if (transactionIndex !== -1) {
                transactions[transactionIndex] = {
                    ...transactions[transactionIndex],
                    cardId,
                    amount,
                    date,
                    description,
                    category
                };
            }
        } else {
            // Add new transaction
            const newTransaction = {
                id: Date.now().toString(),
                cardId,
                amount,
                date,
                description,
                category,
                dateAdded: new Date().toISOString()
            };
            
            transactions.push(newTransaction);
        }
        
        localStorage.setItem('transactions', JSON.stringify(transactions));
        closeTransactionModal();
        renderTransactions();
        renderDashboard();
    }
    
    function deleteTransaction(transactionId) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            transactions = transactions.filter(transaction => transaction.id !== transactionId);
            
            localStorage.setItem('transactions', JSON.stringify(transactions));
            renderTransactions();
            renderDashboard();
        }
    }
    
    function renderTransactions() {
        let filteredTransactions = [...transactions];
        
        // Apply filters
        const selectedCardId = filterCardSelect.value;
        const selectedDateRange = filterDateSelect.value;
        
        if (selectedCardId !== 'all') {
            filteredTransactions = filteredTransactions.filter(transaction => transaction.cardId === selectedCardId);
        }
        
        if (selectedDateRange !== 'all') {
            const now = new Date();
            let startDate = new Date();
            
            if (selectedDateRange === 'this-month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (selectedDateRange === 'last-month') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                filteredTransactions = filteredTransactions.filter(transaction => {
                    const transactionDate = new Date(transaction.date);
                    return transactionDate >= startDate && transactionDate <= endDate;
                });
                // Early return for last-month since we have a specific end date
                if (filteredTransactions.length === 0) {
                    transactionsList.innerHTML = '<p class="empty-state">No transactions found with selected filters</p>';
                    return;
                }
            } else if (selectedDateRange === 'last-3-months') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            }
            
            // For this-month and last-3-months
            if (selectedDateRange !== 'last-month') {
                filteredTransactions = filteredTransactions.filter(transaction => {
                    const transactionDate = new Date(transaction.date);
                    return transactionDate >= startDate;
                });
            }
        }
        
        // Sort transactions by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (filteredTransactions.length === 0) {
            transactionsList.innerHTML = '<p class="empty-state">No transactions found with selected filters</p>';
            return;
        }
        
        transactionsList.innerHTML = '';
        
        filteredTransactions.forEach(transaction => {
            const card = cards.find(card => card.id === transaction.cardId);
            if (!card) return; // Skip if card no longer exists
            
            const transactionEl = document.createElement('div');
            transactionEl.className = 'transaction-item';
            
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
            
            transactionEl.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-icon">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.description}</h4>
                        <p>${formatDate(transaction.date)} • ${card.name} (${card.type})</p>
                    </div>
                </div>
                <div class="transaction-meta">
                    <div class="transaction-amount">$${transaction.amount.toFixed(2)}</div>
                    <div class="transaction-actions">
                        <button class="edit-transaction" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-transaction" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            
            transactionsList.appendChild(transactionEl);
            
            // Add event listeners
            const editBtn = transactionEl.querySelector('.edit-transaction');
            const deleteBtn = transactionEl.querySelector('.delete-transaction');
            
            editBtn.addEventListener('click', () => {
                const transactionToEdit = transactions.find(t => t.id === transaction.id);
                openTransactionModal(transactionToEdit);
            });
            
            deleteBtn.addEventListener('click', () => {
                deleteTransaction(transaction.id);
            });
        });
    }
    
    // Dashboard Functions
    function renderDashboard() {
        // Update card count
        totalCardsEl.textContent = cards.length;
        
        // Calculate total balance
        const totalBalance = cards.reduce((total, card) => total + card.balance, 0);
        totalBalanceEl.textContent = `$${totalBalance.toFixed(2)}`;
        
        // Calculate this month's spending
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const monthlyTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= firstDayOfMonth;
        });
        
        const monthlySpending = monthlyTransactions.reduce((total, transaction) => total + transaction.amount, 0);
        monthSpendingEl.textContent = `$${monthlySpending.toFixed(2)}`;
        
        // Render recent transactions
        renderRecentTransactions();
        
        // Render spending overview chart
        renderSpendingOverviewChart();
    }
    
    function renderRecentTransactions() {
        // Sort transactions by date (newest first) and get top 5
        const recentTransactions = [...transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        
        if (recentTransactions.length === 0) {
            recentTransactionsList.innerHTML = '<p class="empty-state">No recent transactions</p>';
            return;
        }
        
        recentTransactionsList.innerHTML = '';
        
        recentTransactions.forEach(transaction => {
            const card = cards.find(card => card.id === transaction.cardId);
            if (!card) return; // Skip if card no longer exists
            
            const transactionEl = document.createElement('div');
            transactionEl.className = 'transaction-item';
            
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
            
            transactionEl.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-icon">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.description}</h4>
                        <p>${formatDate(transaction.date)} • ${card.name}</p>
                    </div>
                </div>
                <div class="transaction-amount">$${transaction.amount.toFixed(2)}</div>
            `;
            
            recentTransactionsList.appendChild(transactionEl);
        });
    }
    
    // Analytics Functions
    function renderAnalytics() {
        renderMonthlySpendingChart();
        renderCategorySpendingChart();
        renderCreditUtilizationChart();
    }
    
    function renderSpendingOverviewChart() {
        if (!spendingChart) return;
        
        // Get last 6 months of data
        const labels = [];
        const data = [];
        
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = month.toLocaleString('default', { month: 'short' });
            labels.push(monthName);
            
            const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
            const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
            
            const monthlyTransactions = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate >= startDate && transactionDate <= endDate;
            });
            
            const monthlySpending = monthlyTransactions.reduce((total, transaction) => total + transaction.amount, 0);
            data.push(monthlySpending);
        }
        
        // Check if a chart instance already exists and destroy it
        if (window.spendingChartInstance) {
            window.spendingChartInstance.destroy();
        }
        
        window.spendingChartInstance = new Chart(spendingChart, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monthly Spending',
                    data: data,
                    backgroundColor: 'rgba(52, 152, 219, 0.6)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function renderMonthlySpendingChart() {
        if (!monthlySpendingChart) return;
        
        // Get last 12 months of data
        const labels = [];
        const data = [];
        
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = month.toLocaleString('default', { month: 'short' });
            labels.push(monthName);
            
            const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
            const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
            
            const monthlyTransactions = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate >= startDate && transactionDate <= endDate;
            });
            
            const monthlySpending = monthlyTransactions.reduce((total, transaction) => total + transaction.amount, 0);
            data.push(monthlySpending);
        }
        
        // Check if a chart instance already exists and destroy it
        if (window.monthlySpendingChartInstance) {
            window.monthlySpendingChartInstance.destroy();
        }
        
        window.monthlySpendingChartInstance = new Chart(monthlySpendingChart, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monthly Spending',
                    data: data,
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function renderCategorySpendingChart() {
        if (!categorySpendingChart) return;
        
        // Group transactions by category
        const categoryTotals = {};
        
        transactions.forEach(transaction => {
            if (!categoryTotals[transaction.category]) {
                categoryTotals[transaction.category] = 0;
            }
            categoryTotals[transaction.category] += transaction.amount;
        });
        
        const labels = [];
        const data = [];
        const backgroundColors = [
            'rgba(52, 152, 219, 0.7)',  // Blue
            'rgba(46, 204, 113, 0.7)',  // Green
            'rgba(231, 76, 60, 0.7)',   // Red
            'rgba(241, 196, 15, 0.7)',  // Yellow
            'rgba(155, 89, 182, 0.7)',  // Purple
            'rgba(230, 126, 34, 0.7)',  // Orange
            'rgba(127, 140, 141, 0.7)'  // Gray
        ];
        
        // Map category names to user-friendly labels
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
        
        Object.keys(categoryTotals).forEach((category, index) => {
            labels.push(categoryNames[category] || category);
            data.push(categoryTotals[category]);
        });
        
        // Check if a chart instance already exists and destroy it
        if (window.categorySpendingChartInstance) {
            window.categorySpendingChartInstance.destroy();
        }
        
        window.categorySpendingChartInstance = new Chart(categorySpendingChart, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const value = context.raw;
                                label += '$' + value.toFixed(2);
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function renderCreditUtilizationChart() {
        if (!creditUtilizationChart) return;
        
        const labels = [];
        const data = [];
        const backgroundColors = [];
        
        cards.forEach(card => {
            labels.push(card.name);
            
            const utilization = (card.balance / card.limit) * 100;
            data.push(utilization);
            
            // Set color based on utilization (green to red gradient)
            if (utilization < 30) {
                backgroundColors.push('rgba(46, 204, 113, 0.7)'); // Green
            } else if (utilization < 70) {
                backgroundColors.push('rgba(241, 196, 15, 0.7)'); // Yellow
            } else {
                backgroundColors.push('rgba(231, 76, 60, 0.7)'); // Red
            }
        });
        
        // Check if a chart instance already exists and destroy it
        if (window.creditUtilizationChartInstance) {
            window.creditUtilizationChartInstance.destroy();
        }
        
        window.creditUtilizationChartInstance = new Chart(creditUtilizationChart, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Credit Utilization (%)',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const value = context.raw;
                                label += value.toFixed(1) + '%';
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Helper Functions
    function formatExpiryDate(dateString) {
        if (!dateString) return 'N/A';
        const [year, month] = dateString.split('-');
        return `${month}/${year.slice(2)}`;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    
    function updateCardSelects() {
        // Update card selects in transaction form and filter
        transactionCardSelect.innerHTML = '<option value="">Select Card</option>';
        filterCardSelect.innerHTML = '<option value="all">All Cards</option>';
        
        cards.forEach(card => {
            const transactionOption = document.createElement('option');
            transactionOption.value = card.id;
            transactionOption.textContent = `${card.name} (*${card.number})`;
            transactionCardSelect.appendChild(transactionOption);
            
            const filterOption = document.createElement('option');
            filterOption.value = card.id;
            filterOption.textContent = `${card.name} (*${card.number})`;
            filterCardSelect.appendChild(filterOption);
        });
    }
    
    // Event Listeners - Cards
    addCardBtn.addEventListener('click', () => {
        openCardModal();
    });
    
    closeCardModal.addEventListener('click', closeCardModal);
    
    cancelCardBtn.addEventListener('click', closeCardModal);
    
    cardForm.addEventListener('submit', saveCard);
    
    // Event Listeners - Transactions
    addTransactionBtn.addEventListener('click', () => {
        if (cards.length === 0) {
            alert('Please add a card first before adding transactions.');
            return;
        }
        openTransactionModal();
    });
    
    closeTransactionModal.addEventListener('click', closeTransactionModal);
    
    cancelTransactionBtn.addEventListener('click', closeTransactionModal);
    
    transactionForm.addEventListener('submit', saveTransaction);
    
    // Event Listeners - Filters
    filterCardSelect.addEventListener('change', renderTransactions);
    filterDateSelect.addEventListener('change', renderTransactions);
    
    // Initialize the app
    updateCardSelects();
    renderDashboard();
    
    // Set up window click events for modals
    window.addEventListener('click', (e) => {
        if (e.target === cardModal) {
            closeCardModal();
        }
        if (e.target === transactionModal) {
            closeTransactionModal();
        }
    });
}); 