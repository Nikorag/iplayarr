import { useModal } from 'vue-final-modal';

import AlertDialog from '@/components/modals/AlertDialog.vue';

const dialogService = {
    alert: (title, text, subtext) => {
        const formModal = useModal({
            component: AlertDialog,
            attrs: {
                title,
                text,
                subtext,
                onConfirm: () => {
                    formModal.close();
                },
            },
        });
        formModal.open();
    },

    confirm: async (title, text, subtext) => {
        return new Promise((resolve) => {
            const formModal = useModal({
                component: AlertDialog,
                attrs: {
                    title,
                    text,
                    subtext,
                    showCancel: true,
                    onConfirm: () => {
                        resolve(true);
                        formModal.close();
                    },
                    onCancel: () => {
                        resolve(false);
                        formModal.close();
                    },
                },
            });
            formModal.open();
        });
    },

    select: async (title, text, subtext, options) => {
        return new Promise((resolve) => {
            const formModal = useModal({
                component: AlertDialog,
                attrs: {
                    title,
                    text,
                    subtext,
                    showCancel: true,
                    options,
                    onConfirm: (option) => {
                        resolve(option);
                        formModal.close();
                    },
                    onCancel: () => {
                        resolve(false);
                        formModal.close();
                    },
                },
            });
            formModal.open();
        });
    },
};

export default dialogService;
