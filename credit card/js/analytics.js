// Analytics JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            initAnalytics(user);
        } else {
            // User is not signed in, redirect to index
            window.location.href = '../index.html';
        }
    });

    // Initialize analytics page
    function initAnalytics(user) {
        // Display user name
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.displayName || user.email || 'User';
        }
        
        // Mobile menu toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                document.querySelector('.nav-links').classList.toggle('active');
            });
        }

        // Fetch transactions and update analytics
        fetchTransactions(user.uid);

        // Set up period filters for all charts
        setupPeriodFilters();

        // Set up spending prediction
        setupSpendingPrediction();
    }

    // Fetch transactions from Firebase or localStorage
    function fetchTransactions(userId) {
        try {
            // Try to get from localStorage first (for demo)
            const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            
            if (transactions.length === 0) {
                // If no transactions, show empty state
                showEmptyState();
                return;
            }
            
            // Update all analytics views
            updateAllAnalytics(transactions);
            
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
                    
                    if (transactions.length === 0) {
                        showEmptyState();
                        return;
                    }
                    
                    updateAllAnalytics(transactions);
                })
                .catch(error => {
                    console.error('Error fetching transactions:', error);
                    showToast('Error loading transaction data', 'error');
                });
            */
        } catch (error) {
            console.error('Error fetching transactions:', error);
            showToast('Error loading transaction data', 'error');
        }
    }

    // Show empty state when no transactions
    function showEmptyState() {
        const analyticsContainer = document.querySelector('.analytics-container');
        if (analyticsContainer) {
            analyticsContainer.innerHTML = `
                <div class="analytics-full-width empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <h3>No transaction data available</h3>
                    <p>Add some transactions to see your spending analytics.</p>
                    <a href="transactions.html" class="btn primary-btn">
                        <i class="fas fa-plus"></i> Add Transactions
                    </a>
                </div>
            `;
        }
    }

    // Update all analytics views
    function updateAllAnalytics(transactions) {
        // Get cards for reference
        const cards = JSON.parse(localStorage.getItem('creditCards')) || [];
        
        // Default period is 'all'
        updateMonthlySpendingChart(transactions, 'all');
        updateCategoryBreakdown(transactions, 'all');
        updateSpendingTrends(transactions);
        updateSpendingMetrics(transactions, cards);
    }

    // Set up period filters for charts
    function setupPeriodFilters() {
        // Monthly spending period filter
        const spendingFilter = document.getElementById('spending-period-filter');
        if (spendingFilter) {
            const filterBtns = spendingFilter.querySelectorAll('.analytics-filter-btn');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update active state
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Get selected period
                    const period = btn.dataset.period;
                    
                    // Get transactions
                    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
                    
                    // Update chart
                    updateMonthlySpendingChart(transactions, period);
                });
            });
        }

        // Category breakdown period filter
        const categoryFilter = document.getElementById('category-period-filter');
        if (categoryFilter) {
            const filterBtns = categoryFilter.querySelectorAll('.analytics-filter-btn');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update active state
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Get selected period
                    const period = btn.dataset.period;
                    
                    // Get transactions
                    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
                    
                    // Update chart
                    updateCategoryBreakdown(transactions, period);
                });
            });
        }
    }

    // Filter transactions by period
    function filterTransactionsByPeriod(transactions, period) {
        if (period === 'all') {
            return transactions;
        }
        
        const now = new Date();
        let startDate;
        
        switch(period) {
            case '30d':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 90);
                break;
            case '1y':
                startDate = new Date(now);
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                return transactions;
        }
        
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= startDate;
        });
    }

    // Update monthly spending chart
    function updateMonthlySpendingChart(allTransactions, period) {
        const ctx = document.getElementById('monthly-spending-chart');
        if (!ctx) return;
        
        const filteredTransactions = filterTransactionsByPeriod(allTransactions, period);
        
        // Group transactions by month
        const monthlySpending = groupTransactionsByMonth(filteredTransactions);
        
        // Calculate average line
        const monthlyValues = Object.values(monthlySpending);
        const average = monthlyValues.reduce((sum, value) => sum + value, 0) / monthlyValues.length;
        
        // Destroy existing chart if it exists
        if (window.monthlySpendingChart instanceof Chart) {
            window.monthlySpendingChart.destroy();
        }
        
        // Get labels and data
        const labels = Object.keys(monthlySpending);
        const data = Object.values(monthlySpending);
        
        // Create chart
        window.monthlySpendingChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Monthly Spending',
                        data: data,
                        backgroundColor: 'rgba(58, 123, 213, 0.7)',
                        borderColor: 'rgba(58, 123, 213, 1)',
                        borderWidth: 1,
                        borderRadius: 6,
                        barPercentage: 0.6,
                    },
                    {
                        label: 'Average',
                        data: Array(labels.length).fill(average),
                        type: 'line',
                        borderColor: 'rgba(46, 204, 113, 0.8)',
                        backgroundColor: 'rgba(46, 204, 113, 0)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: $${value.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
        
        // Update monthly average metric
        const avgSpendElement = document.getElementById('avg-monthly-spend');
        if (avgSpendElement) {
            avgSpendElement.textContent = `$${average.toFixed(2)}`;
        }
    }

    // Group transactions by month
    function groupTransactionsByMonth(transactions) {
        const monthlySpending = {};
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const month = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            
            if (!monthlySpending[month]) {
                monthlySpending[month] = 0;
            }
            
            monthlySpending[month] += parseFloat(transaction.amount || 0);
        });
        
        return monthlySpending;
    }

    // Update category breakdown
    function updateCategoryBreakdown(allTransactions, period) {
        const ctx = document.getElementById('category-breakdown-chart');
        if (!ctx) return;
        
        const filteredTransactions = filterTransactionsByPeriod(allTransactions, period);
        
        // Group by category
        const categorySpending = {};
        
        filteredTransactions.forEach(transaction => {
            const category = transaction.category || 'Other';
            
            if (!categorySpending[category]) {
                categorySpending[category] = 0;
            }
            
            categorySpending[category] += parseFloat(transaction.amount || 0);
        });
        
        // Sort categories by amount
        const sortedCategories = Object.entries(categorySpending)
            .sort((a, b) => b[1] - a[1]);
        
        // Prepare chart data
        const labels = sortedCategories.map(([category]) => formatCategoryName(category));
        const data = sortedCategories.map(([, amount]) => amount);
        
        // Get colors
        const colors = getCategoryColors(sortedCategories.map(([category]) => category));
        
        // Destroy existing chart if it exists
        if (window.categoryBreakdownChart instanceof Chart) {
            window.categoryBreakdownChart.destroy();
        }
        
        // Create chart
        window.categoryBreakdownChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
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
        
        // Update top spending categories
        updateTopCategories(sortedCategories);
    }

    // Update top spending categories
    function updateTopCategories(sortedCategories) {
        const topCategoriesElement = document.getElementById('top-categories');
        if (!topCategoriesElement) return;
        
        // Get total spending
        const totalSpending = sortedCategories.reduce((total, [, amount]) => total + amount, 0);
        
        // Display top 5 categories
        const topCategories = sortedCategories.slice(0, 5);
        
        topCategoriesElement.innerHTML = '';
        
        topCategories.forEach(([category, amount]) => {
            const percent = ((amount / totalSpending) * 100).toFixed(1);
            const formattedCategory = formatCategoryName(category);
            
            // Get icon for category
            const icon = getCategoryIcon(category);
            
            const categoryEl = document.createElement('div');
            categoryEl.className = 'category-item';
            categoryEl.innerHTML = `
                <div class="category-name">
                    <div class="category-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="category-details">
                        <div>${formattedCategory}</div>
                        <div class="category-percent">${percent}% of total</div>
                    </div>
                </div>
                <div class="category-amount">$${amount.toFixed(2)}</div>
                <div class="category-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
            
            topCategoriesElement.appendChild(categoryEl);
        });
    }

    // Get category icon
    function getCategoryIcon(category) {
        const categoryIcons = {
            'food': 'fa-utensils',
            'dining': 'fa-utensils',
            'shopping': 'fa-shopping-bag',
            'bills': 'fa-file-invoice-dollar',
            'utilities': 'fa-bolt',
            'entertainment': 'fa-film',
            'travel': 'fa-plane',
            'transportation': 'fa-car',
            'health': 'fa-heartbeat',
            'education': 'fa-graduation-cap',
            'housing': 'fa-home',
            'groceries': 'fa-shopping-basket',
            'personal': 'fa-user',
            'gifts': 'fa-gift',
            'other': 'fa-receipt'
        };
        
        const lowercaseCategory = category.toLowerCase();
        
        for (const [key, icon] of Object.entries(categoryIcons)) {
            if (lowercaseCategory.includes(key)) {
                return icon;
            }
        }
        
        return 'fa-receipt'; // Default icon
    }

    // Format category name
    function formatCategoryName(category) {
        // Convert camelCase or snake_case to Title Case with spaces
        return category
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
            .replace(/_/g, ' ') // Replace underscores with spaces
            .replace(/^\w/, c => c.toUpperCase()) // Capitalize first letter
            .trim();
    }

    // Get category colors
    function getCategoryColors(categories) {
        const colorMap = {
            'food': 'rgba(231, 76, 60, 0.8)',
            'dining': 'rgba(231, 76, 60, 0.8)',
            'shopping': 'rgba(155, 89, 182, 0.8)',
            'bills': 'rgba(52, 152, 219, 0.8)',
            'utilities': 'rgba(52, 152, 219, 0.8)',
            'entertainment': 'rgba(241, 196, 15, 0.8)',
            'travel': 'rgba(230, 126, 34, 0.8)',
            'transportation': 'rgba(230, 126, 34, 0.8)',
            'health': 'rgba(46, 204, 113, 0.8)',
            'education': 'rgba(52, 73, 94, 0.8)',
            'housing': 'rgba(22, 160, 133, 0.8)',
            'groceries': 'rgba(39, 174, 96, 0.8)',
            'personal': 'rgba(41, 128, 185, 0.8)',
            'gifts': 'rgba(142, 68, 173, 0.8)',
            'other': 'rgba(149, 165, 166, 0.8)'
        };
        
        return categories.map(category => {
            const lowercaseCategory = category.toLowerCase();
            
            for (const [key, color] of Object.entries(colorMap)) {
                if (lowercaseCategory.includes(key)) {
                    return color;
                }
            }
            
            return 'rgba(149, 165, 166, 0.8)'; // Default color (gray)
        });
    }

    // Update spending trends
    function updateSpendingTrends(transactions) {
        // Calculate weekday spending
        updateWeekdaySpending(transactions);
        
        // Calculate merchant spending
        updateTopMerchants(transactions);
    }

    // Update weekday spending
    function updateWeekdaySpending(transactions) {
        const ctx = document.getElementById('weekday-spending-chart');
        if (!ctx) return;
        
        // Group by weekday
        const weekdaySpending = {
            'Sunday': 0,
            'Monday': 0,
            'Tuesday': 0,
            'Wednesday': 0,
            'Thursday': 0,
            'Friday': 0,
            'Saturday': 0
        };
        
        const weekdayCount = {
            'Sunday': 0,
            'Monday': 0,
            'Tuesday': 0,
            'Wednesday': 0,
            'Thursday': 0,
            'Friday': 0,
            'Saturday': 0
        };
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const weekday = date.toLocaleString('default', { weekday: 'long' });
            
            weekdaySpending[weekday] += parseFloat(transaction.amount || 0);
            weekdayCount[weekday]++;
        });
        
        // Calculate average spending per weekday
        const weekdayAvg = {};
        for (const day in weekdaySpending) {
            weekdayAvg[day] = weekdayCount[day] > 0 ? weekdaySpending[day] / weekdayCount[day] : 0;
        }
        
        // Reorder days to start with Monday
        const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const labels = orderedDays;
        const data = orderedDays.map(day => weekdayAvg[day]);
        
        // Destroy existing chart if it exists
        if (window.weekdaySpendingChart instanceof Chart) {
            window.weekdaySpendingChart.destroy();
        }
        
        // Create chart
        window.weekdaySpendingChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Avg. Spending per Day',
                    data: data,
                    backgroundColor: 'rgba(46, 204, 113, 0.7)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `$${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
        
        // Find highest spending day
        const highestDay = orderedDays.reduce((max, day) => 
            weekdayAvg[day] > weekdayAvg[max] ? day : max, orderedDays[0]);
            
        // Find lowest spending day
        const lowestDay = orderedDays.reduce((min, day) => 
            weekdayAvg[day] < weekdayAvg[min] && weekdayAvg[day] > 0 ? day : min, orderedDays[0]);
            
        // Update highest spending day
        const highestDayElement = document.getElementById('highest-spending-day');
        if (highestDayElement) {
            highestDayElement.textContent = highestDay;
        }
        
        // Update highest spending amount
        const highestAmountElement = document.getElementById('highest-spending-amount');
        if (highestAmountElement) {
            highestAmountElement.textContent = `$${weekdayAvg[highestDay].toFixed(2)}`;
        }
        
        // Update lowest spending day
        const lowestDayElement = document.getElementById('lowest-spending-day');
        if (lowestDayElement) {
            lowestDayElement.textContent = lowestDay;
        }
    }

    // Update top merchants
    function updateTopMerchants(transactions) {
        const topMerchantsList = document.getElementById('top-merchants');
        if (!topMerchantsList) return;
        
        // Group by merchant
        const merchantSpending = {};
        
        transactions.forEach(transaction => {
            const merchant = transaction.description || 'Unknown';
            
            if (!merchantSpending[merchant]) {
                merchantSpending[merchant] = 0;
            }
            
            merchantSpending[merchant] += parseFloat(transaction.amount || 0);
        });
        
        // Sort merchants by amount
        const sortedMerchants = Object.entries(merchantSpending)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Top 5
            
        // Check if we have any merchants
        if (sortedMerchants.length === 0) {
            topMerchantsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-store"></i>
                    <p>No merchant data available</p>
                </div>
            `;
            return;
        }
        
        // Calculate total spending
        const totalSpending = Object.values(merchantSpending).reduce((sum, amount) => sum + amount, 0);
        
        // Display top merchants
        topMerchantsList.innerHTML = '';
        
        sortedMerchants.forEach(([merchant, amount]) => {
            const percent = ((amount / totalSpending) * 100).toFixed(1);
            
            const merchantEl = document.createElement('div');
            merchantEl.className = 'trend-item';
            merchantEl.innerHTML = `
                <div class="trend-title">
                    <i class="fas fa-store"></i> ${merchant}
                </div>
                <div class="trend-value">$${amount.toFixed(2)}</div>
                <div class="category-percent">${percent}% of total spending</div>
            `;
            
            topMerchantsList.appendChild(merchantEl);
        });
    }

    // Update spending metrics
    function updateSpendingMetrics(transactions, cards) {
        // Calculate total spending
        const totalSpending = transactions.reduce((sum, transaction) => 
            sum + parseFloat(transaction.amount || 0), 0);
            
        // Update total spending
        const totalSpendingElement = document.getElementById('total-spending');
        if (totalSpendingElement) {
            totalSpendingElement.textContent = `$${totalSpending.toFixed(2)}`;
        }
        
        // Calculate average transaction size
        const avgTransaction = transactions.length > 0 ? 
            totalSpending / transactions.length : 0;
            
        // Update average transaction
        const avgTransactionElement = document.getElementById('avg-transaction');
        if (avgTransactionElement) {
            avgTransactionElement.textContent = `$${avgTransaction.toFixed(2)}`;
        }
        
        // Calculate utilization rate
        const totalLimit = cards.reduce((sum, card) => sum + parseFloat(card.limit || 0), 0);
        const totalBalance = cards.reduce((sum, card) => sum + parseFloat(card.balance || 0), 0);
        const utilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
        
        // Update utilization rate
        const utilizationElement = document.getElementById('utilization-rate');
        if (utilizationElement) {
            utilizationElement.textContent = `${utilization.toFixed(1)}%`;
            
            // Add color based on utilization
            if (utilization > 75) {
                utilizationElement.style.color = '#e74c3c';
            } else if (utilization > 30) {
                utilizationElement.style.color = '#f39c12';
            } else {
                utilizationElement.style.color = '#2ecc71';
            }
        }
    }

    // Set up spending prediction
    function setupSpendingPrediction() {
        const ctx = document.getElementById('spending-prediction-chart');
        if (!ctx) return;
        
        // Get transactions
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        
        // Group by month
        const monthlySpending = groupTransactionsByMonth(transactions);
        
        // Get the last 12 months or all available months if less than 12
        const months = Object.keys(monthlySpending);
        const values = Object.values(monthlySpending);
        
        // We need at least 3 months of data for prediction
        if (months.length < 3) {
            const predictionContainer = document.getElementById('prediction-container');
            if (predictionContainer) {
                predictionContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-chart-line"></i>
                        <p>Need at least 3 months of data for predictions</p>
                    </div>
                `;
            }
            return;
        }
        
        // Use simple linear regression for prediction
        const predictedValues = predictNextMonths(values, 3);
        
        // Create labels for next 3 months
        const lastMonth = new Date(months[months.length - 1]);
        const nextMonths = [];
        
        for (let i = 1; i <= 3; i++) {
            const nextMonth = new Date(lastMonth);
            nextMonth.setMonth(nextMonth.getMonth() + i);
            nextMonths.push(`${nextMonth.toLocaleString('default', { month: 'short' })} ${nextMonth.getFullYear()}`);
        }
        
        // Combine existing and predicted data
        const allMonths = [...months, ...nextMonths];
        const allValues = [...values, ...predictedValues];
        
        // Create separate datasets for actual and predicted
        const actualData = [...values, null, null, null];
        const predictedData = [null, ...predictedValues];
        
        // Destroy existing chart if it exists
        if (window.spendingPredictionChart instanceof Chart) {
            window.spendingPredictionChart.destroy();
        }
        
        // Create chart
        window.spendingPredictionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: allMonths,
                datasets: [
                    {
                        label: 'Actual Spending',
                        data: actualData,
                        borderColor: 'rgba(58, 123, 213, 1)',
                        backgroundColor: 'rgba(58, 123, 213, 0.1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: 'rgba(58, 123, 213, 1)',
                        fill: true,
                        tension: 0.1
                    },
                    {
                        label: 'Predicted Spending',
                        data: predictedData,
                        borderColor: 'rgba(231, 76, 60, 1)',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: 'rgba(231, 76, 60, 1)',
                        fill: true,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: $${value ? value.toFixed(2) : 0}`;
                            }
                        }
                    }
                }
            }
        });
        
        // Update predicted spending for next month
        const nextMonthSpendElement = document.getElementById('next-month-spend');
        if (nextMonthSpendElement && predictedValues.length > 0) {
            nextMonthSpendElement.textContent = `$${predictedValues[0].toFixed(2)}`;
        }
    }

    // Predict next months using simple linear regression
    function predictNextMonths(data, numMonths = 3) {
        // Need at least 2 data points
        if (data.length < 2) return [];
        
        // Calculate linear regression
        const n = data.length;
        const indices = Array.from({ length: n }, (_, i) => i);
        
        // Calculate sums
        const sumX = indices.reduce((sum, x) => sum + x, 0);
        const sumY = data.reduce((sum, y) => sum + y, 0);
        const sumXY = indices.reduce((sum, x, i) => sum + x * data[i], 0);
        const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
        
        // Calculate slope and intercept
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Predict next months
        const predictions = [];
        for (let i = 1; i <= numMonths; i++) {
            const x = n + i - 1;
            const prediction = intercept + slope * x;
            predictions.push(Math.max(0, prediction)); // Ensure prediction is not negative
        }
        
        return predictions;
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
}); 