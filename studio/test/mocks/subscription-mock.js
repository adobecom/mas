/**
 * A robust mock for subscription handling
 */
export class SubscriptionMock {
  constructor() {
    this.subscriptions = new Set();
    this.unsubscribeCalled = false;
  }

  /**
   * Creates a subscription with guaranteed unsubscribe method
   */
  createSubscription(callback) {
    const subscription = {
      callback,
      unsubscribe: () => {
        this.unsubscribeCalled = true;
        this.subscriptions.delete(subscription);
        return true;
      }
    };
    
    this.subscriptions.add(subscription);
    return subscription;
  }

  /**
   * Safely unsubscribes all subscriptions
   */
  unsubscribeAll() {
    // Create a copy to avoid modification during iteration
    const subs = [...this.subscriptions];
    
    // Unsubscribe each one
    for (const sub of subs) {
      if (sub && typeof sub.unsubscribe === 'function') {
        try {
          sub.unsubscribe();
        } catch (e) {
          console.warn('Error during unsubscribe:', e);
        }
      }
    }
    
    // Clear all
    this.subscriptions.clear();
  }
} 