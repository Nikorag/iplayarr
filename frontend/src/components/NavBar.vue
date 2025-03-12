<template>
    <div class="NavBar">
        <div class="left">
            <div class="logoPanel">
                <RouterLink to="/queue">
                    <img src="/iplayarr.png" alt="Logo">
                    <p>iPlayarr</p>
                </RouterLink>
            </div>
        </div>
        <div class="middle">
            <div class="searchPanel" v-if="authState.user">
                <font-awesome-icon :icon="['fas', 'search']"/>
                <input class="searchBox" type="text" placeholder="Search" @keyup.enter="search" v-model="searchTerm"/>
            </div>
        </div>
        <div class="right">
            <font-awesome-icon class="mobileOnly clickable" @click="toggleLeftHandNav" :icon="['fas', 'bars']" v-if="authState.user"/>
            <a href="https://ko-fi.com/nikorag" aria-label="Donate" class="desktopOnly donateLink" target="_blank" v-if="!hiddenSettings.HIDE_DONATE">
                <font-awesome-icon class="desktopOnly clickable" :icon="['fas', 'heart']" v-if="authState.user"/>
            </a>
            <a href="https://github.com/Nikorag/iplayarr" class="desktopOnly" aria-label="GitHub" target="_blank">
                <font-awesome-icon class="desktopOnly clickable" :icon="['fab', 'github']" v-if="authState.user"/>
            </a>
        </div>
    </div>
</template>

<script setup>
    import { inject, ref, defineExpose } from 'vue';
    import { useRouter } from 'vue-router';

    const router = useRouter();

    const toggleLeftHandNav = inject('toggleLeftHandNav');
    const hiddenSettings = inject("hiddenSettings");
    const authState = inject("authState");
    const searchTerm = ref("");

    const search = () => {
        router.push({ name : 'search', query : {searchTerm : searchTerm.value}});
    }

    const clearSearch = () => {
        searchTerm.value = "";
    }

    defineExpose({clearSearch});
</script>

<style lang="less" scoped>
    .NavBar {
        display: flex;
        padding: 0px 20px;
        background-color: @nav-background-color;
        height: 60px;

        >div {
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
        }

        .donateLink {
            color: @error-color;
        }
    }
</style>
