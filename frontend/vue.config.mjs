import { defineConfig } from '@vue/cli-service';
import path from 'path';

export default defineConfig({
    transpileDependencies: true,
    configureWebpack: {
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    exclude: /node_modules/, // Ensure TS loader ignores node_modules
                },
            ],
        },
        resolve: {
            alias: {
                '@shared': path.resolve(process.cwd(), '../src/shared'),
            },
            extensions: ['.ts', '.js'],
        },
    },
    chainWebpack: (config) => {
        config.module.rule('js').exclude.add(/node_modules/); // Avoid transpiling dependencies
    },
    css: {
        loaderOptions: {
            less: {
                additionalData: '@import "~@/assets/styles/variables.less";',
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
