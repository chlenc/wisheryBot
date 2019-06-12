module.exports = {
    entry: './index.ts',
    output: {
        filename: './index.js',
    },
    resolve: {
        extensions: ['ts', 'js']
    },
    module: {
        loaders: [
            {test: /\.ts$/, loaders: 'ts-loader'}
        ]
    }
}
