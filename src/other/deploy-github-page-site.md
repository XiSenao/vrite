# 部署 Github Page Site 的那些事情

## 目标

- 提交代码时自动部署 `github page` 站点。
- 站点域名为自定义域名(非 `{username}.github.io` 域名，`username` 为自身 github 账号名称)。
- 采用 `cdn` 加速资源，提高用户访问速度。

## 实现

### 自动部署 github page

对于 `github page` 部署，`github` 提供了两种方案：

1. **通过自定义构建工作流（`workflow`）来进行构建 [`Github Actions`](https://www.ruanyifeng.com/blog/2019/09/getting-started-with-github-actions.html)**

   `Vitepress` 官方提供了 `Github Actions` 的方式来部署 `github page`，点击 [查看详情](https://vitepress.dev/guide/deploy#github-pages) 获取更多资讯。在项目根目录下添加 `yaml` 模块(`.github/workflows/deploy.yml`)：

   ```yaml{6,27,31}
   name: Deploy
    on:
    workflow_dispatch: {}
    push:
        branches:
        - main
    jobs:
    deploy:
        runs-on: ubuntu-latest
        permissions:
        contents: read
        pages: write
        id-token: write
        environment:
        name: github-pages
        url: ${{ steps.deployment.outputs.page_url }}
        steps:
        - uses: actions/checkout@v3
            with:
            fetch-depth: 0
        - uses: actions/setup-node@v3
            with:
            node-version: 16
            cache: npm
        - run: npm ci
        - name: Build
            run: npm run docs:build
        - uses: actions/configure-pages@v2
        - uses: actions/upload-pages-artifact@v1
            with:
            path: docs/.vitepress/dist
        - name: Deploy
            id: deployment
            uses: actions/deploy-pages@v1
   ```

    需要注意以上 `yaml` 模块中第 `6` 行（当本地代码 `push` 代码到 `main` 分支时执行 github 工作流）、第 `27` 行（github 工作流会执行 `npm run docs:build` 脚本来构建仓库）、第 `31` 行（将构建好的产物（路径： `docs/.vitepress/dist`）作为发布）。以上可以根据自身项目情况来做适当修改。当前项目修改配置模块如下：

    ```yaml
    name: Deploy
    on:
    workflow_dispatch: {}
    push:
        branches:
        - main // [!code --]
        - master // [!code ++]
    jobs:
    deploy:
        runs-on: ubuntu-latest
        permissions:
        pages: write
        id-token: write
        environment:
        name: github-pages
        url: ${{ steps.deployment.outputs.page_url }}
        steps:
        - uses: actions/checkout@v3
            with:
            fetch-depth: 0
        - uses: actions/setup-node@v3
            with:
            node-version: 16
            cache: npm
        - run: npm ci
        - name: Build
            run: npm run docs:build // [!code --]
            run: npm run build // [!code ++]
        - uses: actions/configure-pages@v2
        - uses: actions/upload-pages-artifact@v1
            with:
            path: docs/.vitepress/dist // [!code --]
            path: .vitepress/dist // [!code ++]
        - name: Deploy
            id: deployment
            uses: actions/deploy-pages@v1
    ```

    设置后每次代码 `push` 到 `master` 分支后会自动执行 github 工作流， 工作流会自动执行 `npm run build` 指令来构建当前仓库，将路径为 `.vitepress/dist` 的构建成功的产物进行上传并自动部署到 `github page` 站点上，那么就可以通过 `{username}.github.io` 静态页面。
2. 通过分支来自动部署

### 自定义域名配置

1. **通过腾讯云购买所需要的自定义域名（以下以 `vite.cn` 域名为例）。**
2. **进入 [DNS 解析 DNSPod](https://console.cloud.tencent.com/cns) 为 `vrite.cn` 域名添加解析记录。**
3. **在域名解析里添加一条 `CNAME 记录`（推荐），或者添加 4 条 `A 记录`。**

   - `CNAME 记录` 信息：

   | 主机记录  |   记录类型  |  记录值           |
   | -------  | :-------: | ----------------: |
   | www      | CNAME     | xisenao.github.io |

   - `A 记录` 信息：

   | 主机记录  |   记录类型  |  记录值          |
   | -------  | :-------: | --------------: |
   | www      | A         | 185.199.108.153 |
   | www      | A         | 185.199.109.153 |
   | www      | A         | 185.199.110.153 |
   | www      | A         | 185.199.111.153 |

4. **Github 绑定域名**

   当前部署仓库 `Settings` -> `Pages` -> `Custom domain` 填写已配置好的自定义域名（`www.vrite.cn`）。勾选下方 `Enforce HTTPS` 选项（在 2018 年 5 月 1 日之后，GitHub Pages 已经开始提供免费为自定义域名开启 HTTPS 的功能，并且大大简化了操作的流程，现在用户已经不再需要自己提供证书，只需要将自己的域名使用 CNAME 的方式指向自己的 GitHub Pages 域名即可。）。

到此为止就可以通过 `https://www.vrite.cn` 来访问 `github page` 站点了。

### cdn加速

#### 配置原理

原先的访问路径为 `域名` -> `DNS 服务器` -> `Github 服务器`，现阶段在其中添加一层 `CDN 服务器` 将整个流程串起来即可，那么访问路径就变为了 `域名` -> `DNS 服务器` -> `CDN 服务器` -> `Github 服务器`。实现这样一条链路则需要做好 `DNS 服务器` -> `CDN 服务器` 和 `CDN 服务器` -> `Github 服务器` 的映射关系。同时还需要启用 `CDN 服务器`。

以腾讯云为例：

1. 启用 `CDN 服务器`

   在 `域名管理` 中添加加速域名

   ![CDN加速域名配置](/cdn-domain-name-configuration.png)

   ::: warning 值得一提
    1. 所添加的域名需要做验证处理，腾讯提供了 `TXT记录DNS解析验证` 和 `文件验证` 两种方式来确认域名归属。
    2. 加速区域为中国境外（访问用户为境外用户，包括中国香港、中国澳门、中国台湾等地区；）的域名无需做备案，而对于加速区域为 `中国境内`（访问用户为境内用户） 或 `全球`（访问用户为境内和境外用户） 的域名需要做备案。
    3. 接入单域名时需要为 `www.vrite.cn` 和 `vrite.cn` 两个域名做加速，也就是说需要配置两次。因为当访问 `vrite.cn` 时，`github` 会自动跳转到 `www.vrite.cn`，而在 `vrite.cn` 上配置的证书是无法使用到 `www.vrite.cn` 子域名上，因此若只配置了 `vrite.cn` 的证书后访问 `www.vrite.cn` 会提示站点证书失效。
   :::

2. `CDN 服务器` -> `Github 服务器` 配置

填写原站信息(需要加速的服务器地址)如下

![cdn原站信息配置](/cdn-original-station-information-configuration.png)

`cdn` 配置好之后会获取到 `cdn` 提供的 `cname` 地址

![获取vrite-cdn的cname值](/get-vrite-cdn-cname-value.png)
3. `DNS 服务器` -> `CDN 服务器` 配置

在域名的 `DNSPod` 中添加 `CNAME` 记录，其他的记录可以删掉。

![添加CDN的CNAME到DNSPod](/add-cdn-cname-to-dnspod.png)

为 `vrite.cn` 和 `www.vrite.cn` 配置证书

腾讯云可申请 `50` 个免费证书，提交证书申请中的域名验证方式默认为 `自动DNS验证`，但本次申请过程中发现自动在 `DNSPod` 中添加 `CNAME` 记录但一直校验失败，后通过人工客服审批过(未告知原因)。后续申请时可以考虑其他两种校验方式 `手动DNS验证`、`文件校验`。 证书在 `24` 小时内可以审批下来，之后可以为两个域名添加证书。

![为域名添加证书](/add-certificate-to-domain-name.png)

配置完成后过一会儿就可以正常访问站点。

::: warning 发现一个问题
    在cdn欠费的情况下，证书也会失效，因此在缴费完成后可以点击右侧 更新 按钮来重置证书。
:::
