# 配置解析

不管是开发阶段还是生产阶段，对于配置文件的解析都是必要的。解析流程主要分为 `vite.config` 的配置解析、`plugins` 的排序和初始化(执行各个插件的 `config hook`)、加载 `.env` 文件(默认是没有的)。

## `vite.config` 模块的加载

```js
let { configFile } = config;
if (configFile !== false) {
    const loadResult = await loadConfigFromFile(configEnv, configFile, config.root, config.logLevel);
    if (loadResult) {
        config = mergeConfig(loadResult.config, config);
        configFile = loadResult.path;
        configFileDependencies = loadResult.dependencies;
    }
}
```

默认 `config` 为 `inlineConfig`

```js
const inlineConfig = {
  root,
  base: options.base,
  mode: options.mode,
  configFile: options.config,
  logLevel: options.logLevel,
  clearScreen: options.clearScreen,
  optimizeDeps: { force: options.force },
  build: buildOptions
}
```

`options` 是用户在控制台中通过指令的方式来进行配置的。例如 `configFile` 这个配置项，值是通过用户执行 `vite --config=xxx` 所得到的，默认情况下为 `undefined`。因此判断语句在默认情况下都是会执行的，除非执行 `vite --config=false`。

在 `loadConfigFromFile` 函数中主要做了如下工作：

1. 获取 `vite.config` 在文件系统下的路径

`vite.config` 的后缀其实应该有 `6` 中，包含 `js` 和 `ts` 在 `ESM` 和 `CJS` 下的所有后缀

```js
const DEFAULT_CONFIG_FILES = [
 'vite.config.js',
 'vite.config.mjs',
 'vite.config.ts',
 'vite.config.cjs'
 'vite.config.mts',
 'vite.config.cts'
];
```

检索配置文件系统的名称从上往下优先级以此递减。`Vite` 默认配置模块(**`无法修改`**)为项目的根目录下，因此默认检索只会检索根目录下是否存在，由上往下依次检索直到存在即为项目的配置文件。

1. 判断配置模块是 `ESM` 模块还是 `CJS` 模块

判断配置模块归属于哪一个模块就很简单，通常可以直接通过判断配置文件后缀得出。如果是特殊的后缀，那么可以通过检测项目的 `package.json` 模块中是否设置 `type: module`。

```js
let isESM = false;
if (/\.m[jt]s$/.test(resolvedPath)) {
  isESM = true;
}
else if (/\.c[jt]s$/.test(resolvedPath)) {
  isESM = false;
}
else {
  try {
    const pkg = lookupFile(configRoot, ['package.json']);
    isESM = !!pkg && JSON.parse(pkg).type === 'module';
  }
  catch (e) { }
}
```

还需要关注的点是 `package.json` 的检索是通过 `lookupFile` 方法来进行实现的，实现逻辑是先从 `configRoot` 目录下开始检索，若没有检索到则往父目录下继续检索，直到检索到 `package.json` 模块为止，若没有检索到则返回 `undefined`。

3. 不同模块根据不同方式来进行加载

这一步就比较有意思了，针对 `ESM` 和 `CJS` 采取的解析方案有很大的区别。不过两者都是借助 `esbuild` 来执行打包构建流程。

