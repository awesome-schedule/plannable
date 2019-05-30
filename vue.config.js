// vue.config.js
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');
const externals = {
    jquery: 'jQuery',
    bootstrap: 'bootstrap'
};
module.exports = {
    configureWebpack: config => {
        if (process.env.NODE_ENV === 'production') {
            return {
                externals
                // plugins: [
                //     new HtmlWebpackExternalsPlugin({
                //         externals: [
                //             {
                //                 module: 'axios',
                //                 entry: '//unpkg.com/axios@0.18.0/dist/axios.min.js',
                //                 global: 'axios'
                //             },
                //             {
                //                 module: 'vue',
                //                 entry: '//cdnjs.cloudflare.com/ajax/libs/vue/2.6.10/vue.min.js',
                //                 global: 'Vue'
                //             },
                //             {
                //                 module: 'vuedraggable',
                //                 entry: [
                //                     '//cdn.jsdelivr.net/npm/sortablejs@1.8.4/Sortable.min.js',
                //                     '//cdnjs.cloudflare.com/ajax/libs/Vue.Draggable/2.20.0/vuedraggable.umd.min.js'
                //                 ]
                //             },
                //             {
                //                 module: 'papaparse',
                //                 entry:
                //                     '//cdnjs.cloudflare.com/ajax/libs/PapaParse/4.6.3/papaparse.min.js',
                //                 global: 'Papa'
                //             },
                //             {
                //                 module: 'vuetify',
                //                 entry: '//cdn.jsdelivr.net/npm/vuetify@1.5.14/dist/vuetify.min.js',
                //                 global: 'Vuetify'
                //             }
                //         ]
                //     })
                // ]
            };
        } else {
            return {
                externals
            };
        }
    }
};
