// Copyright (C) 2016 Max Riveiro <kavu13@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
module.exports = function (content) {
  this.cacheable && this.cacheable();

  const options = this.getOptions({
    type: 'object',
    properties: {
      debug: {
        type: 'boolean',
      },
      bypassOnDebug: {
        type: 'boolean',
      },
      emitBeforeFile: {
        type: 'string',
      },
      emitFile: {
        type: 'string',
      },
      regExp: {
        instanceOf: 'RegExp',
      },
      quality: {
        type: 'number',
      }
    },
    additionalProperties: true
  });

  const callback = this.async();

  const copy = Buffer.from(content);

  if (this.debug === true && options.bypassOnDebug === true) {
    return callback(null, content);
  } else {
    (async () => {
      const [
        {default: loaderUtils},
        {default: imagemin},
        {default: imageminWebp},
        path
      ] = await Promise.all([
        import('loader-utils'),
        import('imagemin'),
        import('imagemin-webp'),
        import('node:path')
      ]);
      imagemin
        .buffer(content, {
          plugins: [imageminWebp(options)]
        })
        .then((data) => {
          const context = this.rootContext;
          if (options.emitBeforeFile) {
            const isImmutable = /\[([^:\]]+:)?(hash|contenthash)(:[^\]]+)?]/gi.test(options.emitBeforeFile);
            const name = loaderUtils.interpolateName(this, options.emitBeforeFile, {
              context,
              content: data,
              regExp: options.regExp
            });

            this.emitFile(name, copy, null, isImmutable ? {immutable: true} : {});
          }
          // Seems the hash differ in webpack, so let user emit instead of fileloader
          if (options.emitFile) {
            const isImmutable = /\[([^:\]]+:)?(hash|contenthash)(:[^\]]+)?]/gi.test(options.emitFile);
            const name = loaderUtils.interpolateName(this, options.emitFile, {
              context,
              content: data,
              regExp: options.regExp
            });

            this.emitFile(name, data, null, isImmutable ? {immutable: true} : {});

            let outputPath = name;
            if (options.outputPath) {
              if (typeof options.outputPath === 'function') {
                outputPath = options.outputPath(name, this.resourcePath, context);
              } else {
                outputPath = path.posix.join(options.outputPath, name);
              }
            }

            let publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`;

            if (options.publicPath) {
              if (typeof options.publicPath === 'function') {
                publicPath = options.publicPath(name, this.resourcePath, context);
              } else {
                publicPath = `${options.publicPath.endsWith('/') ? options.publicPath : `${options.publicPath}/`}${name}`;
              }

              publicPath = JSON.stringify(publicPath);
            }
            if (options.postTransformPublicPath) {
              publicPath = options.postTransformPublicPath(publicPath);
            }
            const esModule = typeof options.esModule !== 'undefined' ? options.esModule : false;
            callback(null, `${esModule ? 'export default' : 'module.exports ='} ${publicPath};`);
          } else {
            callback(null, data);
          }
        })
        .catch(function (err) {
          callback(err);
        });
    })();
  }
};

module.exports.raw = true;
