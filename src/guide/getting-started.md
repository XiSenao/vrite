# 学习源码前的准备

## 构建 Vite 项目

```bash
# 1. clone Vite code source
$ git clone git@github.com:vitejs/vite.git

# 进入 Vite 项目
$ cd vite

# 安装全局依赖
$ pnpm install

# 进入 Vite 模块
$ cd package/vite

# 若存在 TS 类型报错，添加遗漏的 TS 类型或者使用 @ts-ignore 注释均可，处理完后再执行 pnpm build。
$ pnpm build
```

执行完成后会在 `package/vite` 的目录下生成 `dist` 目录，里面就是 `Vite` 构建完的产物。

## 创建 Vite 项目

以下执行的指令均在 `package/vite` 的目录下：

```bash
# 通过 Cli 构建 demo 项目
$ pnpm create vite

# 进入 demo 项目
$ cd demo

# 安装 demo 项目的所有依赖
$ pnpm install

$ cd node_modules/.bin

# 删除 demo 项目 vite 的执行脚本
$ rm -rf vite

# 将 vite 项目的执行脚本（package/vite/bin/vite.js）软链到 demo 项目中
$ ln -s /Users/xxx/vite/packages/vite/bin/vite.js vite
```

通过软链 `vite` 脚本后，在 `demo` 项目中构建或启动开发服务器的话均会执行 `package/vite/dist` 中的源码，只需对 `package/vite/dist` 进行调试即可理清源码执行流程。

现在我们可以直接修改 Vite src 目录下的代码并且实时验证了

## Vite 目录结构分析

简单介绍一下 Vite 源码目录各个模块的作用

```bash
$ tree -L 2 -I 'node_modules' ./src

├── client # 客户端代码，在开发模式下会和服务端建立 socket 通信以及 HMR 处理。
│   ├── client.ts
│   ├── env.ts
│   ├── overlay.ts
│   └── tsconfig.json
├── node # 服务端代码
│   ├── __tests__
│   ├── build.ts
│   ├── cli.ts
│   ├── config.ts
│   ├── constants.ts
│   ├── env.ts
│   ├── http.ts
│   ├── index.ts
│   ├── logger.ts
│   ├── optimizer
│   ├── packages.ts
│   ├── plugin.ts
│   ├── plugins
│   ├── preview.ts
│   ├── publicUtils.ts
│   ├── server
│   ├── shortcuts.ts
│   ├── ssr
│   ├── tsconfig.json
│   ├── utils.ts
│   └── watch.ts
└── types
    ├── alias.d.ts
    ├── anymatch.d.ts
    ├── chokidar.d.ts
    ├── commonjs.d.ts
    ├── connect.d.ts
    ├── dynamicImportVars.d.ts
    ├── http-proxy.d.ts
    ├── lightningcss.d.ts
    ├── package.json
    ├── shims.d.ts
    ├── terser.d.ts
    └── ws.d.ts

6 directories, 12 files
```
