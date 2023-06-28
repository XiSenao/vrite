# 为什么 Vite 需要对预构建产物的路径做重写操作呢？

重写导入的 **hook** 是 **`transformCjsImport`**，其源码注释如下：

```js
/**
 * Detect import statements to a known optimized CJS dependency and provide
 * ES named imports interop. We do this by rewriting named imports to a variable
 * assignment to the corresponding property on the `module.exports` of the cjs
 * module. Note this doesn't support dynamic re-assignments from within the cjs
 * module.
 *
 * Note that es-module-lexer treats `export * from '...'` as an import as well,
 * so, we may encounter ExportAllDeclaration here, in which case `undefined`
 * will be returned.
 *
 * Credits \@csr632 via #837
 */
```

解决问题本源是 [issue#837](https://github.com/vitejs/vite/pull/837)。通过引导可以追溯到 [issue#720](https://github.com/vitejs/vite/issues/720)，问题阐明了在 `Vite` 中使用具名导入模块出现报错现象。

Chrome

```markdown
## Uncaught SyntaxError: The requested module '/@modules/redux-dynamic-modules.js' does not provide an export named 'createStore'
```

Firefox

```markdown
## Uncaught SyntaxError: import not found: createStore
```

### 前置知识补充

1. 导入 **`ESM`** 和 **`CJS`** 规范的模块存在差异化。

    **在 ESM 中：**

      ```js
        // index.js
        import demo from 'demo.js';

        // demo.js
        export default {
          name: 'demo.js'
        }

        export const name = 'demo.js';
      ```

      以上写法是符合规范的。

      ```js
        // index.js
        import { name } from 'demo.js';

        // demo.js
        export default {
          name: 'demo.js'
        }

        export const p = 'demo.js';
      ```

      以上写法是不符合规范的，具名导入必须与具名导出相照应，也就是说必须包含

      ```js
        // index.js
        import { name } from 'demo.js';

        // demo.js
        export const name = 'demo.js';
      ```

      即可符合要求。

    **在 CJS 中：**

      ```js
        // index.js
        import { name } from 'demo.js';

        // demo.js
        module.exports =  {
          name: 'demo.js'
        }
      ```

      以上写法是符合规范的。

2. 通常情况下 **`Vite`** 会对 `Bare Import` 或者 `config.optimizeDeps.include` 中配置好的模块(一般为 **CommonJS** 模块)进行预构建处理( **CommonJS** -> **ESM** )。

通过以上两点前置知识，理解官方提供的注释就不难了。简单阐述就是：

由于 **ESM** 中在大概率的情况下会导入预构建产物（ **CommonJS** 模块），而这些模块已经通过 `Esbuild` 打包成 `ESM` 规范的模块。因此无法再通过具名导入的模式来导入 **default** 产物。

```js
/*======== origin ========*/

// index.js
import { name } from 'demo';

// demo.js
module.exports = {
  name: 'demo.js'
}


/*======== after bundle demo.js ========*/

error 
// index.js
import { name } from 'demo';

// demo.js
export default {
  name: 'demo.js'
}

success
// index.js [rewrite path]
import uniqueName from 'demo';
const name = uniqueName['name'];

// demo.js
export default {
  name: 'demo.js'
}
```

### 如何重写预构建产物的路径呢？

在 **ESM** 中的导入方式有以下几种，因此只需要对以下几种导入方式做重写处理就可以了。

```js
// 1.
import React from 'react';

// 2.
import * as React from 'react';

// 3.
import { jsxDEV as _jsxDEV, Fragment } from "react/jsx-dev-runtime"

// 4.
import('react')

// 5.
export { useState, useEffect as effect, useMemo as default } from 'react';

// 6. 
export * as React from 'react';

// 7. Error!
export * from 'react'

// 8. 
import 'react';
```

1. 重写默认导入 ( `import React from 'react'` )
   默认导入方式主要考虑的是 **CommonJS** 打包后的产物中的 **`__esModule`** 属性值，如果值为 `true` 则取其 **`default`** 值，值为 `false` 则取其自身值。

   ```js
    // `const ${localName} = ${cjsModuleName}.__esModule ? ${cjsModuleName}.default : ${cjsModuleName}`

    import React from 'react'

    // rewrite =============>

    import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=048661c9";
    const React = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react;
   ```

    **为什么需要 `__esModule` 属性呢？**

    **历史包袱：**

      早期还未出 `ESM` 模块规范之前均使用 `CommonJS` 模块规范。 `Node` 就是典例，原生支持 `CommonJS`，因此对于早期的库大多均支持 `CommonJS`(或 AMD 等)。后续官方主推 `ESM` 模块化方案，但是两种模块格式混用的时候问题就来了，`ES 模块` 和 `CommonJS 模块` 并不完全兼容，`CommonJS` 的 `module.exports` 在 `ES 模块` 中没有对应的表达方式，和默认导出 `export default` 是不一样的，即在 `ESM` 中是无法使用默认导入 `CommonJS`。

      ```js
      // Bad Case: index.js
      import demo from './demo.js';

      // Good Case: index.js
      import { name } from './demo.js';
      import * as demo from './demo.js';

      // demo.js
      module.exports = {
        name: 'demo'
      }
      ```

    **解决方案：**

      `__esModule` 解决方案首先由 `Babel` 提出，现在市面上的构建工具也都非常默契地遵守了这个约定。约定如下：

      `Babel` 首先在 `CommonJS` 模块的文件中引入 `__esModule` 标识。如果 `__esModule` 为 `true`，那么当 `CommonJS` 转化为 `ESM` 时，`export default` 导出的值即为 **`module.exports.default`** 的值。如果 `__esModule` 为 `false`，那么当 `CommonJS` 转化为 `ESM` 后，`export default` 的值则为整个 **`module.exports`** 的值。遵守以上规则，那么在 `ESM` 中就可以 **默认导入** `CommonJS` 模块了。

      ```js
      exports.__esModule = true
      
      // or

      Object.defineProperty(exports, '__esModule', { value: true })
      ```

    **注意的点：**

      1. 如果 `CommonJS` 的模块中存在 `__esModule` 为 `false`，导出的是整个 `module.exports` 对象，如果设置了 `__esModule` 为 `false`，这个对象中可能会多一个 `__esModule`。因此如果 `__esModule` 为 `false`，可以不设置。可以看作默认情况下 `__esModule` 的值为 `false`。
      2. 如果 `CommonJS` 的模块中存在 `__esModule` 为 `true`，但是不存在 `module.exports.default` 的属性。对于这种情况，不同的构建工具可能有不同的表现。
         1. 在 `ESbuild` 中：

            ```js
            //commonjs a.js
            module.exports.a = 2
            module.exports.b = 3
            module.exports.__esModule = true

            //main.js

            import x from './a.js'
            x = undefined
            ```

          2. 在 `Vite` 中：

          ```js
           // `const ${localName} = ${cjsModuleName}.__esModule ? ${cjsModuleName}.default : ${cjsModuleName}`

          import React from 'react'

          // rewrite =============>

          import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=048661c9";

          // React = undefined
          const React = __vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react.default : __vite__cjsImport0_react;
          
          ```

      3. 在 `.mjs` 文件中引用

      ```js
        //commonjs a.js
        module.exports.default = "aa"
        module.exports.a = 2
        module.exports.b = 3
        module.exports.__esModule = true

        //main.mjs

        import x from './a.js'
        x = {
          default:'aa',
          a:2,
          b:2,
          __esModule:true
        }

      ```

      以 `.mjs` 后缀结尾的文件，是 `nodejs` 中支持了 `ESM` 的形式，此时如果在 `.mjs` 后缀结尾的文件中引用 `CommonJS`，一般不会做特殊处理。需要 `__esModule` 的本身就是为了兼容 `nodejs` 环境中，使得在 `nodejs` 环境下可以运行 `ESM`。因此这里 `__esModule` 不会生效，所有属性都被当成普通属性。

  
2. 重写 `import * as React from 'react'`。
   重写方式和第一种默认导出有点相类似，不同的是 `import *` 的导入方式本质上就需要导入模块中的所有属性，因此无需考虑 **`__esModule`** 属性值。

   ```js
    // const ${localName} = ${cjsModuleName}
    
    import * as React from 'react'

    // rewrite =============>

    import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=048661c9";
    const React = __vite__cjsImport0_react;
   ```

3. 重写具名导入方式

  ```js
    // const ${localName} = ${cjsModuleName}["${importedName}"]

    import { jsxDEV as _jsxDEV, Fragment } from "react/jsx-dev-runtime"

    // rewrite =============>

    import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=65945471"
    const _jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
    const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"];
  ```

4. 重写动态导入( `import(...)` )则直接暴露 **`default`** 值。
  
  ```js
  // import('${rewrittenUrl}').then(m => m.default && m.default.__esModule ? m.default : ({ ...m.default, default: m.default }))

  import('react')

  // rewrite =============>

  import('/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=65945471').then(m => m.default && m.default.__esModule ? m.default : ({ ...m.default, default: m.default }));
  ```

5. 重写重导出模块，即先导入后导出。
  
  ```js
  export { useState, useEffect as effect, useMemo as default } from 'react';

  // rewrite =============>

  import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=3c90f486"
  const __vite__cjsExport_useState = __vite__cjsImport0_react["useState"]
  const __vite__cjsExport_effect = __vite__cjsImport0_react["useEffect"]
  const __vite__cjsExportDefault_0 = __vite__cjsImport0_react["useMemo"]
  export default __vite__cjsExportDefault_0
  export { __vite__cjsExport_useState as useState, __vite__cjsExport_effect as effect }
  ```

6. 重写重导出模块。

  ```js
  export * as React from 'react';

  // rewrite =============>

  export * as React from '/node_modules/.vite/deps/react.js?v=3c90f486';
  ```

7. `export * from 'react'` 存在异常错误，可能会失去模块导出。
   可以看到在重写路径 `transformCjsImport` 方法下有这么一行注释：

   ```js
    // `export * from '...'` may cause unexpected problem, so give it a warning
    if (
      config.command === 'serve' &&
      node.type === 'ExportAllDeclaration' &&
      !node.exported
    ) {
      config.logger.warn(
        colors.yellow(
          `\nUnable to interop \`${importExp}\` in ${importer}, this may lose module exports. Please export "${rawUrl}" as ESM or use named exports instead, e.g. \`export { A, B } from "${rawUrl}"\``,
        ),
      )
    }
   ```

   那么这个是什么原因导致的呢？我们可以追溯一下此次修改的 [issue](https://github.com/vitejs/vite/issues/12764)，简单阐述一下此 [issue](https://github.com/vitejs/vite/issues/12764) 表述的问题：

   **问题：**
    在 **App.tsx** 中无法使用具名导入重导入的内容，而通过直接导入的方式可以正常导入。

    ```js
    // bug.ts
    export * from '@prisma/client'
    ```

    ```js
    // App.tsx
    import { UserRole } from './bug.ts' 
    // Syntax error on runtime "The requested module bug.ts does not provide an export UserRole"

    import UserRole from "./bug.ts";
    // Syntax error on runtime "The requested module bug.ts does not provide an export named default" 

    import { UserRole } from '@prisma/client' // Works fine
    ```

    **原因分析：**

    1. `export * from '@prisma/client'` 写法意味着导出 `@prisma/client` 模块中非 `default` 的数据集合，也就是说在 `ESM` 中使用 `export` 来进行导出的（非 `export default`）。
    2. `@prisma/client` 在 `Vite` 中被检测为需要预构建的模块（**CommonJS** 模块）。在预构建阶段会通过 `ESbuild` 将原先 **CommonJS** 模块构建为 **ESM** 模块。通过观察构建产物，会发现 `ESbuild` 构建 `CommonJS` 的产物最终都会以 `export default` 的形式默认导出。那么也就说明通过 `export * from 'CommonJS_Module'` 是没有意义的（构建产物中并不会以 `export` 来导出属性）。这也就可以解释为什么通过 `import { UserRole } from './bug.ts'` 和 `import UserRole from "./bug.ts"` 两种导入方式均报相同的错误，前者是因为 `@prisma/client` 中没有 `export` 指定的 `UserRole` 属性，后者是因为 `export * from 'xxx'` 导出的是非 `default` 的数据集合。两者均为空属性集合，自然无法获取 `UserRole` 和 `default` 的属性。
    3. 对于第三中写法可以正常运行的原因是因为 `Vite` 判定 `@prisma/client` 为预构建过的产物，因此会对路径进行重写：

      ```js
      import { UserRole } from '@prisma/client'

      // rewrite ========>

      import __vite__cjsImport0_@prisma_client from "/node_modules/.vite/deps/@prisma_client.js?v=65945471"
      const UserRole = __vite__cjsImport0_@prisma_client["UserRole"]
      ```

    `/node_modules/.vite/deps/@prisma_client.js?v=65945471` 是已经被 `Vite` 构建好的 `ESM` 产物，以 `export default` 的模式默认导出，那么自然可以执行成功。

8. `import 'react'`

  ```js
    import 'react'

    // rewrite =============>

    import '/node_modules/.vite/deps/react.js?v=3c90f486'
  ```
