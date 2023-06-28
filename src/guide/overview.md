# Design Art of Vite

Vite 是一种新型前端构建工具，主要在于显著提升前端开发体验。它主要由以下两个部分组成：

+ 在开发环境下，与 Webpack 截然不同的是 Vite 通过借助浏览器原生支持 ESM 的特性，并没有对模块进行打包分发处理。它只需要关心每一个模块均是 ESM 即可，对于非 ESM 模块借助 ESbuild 快速进行打包转译为 ESM 规范的模块。这也使得拥有了较快 [模块热更新（HMR）](../reference/hmr.md)
+ 在生产环境下，Vite 借助于预配置的 Rollup 能力对模块进行构建处理。插件的设计上 Vite 借鉴于 Rollup 的插件体系并对其进行扩展，无需重复为不同环境编写同一个插件，确保了在生产环境和开发环境解析流程一致性。

## Browser Support

默认的构建目标是能支持 [原生 ESM 语法的 script 标签](https://caniuse.com/es6-module)、[原生 ESM 动态导入](https://caniuse.com/es6-module-dynamic-import) 和 `import.meta` 的浏览器。传统浏览器可以通过官方插件 [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) 支持 —— 细节解析还请 [查看](../plugin/inside/plugin-legacy.md) 获悉。
