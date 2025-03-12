<template>
    <div class="SettingsPageToolbar">
        <div>
            <button class="SettingsPageToolbar-button clickable" @click="emitEvent('deleteQueueItem')"
                v-if="icons.some((i) => i == 'delete')">
                <font-awesome-icon :icon="['fas', 'trash']" />
                <div class="SettingsPageToolbar-label">
                    Stop
                </div>
            </button>
            <button class="SettingsPageToolbar-button clickable" @click="emitEvent('save')" :disabled="!saveEnabled"
                v-if="icons.some((i) => i == 'save')">
                <font-awesome-icon :icon="['fas', 'floppy-disk']" />
                <div class="SettingsPageToolbar-label">
                    {{ saveEnabled ? 'Save' : 'No' }} Changes
                </div>
            </button>
            <button class="SettingsPageToolbar-button clickable" @click="emitEvent('toggleAdvanced')"
                v-if="icons.some((i) => i == 'advanced')">
                <font-awesome-icon :icon="['fas', 'cog']" />
                <div class="SettingsPageToolbar-label">
                    Toggle Advanced
                </div>
            </button>
            <button class="SettingsPageToolbar-button clickable" @click="emitEvent('download')"
                v-if="icons.some((i) => i == 'download')">
                <font-awesome-icon :icon="['fas', 'download']" />
                <div class="SettingsPageToolbar-label">
                    Download
                </div>
            </button>
            <button class="SettingsPageToolbar-button clickable" @click="emitEvent('toggleFollow')"
                v-if="icons.some((i) => i == 'follow')">
                <font-awesome-icon :icon="['fas', followStatus ? 'person-walking' : 'person']" />
                <div class="SettingsPageToolbar-label">
                    {{ followStatus ? 'Following' : 'Not Following' }}
                </div>
            </button>
        </div>
        <div>
            <template v-if="icons.some((i) => i == 'filter')">
                <button :class="['SettingsPageToolbar-button clickable', filterEnabled ? 'enabled' : '']" @click="toggleFilter">
                    <font-awesome-icon :icon="['fas', 'filter']" />
                    <div class="SettingsPageToolbar-label">
                        Filter
                    </div>
                </button>
                <div class="filterDropdown" v-if="showFilterDropdown" ref="dropdownDiv">
                    <ul>
                        <li v-for="option in filterOptions" v-bind:key="option" :class="['clickable', selectedFilter == option ? 'selected' : '']" @click="selectFilter(option)">
                            <div>
                                {{ option }}
                            </div>
                            <div>
                                <font-awesome-icon :icon="['fas', 'check']" v-if="selectedFilter == option"/>
                            </div>
                        </li>
                    </ul>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { defineEmits, defineProps, ref, onBeforeUnmount } from 'vue';

const emit = defineEmits(['save', 'toggleAdvanced', 'download', 'toggleFollow', 'selectFilter', 'deleteQueueItem']);
const showFilterDropdown = ref(false);
const dropdownDiv = ref(null);

defineProps({
    saveEnabled: {
        type: Boolean,
        required: false,
        default: true
    },
    icons: {
        type: Array,
        required: true,
        default: () => []
    },
    followStatus: {
        type: Boolean,
        required: false,
        default: true
    },
    filterOptions: {
        type: Array,
        required: false,
        default: () => []
    },
    selectedFilter: {
        type: String,
        required: false
    },
    filterEnabled : {
        type: Boolean,
        required: false,
        default: false
    }
})

const emitEvent = (event) => {
    emit(event);
}

const selectFilter = (option) => {
    showFilterDropdown.value = false;
    document.removeEventListener('click', handleClickOutside);
    emit('selectFilter', option);
}

const toggleFilter = () => {
  showFilterDropdown.value = !showFilterDropdown.value;

  if (showFilterDropdown.value) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0); // Delay adding listener to avoid catching the current click event
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
};

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

const handleClickOutside = (event) => {
  if (showFilterDropdown.value && dropdownDiv.value && !dropdownDiv.value.contains(event.target)) {
    showFilterDropdown.value = false;
    document.removeEventListener('click', handleClickOutside);
  }
};

</script>

<style lang="less">
.SettingsPageToolbar {
    height: 60px;
    background-color: @toolbar-background-color;
    display: flex;
    padding: 0px 1rem;

    >div {
        flex: 1;
        display: flex;

        &:nth-of-type(2) {
            justify-content: flex-end;
        }

        button {
            padding-top: 4px;
            min-width: 60px;
            width: min-content;
            text-align: center;
            background-color: transparent;
            border: 0px;
            height: 100%;

            &:hover {
                svg {
                    color: @brand-color;
                }
            }

            svg {
                color: @toolbar-text-color;
                height: 21px;
            }

            &.enabled {
                svg {
                    color: @brand-color;
                }
            }
        }

        .SettingsPageToolbar-label {
            color: @primary-text-color;
            font-size: 11px;
        }

        .filterDropdown {
            position: absolute;
            top: 120px;
            background-color: @nav-background-color;
            width: 180px;

            ul {
                list-style: none;
                padding: 0px;
                width: 100%;
                display:block;
                margin: 0px;

                li {
                    display: flex;
                    // margin: 1.2rem 0px;
                    padding: 0.8rem 1rem;
                    border-bottom: 1px solid @login-panel-header-color;

                    >div {
                        flex: 3;
                        &:nth-of-type(2) {
                            flex: 1;
                            text-align: right;
                        }
                    }

                    &.selected, &:hover {
                        color: @brand-color;
                        background-color: @nav-active-background-color;
                    }
                    
                }
            }
        }
    }
}
</style>