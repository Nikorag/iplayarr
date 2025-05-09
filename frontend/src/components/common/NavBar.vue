<template>
    <div class="NavBar">
        <div class="left">
            <div class="logoPanel">
                <RouterLink to="/queue">
                    <img src="/iplayarr.png" alt="Logo" />
                    <p class="desktopOnly">iPlayarr</p>
                </RouterLink>
                <font-awesome-icon
                    v-if="authState.user"
                    class="mobileOnly clickable burgerMenu"
                    :icon="['fas', 'bars']"
                    @click="toggleLeftHandNav"
                />
            </div>
        </div>
        <div class="middle">
            <div v-if="authState.user" class="searchPanel">
                <font-awesome-icon :icon="['fas', 'search']" />
                <input v-model="searchTerm" class="searchBox" type="text" placeholder="Search" @keyup.enter="search" />
            </div>
        </div>
        <div class="right">
            <a
                v-if="!hiddenSettings.HIDE_DONATE"
                href="https://ko-fi.com/nikorag"
                aria-label="Donate"
                class="desktopOnly donateLink"
                target="_blank"
            >
                <font-awesome-icon v-if="authState.user" class="desktopOnly clickable" :icon="['fas', 'heart']" />
            </a>
            <a href="https://github.com/Nikorag/iplayarr" class="desktopOnly" aria-label="GitHub" target="_blank">
                <font-awesome-icon v-if="authState.user" class="desktopOnly clickable" :icon="['fab', 'github']" />
            </a>
        </div>
    </div>
</template>

<script setup>
import { defineExpose, inject, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const toggleLeftHandNav = inject('toggleLeftHandNav');
const hiddenSettings = inject('hiddenSettings');
const authState = inject('authState');
const searchTerm = ref('');

const search = () => {
    router.push({ name: 'search', query: { searchTerm: searchTerm.value } });
};

const clearSearch = () => {
    searchTerm.value = '';
};

defineExpose({ clearSearch });
</script>

<style lang="less" scoped>
.NavBar {
    display: flex;
    padding: 0px 20px;
    background-color: @nav-background-color;
    height: 60px;
    z-index: 2;
    position: relative;

    @media (min-width: @mobile-breakpoint) {
        position: sticky;
        top: 0;
    }

    > div {
        @media (max-width: @mobile-breakpoint) {
            flex: 1;
        }

        &.left {
            @media (min-width: @mobile-breakpoint) {
                flex: 0 0 210px;
            }
        }

        &.middle {
            @media (min-width: @mobile-breakpoint) {
                flex: 1;
                justify-content: flex-start;
            }

            @media (max-width: @mobile-breakpoint) {
                padding: 0 1rem;
                margin-left: 1rem;
            }

            .searchPanel {
                display: flex;
                align-items: center;
                gap: 10px;
                height: 100%;

                .searchBox {
                    background-color: transparent;
                    border: 0px;
                    border-bottom: 1px solid white;
                    padding: 5px 5px;
                    color: white;
                    border-radius: 0px;
                    transition: border-bottom-color 0.3s ease-out;

                    &:focus {
                        outline: none;
                        box-shadow: none;
                        border-bottom-color: transparent;

                        &::placeholder {
                            color: transparent;
                        }
                    }
                }
            }
        }

        &.right {
            @media (min-width: @mobile-breakpoint) {
                flex: 0 0 210px;
            }

            text-align: right;
            display: flex;
            align-items: center;
            justify-content: flex-end;

            a {
                width: 30px;
                height: 60px;
                text-align: center;
                display: flex;
                align-items: center;
            }
        }
    }

    .logoPanel {
        height: 60px;
        display: flex;
        align-items: center;

        a {
            display: flex;
            align-items: center;
            gap: 10px;
            height: 100%;
        }

        img {
            width: 32px;
            height: auto;
        }

        p {
            font-size: 16px;
            font-weight: bold;
        }

        .burgerMenu {
            margin-left: 1.5rem;
        }
    }

    .donateLink {
        color: @error-color;
    }
}
</style>
