<template>
    <SettingsPageToolbar :icons="['refresh']" @refresh="load" />
    <div class="inner-content">
        <LoadingIndicator v-if="!report" />
        <template v-else>
            <div class="summary" :class="report.status">
                <font-awesome-icon :icon="['fas', statusIcons[report.status]]" fixed-width />
                <span>{{ summaryText }}</span>
            </div>
            <legend>Checks</legend>
            <table class="checks">
                <tbody>
                    <tr v-for="check in report.checks" :key="check.id" :class="check.status">
                        <td class="status">
                            <font-awesome-icon :icon="['fas', statusIcons[check.status]]" fixed-width />
                        </td>
                        <td class="name">{{ check.name }}</td>
                        <td class="message">{{ check.message }}</td>
                    </tr>
                </tbody>
            </table>
            <p class="footnote">
                iPlayarr {{ report.version }} · up {{ formatUptime(report.uptime) }} · checked
                {{ new Date(report.generatedAt).toLocaleTimeString() }}
            </p>
        </template>
        <p v-if="failed" class="footnote error">Could not load diagnostics.</p>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';

import LoadingIndicator from '@/components/common/LoadingIndicator.vue';
import SettingsPageToolbar from '@/components/common/SettingsPageToolbar.vue';
import { ipFetch } from '@/lib/ipFetch';

const statusIcons = {
    ok: 'circle-check',
    warn: 'triangle-exclamation',
    error: 'circle-xmark',
    skipped: 'circle-minus',
};

const report = ref(null);
const failed = ref(false);

const summaryText = computed(() => {
    const problems = report.value.checks.filter(({ status }) => status == 'warn' || status == 'error').length;
    if (report.value.status == 'ok') return 'Everything looks healthy';
    return `${problems} ${problems == 1 ? 'check needs' : 'checks need'} attention`;
});

const load = async () => {
    failed.value = false;
    report.value = null;
    try {
        const response = await ipFetch('json-api/diagnostics');
        if (!response.ok) throw new Error('Request failed');
        report.value = response.data;
    } catch {
        failed.value = true;
    }
};

const formatUptime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return hours < 48 ? `${hours}h ${minutes % 60}m` : `${Math.floor(hours / 24)}d ${hours % 24}h`;
};

onMounted(load);
</script>

<style lang="less">
.summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    font-size: 18px;
    border-left: 4px solid @subtle-text-color;
    background-color: @toolbar-background-color;

    &.ok {
        border-color: @success-color;
    }

    &.warn {
        border-color: @warn-color;
    }

    &.error {
        border-color: @error-color;
    }
}

.checks {
    width: 100%;
    border-collapse: collapse;

    td {
        padding: 0.65rem 0.5rem;
        border-bottom: 1px solid @table-border-color;
        vertical-align: top;
    }

    .status {
        width: 2rem;
    }

    .name {
        width: 14rem;
        white-space: nowrap;
    }

    .message {
        color: @table-text-color;
        overflow-wrap: anywhere;
    }

    tr.ok .status {
        color: @success-color;
    }

    tr.warn .status {
        color: @warn-color;
    }

    tr.error .status {
        color: @error-color;
    }

    tr.skipped {
        color: @subtle-text-color;

        .message {
            color: @subtle-text-color;
        }
    }

    @media (max-width: @mobile-breakpoint) {
        .name {
            width: auto;
            white-space: normal;
        }
    }
}

.footnote {
    margin-top: 1.5rem;
    color: @subtle-text-color;
    font-size: 13px;
}
</style>
