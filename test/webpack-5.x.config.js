var path = require('path');

module.exports = [
  {
    mode: 'development',
    entry: './test/app.js',
    output: {
      path: path.resolve('test/results'),
      filename: 'app.[contenthash:8].js'
    },
    module: {
      rules: [
        {
          test: /\.(png|jpe?g)$/i,
          use: [
            {
              loader: './index.js',
              options: {
                esModule: false,
                quality: 80,
                emitBeforeFile: 'img/[name].[hash:8].[ext]',
                emitFile: 'img/[name].[hash:8].[ext].webp'
              }
            },
          ]
        },
      ]
    }
  }
];
