import { defineConfig } from '@vue/cli-service';

export default defineConfig({
    transpileDependencies: true,
    css: {
        loaderOptions: {
            less: {
                additionalData: `
                    @import "~@/assets/styles/variables.less";
                    @import "~@/assets/styles/global.less";
                `,
            },
        },
    },
    pwa: {
        name: 'iPlayarr',
        themeColor: '#202020',
        msTileColor: '#000000',
        appleMobileWebAppCapable: 'yes',
        appleMobileWebAppStatusBarStyle: 'black-translucent',
    },
});
