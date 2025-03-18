class ReminderManager {
    constructor(userId) {
        this.userId = userId;
    }

    async setReminder(cardId, dueDate, amount, description) {
        const reminderRef = db.collection('users').doc(this.userId)
            .collection('reminders').doc();
        
        await reminderRef.set({
            cardId: cardId,
            dueDate: dueDate,
            amount: amount,
            description: description,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Schedule notification
        this.scheduleNotification(dueDate, description, amount);
    }

    scheduleNotification(dueDate, description, amount) {
        if (!("Notification" in window)) {
            console.log("This browser does not support notifications");
            return;
        }

        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                const notificationDate = new Date(dueDate);
                notificationDate.setDate(notificationDate.getDate() - 3); // Notify 3 days before

                const now = new Date();
                const timeUntilNotification = notificationDate - now;

                if (timeUntilNotification > 0) {
                    setTimeout(() => {
                        new Notification("Payment Reminder", {
                            body: `Payment of $${amount} for ${description} is due in 3 days`,
                            icon: "/path/to/icon.png"
                        });
                    }, timeUntilNotification);
                }
            }
        });
    }

    async getReminders() {
        const remindersRef = db.collection('users').doc(this.userId)
            .collection('reminders')
            .where('status', '==', 'pending')
            .orderBy('dueDate');
        
        const reminders = await remindersRef.get();
        return reminders.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
} 