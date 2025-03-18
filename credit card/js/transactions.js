// Transactions JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            initTransactionsPage(user);
        } else {
            // User is not signed in, redirect to index
            window.location.href = '../index.html';
        }
    });

    // Initialize transactions page
    function initTransactionsPage(user) {
        // Display user name
        document.getElementById('user-name').textContent = user.displayName || 'User';
        
        // Event listener for logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            firebase.auth().signOut()
                .then(() => {
                    window.location.href = '../index.html';
                })
                .catch(error => {
                    console.error('Error signing out:', error);
                });
        });

        // Fetch cards and transactions
        fetchCards(user.uid);
        fetchTransactions(user.uid);
        
        // Add transaction button listener
        document.getElementById('add-transaction-btn').addEventListener('click', () => {
            if (getCards().length === 0) {
                alert('Please add at least one card before adding transactions.');
                window.location.href = 'cards.html';
                return;
            }
            openTransactionModal();
        });
        
        // Transaction modal close button
        document.querySelector('#transaction-modal .close').addEventListener('click', closeTransactionModal);
        
        // Cancel button in transaction modal
        document.getElementById('cancel-transaction').addEventListener('click', closeTransactionModal);
        
        // Transaction form submission
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            saveTransaction(e, user.uid);
        });
        
        // Filter change listeners
        document.getElementById('card-filter').addEventListener('change', filterTransactions);
        document.getElementById('date-filter').addEventListener('change', filterTransactions);
        document.getElementById('category-filter').addEventListener('change', filterTransactions);
        document.getElementById('min-amount').addEventListener('input', filterTransactions);
        document.getElementById('max-amount').addEventListener('input', filterTransactions);
    }

    // Fetch cards for dropdown
    function fetchCards(userId) {
        try {
            // Try to get from localStorage first (for demo)
            const cards = JSON.parse(localStorage.getItem('creditCards')) || [];
            populateCardSelects(cards);
            
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
                    populateCardSelects(cards);
                })
                .catch(error => {
                    console.error('Error fetching cards:', error);
                });
            */
        } catch (error) {
            console.error('Error fetching cards:', error);
        }
    }

    // Populate card select dropdowns
    function populateCardSelects(cards) {
        const cardFilterSelect = document.getElementById('card-filter');
        const transactionCardSelect = document.getElementById('transaction-card');
        
        // Clear existing options
        cardFilterSelect.innerHTML = '<option value="all">All Cards</option>';
        transactionCardSelect.innerHTML = '<option value="">Select Card</option>';
        
        // Add card options
        cards.forEach(card => {
            const filterOption = document.createElement('option');
            filterOption.value = card.id;
            filterOption.textContent = `${card.name} (*${card.number})`;
            cardFilterSelect.appendChild(filterOption);
            
            const transactionOption = document.createElement('option');
            transactionOption.value = card.id;
            transactionOption.textContent = `${card.name} (*${card.number})`;
            transactionCardSelect.appendChild(transactionOption);
        });
    }

    // Fetch transactions
    function fetchTransactions(userId) {
        try {
            // Try to get from localStorage first (for demo)
            const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            renderTransactions(transactions);
            updateTransactionSummary(transactions);
            
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
                    renderTransactions(transactions);
                    updateTransactionSummary(transactions);
                })
                .catch(error => {
                    console.error('Error fetching transactions:', error);
                });
            */
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    }

    // Get filtered transactions
    function getFilteredTransactions() {
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        
        const cardFilter = document.getElementById('card-filter').value;
        const dateFilter = document.getElementById('date-filter').value;
        const categoryFilter = document.getElementById('category-filter').value;
        const minAmount = parseFloat(document.getElementById('min-amount').value) || 0;
        const maxAmount = parseFloat(document.getElementById('max-amount').value) || Infinity;
        
        return transactions.filter(transaction => {
            // Card filter
            if (cardFilter !== 'all' && transaction.cardId !== cardFilter) {
                return false;
            }
            
            // Date filter
            if (dateFilter !== 'all') {
                const transactionDate = new Date(transaction.date);
                const now = new Date();
                let startDate;
                
                switch (dateFilter) {
                    case 'this-month':
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                        if (transactionDate < startDate) return false;
                        break;
                    case 'last-month':
                        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                        if (transactionDate < startDate || transactionDate > endDate) return false;
                        break;
                    case 'last-3-months':
                        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                        if (transactionDate < startDate) return false;
                        break;
                    case 'custom':
                        // Could implement custom date range picker later
                        break;
                }
            }
            
            // Category filter
            if (categoryFilter !== 'all' && transaction.category !== categoryFilter) {
                return false;
            }
            
            // Amount filter
            const amount = parseFloat(transaction.amount);
            if (amount < minAmount || amount > maxAmount) {
                return false;
            }
            
            return true;
        });
    }

    // Filter transactions based on selected filters
    function filterTransactions() {
        const filteredTransactions = getFilteredTransactions();
        renderTransactions(filteredTransactions);
        updateTransactionSummary(filteredTransactions);
    }

    // Update transaction summary
    function updateTransactionSummary(transactions) {
        const totalTransactionsEl = document.getElementById('total-transactions');
        const totalAmountEl = document.getElementById('total-amount');
        const avgTransactionEl = document.getElementById('avg-transaction');
        
        const totalTransactions = transactions.length;
        const totalAmount = transactions.reduce((sum, transaction) => sum + parseFloat(transaction.amount || 0), 0);
        const avgTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
        
        totalTransactionsEl.textContent = totalTransactions;
        totalAmountEl.textContent = `$${totalAmount.toFixed(2)}`;
        avgTransactionEl.textContent = `$${avgTransaction.toFixed(2)}`;
    }

    // Render transactions list
    function renderTransactions(transactions) {
        const transactionsContainer = document.getElementById('transactions-container');
        
        if (transactions.length === 0) {
            transactionsContainer.innerHTML = '<p class="empty-state">No transactions found. Add your first transaction or adjust your filters.</p>';
            return;
        }
        
        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        transactionsContainer.innerHTML = '';
        
        const cards = getCards();
        
        transactions.forEach(transaction => {
            const card = cards.find(c => c.id === transaction.cardId) || { name: 'Unknown Card' };
            
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
            
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item';
            
            transactionItem.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-icon">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.description || 'Unnamed Transaction'}</h4>
                        <p>${formatDate(transaction.date)} • ${card.name}</p>
                    </div>
                </div>
                <div class="transaction-meta">
                    <div class="transaction-amount">$${parseFloat(transaction.amount || 0).toFixed(2)}</div>
                    <div class="transaction-actions">
                        <button class="edit-transaction" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-transaction" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            
            transactionsContainer.appendChild(transactionItem);
            
            // Add event listeners
            const editBtn = transactionItem.querySelector('.edit-transaction');
            const deleteBtn = transactionItem.querySelector('.delete-transaction');
            
            editBtn.addEventListener('click', () => {
                openTransactionModal(transaction);
            });
            
            deleteBtn.addEventListener('click', () => {
                deleteTransaction(transaction.id);
            });
        });
    }

    // Open add/edit transaction modal
    function openTransactionModal(transaction = null) {
        const modal = document.getElementById('transaction-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('transaction-form');
        const transactionIdInput = document.getElementById('transaction-id');
        const transactionCardSelect = document.getElementById('transaction-card');
        const transactionAmountInput = document.getElementById('transaction-amount');
        const transactionDateInput = document.getElementById('transaction-date');
        const transactionCategoryInput = document.getElementById('transaction-category');
        const transactionDescriptionInput = document.getElementById('transaction-description');
        
        // Reset form
        form.reset();
        
        // Set today's date as default for new transactions
        if (!transaction) {
            const today = new Date().toISOString().split('T')[0];
            transactionDateInput.value = today;
        }
        
        if (transaction) {
            // Edit existing transaction
            modalTitle.textContent = 'Edit Transaction';
            transactionIdInput.value = transaction.id;
            transactionCardSelect.value = transaction.cardId;
            transactionAmountInput.value = transaction.amount;
            transactionDateInput.value = transaction.date;
            transactionCategoryInput.value = transaction.category;
            transactionDescriptionInput.value = transaction.description;
        } else {
            // Add new transaction
            modalTitle.textContent = 'Add Transaction';
            transactionIdInput.value = '';
        }
        
        modal.style.display = 'flex';
    }

    // Close transaction modal
    function closeTransactionModal() {
        const modal = document.getElementById('transaction-modal');
        modal.style.display = 'none';
    }

    // Save transaction
    function saveTransaction(e, userId) {
        e.preventDefault();
        
        const transactionId = document.getElementById('transaction-id').value;
        const cardId = document.getElementById('transaction-card').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const date = document.getElementById('transaction-date').value;
        const category = document.getElementById('transaction-category').value;
        const description = document.getElementById('transaction-description').value;
        
        // Get existing transactions
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        
        if (transactionId) {
            // Update existing transaction
            const transactionIndex = transactions.findIndex(t => t.id === transactionId);
            
            if (transactionIndex !== -1) {
                transactions[transactionIndex] = {
                    ...transactions[transactionIndex],
                    cardId,
                    amount,
                    date,
                    category,
                    description,
                    updatedAt: new Date().toISOString()
                };
            }
            
            // Update in Firebase
            /*
            db.collection('users').doc(userId).collection('transactions').doc(transactionId)
                .update({
                    cardId,
                    amount,
                    date,
                    category,
                    description,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    closeTransactionModal();
                    fetchTransactions(userId);
                })
                .catch(error => {
                    console.error('Error updating transaction:', error);
                    alert('Error updating transaction. Please try again.');
                });
            */
        } else {
            // Add new transaction
            const newTransaction = {
                id: Date.now().toString(),
                cardId,
                amount,
                date,
                category,
                description,
                createdAt: new Date().toISOString()
            };
            
            transactions.push(newTransaction);
            
            // Update card balance
            updateCardBalance(cardId, amount);
            
            // Add to Firebase
            /*
            db.collection('users').doc(userId).collection('transactions')
                .add({
                    cardId,
                    amount,
                    date,
                    category,
                    description,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    // Update card balance in Firebase
                    const cardRef = db.collection('users').doc(userId).collection('cards').doc(cardId);
                    
                    return db.runTransaction(transaction => {
                        return transaction.get(cardRef).then(cardDoc => {
                            if (!cardDoc.exists) {
                                throw "Card does not exist!";
                            }
                            
                            const newBalance = cardDoc.data().balance + amount;
                            transaction.update(cardRef, { balance: newBalance });
                        });
                    });
                })
                .then(() => {
                    closeTransactionModal();
                    fetchTransactions(userId);
                })
                .catch(error => {
                    console.error('Error adding transaction:', error);
                    alert('Error adding transaction. Please try again.');
                });
            */
        }
        
        // Save to localStorage
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        // Close modal and refresh transactions
        closeTransactionModal();
        filterTransactions();
    }

    // Update card balance when adding transaction
    function updateCardBalance(cardId, amount) {
        const cards = JSON.parse(localStorage.getItem('creditCards')) || [];
        const cardIndex = cards.findIndex(card => card.id === cardId);
        
        if (cardIndex !== -1) {
            cards[cardIndex].balance = (parseFloat(cards[cardIndex].balance) || 0) + amount;
            localStorage.setItem('creditCards', JSON.stringify(cards));
        }
    }

    // Delete transaction
    function deleteTransaction(transactionId) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            // Get transaction details first to update card balance
            const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            const transaction = transactions.find(t => t.id === transactionId);
            
            if (transaction) {
                // Reverse the effect on card balance
                updateCardBalance(transaction.cardId, -parseFloat(transaction.amount));
                
                // Remove transaction
                const updatedTransactions = transactions.filter(t => t.id !== transactionId);
                localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
                
                // Refresh transactions list
                filterTransactions();
                
                // Delete from Firebase
                /*
                db.collection('users').doc(userId).collection('transactions').doc(transactionId)
                    .delete()
                    .then(() => {
                        // Update card balance in Firebase
                        const cardRef = db.collection('users').doc(userId).collection('cards').doc(transaction.cardId);
                        
                        return db.runTransaction(transaction => {
                            return transaction.get(cardRef).then(cardDoc => {
                                if (!cardDoc.exists) {
                                    throw "Card does not exist!";
                                }
                                
                                const newBalance = cardDoc.data().balance - parseFloat(transaction.amount);
                                transaction.update(cardRef, { balance: newBalance });
                            });
                        });
                    })
                    .then(() => {
                        fetchTransactions(userId);
                    })
                    .catch(error => {
                        console.error('Error deleting transaction:', error);
                        alert('Error deleting transaction. Please try again.');
                    });
                */
            }
        }
    }

    // Helper function to get cards
    function getCards() {
        return JSON.parse(localStorage.getItem('creditCards')) || [];
    }

    // Helper function to format date
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('transaction-modal');
        if (e.target === modal) {
            closeTransactionModal();
        }
    });
}); 