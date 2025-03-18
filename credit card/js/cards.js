// Cards JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            initCardsPage(user);
        } else {
            // User is not signed in, redirect to index
            window.location.href = '../index.html';
        }
    });

    // Initialize cards page
    function initCardsPage(user) {
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

        // Fetch and display cards
        fetchCards(user.uid);
        
        // Add card button listener
        document.getElementById('add-card-btn').addEventListener('click', () => {
            openCardModal();
        });
        
        // Card modal close button
        document.querySelector('#card-modal .close').addEventListener('click', closeCardModal);
        
        // Cancel button in card modal
        document.getElementById('cancel-card').addEventListener('click', closeCardModal);
        
        // Card form submission
        document.getElementById('card-form').addEventListener('submit', (e) => {
            saveCard(e, user.uid);
        });
    }

    // Fetch cards from Firebase or localStorage
    function fetchCards(userId) {
        try {
            // Try to get from localStorage first (for demo)
            const cards = JSON.parse(localStorage.getItem('creditCards')) || [];
            renderCards(cards);
            
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
                    renderCards(cards);
                })
                .catch(error => {
                    console.error('Error fetching cards:', error);
                });
            */
        } catch (error) {
            console.error('Error fetching cards:', error);
        }
    }

    // Render cards on the page
    function renderCards(cards) {
        const cardsContainer = document.getElementById('cards-container');
        
        if (cards.length === 0) {
            cardsContainer.innerHTML = '<p class="empty-state">No cards added yet. Click the "Add New Card" button to get started.</p>';
            return;
        }
        
        cardsContainer.innerHTML = '';
        
        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card-item';
            cardEl.style.backgroundColor = card.color || '#2c3e50';
            
            cardEl.innerHTML = `
                <div class="card-header">
                    <span class="card-type">${card.type || 'Credit Card'}</span>
                    <div class="card-actions">
                        <button class="edit-card" data-id="${card.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-card" data-id="${card.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="card-number">**** **** **** ${card.number || '0000'}</div>
                <div class="card-details">
                    <div>
                        <div class="card-name">${card.name || 'My Card'}</div>
                        <div class="card-expires">Expires: ${formatExpiry(card.expiry)}</div>
                    </div>
                </div>
                <div class="card-balance">
                    <div>Balance: $${parseFloat(card.balance || 0).toFixed(2)}</div>
                    <div>Credit Limit: $${parseFloat(card.limit || 0).toFixed(2)}</div>
                </div>
            `;
            
            cardsContainer.appendChild(cardEl);
            
            // Add event listeners for card actions
            const editBtn = cardEl.querySelector('.edit-card');
            const deleteBtn = cardEl.querySelector('.delete-card');
            
            editBtn.addEventListener('click', () => {
                openCardModal(card);
            });
            
            deleteBtn.addEventListener('click', () => {
                deleteCard(card.id);
            });
        });
    }

    // Open add/edit card modal
    function openCardModal(card = null) {
        const modal = document.getElementById('card-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('card-form');
        const cardIdInput = document.getElementById('card-id');
        const cardNameInput = document.getElementById('card-name');
        const cardTypeInput = document.getElementById('card-type');
        const cardNumberInput = document.getElementById('card-number');
        const creditLimitInput = document.getElementById('credit-limit');
        const aprInput = document.getElementById('apr');
        const dueDateInput = document.getElementById('due-date');
        const cardColorInput = document.getElementById('card-color');
        
        // Reset form
        form.reset();
        
        if (card) {
            // Edit existing card
            modalTitle.textContent = 'Edit Card';
            cardIdInput.value = card.id;
            cardNameInput.value = card.name || '';
            cardTypeInput.value = card.type || '';
            cardNumberInput.value = card.number || '';
            creditLimitInput.value = card.limit || '';
            aprInput.value = card.apr || '';
            dueDateInput.value = card.dueDate || '';
            cardColorInput.value = card.color || '#2c3e50';
        } else {
            // Add new card
            modalTitle.textContent = 'Add New Card';
            cardIdInput.value = '';
            cardColorInput.value = '#2c3e50';
        }
        
        modal.style.display = 'flex';
    }

    // Close card modal
    function closeCardModal() {
        const modal = document.getElementById('card-modal');
        modal.style.display = 'none';
    }

    // Save card
    function saveCard(e, userId) {
        e.preventDefault();
        
        const cardId = document.getElementById('card-id').value;
        const name = document.getElementById('card-name').value;
        const type = document.getElementById('card-type').value;
        const number = document.getElementById('card-number').value;
        const limit = parseFloat(document.getElementById('credit-limit').value);
        const apr = parseFloat(document.getElementById('apr').value);
        const dueDate = parseInt(document.getElementById('due-date').value);
        const color = document.getElementById('card-color').value;
        
        // Get existing cards from localStorage
        const cards = JSON.parse(localStorage.getItem('creditCards')) || [];
        
        if (cardId) {
            // Update existing card
            const cardIndex = cards.findIndex(card => card.id === cardId);
            
            if (cardIndex !== -1) {
                cards[cardIndex] = {
                    ...cards[cardIndex],
                    name,
                    type,
                    number,
                    limit,
                    apr,
                    dueDate,
                    color,
                    balance: cards[cardIndex].balance || 0,
                    updatedAt: new Date().toISOString()
                };
            }
            
            // Update in Firebase
            /*
            db.collection('users').doc(userId).collection('cards').doc(cardId)
                .update({
                    name,
                    type,
                    number,
                    limit,
                    apr,
                    dueDate,
                    color,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    closeCardModal();
                    fetchCards(userId);
                })
                .catch(error => {
                    console.error('Error updating card:', error);
                    alert('Error updating card. Please try again.');
                });
            */
        } else {
            // Add new card
            const newCard = {
                id: Date.now().toString(),
                name,
                type,
                number,
                limit,
                apr,
                dueDate,
                color,
                balance: 0,
                createdAt: new Date().toISOString()
            };
            
            cards.push(newCard);
            
            // Add to Firebase
            /*
            db.collection('users').doc(userId).collection('cards')
                .add({
                    name,
                    type,
                    number,
                    limit,
                    apr,
                    dueDate,
                    color,
                    balance: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    closeCardModal();
                    fetchCards(userId);
                })
                .catch(error => {
                    console.error('Error adding card:', error);
                    alert('Error adding card. Please try again.');
                });
            */
        }
        
        // Save to localStorage
        localStorage.setItem('creditCards', JSON.stringify(cards));
        
        // Close modal and refresh cards
        closeCardModal();
        renderCards(cards);
    }

    // Delete card
    function deleteCard(cardId) {
        if (confirm('Are you sure you want to delete this card? This will also delete all transactions associated with this card.')) {
            // Get existing cards and transactions
            const cards = JSON.parse(localStorage.getItem('creditCards')) || [];
            const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            
            // Remove card
            const updatedCards = cards.filter(card => card.id !== cardId);
            
            // Remove associated transactions
            const updatedTransactions = transactions.filter(transaction => transaction.cardId !== cardId);
            
            // Update localStorage
            localStorage.setItem('creditCards', JSON.stringify(updatedCards));
            localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
            
            // Refresh cards list
            renderCards(updatedCards);
            
            // Delete from Firebase
            /*
            db.collection('users').doc(userId).collection('cards').doc(cardId)
                .delete()
                .then(() => {
                    // Delete all transactions for this card
                    const batch = db.batch();
                    
                    db.collection('users').doc(userId).collection('transactions')
                        .where('cardId', '==', cardId)
                        .get()
                        .then(snapshot => {
                            snapshot.forEach(doc => {
                                batch.delete(doc.ref);
                            });
                            return batch.commit();
                        })
                        .then(() => {
                            fetchCards(userId);
                        });
                })
                .catch(error => {
                    console.error('Error deleting card:', error);
                    alert('Error deleting card. Please try again.');
                });
            */
        }
    }

    // Helper function to format expiry date
    function formatExpiry(expiryDate) {
        if (!expiryDate) return 'MM/YY';
        
        try {
            const date = new Date(expiryDate);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear().toString().slice(2);
            return `${month}/${year}`;
        } catch (e) {
            return 'MM/YY';
        }
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('card-modal');
        if (e.target === modal) {
            closeCardModal();
        }
    });
}); 