import{_ as s,o as a,c as o,R as e}from"./chunks/framework.fed62f4c.js";const A=JSON.parse('{"title":"为什么 zsh 启动慢","description":"","frontmatter":{},"headers":[],"relativePath":"other/why-does-zsh-start-slowly.md","filePath":"other/why-does-zsh-start-slowly.md","lastUpdated":null}'),l={name:"other/why-does-zsh-start-slowly.md"},n=e(`<h1 id="为什么-zsh-启动慢" tabindex="-1">为什么 zsh 启动慢 <a class="header-anchor" href="#为什么-zsh-启动慢" aria-label="Permalink to &quot;为什么 zsh 启动慢&quot;">​</a></h1><h2 id="问题" tabindex="-1">问题 <a class="header-anchor" href="#问题" aria-label="Permalink to &quot;问题&quot;">​</a></h2><p><code>oh-my-zsh</code> 适配了 <code>zsh</code> 后发现 <code>zsh</code> 启动需要等待一段时间。通过执行 <code>\\time zsh -i -c exit</code> 检测了下 <code>zsh</code> 启动时间，输出结果如下：</p><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#89DDFF;">~</span><span style="color:#A6ACCD;"> \\time zsh -i -c exit</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#FFCB6B;">3.79</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">real</span><span style="color:#A6ACCD;">         </span><span style="color:#F78C6C;">0.17</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">user</span><span style="color:#A6ACCD;">         </span><span style="color:#F78C6C;">0.18</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">sys</span></span></code></pre></div><p>可以发现加载 <code>zsh</code> 模块需要耗费 <code>3.79s</code> 的时间，对于开发来说会显得格外别扭。</p><h2 id="优化手段" tabindex="-1">优化手段 <a class="header-anchor" href="#优化手段" aria-label="Permalink to &quot;优化手段&quot;">​</a></h2><p><code>zprof</code> 是一款 <code>zsh</code> 自带的性能检测工具，可以用很快的方式来检测 <code>zsh</code> 运行时的性能开销。使用方式通过在 <code>~/.zshrc</code> 模块顶部添加 <code>zmodload zsh/zprof</code> 指令然后重新执行 <code>zshrc</code>(重启控制台)。在重新开启的控制台中输入 <code>zprof</code> 指令，可以看到如下输出：</p><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#FFCB6B;">num</span><span style="color:#A6ACCD;">  </span><span style="color:#C3E88D;">calls</span><span style="color:#A6ACCD;">                </span><span style="color:#C3E88D;">time</span><span style="color:#A6ACCD;">                       </span><span style="color:#C3E88D;">self</span><span style="color:#A6ACCD;">            </span><span style="color:#C3E88D;">name</span></span>
<span class="line"><span style="color:#FFCB6B;">-----------------------------------------------------------------------------------</span></span>
<span class="line"><span style="color:#A6ACCD;"> </span><span style="color:#FFCB6B;">1</span><span style="color:#A6ACCD;">)    1        3394.58  3394.58   78.49%   3394.58  3394.58   78.49%  is_update_available</span></span>
<span class="line"><span style="color:#A6ACCD;"> </span><span style="color:#FFCB6B;">2</span><span style="color:#A6ACCD;">)    2         656.08   328.04   15.17%    654.53   327.26   15.13%  bracketed-paste-magic</span></span>
<span class="line"><span style="color:#A6ACCD;"> </span><span style="color:#FFCB6B;">3</span><span style="color:#A6ACCD;">)    1         218.95   218.95    5.06%     82.34    82.34    1.90%  nvm_auto</span></span>
<span class="line"><span style="color:#A6ACCD;"> </span><span style="color:#FFCB6B;">4</span><span style="color:#A6ACCD;">)    2         136.61    68.31    3.16%     70.00    35.00    1.62%  nvmss</span></span>
<span class="line"></span>
<span class="line"><span style="color:#FFCB6B;">-----------------------------------------------------------------------------------</span></span></code></pre></div><p>可以发现 <code>is_update_available</code> 项加载时间占据着 <strong><code>78.49%</code></strong>。意味着运行 <code>oh-my-zsh</code> 的时候会进行检测更新。因此可以在 <code>.zshrc</code> 模块执行 <code>source $ZSH/oh-my-zsh.sh</code> 指令之前禁止掉 <code>oh-my-zsh</code> 自动更新检测就可以了。</p><h3 id="禁止自动检测更新有以下两种实现方案" tabindex="-1"><a href="https://cloud.tencent.com/developer/ask/sof/115329" target="_blank" rel="noreferrer">禁止自动检测更新有以下两种实现方案</a> <a class="header-anchor" href="#禁止自动检测更新有以下两种实现方案" aria-label="Permalink to &quot;[禁止自动检测更新有以下两种实现方案](https://cloud.tencent.com/developer/ask/sof/115329)&quot;">​</a></h3><ol><li><p><strong>不推荐使用的修改设置的方法(<code>.zshrc</code> 中的环境变量)</strong></p><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#A6ACCD;">DISABLE_AUTO_UPDATE</span><span style="color:#89DDFF;">=</span><span style="color:#89DDFF;">true</span></span></code></pre></div></li><li><p><strong>修改设置的推荐方法(<code>zstyle</code> 设置)</strong></p><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#FFCB6B;">zstyle</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&#39;</span><span style="color:#C3E88D;">:omz:update</span><span style="color:#89DDFF;">&#39;</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">mode</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">disabled</span></span></code></pre></div></li></ol><p>重启 <code>zsh</code> 后运行时间如下：</p><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#89DDFF;">~</span><span style="color:#A6ACCD;"> \\time zsh -i -c exit</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#FFCB6B;">0.34</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">real</span><span style="color:#A6ACCD;">         </span><span style="color:#F78C6C;">0.14</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">user</span><span style="color:#A6ACCD;">         </span><span style="color:#F78C6C;">0.16</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">sys</span></span></code></pre></div><p>可以发现运行很顺畅了。</p>`,14),p=[n];function c(t,r,d,C,i,h){return a(),o("div",null,p)}const D=s(l,[["render",c]]);export{A as __pageData,D as default};