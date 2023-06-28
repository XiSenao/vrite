import{_ as e,o,c,R as d}from"./chunks/framework.fed62f4c.js";const a="/twitter-vercel-claim.png",r="/turbo-github-maintainer.png",t="/youyuxi-turbo-cache-appreciation.png",l="/turbo-excute-line-1.png",i="/turbo-excute-line-2.png",p="/youyuxi-turbo-views.png",x=JSON.parse('{"title":"Is Turbopack really 10x Faster than Vite?","description":"","frontmatter":{},"headers":[],"relativePath":"events/is-turbopack-really-10x-faster-than-vite.md","filePath":"events/is-turbopack-really-10x-faster-than-vite.md","lastUpdated":null}'),s={name:"events/is-turbopack-really-10x-faster-than-vite.md"},b=d('<h1 id="is-turbopack-really-10x-faster-than-vite" tabindex="-1">Is Turbopack really 10x Faster than Vite? <a class="header-anchor" href="#is-turbopack-really-10x-faster-than-vite" aria-label="Permalink to &quot;Is Turbopack really 10x Faster than Vite?&quot;">​</a></h1><p><code>Evan You</code> 在 <code>2022.11.1</code> 发布的一片<a href="https://github.com/yyx990803/vite-vs-next-turbo-hmr/discussions/8" target="_blank" rel="noreferrer">文章</a>。发布这篇文章的原因是 <code>Vercel</code> 在 <code>2022.10.26</code> 早上 <code>1.35</code> 的时候发布的推文，在该推文介绍了 <code>Webpack</code> 下一任基于 <code>rust</code> 实现的继承者 <a href="https://turbo.build/" target="_blank" rel="noreferrer">Turbopack</a>， 官方声明:</p><ol><li>比 <code>Webpack</code> 快近乎 <code>700</code> 倍。</li><li>比 <code>Vite</code> 快 <code>10</code> 倍且甚至在更大的应用中差距将会达到 <code>20</code> 倍。</li><li>用 <code>Rust</code> 构建的原生增量架构。</li><li>支持 <code>RSC</code>。</li><li>支持 <code>TS</code>、<code>JSX</code>、<code>CSS</code> 等基础能力。</li></ol><p><img src="'+a+'" alt="vercel声称"></p><p>在此来简单了解一下 <code>Turbopack</code>，这个令人兴奋的构建工具</p><p>从 <code>github</code> 上可以看到 <code>Turbopack</code> 是由 <code>Webpack</code> 的作者 <code>Tobias Koppers</code> 领导的基于 <code>rust</code> 实现的构建工具(目前处于 <code>alpha</code> 阶段)</p><p><img src="'+r+'" alt="Webpack作者领导"></p><p>官方提供的 <a href="https://vercel.com/blog/turbopack" target="_blank" rel="noreferrer">文章</a> 主要阐述了 <code>Turbopack</code> 在 <code>有多快</code>、<code>为什么这么快</code>、<code>未来的打算</code> 的表现。</p><ul><li><p>在 <code>有多快</code> 小结中介绍了 <code>Turbopack</code> 为了获得尽可能获取最快的开发体验而建立全新的增量架构(<code>rust</code> 默认开启<a href="https://rustwiki.org/zh-CN/edition-guide/rust-2018/the-compiler/incremental-compilation-for-faster-compiles.html" target="_blank" rel="noreferrer">增量编译</a>的能力)，从测试结果上看取得不错的进展。</p></li><li><p>在 <code>为什么这么快</code> 小结中介绍了 <code>Turbopack</code> 架构结合了 <code>Turborepo</code> 和 <code>Bazel(Google)</code> 等工具的增量计算的创新，着重使用 <strong><code>缓存</code></strong> 来避免重复做同样的工作。 <code>Turbopack</code> 的缓存能力如下:</p><ol><li>细分到函数粒度的 <code>结果缓存</code>。可以 <code>缓存</code> 程序中的 <code>任意函数的结果</code>，只要确保函数的输入没有发生变化函数就不会被重复执行。这种细化的架构使程序在函数的执行层面上能够跳过大量的工作。</li><li>支持 <code>内存缓存</code>，未来还将有 <code>持久化缓存</code> 和 <code>远程缓存</code>。</li></ol><p><code>Evan You</code> 也对 <code>Turbopack</code> 拥有强大的 <strong><code>缓存</code></strong> 能力做了赞许，宣称未来在合适的时机里会使用 <code>Turbopack</code> 来取代 <code>esbuild</code> 和 <code>rollup</code>。 <img src="'+t+'" alt="Evan You赞许Turbopack的缓存"></p></li><li><p>在 <code>未来的打算</code> 小结中介绍了 <code>Turbopack</code> 将被用于 <code>Next.js 13</code> 开发环境下提供快如闪电的 <code>HMR</code> 能力，并且支持原生 <code>RSC</code>、<code>TypeScript</code>、<code>JSX</code>、<code>CSS</code> 等能力。后续会逐步成为 <code>Next.js</code> 生产环节构建。同时也呼吁 <code>Webpack</code> 用户迁移到 <code>Turbopack</code> 以及共创 <code>Turbopack</code> 生态。</p></li></ul><p><strong><code>Turbopack</code> 引擎的工作原理</strong></p><p>在 Turbopack 驱动的程序中，可以将某些函数标记为“to be remembered”。当这些函数被调用时，Turbo 引擎会记住它们被调用的内容，以及它们返回的内容。然后它将其保存在内存缓存中。下面是一个简化的示例： <img src="'+l+'" alt="工作流1"> 首先在 api.ts​ 和 sdk.ts​ 这两个文件中调用 readFile。然后打包这些文件，将它们拼接在一起，最后得到 fullBundle。所有这些函数调用的结果都保存在缓存中以备后用。 <img src="'+i+'" alt="工作流2"></p><p>由于 <code>sdk.ts</code>​ 文件发生了变化，需要再次进行打包。而 <code>api.ts</code>​ 文件并没有改变。只需从 <code>api.ts</code> 缓存中读取结果并将其传递给 <code>concat</code>。因此，通过按需打包的流程来节省了大量时间。</p><p><code>Turbo</code> 引擎当前将其缓存存储在内存中。这意味着 <code>Turbo</code> 缓存时间将与程序进程运行时间保持一致。之后会计划将缓存进行持久化，保存到文件系统中或者保存到像 <code>Turborepo</code> 这样的 <code>远程缓存</code>中。这意味着 <code>Turbopack</code> 可以记住跨运行和机器完成的工作。</p><p>这种方法使 Turbopack 在计算应用的增量更新方面非常快速，优化了 Turbopack 以处理开发中的更新，这意味着 Dev server 将始终快速响应更改。</p><p>回到开头，<code>Evan You</code> 发布了标题的 <a href="https://github.com/yyx990803/vite-vs-next-turbo-hmr/discussions/8" target="_blank" rel="noreferrer">文章</a>。里面的内容以 &quot;探究 <code>Turbopack</code> 速度超出 <code>Vite</code> 十倍&quot; 为论点在各基准上进行测试。 <code>Evan You</code> 肯定了 <code>Turbopack</code> 更快了，但是并不会比 <code>Vite</code> 快 <code>十倍</code>，<code>Vercel</code> 对外营销的数据是不正确的。 <code>Evan You</code> 使用了 <code>Next 13</code>(搭载了 <code>Turbopack</code>) 和 <code>Vite 3.2</code> 来对比两者处理 <code>HMR</code> 的性能。以下比较基准</p><blockquote><p><code>root</code>：根节点组件。组件导入 <code>1000</code> 个不同的子组件并将它们一起渲染；</p><p><code>leaf</code>：叶节点组件。组件被根节点组件所导入，自身没有子组件。</p></blockquote><p><strong>1. 否开启 <code>RSC</code> ?</strong></p><p>最初的基准测试是在服务端模式下使用根组件和叶子组件测量 <code>Next 13</code> 的 <code>HMR</code> 性能。 结果表明，<code>Next 13</code> 在两种情况下实际上都较慢，并且对于叶子组件而言差异更为明显，测试方法和测试结果如下。后来 <code>Evan You</code> 也注意到了开启 <code>RSC</code> 进行比较对于 <code>Next 13</code> 来说并不公平。因此就使用客户端模式来进行测试，发现 <code>Next 13</code> 的 <code>HMR</code> 的确提升显著，比 <code>Vite</code> 快了有 <code>2x</code>，但并不会达到如 <code>Vercel</code> 营销宣传的 <code>10x</code>。</p><p><strong>2. <code>Vite</code> 对于 <code>React Transform</code> 是否是使用 <code>SWC(rust-based)</code> 而不是 <code>Babel(js-based)</code> 来进行解析?</strong></p><p><code>React HMR</code> 和 <code>JSX</code> 转换并不是与构建工具耦合，它可以通过 <code>Babel(js-based)</code>）或 <code>SWC(rust-based)</code> 来完成。<code>Esbuild</code> 也是可以转换 <code>JSX</code>，但缺乏对 <code>HMR</code> 的支持。<code>Vite</code> 对于处理 <code>React preset</code> 默认使用 <code>Babel</code> 来转换 <code>React HMR</code> 和 <code>JSX</code>。而 <code>SWC</code> 显然是比 <code>Babel</code> 快非常多(单个线程快了 <code>20x</code>, 多核快了 <code>70x</code>)。<code>Vite</code> 现阶段没有使用 <code>SWC</code> 的原因：</p><ol><li>安装体积过大。会添加繁重的包体积(自身 <code>58M</code> 的大小而 <code>Vite</code> 也就 <code>19M</code>)</li><li>一些用户需要依赖 <code>Babel</code> 的能力做转换，因此对于部分用户来说 <code>Babel</code> 是不可缺失的。</li></ol><p>当 <code>Vite</code> 基于 <code>SWC</code> 来进行解析时，得出的结论为 <code>Next/turbo</code> 在根组件比叶子组件慢 <code>4</code> 倍，而 <code>Vite</code> 只慢 <code>2.4</code> 倍。这意味着 <code>Vite HMR</code> 在更大的组件中可伸缩性更好。此外，切换到 <code>SWC</code> 还可以改善 <code>Vite</code> 在 <code>Vercel</code> 基准测试中的冷启动指标。</p><h4 id="vercel-的澄清" tabindex="-1"><code>Vercel</code> 的澄清 <a class="header-anchor" href="#vercel-的澄清" aria-label="Permalink to &quot;`Vercel` 的澄清&quot;">​</a></h4><p>在 <code>Evan You</code> 发布了基准测试之后，<code>Vercel</code> 发布了一篇博客文章，阐明了他们的基准方法，并将他们的基准提供给公众验证。<code>Evan You</code> 随即也吐槽了第一天就改这么做了。文章的关键点如下：</p><ol><li>在基准上测试 <code>Vite HMR</code> 性能的时候依旧是使用 <code>Babel</code>，而对于 <code>Turbopack</code> 和 <code>Webpack</code> 测试上使用了 <code>SWC</code>。这一点对于 <code>Vite</code> 来说是极为不公平的。</li><li><code>1000</code> 个组件案例的原始数字存在舍入问题——<code>Turbopack</code> 的 <code>15ms</code> 被舍入到 <code>0.01s</code>，而 <code>Vite</code> 的 <code>87ms</code> 被舍入到 <code>0.09s</code>。 当原始数字接近 <code>6</code> 倍时，这进一步被宣传为 <code>10</code> 倍的优势；</li><li><code>Vercel</code> 的基准测试使用更新模块的“浏览器评估时间”作为结束时间戳，而不是 <code>React</code> 组件重新渲染时间；</li><li>博客文章中图表显示，当总模块数超过 <code>30k</code> 时，<code>Turbopack</code> 可以比 <code>Vite</code> 快 <code>10</code> 倍。</li></ol><div class="tip custom-block"><p class="custom-block-title">Vercel 的澄清总结</p><p>如果以下所有条件都成立，“比 Vite 快 10 倍”的说法是成立的：</p><ol><li>Vite 没有使用相同的 SWC 转换。</li><li>应用包含超过 30k 个模块。</li><li>基准测试只测量热更新模块的评估时间，而不是实际应用更改的时间。</li></ol></div><p><strong>Even You 对 Vercel 澄清的看法：</strong></p><ol><li>对于绝大多数用户来说，<code>30k</code> 模块是极不可能的情况。使用 <code>SWC</code> 的 <code>Vite</code>，达到 <code>10</code> 倍要求所需的模块数量可能会变得更加不切实际。虽然理论上是可行的，但用它来营销 <code>Turbopack</code> 是不诚实的。</li><li>与理论上的“模块评估”时间相比，用户更关心 <code>端到端 HMR</code> 性能，即从保存到看到更改的时间。当看到“更新速度快 10 倍”时，普通用户会想到前者而不是后者，<code>Vercel</code> 在其营销中忽略了这一警告。实际上，<code>Next</code> 中服务端组件（默认）的端到端 <code>HMR</code> 比 <code>Vite</code> 中的慢。</li></ol><h4 id="对于-turbopack-竞品的看法" tabindex="-1">对于 <code>Turbopack</code> 竞品的看法 <a class="header-anchor" href="#对于-turbopack-竞品的看法" aria-label="Permalink to &quot;对于 `Turbopack` 竞品的看法&quot;">​</a></h4><h5 id="evan-you-的观点" tabindex="-1"><code>Evan You</code> 的观点 <a class="header-anchor" href="#evan-you-的观点" aria-label="Permalink to &quot;`Evan You` 的观点&quot;">​</a></h5><p><img src="'+p+'" alt="观点"></p><p>简单来说新竞品的出现对于 <code>Vite</code> 来说是否是互补关系还取决于设计者的目标，<code>Turbopack</code> 的出现对于市面上所有构建工具来说是一个十分强劲的对手，构建能力方面相对于其他构建工具来说是较为优秀的，可以在市面上获取很不错的收益和地位。从 <code>Evan You</code> 的说法上可以看出 <code>Turbopack</code> 可以作为 <code>meta frameworks</code> 的基本构建工具或者可以作为开箱即用的<code>spa</code> 解决方案。</p><h5 id="anthony-fu-的观点-vite-的核心团队成员" tabindex="-1"><code>Anthony Fu</code> 的观点 - Vite 的核心团队成员 <a class="header-anchor" href="#anthony-fu-的观点-vite-的核心团队成员" aria-label="Permalink to &quot;`Anthony Fu` 的观点 - Vite 的核心团队成员&quot;">​</a></h5><p>好的设计对性能的影响远比语言带来的提升更大，语言性能的加成更像一个常量系数，单纯更换语言只能带来有限的提升。<code>Vite</code> 更吸引人的是其插件系统，和构建在上面的生态系统。这样才能将改进快速带给其他领域。目前市面上暂时没有看到很好的基于原生语言的插件系统实现（同时兼顾性能和扩展性），在 <code>Turbopack</code> 实现插件系统前无法评价，暂时先静观其变。</p><blockquote><p><a href="https://zhihu.com/question/562349205/answer/2733040669" target="_blank" rel="noreferrer">如何评价Vercel开源的使用Rust实现的Turbopack? – Anthony Fu的回答 – 知乎</a></p></blockquote><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>可以看出 <code>Anthony Fu</code> 评价一个构建工具主要从两方面考虑。第一个方面是性能要素，第二个方面是可扩展已有的生态。</p></div><h4 id="sean-larkin-的观点-webpack-的核心团队创始人" tabindex="-1"><code>Sean Larkin</code> 的观点 - Webpack 的核心团队创始人 <a class="header-anchor" href="#sean-larkin-的观点-webpack-的核心团队创始人" aria-label="Permalink to &quot;`Sean Larkin` 的观点 - Webpack 的核心团队创始人&quot;">​</a></h4><ol><li>在我看来 <code>Turbopack</code> 更多是给予 <code>SWC</code> 的能力而非由于其自身创新的能力，希望对方能表达得清楚一些。</li><li>我对 <code>Turborepo</code> 与 <code>Next</code> 的绑定程度感到失望。没办法， <code>Vercel</code> 需要挣到更多的天使资金。</li><li>普遍用户很难从 <code>Webpack</code> 迁移到 <code>Turbopack</code>。</li><li>我倾向于开发服务器上的模块仍然是打包后的，因为 <code>ESM</code> 比原始 <code>ESM</code> 慢。我需要剥离更多层，才能让独立的实现工作。</li><li>目前 <code>Turbopack</code> 还处于 <code>alpha</code> 阶段，所以我们要看开一点，但我仍然希望多做一些实事而少一些营销。</li><li>对于把 <code>Turbopack</code> 比作 <code>Webpack</code> 的继承者有失偏薄，如此营销显得虚伪且误导旁观者。作为继承者需要让 <code>Turbopack</code> 拥有 <code>Webpack</code> 所拥有的特性且能轻易的从 <code>Webpack</code> 迁移到 <code>Turbopack</code>。</li></ol><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>对于把 <code>Turbopack</code> 比作 <code>Webpack</code> 的继承者是不合理的，这是两个不一样的工具，是共存关系而不是取代关系。这里面蕴含了大量的营销手段，借助 <code>Webpack</code> 创始人的身份来推销新构建工具，让一部分社区人士认为这是 <code>Webpack</code> 创始人 <code>wSokra</code> 创建的新构建工具并作为 <code>Webpack</code> 的下一代构建工具，在极短时间内获取社区的广泛关注。</p></div><h5 id="lee-robinson-的回复-vercel-公司开发者体验副总裁" tabindex="-1">Lee Robinson 的回复 - Vercel 公司开发者体验副总裁 <a class="header-anchor" href="#lee-robinson-的回复-vercel-公司开发者体验副总裁" aria-label="Permalink to &quot;Lee Robinson 的回复 - Vercel 公司开发者体验副总裁&quot;">​</a></h5><ol><li>没有 <code>SWC</code> 当然是不可能的，<code>Vercel</code> 研发团队前期在 <code>SWC</code> 上做了大量工作。</li><li>现阶段先支持 <code>Next 13</code> 版本，后续目标是为所有框架提供支持。</li><li><code>Webpack</code> 迁移到 <code>Turbopack</code> 还需要花费时间，并且我们确信我们会拥抱社区的(插件扩展能力)。</li></ol><h4 id="wsokra-的观点-webpack-和-turbopack-的创始人" tabindex="-1"><code>wSokra</code> 的观点 - Webpack 和 Turbopack 的创始人 <a class="header-anchor" href="#wsokra-的观点-webpack-和-turbopack-的创始人" aria-label="Permalink to &quot;`wSokra` 的观点 - Webpack 和 Turbopack 的创始人&quot;">​</a></h4><ol><li>目前把 <code>Turbopack</code> 比作 <code>Webpack</code> 的继承者是一种营销手段，且 <code>Webpack</code> 是肯定不会被弃用的。但 <code>Turbopack</code> 的更大愿景是提供 <code>95%</code> 的 <code>webpack</code> 的特性、思想(包括扩展能力)并且使其容易迁移。</li><li><code>Turbopack</code> 渐进式的构建仅取决于改变文件的大小而不取决于总编译大小。对于 <code>Webpack</code> 来说，是按照总编译大小来做增量构建的，因为 <code>Webpack</code> 需要在缓存中检索所有的模块。后续还会初始构建流程中进一步提升 <code>Turbopack</code> 的构建速度。</li><li>后续不再关心这个话题，因为无论如何每一个人都会去评估这个价值。作为两个项目( <code>Webpack</code> &amp; <code>Turbopack</code> )的创始人，两个项目都是有价值的，而我在社区评估两者的价值会放大这件事情，对两个项目用户或支持者并不友好。</li></ol>',43),u=[b];function n(k,h,T,m,V,v){return o(),c("div",null,u)}const f=e(s,[["render",n]]);export{x as __pageData,f as default};