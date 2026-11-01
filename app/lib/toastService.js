import { reactive } from 'vue';

const DEFAULT_DURATION = 6000;

export const toasts = reactive([]);

let nextId = 0;

const dismiss = (id) => {
    const index = toasts.findIndex((toast) => toast.id === id);
    if (index !== -1) {
        toasts.splice(index, 1);
    }
};

const show = (type, message, duration = DEFAULT_DURATION) => {
    const id = nextId++;
    toasts.push({ id, type, message });
    if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
    }
    return id;
};

const toastService = {
    success: (message, duration) => show('success', message, duration),
    error: (message, duration) => show('error', message, duration),
    dismiss,
};

export default toastService;
