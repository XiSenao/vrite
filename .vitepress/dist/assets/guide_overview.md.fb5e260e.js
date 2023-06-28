import{_ as e,o as r,c as t,R as a}from"./chunks/framework.fed62f4c.js";const f=JSON.parse('{"title":"Design Art of Vite","description":"","frontmatter":{},"headers":[],"relativePath":"guide/overview.md","filePath":"guide/overview.md","lastUpdated":null}'),i={name:"guide/overview.md"},o=a('<h1 id="design-art-of-vite" tabindex="-1">Design Art of Vite <a class="header-anchor" href="#design-art-of-vite" aria-label="Permalink to &quot;Design Art of Vite&quot;">​</a></h1><p>Vite 是一种新型前端构建工具，主要在于显著提升前端开发体验。它主要由以下两个部分组成：</p><ul><li>在开发环境下，与 Webpack 截然不同的是 Vite 通过借助浏览器原生支持 ESM 的特性，并没有对模块进行打包分发处理。它只需要关心每一个模块均是 ESM 即可，对于非 ESM 模块借助 ESbuild 快速进行打包转译为 ESM 规范的模块。这也使得拥有了较快 <a href="./../reference/hmr">模块热更新（HMR）</a></li><li>在生产环境下，Vite 借助于预配置的 Rollup 能力对模块进行构建处理。插件的设计上 Vite 借鉴于 Rollup 的插件体系并对其进行扩展，无需重复为不同环境编写同一个插件，确保了在生产环境和开发环境解析流程一致性。</li></ul><h2 id="browser-support" tabindex="-1">Browser Support <a class="header-anchor" href="#browser-support" aria-label="Permalink to &quot;Browser Support&quot;">​</a></h2><p>默认的构建目标是能支持 <a href="https://caniuse.com/es6-module" target="_blank" rel="noreferrer">原生 ESM 语法的 script 标签</a>、<a href="https://caniuse.com/es6-module-dynamic-import" target="_blank" rel="noreferrer">原生 ESM 动态导入</a> 和 <code>i<wbr>mport.meta</code> 的浏览器。传统浏览器可以通过官方插件 <a href="https://github.com/vitejs/vite/tree/main/packages/plugin-legacy" target="_blank" rel="noreferrer">@vitejs/plugin-legacy</a> 支持 —— 细节解析还请 <a href="./../plugin/inside/plugin-legacy">查看</a> 获悉。</p>',5),s=[o];function l(n,c,p,d,u,_){return r(),t("div",null,s)}const m=e(i,[["render",l]]);export{f as __pageData,m as default};
