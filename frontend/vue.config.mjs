import { defineConfig } from '@vue/cli-service';
import path from 'path';

export default defineConfig({
    transpileDependencies: true,
    configureWebpack: {
        resolve: {
            alias: {
                '@shared': path.resolve(process.cwd(), '../src/shared')
            }
        }
    },
    css: {
        loaderOptions: {
            less: {
                additionalData: '@import "~@/assets/styles/variables.less";'
            }
        }
    },
    pwa: {
        name: 'iPlayarr',
        themeColor: '#202020',
        msTileColor: '#000000',
        appleMobileWebAppCapable: 'yes',
        appleMobileWebAppStatusBarStyle: 'black-translucent',
    }
});
