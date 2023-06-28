# Vite中配置项TS类型提示

`vite` 的默认配置文件是 **`vite.config.ts`**，最基础的配置文件格式如下：

```ts
export default {
  // 配置选项
};
```

我们也可以通过 `–-config` 命令行选项指定一个配置文件，命令行输入： `vite --config configFile.js`。

采用 `vscode` 编译器增添 `vite` 配置时，编译器是没有任何提示的，这对我们很不友好！
（下图的提示并不是 `vite` 的可选配置提示，是插件对JS语法的通用提示）

![vscode-prompt](/vscode-prompt.jpg)

`WebStorm` 有很好的语法补全功能，而 `vscode` 却没有。因此若想让编译器给予智能提示，可以通过以下两种方式来进行特殊处理。

### defineConfig

使用官方提供的 **`defineConfig`**，可以发现存在配置项提示。

![defineConfig-type-prompt](/defineConfig-type-prompt.jpg)

通过查看源码：

```ts
export type UserConfigFn = (env: ConfigEnv) => UserConfig | Promise<UserConfig>
export type UserConfigExport = UserConfig | Promise<UserConfig> | UserConfigFn

/**
 * Type helper to make it easier to use vite.config.ts
 * accepts a direct {@link UserConfig} object, or a function that returns it.
 * The function receives a {@link ConfigEnv} object that exposes two properties:
 * `command` (either `'build'` or `'serve'`), and `mode`.
 */
export function defineConfig(config: UserConfigExport): UserConfigExport {
  return config
}
```

就可以发现本质上就是使用 **`TypeScript`** 来做类型提示。

### jsdoc 注释法

**`jsDoc`** 是一个用于 **`JavaScript`** 的 **`API`** 文档生成器，[官网](https://jsdoc.zcopy.site/)。

通过注释的方式使引用的对象存在类型提示：

```ts
/** @type import("vite").UserConfig  */
```

![defineConfig-type-prompt-view](/defineConfig-type-prompt-view.jpg)

### 环境模式配置

**`webpack`** 时代，基于不同的环境，开发者通常会设置不同的配置文件，如：**`webpack.dev.config`**、**`webpack.prod.config`**、**`webpack.base.config`**...

在 **`vite`** 中，基于不同环境设置不同配置，只需要导出这样一个函数：

```ts
export default defineConfig(({ command, mode, ssrBuild }) => {
  if (command === 'serve') {
    return {
      // dev 独有配置
    }
  } else {
    // command === 'build'
    return {
      // build 独有配置
    }
  }
})
```

**优化一下写法：**

```ts
import { defineConfig } from "vite";
import viteBaseConfig from "./vite.base.config";
import viteDevConfig from "./vite.dev.config";
import viteProdConfig from "./vite.prod.config";

const envResolver = {
  // build: () => ({...viteBaseConfig,viteProdConfig}) 这种方式也可以
  // Object.assign 中的 {} 是为了防止 viteBaseConfig 被修改。
  build: () => Object.assign({}, viteBaseConfig, viteProdConfig),
  serve: () => Object.assign({}, viteBaseConfig, viteDevConfig),
};
export default defineConfig(({ command, mode, ssrBuild }) => {
  return envResolver[command]();
});
```

同时 **`defineConfig`** 也支持异步配置。
如果配置需要调用一个异步函数，也可以转而导出一个异步函数：

```ts
export default defineConfig(async ({ command, mode }) => {
  const data = await asyncFunction()
  return {
    // vite 配置
  }
})
```
