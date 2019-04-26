// vue.config.js
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');
module.exports = {
    configureWebpack: config => {
        if (process.env.NODE_ENV === 'production') {
            return {
                externals: {
                    jquery: 'jQuery',
                    bootstrap: 'bootstrap'
                },
                plugins: [
                    new HtmlWebpackExternalsPlugin({
                        externals: [
                            {
                                module: 'vue',
                                entry: '//cdnjs.cloudflare.com/ajax/libs/vue/2.6.10/vue.min.js',
                                global: 'Vue'
                            },
                            {
                                module: 'vuedraggable',
                                entry: [
                                    '//cdn.jsdelivr.net/npm/sortablejs@1.8.4/Sortable.min.js',
                                    '//cdnjs.cloudflare.com/ajax/libs/Vue.Draggable/2.20.0/vuedraggable.umd.min.js'
                                ]
                            },
                            {
                                module: 'papaparse',
                                entry:
                                    '//cdnjs.cloudflare.com/ajax/libs/PapaParse/4.6.3/papaparse.min.js',
                                global: 'Papa'
                            },
                            {
                                module: 'axios',
                                entry: '//unpkg.com/axios/dist/axios.min.js',
                                global: 'axios'
                            }
                        ]
                    })
                ]
            };
        } else {
            return {};
        }
    }
};
