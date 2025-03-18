class BudgetManager {
    constructor(userId) {
        this.userId = userId;
        this.budgets = [];
    }

    async setBudget(category, amount, period = 'monthly') {
        const budgetRef = db.collection('users').doc(this.userId)
            .collection('budgets').doc(category);
        
        await budgetRef.set({
            amount: amount,
            period: period,
            category: category,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    async getBudgetStatus(category) {
        const budgetRef = db.collection('users').doc(this.userId)
            .collection('budgets').doc(category);
        const budget = await budgetRef.get();
        
        if (!budget.exists) {
            return null;
        }

        const budgetData = budget.data();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get transactions for this category in the current period
        const transactions = await db.collection('users').doc(this.userId)
            .collection('transactions')
            .where('category', '==', category)
            .where('date', '>=', startOfMonth)
            .get();
        
        const spent = transactions.docs.reduce((total, doc) => {
            return total + doc.data().amount;
        }, 0);

        return {
            category: category,
            budgeted: budgetData.amount,
            spent: spent,
            remaining: budgetData.amount - spent,
            percentage: (spent / budgetData.amount) * 100
        };
    }
} 