import { toast, type ToastOptions } from 'react-hot-toast';

// Keep track of active toasts
const activeToasts = new Map<string, string>();

export const smartToast = {
  success: (message: string, options?: ToastOptions) => {
    // Dismiss existing toast with same message
    const existingToastId = activeToasts.get(message);
    if (existingToastId) {
      toast.dismiss(existingToastId);
    }
    
    // Create new toast
    const toastId = toast.success(message, {
      ...options,
      duration: 4000,
    });
    
    // Track the toast
    activeToasts.set(message, toastId);
    
    // Clean up when toast is dismissed
    setTimeout(() => {
      activeToasts.delete(message);
    }, 4500);
    
    return toastId;
  },

  error: (message: string, options?: ToastOptions) => {
    // Dismiss existing toast with same message
    const existingToastId = activeToasts.get(message);
    if (existingToastId) {
      toast.dismiss(existingToastId);
    }
    
    // Create new toast
    const toastId = toast.error(message, {
      ...options,
      duration: 5000,
    });
    
    // Track the toast
    activeToasts.set(message, toastId);
    
    // Clean up when toast is dismissed
    setTimeout(() => {
      activeToasts.delete(message);
    }, 5500);
    
    return toastId;
  },

  loading: (message: string, options?: ToastOptions) => {
    // Dismiss existing toast with same message
    const existingToastId = activeToasts.get(message);
    if (existingToastId) {
      toast.dismiss(existingToastId);
    }
    
    // Create new toast
    const toastId = toast.loading(message, {
      ...options,
    });
    
    // Track the toast
    activeToasts.set(message, toastId);
    
    return toastId;
  },

  // Generic toast function
  show: (message: string, options?: ToastOptions) => {
    // Dismiss existing toast with same message
    const existingToastId = activeToasts.get(message);
    if (existingToastId) {
      toast.dismiss(existingToastId);
    }
    
    // Create new toast
    const toastId = toast(message, {
      ...options,
      duration: 4000,
    });
    
    // Track the toast
    activeToasts.set(message, toastId);
    
    // Clean up when toast is dismissed
    setTimeout(() => {
      activeToasts.delete(message);
    }, 4500);
    
    return toastId;
  },

  // Dismiss a specific toast
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
    // Clean up from tracking
    for (const [message, id] of activeToasts.entries()) {
      if (id === toastId) {
        activeToasts.delete(message);
        break;
      }
    }
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
    activeToasts.clear();
  }
};

export default smartToast; 