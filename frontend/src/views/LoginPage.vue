<template>
    <div class="login-content">
        <div>
            <div class="panel">
                <div class="panel-header">
                    <img src="/iplayarr.png" alt="Image" class="logo" />
                </div>
                <div v-if="!forgot" class="panel-body">
                    <div class="sign-in">SIGN IN TO CONTINUE</div>
                    <div class="form-group">
                        <input
                            v-model="loginForm.username"
                            type="email"
                            class="form-input"
                            placeholder="Username"
                            @keyup.enter="login"
                        />
                    </div>
                    <div class="form-group">
                        <input
                            v-model="loginForm.password"
                            type="password"
                            class="form-input"
                            placeholder="Password"
                            @keyup.enter="login"
                        />
                    </div>
                    <div class="forgot-container">
                        <a href="#" @click="showForgot">Forgot your password?</a>
                    </div>
                    <button type="button" class="button" @click="login">Login</button>
                    <div v-if="error" id="login-failed" class="login-failed">Incorrect Username or Password</div>
                </div>
                <div v-if="forgot" class="panel-body">
                    <div class="sign-in">FORGOT PASSWORD</div>
                    <p>A unique code has been printed into the logs, enter it below to reset the password to default</p>
                    <div class="form-group">
                        <input
                            v-model="forgotForm.key"
                            type="text"
                            class="form-input"
                            placeholder="Code from Console"
                            @keyup.enter="submitForgot"
                        />
                    </div>
                    <div class="forgot-container">
                        <a href="#" @click="hideForgot">Cancel</a>
                    </div>
                    <button type="button" class="button" @click="submitForgot">Reset</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted,ref } from 'vue';
import { useRouter } from 'vue-router';

import dialogService from '@/lib/dialogService';
import { ipFetch } from '@/lib/ipFetch';

const router = useRouter();

const loginForm = ref({
    username: '',
    password: '',
});

const forgotForm = ref({
    key: '',
});

const error = ref(false);
const forgot = ref(false);

const login = async () => {
    const response = await ipFetch('auth/login', 'POST', loginForm.value);
    if (response.ok) {
        router.push('/queue');
    } else {
        error.value = true;
    }
};

const showForgot = async () => {
    forgot.value = true;
    ipFetch('auth/generateToken');
};

const hideForgot = async () => {
    forgot.value = false;
};

const submitForgot = async () => {
    ipFetch('auth/resetPassword', 'POST', forgotForm.value);
    dialogService.alert('Reset Password', 'If the code is correct, the password will be reset!');
    forgot.value = false;
};

//Check if already logged in
onMounted(async () => {
    const response = await ipFetch('auth/me');
    if (response.ok) {
        router.push('/queue');
    }
});
</script>

<style lang="less" scoped>
.login-content {
    display: flex;
    justify-content: center;

    > div {
        flex: 0 0 325px;
    }
}

.panel {
    margin-top: 50px;
    border-radius: 4px;
}

.panel-header {
    display: flex;
    justify-content: center;
    padding: 10px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    background-color: @login-panel-header-color;
}

.logo {
    width: 32px;
    height: 32px;
}

.panel-body {
    padding: 20px;
    border-bottom-right-radius: 4px;
    border-bottom-left-radius: 4px;
    background-color: @login-panel-body-color;
}

.sign-in {
    padding: 10px 0;
    text-align: center;
}

.form-group {
    margin: 20px 0;
}

.form-input {
    box-sizing: border-box;
    padding: 6px 16px;
    width: 100%;
    height: 35px;
    background-color: @input-background-color;
    border: 1px solid @input-border-color;
    border-radius: 4px;
    box-shadow: inset 0 1px 1px @primary-box-shadow;
    color: @input-text-color;
}

.button {
    overflow: hidden;
    margin-top: 20px;
    padding: 10px 0;
    width: 100%;
    border: 1px solid;
    border-color: @login-button-border-color;
    border-radius: 4px;
    background-color: @login-button-background-color;
    color: @primary-text-color;
    vertical-align: middle;
    text-align: center;
    white-space: nowrap;
    line-height: normal;
}

.login-failed {
    margin-top: 20px;
    color: @error-color;
    font-size: 14px;
}

.forgot-container {
    display: flex;

    a {
        margin-left: auto;
        color: @subtle-text-color;
        text-decoration: none;
        font-size: 13px;
    }
}
</style>
