
# plugin-legacy 内置插件详解

## 背景

### Vite 的浏览器兼容性

用于生产环境的构建包会假设目标浏览器支持现代 `JavaScript` 语法。默认情况下，`Vite` 的目标是能够能支持 [原生 ESM 语法的 script 标签](https://caniuse.com/es6-module)、[原生 ESM 动态导入](https://caniuse.com/es6-module-dynamic-import) 和 `import.meta` 的浏览器，包含如下：

| Browser       |     Version   |
| ------------- | :-----------: |
| Chrome        |     >= 87     |
| Firefox       |     >= 78     |
| Safari        |     >= 14     |
| Edge          |     >= 88     |

你也可以通过 [build.target](https://cn.vitejs.dev/config/build-options.html#build-target) 配置项 指定构建目标，最低支持 `es2015`。

请注意，默认情况下 `Vite` 只处理语法转译，且 **默认不包含任何 polyfill**。你可以前往 [Polyfill.io](https://polyfill.io/v3/) 查看，这是一个基于用户浏览器 `User-Agent` 字符串自动生成 `polyfill` 包的服务。

传统浏览器可以通过插件 [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) 来支持，它将自动生成传统版本的 `chunk` 及与其相对应 `ES` 语言特性方面的 `polyfill`。兼容版的 `chunk` 只会在不支持原生 `ESM` 的浏览器中进行按需加载。

## 执行流程

默认情况下，这个插件将做如下几件事情：

- 在最后的构建产物中会通过 [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env) 和生成 [SystemJS modules](https://github.com/systemjs/systemjs) （依旧支持代码切割）的方式为每一个 `chunk` 生成特定的 `legacy chunk`。
- 生成一个 `polyfill chunk` 会包含 `SystemJS runtime` 和 `指定浏览器需要的 polyfills` 以及 `源码中实际使用的 polyfills`。
- 在已生成的 `HTML` 模块中注入 `<script nomodule>` 标签，目的是为了可选择性的加载 `polyfills` 和仅在没有广泛支持可用功能的浏览器中使用 `legacy bundle`。
- 注入  `import.meta.env.LEGACY` 环境属性，这个属性值在 `legacy` 产物中为 `true`，其他情况下为 `false`。

## 实现思路

从入口处可以看出 `@vitejs/plugin-legacy` 模块导出格式如下：

```js
// @vitejs/plugin-legacy

function viteLegacyPlugin(options = {}) {

  const legacyConfigPlugin = {
    // ...
  }

  const legacyGenerateBundlePlugin = {
    // ...
  }

  const legacyPostPlugin = {
    // ...
  }

  return [legacyConfigPlugin, legacyGenerateBundlePlugin, legacyPostPlugin];
}

export { cspHashes, viteLegacyPlugin as default, detectPolyfills };
```

也就是说使用 `@vitejs/plugin-legacy` 模块本质上会导入三个插件 `legacyConfigPlugin`、`legacyGenerateBundlePlugin`、`legacyPostPlugin`。以下逐一分析每一个插件具体做了什么。

### legacyConfigPlugin

源码结构很简单：

```js{1,8,11,26,34}
const genLegacy = options.renderLegacyChunks !== false;

const legacyConfigPlugin = {
  name: "vite:legacy-config",
  config(config2, env) {
    if (env.command === "build" && !config2.build?.ssr) {
      if (!config2.build) {
        config2.build = {};
      }
      if (!config2.build.cssTarget) {
        config2.build.cssTarget = "chrome61";
      }
      if (genLegacy) {
        overriddenBuildTarget = config2.build.target !== void 0;
        config2.build.target = [
          "es2020",
          "edge79",
          "firefox67",
          "chrome64",
          "safari12"
        ];
      }
    }
    return {
      define: {
        "import.meta.env.LEGACY": env.command === "serve" || config2.build?.ssr ? false : legacyEnvVarMarker
      }
    };
  },
  configResolved(config2) {
    if (overriddenBuildTarget) {
      config2.logger.warn(
        colors.yellow(
          `plugin-legacy overrode 'build.target'. You should pass 'targets' as an option to this plugin with the list of legacy browsers to support instead.`
        )
      );
    }
  }
};
```

插件实现逻辑比较简单，可以概括如下三点：

- `css` 的兼容性版本默认为 `chrome61`。直观的示例是当你要兼容的场景是安卓微信中的 `webview` 时，它支持大多数现代的 `JavaScript` 功能，但并不支持 [CSS 中的 `#RGBA` 十六进制颜色符号](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#rgb_colors)。这种情况下，你需要将 `build.cssTarget` 设置为 `chrome61`(`chrome 61` 以下的版本不支持 `#RGBA`)，来防止 `ESbuild` 将 `rgba()` 颜色默认转化为 `#RGBA` 十六进制符号的形式，[文档参考](https://esbuild.github.io/content-types/#css)。
- 使用插件后，`plugin-legacy` 插件会覆盖项目 `build.target` 的配置项。`["es2020", "edge79", "firefox67", "chrome64", "safari12"]`。
- 全局注入 `import.meta.env.LEGACY` 常量，只有在构建阶段生效，`开发` 或者 `SSR阶段` 无效。

### legacyPostPlugin

源码结构如下，可以看出在构建的 `post` 阶段会暴露出四个钩子，`configResolved`、`renderChunk`、`transformIndexHtml`、`generateBundle`。

```js{5,8,11,14}
const legacyPostPlugin = {
  name: "vite:legacy-post-process",
  enforce: "post",
  apply: "build",
  configResolved(_config) {
    // ...
  },
  async renderChunk(raw, chunk, opts) {
    // ...
  },
  transformIndexHtml(html, { chunk }) {
    // ...
  },
  generateBundle(opts, bundle) {
    // ...
  }
}
```

#### configResolved 插件的关注点

阅读以下源码

```js
function configResolved(_config) {
  if (_config.build.lib) {
    throw new Error("@vitejs/plugin-legacy does not support library mode.");
  }
  config = _config;
  if (!genLegacy || config.build.ssr) {
    return;
  }
  targets = options.targets || browserslistLoadConfig({ path: config.root }) || "last 2 versions and not dead, > 0.3%, Firefox ESR";
  isDebug && console.log(`[@vitejs/plugin-legacy] targets:`, targets);
  const getLegacyOutputFileName = (fileNames, defaultFileName = "[name]-legacy-[hash].js") => {
    if (!fileNames) {
      return path.posix.join(config.build.assetsDir, defaultFileName);
    }
    return (chunkInfo) => {
      let fileName = typeof fileNames === "function" ? fileNames(chunkInfo) : fileNames;
      if (fileName.includes("[name]")) {
        fileName = fileName.replace("[name]", "[name]-legacy");
      } else {
        fileName = fileName.replace(/(.+)\.(.+)/, "$1-legacy.$2");
      }
      return fileName;
    };
  };
  const createLegacyOutput = (options2 = {}) => {
    return {
      ...options2,
      format: "system",
      entryFileNames: getLegacyOutputFileName(options2.entryFileNames),
      chunkFileNames: getLegacyOutputFileName(options2.chunkFileNames)
    };
  };
  const { rollupOptions } = config.build;
  const { output } = rollupOptions;
  if (Array.isArray(output)) {
    rollupOptions.output = [...output.map(createLegacyOutput), ...output];
  } else {
    rollupOptions.output = [createLegacyOutput(output), output || {}];
  }
}
```

可以看出通过 `rollupOptions.output` 配置项，为其添加 `legacy` 的输出格式。

借助 `@babel/standalone` 的 `transfrom` 的能力

```js
const legacyPostPlugin = {
  name: 'vite:legacy-post-process',
  enforce: 'post',
  apply: 'build',
  renderChunk(raw, chunk, opts) {
    const { code, map } = loadBabel().transform(raw, {
      // ...
      presets: [
        () => ({
          plugins: [
            recordAndRemovePolyfillBabelPlugin(legacyPolyfills),
            replaceLegacyEnvBabelPlugin(),
            wrapIIFEBabelPlugin()
          ]
        })
      ]
    }
  }
}
```

注入 `post` babel插件，收集 `babel` 已经注入的 `core-js` polyfill。

```js
function recordAndRemovePolyfillBabelPlugin(polyfills) {
  return ({ types: t }) => ({
    name: 'vite-remove-polyfill-import',
    post({ path }) {
      path.get('body').forEach((p) => {
        if (t.isImportDeclaration(p)) {
          polyfills.add(p.node.source.value)
          p.remove()
        }
      })
    }
  })
}
```

由于 `Vite` 的 `renderChunk` 阶段 `chunk` 的代码已经解析完了 `import` 和 `export`。因此再次收集到的 `import` 必定是 `babel` 注入的 `polyfill`。

由于需要全局注入 `polyfill`，因此 `polyfill` 可以作为独立的 `bundle` 在 `index.html` 中执行。`polyfill` 作为独立的 `bundle`，因此其他模块就不需要再特意注入 `polyfill`，因此收集完成后会将注入的 `import` 语句进行删除。

```js
if (t.isImportDeclaration(p)) {
  polyfills.add(p.node.source.value)
  p.remove()
}
```

收集到的 `polyfill` 集合作为全新的一个模块，其代码如下：

```js
function polyfillsPlugin(imports, externalSystemJS) {
  return {
    name: 'vite:legacy-polyfills',
    resolveId(id) {
      if (id === polyfillId) {
        return id
      }
    },
    load(id) {
      if (id === polyfillId) {
        return (
          // imports 是在 renderChunk 阶段收集到的所有需要兼容的 polyfill。
          [...imports].map((i) => `import "${i}";`).join('') +
          (externalSystemJS ? '' : `import "systemjs/dist/s.min.js";`)
        )
      }
    }
  }
}
```

在 `generateBundle` 阶段再次单独调用 `Vite` 进行构建 `polyfill` bundle。最后会生成现代浏览器支持 `esmodule` 的产物和旧版本浏览器支持 `nomodule` 的产物。

```js
async function buildPolyfillChunk(
  name,
  imports,
  bundle,
  facadeToChunkMap,
  buildOptions,
  externalSystemJS
) {
  let { minify, assetsDir } = buildOptions
  minify = minify ? 'terser' : false
  const res = await build({
    // so that everything is resolved from here
    root: __dirname,
    configFile: false,
    logLevel: 'error',
    plugins: [polyfillsPlugin(imports, externalSystemJS)],
    build: {
      write: false,
      target: false,
      minify,
      assetsDir,
      rollupOptions: {
        input: {
          [name]: polyfillId
        },
        output: {
          format: name.includes('legacy') ? 'iife' : 'es',
          manualChunks: undefined
        }
      }
    }
  })
  // ...
}
```

::: tip 注意

1. `plugin-legacy` 内部是使用 `terser` 来对代码压缩。因此在配置了 `minify` 的时候请务必按照 `terser` 依赖。
2. `useBuiltIns: 'usage'` 表示有用到的 `polyfill` 才引入。可以对比一下 `useBuiltIns: 'entry'`

3. 从配置项中和 `vite-wrap-iife` 插件(作为 `babel` 的预设插件首个被执行)可以看出

```js
const options = {
  output: {
    format: name.includes('legacy') ? 'iife' : 'es',
    manualChunks: undefined
  }
}

function wrapIIFEBabelPlugin() {
  return ({ types: t, template }) => {
    const buildIIFE = template(';(function(){%%body%%})();')

    return {
      name: 'vite-wrap-iife',
      post({ path }) {
        if (!this.isWrapped) {
          this.isWrapped = true
          path.replaceWith(t.program(buildIIFE({ body: path.node.body })))
        }
      }
    }
  }
}

```

polyfill chunk 是立即执行函数。

:::

之后将 `polyfill` chunk 注入到 `bundle` 中作为新的 `bundle`。

```js
async function buildPolyfillChunk(
  name,
  imports,
  bundle,
  facadeToChunkMap,
  buildOptions,
  externalSystemJS
) {
  // ...
  const _polyfillChunk = Array.isArray(res) ? res[0] : res
  if (!('output' in _polyfillChunk)) return
  const polyfillChunk = _polyfillChunk.output[0]

  // associate the polyfill chunk to every entry chunk so that we can retrieve
  // the polyfill filename in index html transform
  for (const key in bundle) {
    const chunk = bundle[key]
    if (chunk.type === 'chunk' && chunk.facadeModuleId) {
      facadeToChunkMap.set(chunk.facadeModuleId, polyfillChunk.fileName)
    }
  }

  // add the chunk to the bundle
  bundle[polyfillChunk.name] = polyfillChunk
}
```

### 实现上的注意点

1. **需要检测 Promise 的 Polyfill 是否缺失**

   Vite 的项目默认以 `ESM` 为基准进行开发，`ESM` feature 的能力需要依赖于 `SystemJS` 来进行 `Polyfill`。而 `SystemJS` 包需要依赖 `Promise`，但若用户没有在模块中引入 `Promise`，即如下写法：

   ```js
   import react from 'react'; 
   console.log(react);
   ```

   则会导致 `babel` 不会注入 `Promise` 的 `polyfill`。但事实上模块使用了 `ESM`，是需要依赖 `Promise` 的。

   在 `@vite/legacy-plugin` 中也做了相应的处理。

   ```js
   const legacyGenerateBundlePlugin = {
    name: 'vite:legacy-generate-polyfill-chunk',
    apply: 'build',
    
    async generateBundle(opts, bundle) {
      // ...
      // legacy bundle
      if (legacyPolyfills.size || genDynamicFallback) {
        if (!legacyPolyfills.has('es.promise')) {
          // check if the target needs Promise polyfill because SystemJS relies
          // on it
          detectPolyfills(`Promise.resolve()`, targets, legacyPolyfills)
        }

        isDebug &&
          console.log(
            `[@vitejs/plugin-legacy] legacy polyfills:`,
            legacyPolyfills
          )

        await buildPolyfillChunk(
          'polyfills-legacy',
          legacyPolyfills,
          bundle,
          facadeToLegacyPolyfillMap,
          // force using terser for legacy polyfill minification, since esbuild
          // isn't legacy-safe
          config.build,
          options.externalSystemJS
        )
      }
    } 
   }
   ```

   当收集到的 `Polyfill` 中没有包含 `es.promise`，则会自动注入 `es.promise` 相关的 `Polyfill`。

   ```js
    function detectPolyfills(code, targets, list) {
      const { ast } = loadBabel().transform(code, {
        ast: true,
        babelrc: false,
        configFile: false,
        presets: [
          [
            'env',
            {
              targets,
              modules: false,
              useBuiltIns: 'usage',
              corejs: { version: 3, proposals: false },
              shippedProposals: true,
              ignoreBrowserslistConfig: true
            }
          ]
        ]
      })
      for (const node of ast.program.body) {
        if (node.type === 'ImportDeclaration') {
          const source = node.source.value
          if (
            source.startsWith('core-js/') ||
            source.startsWith('regenerator-runtime/')
          ) {
            list.add(source)
          }
        }
      }
    }
   ```

   确保构建出来的 `Polyfill` 一定包含 `es.promise` 相关的 `Polyfill`。同时也确保了 `SystemJs` 的正常执行。

2. **注入内敛JS代码**

  `Polyfill` 会在 `index.html` 中注入 [Safari 10.1 nomodule fix](https://gist.github.com/samthor/64b114e4a4f539915a95b91ffd340acc)、`SystemJS 初始化` 和 `动态导入回退` 的内敛 JS 代码。

+ **Safari 10.1 nomodule fix**
  
  Safari 11 版本之前是不支持 `type=nomodule`，而支持 `type=module`。但是对于 `type=nomodule` 标签的脚本也会进行加载和执行。会导致执行两遍的代码，[这里](https://gist.github.com/samthor/64b114e4a4f539915a95b91ffd340acc) 有具体的解决方案可供参考。

+ **动态导入回退**

  对于 `safari 10.1` 版本来说支持 `type=module` 但不支持 `type=nomodule` 和 `dynamic import`。因此就会导致在 `type=module` 脚本中使用动态导入模块时会出现报错现象，因此需要对 `dynamic import` 做回退机制。回退使用 `SystemJS` 来进行加载模块。

  ```html
    <script type="module">
      !function () {
        try {
          new Function("m", "return import(m)")
        } catch (o) { 
          console.warn("vite: loading legacy build because dynamic import is unsupported, syntax error above should be ignored"); 
          var e = document.getElementById("vite-legacy-polyfill"), n = document.createElement("script"); 
          n.src = e.src; 
          n.onload = function () { 
            System.import(document.getElementById('vite-legacy-entry').getAttribute('data-src')) 
          };
          document.body.appendChild(n) 
        }
      }();
    </script>

    <script nomodule id="vite-legacy-entry" data-src="./assets/index-legacy.0bf6a3bb.js">
      System.import(document.getElementById('vite-legacy-entry').getAttribute('data-src'))
    </script>
  ```

  + **SystemJS 初始化**

    对于 `Safari` 低版本(**10.1版本及以下**)和支持 `nomodule` 标签而不支持 `module` 浏览器来说需要通过 `SystemJS` 来动态加载入口模块。

    ```js
      System.import(document.getElementById('vite-legacy-entry').getAttribute('data-src'))
    ```

3. **Content Security Policy 的处理**

由于第二点解释了 `Vite` 需要往 `index.html` 中注入内敛 JS 代码。因此当页面配置了 `CSP`，就会阻塞内敛代码的执行。一个很简单的解决方案是使用 `CSP Hash` 来解决这个问题，详细介绍和注意事项可以参照这一篇 **[文章](https://content-security-policy.com/hash/)** 。插件内部已经生成好了各个内敛脚本的 `Hash` 值：

```js
viteLegacyPlugin.cspHashes = [
  createHash('sha256').update(safari10NoModuleFix).digest('base64'),
  createHash('sha256').update(systemJSInlineCode).digest('base64'),
  createHash('sha256').update(dynamicFallbackInlineCode).digest('base64')
]
```

可以直接配置在 `script-src` 上即可。