+ **为什么要执行构建流程呢?**
  
  其实配置模块和普通模块都是一样的，都有可能依赖其他的模块。但是可能也会想现在应该是处于运行阶段，可以直接通过 `import` (esm) 或者 `require` (cjs) 的方式来加载配置文件就可以了，没有必要先打包后加载配置文件。我的考虑点是回到打包的意义，通俗来讲打包的意义为容器兼容、优化项目加载流程(包含减小包体积、split chunk等)。在这里的话应该是兼容的意义，可能存在不同规范间的模块依赖，那么就会导致解析模块异常。还有一个原因是优化解析速度，`node` 在解析模块([demo](https://github.com/XiSenao/vite-design.github.io/blob/master/docs/demo/require/require-mock.js))流程简单可以概括为 `加载模块 -> 编译模块 -> 执行模块 -> 加载模块 -> ...` 以此类推递归解析各个模块，整个流程在大规模的依赖上势必解析会耗时。如果先打包的话那么对于 `node` 来说就只需要 `加载模块 -> 编译模块 -> 执行模块`，更甚者只需要 `编译模块 -> 执行模块`。同时配合 `esbuild` 原生构建工具，打包速度十分迅速，综合来看对于模块解析流程会有一定的提升。

+ **`Esbuild` 打包流程**

  `Esbuild` 在打包的流程中 `Vite` 会注入 `externalize-deps`、`inject-file-scope-variables` 两个插件。前者插件的用途是过滤掉非使用相对路径的模块(e.g. `import react from '@vitejs/plugin-react'`、`import { defineConfig } from '/demo'`); 后者插件的目的是为非过滤的模块注入 `__dirname`、`__filename`、`__vite_injected_original_import_meta_url` 三个与模块相关的路径常量。代码实现如下：

    ```js
    async function bundleConfigFile(fileName, isESM = false) {
      const importMetaUrlVarName = '__vite_injected_original_import_meta_url';
      const result = await build$3({
        // ... 省略其他配置项
        format: isESM ? 'esm' : 'cjs',
        plugins: [
          {
            name: 'externalize-deps',
            setup(build) {
              build.onResolve({ filter: /.*/ }, (args) => {
                const id = args.path;
                if (id[0] !== '.' && !path$o.isAbsolute(id)) {
                  return {
                    external: true
                  };
                }
              });
            }
          },
          {
            name: 'inject-file-scope-variables',
            setup(build) {
              build.onLoad({ filter: /\.[cm]?[jt]s$/ }, async (args) => {
                const contents = await fs$l.promises.readFile(args.path, 'utf8');
                const injectValues = `const __dirname = ${JSON.stringify(path$o.dirname(args.path))};` +
                  `const __filename = ${JSON.stringify(args.path)};` +
                  `const ${importMetaUrlVarName} = ${JSON.stringify(pathToFileURL(args.path).href)};`;
                return {
                  loader: isTS(args.path) ? 'ts' : 'js',
                  contents: injectValues + contents
                };
              });
            }
          }
        ]
      });
      const { text } = result.outputFiles[0];
      return {
        code: text,
        dependencies: result.metafile ? Object.keys(result.metafile.inputs) : []
      };
    }
    ```

+ **`ESM` 模块的处理**
  
  将配置模块的打包产物以 `.mjs` 为后缀写入文件系统中，再通过 `import` 来动态加载模块信息，最后将 `.mjs` 后缀的配置模块从文件系统中抹除。代码实现如下：

  ```js
  const dynamicImport = new Function('file', 'return import(file)');
  if (isESM) {
    if (isTS(resolvedPath)) {
      fs$l.writeFileSync(resolvedPath + '.mjs', bundled.code);
      try {
          userConfig = (await dynamicImport(`${fileUrl}.mjs?t=${Date.now()}`))
              .default;
      }
      finally {
          fs$l.unlinkSync(resolvedPath + '.mjs');
      }
    }
    else {
      userConfig = (await dynamicImport(`${fileUrl}?t=${Date.now()}`)).default;
    }
  }
  ```

+ **`CJS` 模块的处理**

  为了让 `require` 能直接执行编译流程而不需执行加载流程，重写 `require.extensions['.js']` 的方法，使打包后的配置模块可以直接进行编译。代码实现如下：

    ```js
    async function loadConfigFromBundledFile(fileName, bundledCode) {
        const realFileName = fs$l.realpathSync(fileName);
        const defaultLoader = _require.extensions['.js'];
        _require.extensions['.js'] = (module, filename) => {
            if (filename === realFileName) {
                module._compile(bundledCode, filename);
            }
            else {
                defaultLoader(module, filename);
            }
        };
        delete _require.cache[_require.resolve(fileName)];
        const raw = _require(fileName);
        _require.extensions['.js'] = defaultLoader;
        return raw.__esModule ? raw.default : raw;
    }

    if (!userConfig) {
        const bundled = await bundleConfigFile(resolvedPath);
        dependencies = bundled.dependencies;
        userConfig = await loadConfigFromBundledFile(resolvedPath, bundled.code);
    }
    ```

+ **合并配置模块**
  
  整体思路为 `vite.config` 为基本配置模块，遍历 `inlineConfig` 中存在的变量值(非 `undefined` 和 `null`)，将值合并到 `vite.config` 对应的属性中。合并细节代码如下：

  ```js
  function arraify(target) {
    return Array.isArray(target) ? target : [target];
  }
  function isObject$2(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }
  // 由于 alias 的执行顺序是自上而下，因此在这里顺序应该被翻转，也就是说排序到后面的优先级会更高。
  function mergeAlias(a, b) {
    if (!a)
      return b;
    if (!b)
      return a;
    if (isObject$2(a) && isObject$2(b)) {
      return { ...a, ...b };
    }
    return [...normalizeAlias(b), ...normalizeAlias(a)];
  }
  function mergeConfigRecursively(defaults, overrides, rootPath) {
    const merged = { ...defaults };
    for (const key in overrides) {
        const value = overrides[key];
        if (value == null) {
            continue;
        }
        const existing = merged[key];
        if (existing == null) {
            merged[key] = value;
            continue;
        }
        if (key === 'alias' && (rootPath === 'resolve' || rootPath === '')) {
            merged[key] = mergeAlias(existing, value);
            continue;
        }
        else if (key === 'assetsInclude' && rootPath === '') {
            merged[key] = [].concat(existing, value);
            continue;
        }
        else if (key === 'noExternal' &&
            rootPath === 'ssr' &&
            (existing === true || value === true)) {
            merged[key] = true;
            continue;
        }
        if (Array.isArray(existing) || Array.isArray(value)) {
            merged[key] = [...arraify(existing ?? []), ...arraify(value ?? [])];
            continue;
        }
        if (isObject$2(existing) && isObject$2(value)) {
            merged[key] = mergeConfigRecursively(existing, value, rootPath ? `${rootPath}.${key}` : key);
            continue;
        }
        merged[key] = value;
    }
    return merged;
  }
  ```
  
需要注意，通过打包流程会获取到当前模块的依赖模块(包含自身模块) `dependencies`，这个会和后续的 [**HMR**](/reference/hmr) 的 `handleHMRUpdate` 更新有关。

## `plugins` 的初始化和排序
  
  `Vite` 中的插件主要分为两种，用户编写的插件和 `Vite` 内置的插件。对于用户编写的插件会分为 `user plugin` 和 `worker plugin`。前者对于以 `this.option.entry`、`import()`、`this.emitChunk` 这一类的入口模块均会进行调用；而后者只针对于 `worker` 的模块，调用流程如下：

  ```js
  export async function bundleWorkerEntry(
    config: ResolvedConfig,
    id: string,
    query: Record<string, string> | null
  ): Promise<OutputChunk> {
    // bundle the file as entry to support imports
    const { rollup } = await import('rollup')
    const { plugins, rollupOptions, format } = config.worker
    const bundle = await rollup({
      ...rollupOptions,
      input: cleanUrl(id),
      plugins,
      onwarn(warning, warn) {
        onRollupWarning(warning, warn, config)
      },
      preserveEntrySignatures: false
    })
    // ...
  }
  ```

  可以看出来针对 `worker` 模块的处理，会通过直接调用 `rollup` 来生成模块，而这里用到的 `plugins` 也就是上述提到的 `worker plugins`。`worker plugins` 的处理时机在 `user normal plugins` 之前。插件详情流程可以跳转到 worker plugin

1. **初始化插件**

+ 扁平化 `vite.config` 模块中所有的 `plugins`，这意味着 `Vite` 在插件中实现上支持 `异步操作` 和 `一个插件可导出多个插件`。

  ```js
  async function asyncFlatten(arr) {
    do {
      arr = (await Promise.all(arr)).flat(Infinity);
    } while (arr.some((v) => v?.then));
    return arr;
  }
  ```
  
+ 过滤掉无需开启使用的插件，若插件中存在 `apply` 属性则根据 `apply` 属性的值来确定当前插件是否需要被用到。代码如下：

  ```js
  const rawUserPlugins = (await asyncFlatten(config.plugins || [])).filter((p) => {
    if (!p) {
      // 过滤本就不存在或者 promise 异步执行后才决定不需要的插件
      return false;
    }
    else if (!p.apply) {
      // 默认情况下当前插件需要使用
      return true;
    }
    else if (typeof p.apply === 'function') {
      // 执行插件中的 apply 函数根据函数返回值来确定是否需要使用当前插件。
      return p.apply({ ...config, mode }, configEnv);
    }
    else {
      // 插件与所处环境相适配。
      return p.apply === command;
    }
  });                                                                                
  ```

2. **排序插件，确定插件的优先级**

  根据插件的优先级来排序插件的执行顺序，代码如下：
  
  ```js
  function sortUserPlugins(plugins) {
    const prePlugins = [];
    const postPlugins = [];
    const normalPlugins = [];
    if (plugins) {
        plugins.flat().forEach((p) => {
            if (p.enforce === 'pre')
                prePlugins.push(p);
            else if (p.enforce === 'post')
                postPlugins.push(p);
            else
                normalPlugins.push(p);
        });
    }
    return [prePlugins, normalPlugins, postPlugins];
  }
  ```

  从代码上可以了解 `Vite` 对于优先级的设定是通过在插件中配置 `enforce` 属性来进行确定的，即根据 `enforce` 值为 `pre`、`post`、`插件配置的相对位置` 来确定执行顺序。

3. 按上述排序顺序依次执行并合并用户配置插件的 `config` 钩子，该钩子的执行也标志着 `vite` 配置信息的最后确定(用户可修改)。

  ```js
  const userPlugins = [...prePlugins, ...normalPlugins, ...postPlugins];
  for (const p of userPlugins) {
    if (p.config) {
      const res = await p.config(config, configEnv);
      if (res) {
        config = mergeConfig(config, res);
      }
    }
  }
  ```

4. **解析插件**


## 加载 `env` 文件

在 `vite.config` 中可以通过配置 `envPrefix` (默认为 [`VITE_`]) 来定义以 `prefixes` 为前缀的所有 `process.env` 和 `envFiles` 模块中的变量。`Vite` 对于 `env` 模块路径分为以下 `4` 类。

```js
const envFiles = [
  /** mode local file */ `.env.${mode}.local`,
  /** mode file */ `.env.${mode}`,
  /** local file */ `.env.local`,
  /** default file */ `.env`
];
```

检索方式默认从根目录下(可以通过在 `vite.config` 配置模块中设置 `envDir` 属性来修改默认路径) 开始，若没有检索到则往父路径下进行检索，直到检索到 `env` 模块路径为止。检索的方式和 `package.json` 的检索方式类似。

加载 `env` 模块会借助 `dotenv` 的能力来进行解析。不过这里需要注意的是 `env` 模块并不会被注入到 `process.env` 中。

```js
// let environment variables use each other
main({
  parsed,
  // 避免对 process.env 产生影响
  ignoreProcessEnv: true
});
```

加载完成 `env` 模块后会获取到 `JS Object`，然后会提取以 `prefixes` 为前缀的所有非空键值对。

```js
function loadEnv(mode, envDir, prefixes = 'VITE_') {
  if (mode === 'local') {
    throw new Error(`"local" cannot be used as a mode name because it conflicts with ` +
      `the .local postfix for .env files.`);
  }
  prefixes = arraify(prefixes);
  const env = {};
  const envFiles = [
    /** mode local file */ `.env.${mode}.local`,
    /** mode file */ `.env.${mode}`,
    /** local file */ `.env.local`,
    /** default file */ `.env`
  ];
  // check if there are actual env variables starting with VITE_*
  // these are typically provided inline and should be prioritized
  for (const key in process.env) {
    if (prefixes.some((prefix) => key.startsWith(prefix)) &&
      env[key] === undefined) {
      env[key] = process.env[key];
    }
  }
  for (const file of envFiles) {
    const path = lookupFile(envDir, [file], { pathOnly: true, rootDir: envDir });
    if (path) {
      const parsed = main$1.exports.parse(fs$l.readFileSync(path), {
        debug: process.env.DEBUG?.includes('vite:dotenv') || undefined
      });
      // let environment variables use each other
      main({
        parsed,
        // prevent process.env mutation
        ignoreProcessEnv: true
      });
      // only keys that start with prefix are exposed to client
      for (const [key, value] of Object.entries(parsed)) {
        if (prefixes.some((prefix) => key.startsWith(prefix)) &&
          env[key] === undefined) {
          env[key] = value;
        }
        else if (key === 'NODE_ENV' &&
          process.env.VITE_USER_NODE_ENV === undefined) {
          // NODE_ENV override in .env file
          process.env.VITE_USER_NODE_ENV = value;
        }
      }
    }
  }
  return env;
}
```

最后的解析完成的 `env` 则作为 `userEnv`。用户最终可以通过 `config.env` 来进行获取。

```js
async function resolveConfig(inlineConfig, command, defaultMode = 'development') {
  // ...
  const resolved = {
    // ...
    env: {
      ...userEnv,
      BASE_URL,
      MODE: mode,
      DEV: !isProduction,
      PROD: isProduction
    },
    // ...
  }
  //...
  return resolved;
}
```

## 开发模式和生产环境下的区别

开发和生产环境下均会执行 `resolveConfig` 的流程

```js
async function doBuild(inlineConfig = {}) {
  const config = await resolveConfig(inlineConfig, 'build', 'production');
  // ...
}

async function createServer(inlineConfig = {}) {
  const config = await resolveConfig(inlineConfig, 'serve', 'development');
  // ...
}
```

通过传入的参数可以很清晰的看出第二个参数和第三个参数不一致。在 `resolveConfig` 函数中没有针对不同模式产生一些额外的逻辑处理，只是确认模式的一些逻辑。

```js
  async function loadConfigFromFile(configEnv, configFile, configRoot = process.cwd(), logLevel) {
    // ...
    const config = await (typeof userConfig === 'function'
      ? userConfig(configEnv)
      : userConfig);
    // ...
    return {
      path: normalizePath$3(resolvedPath),
      config,
      dependencies
    };
  }
  async function resolveConfig(inlineConfig, command, defaultMode = 'development') {
    // 通常兜底
    let mode = inlineConfig.mode || defaultMode;
    if (mode === 'production') {
      process.env.NODE_ENV = 'production';
    }
    const configEnv = {
      mode,
      command
    };
    if (configFile !== false) {
      const loadResult = await loadConfigFromFile(configEnv, configFile, config.root, config.logLevel);
      if (loadResult) {
        config = mergeConfig(loadResult.config, config);
        configFile = loadResult.path;
        configFileDependencies = loadResult.dependencies;
      }
    }
    mode = inlineConfig.mode || config.mode || mode;
    configEnv.mode = mode;
    
    // 插件解析
    const rawUserPlugins = (await asyncFlatten(config.plugins || [])).filter((p) => {
      if (!p) {
       return false;
      }
      else if (!p.apply) {
        return true;
      }
      else if (typeof p.apply === 'function') {
        return p.apply({ ...config, mode }, configEnv);
      }
      else {
        // 插件执行是通过模式来进行确定
        return p.apply === command;
      }
    });
    for (const p of userPlugins) {
      if (p.config) {
        const res = await p.config(config, configEnv);
        if (res) {
          config = mergeConfig(config, res);
        }
      }
    }

    config = mergeConfig(config, externalConfigCompat(config, configEnv));
  }
  /**
   *  当 legacy.buildRollupPluginCommonjs 配置禁用掉后支持rollupOptions.external，这个函数就是为 config?.build?.rollupOptions?.external 提供额外的配置支持。
   *  */ 
  function externalConfigCompat(config, { command }) {
    // Only affects the build command
    if (command !== 'build') {
      return {};
    }
    const external = config?.build?.rollupOptions?.external;
    // 没配置的话则直接跳过
    if (!external) {
        return {};
    }
    let normalizedExternal = external;
    if (typeof external === 'string') {
      normalizedExternal = [external];
    }
    const additionalConfig = {
      optimizeDeps: {
        exclude: normalizedExternal,
        esbuildOptions: {
          plugins: [
            esbuildCjsExternalPlugin(normalizedExternal)
          ]
        }
      }
    };
    return additionalConfig;
  }
```
