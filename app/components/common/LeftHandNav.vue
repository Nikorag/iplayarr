<template>
    <div ref="lhn" class="LeftHandNav">
        <ul>
            <LeftHandNavLink label="Queue" icon="tasks" path="/queue" @option-clicked="closeLHN" />
            <LeftHandNavLink label="Logs" icon="history" path="/logs" @option-clicked="closeLHN" />
            <LeftHandNavLink label="Apps" icon="laptop-code" path="/apps" @option-clicked="closeLHN" />
            <LeftHandNavLink label="Synonyms" icon="arrows-rotate" path="/synonyms" @option-clicked="closeLHN" />
            <template v-if="globalSettings.NATIVE_SEARCH == 'false'">
                <LeftHandNavLink label="Off Schedule" icon="calendar" path="/offSchedule" @option-clicked="closeLHN" />
                <LeftHandNavLink
label="Refresh Index" icon="address-book" :no-link="true"
                    @option-clicked="refreshCache" />
            </template>
            <LeftHandNavLink label="Settings" icon="gears" path="/settings" @option-clicked="closeLHN" />
            <LeftHandNavLink label="Statistics" icon="chart-bar" path="/stats" @option-clicked="closeLHN" />
            <LeftHandNavLink label="About" icon="circle-info" path="/about" @option-clicked="closeLHN" />
            <LeftHandNavLink v-if="globalSettings.AUTH_TYPE != 'none'" label="Logout" icon="sign-out" :no-link="true" @option-clicked="logout" />
        </ul>
        <div class="floor">
            <div v-if="globalSettings.NATIVE_SEARCH == 'false'">
                <font-awesome-icon :icon="['fas', 'box']" fixed-width />
                <span>get_iplayer Search</span>
            </div>
            <div v-else>
                <font-awesome-icon :icon="['fas', 'desktop']" fixed-width />
                <span>Native Search</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineEmits, defineExpose, inject, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { onBeforeRouteLeave } from 'vue-router';

import dialogService from '@/lib/dialogService';
import { ipFetch } from '@/lib/ipFetch';

import LeftHandNavLink from './NavLink.vue';

const router = useRouter();
const lhn = ref(null);
const emit = defineEmits(['clear-search']);
const globalSettings = inject('globalSettings');

const toggleLHN = () => {
    lhn.value.classList.toggle('show');
    if (lhn.value.classList.contains('show')) {
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);
    }
};

const closeLHN = () => {
    lhn.value.classList.remove('show');
    document.removeEventListener('click', handleClickOutside);
    emit('clear-search');
};

defineExpose({ toggleLHN });

const logout = async () => {
    if (await dialogService.confirm('Logout', 'Are you sure you want to log out?')) {
        const response = await ipFetch('auth/logout');
        if (response.ok) {
            router.go(0);
        }
    }
};

const refreshCache = async () => {
    if (await dialogService.confirm('Refresh Index', 'Are you sure you want to refresh the index?')) {
        await ipFetch('json-api/cache-refresh');
        if (
            await dialogService.confirm('Index Refreshing', 'Cache Refresh Started, Would you like to view the logs?')
        ) {
            router.push('/logs');
        }
    }
};

onBeforeRouteLeave(() => {
    closeLHN();
});

onBeforeUnmount(() => {
    closeLHN();
});

const handleClickOutside = (event) => {
    if (lhn.value && !lhn.value.contains(event.target)) {
        closeLHN();
    }
};
</script>

<style lang="less">
.LeftHandNav {
    width: 210px;
    background-color: @nav-background-color;
    color: @nav-text-color;
    height: calc(100vh - 60px);
    z-index: 1;
    font-size: 14px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: sticky;
    top: 60px;

    .floor {
        padding: 24px 24px;
        box-sizing: border-box;

        span {
            margin-left: 0.5rem;

            &:hover {
                color: @nav-link-color;
            }
        }
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li {
        padding: 12px 24px;

        &.active {
            background-color: @nav-active-background-color;
            color: @brand-color;
            border-left: 3px solid @brand-color;

            padding-left: 21px;

            a,
            span {
                color: @brand-color !important;
                text-decoration: none;
            }
        }

        .menuText {
            margin-left: 1rem;
        }
    }

    a,
    span {
        color: @nav-link-color;
        text-decoration: none;

        &:hover {
            color: @brand-color;
        }
    }
}

@media (max-width: @mobile-breakpoint) {
    .LeftHandNav {
        position: fixed;
        top: 0px;
        bottom: 0;
        transform: translateX(-100%);
        transition: transform 0.3s ease-in-out;
        padding-top: 60px;
    }

    .LeftHandNav.show {
        transform: translateX(0);
    }
}
</style>
