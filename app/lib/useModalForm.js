import { nextTick, ref } from 'vue';

import toastService from '@/lib/toastService';

/**
 * Shared submit flow for the create/edit modals.
 *
 * - `validate()` returns an object of `{ field: message }` for anything wrong. Nothing is sent while it isn't empty.
 * - `save()` performs the request and returns the ipFetch response (`{ ok, data }`).
 * - Field errors from the server (`data.invalid_fields`) are shown against their fields, anything else as a toast,
 *   and the modal stays open with the user's input intact until the save has actually succeeded.
 */
export const useModalForm = ({ validate, save, onSaved, failureMessage = 'The changes could not be saved' }) => {
    const errors = ref({});
    const saving = ref(false);

    const focusFirstError = async () => {
        await nextTick();
        const field = document.querySelector('.iplayarr-modal-content .has-error');
        field?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        field?.querySelector('input, select')?.focus({ preventScroll: true });
    };

    // Re-check as the user types, but only once a submit has failed, so fixed fields stop showing errors
    const revalidate = () => {
        if (Object.keys(errors.value).length) {
            errors.value = validate();
        }
    };

    const submit = async () => {
        if (saving.value) {
            return;
        }

        errors.value = validate();
        if (Object.keys(errors.value).length) {
            await focusFirstError();
            return;
        }

        saving.value = true;
        try {
            const response = await save();
            if (response.ok) {
                onSaved?.(response);
                return;
            }

            errors.value = response.data?.invalid_fields ?? {};
            if (Object.keys(errors.value).length) {
                await focusFirstError();
            } else {
                toastService.error(response.data?.message || failureMessage);
            }
        } catch (err) {
            toastService.error(`${failureMessage}: ${err.message || 'the server could not be reached'}`);
        } finally {
            saving.value = false;
        }
    };

    return { errors, saving, submit, revalidate };
};
