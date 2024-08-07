import { defineConfig } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'

const headPrependInjectRE = /([ \t]*)<head[^>]*>/i;
const favicon = `
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="manifest" href="/site.webmanifest">
`

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Vrite",
  base: "/",
  description: "Vite Art",
  srcDir: "./src",
  lang: 'en-US',
  lastUpdated: true,
  cleanUrls: true,

  markdown: {
    codeTransformers: [transformerTwoslash()],
  },
  
  head: [
    ['meta', { name: 'theme-color', content: '#646cff' }],
    [
      'script',
      {
        src: 'https://cdn.usefathom.com/script.js',
        'data-site': 'AZBRSFGG',
        'data-spa': 'auto',
        defer: ''
      }
    ]
  ],

  themeConfig: {
    outline: {
      level: [2, 3],
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Guide', link: '/guide/overview', activeMatch: '/guide/' },
      { text: 'Plugin', link: '/plugin/inside/plugin-legacy', activeMatch: '/plugin/' }
    ],

    sidebar: {
      '/guide/': sidebarGuide(),
      '/plugin/': sidebarPlugin()
    },

    editLink: {
      pattern: 'https://github.com/XiSenao/vrite/tree/master/src/:path',
      text: 'Edit this page on GitHub'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2019-present XiSenao'
    },

    search: {
      provider: 'algolia',
      options: {
        appId: '8J64VVRP8K',
        apiKey: 'a18e2f4cc5665f6602c5631fd868adfd',
        indexName: 'vitepress'
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/XiSenao' }
    ],
  },
  transformHtml (html) {
    if (headPrependInjectRE.test(html)) {
      return html.replace(
        headPrependInjectRE,
        (match) => `${match}\n${favicon}`,
      )
    }
  }
})


function sidebarGuide () {
  return [
    {
      text: 'Guide',
      collapsed: false,
      items: [
        {
          text: 'Overview',
          link: '/guide/overview'
        },
        {
          text: 'Getting Started',
          link: '/guide/getting-started'
        }
      ],
    },
    {
      text: 'Reference',
      collapsed: false,
      items: [
        {
          text: 'Config Resolve',
          link: "/reference/config-resolve"
        },
        {
          text: "Module Resolve",
          link: "/reference/module-resolve"
        },
        {
          text: "Optimized",
          link: "/reference/optimize"
        },
        {
          text: "Module Order",
          link: "/reference/module-order",
        },
        {
          text: "HMR",
          link: "/reference/hmr"
        }
      ]
    },
    {
      text: "Advanced",
      collapsed: false,
      items: [
        {
          text: "Plugin Mechanisms",
          link: "/advanced/comparison-of-plugin-mechanisms"
        },
        {
          text: "Rewrite Path",
          link: "/advanced/rewrite-prebuild-module-path"
        }
      ]
    },
    {
      text: "Events",
      collapsed: false,
      items: [
        {
          text: "Turbopack vs Vite",
          link: "/events/is-turbopack-really-10x-faster-than-vite"
        }
      ]
    },
    {
      text: "Other",
      collapsed: false,
      items: [
        {
          text: "Package Manager",
          link: "/other/package-manager"
        },
        {
          text: "TS Prompt Support",
          link: "/other/configuration-item-ts-type-prompt-in-vite"
        },
        {
          text: "JS optimize & deoptimize",
          link: "/other/optimization-and-deoptimization-of-js"
        },
        {
          text: "Why Does ZSH Start Slowly",
          link: "/other/why-does-zsh-start-slowly"
        },
        {
          text: "Deploy Github Page Site",
          link: "/other/deploy-github-page-site"
        }
      ]
    },
    {
      text: "Daily Log",
      collapsed: false,
      items: [
        {
          text: "2024-08-03",
          link: "/dailyLog/2024-08-03"
        }
      ]
    }
  ]
}

function sidebarPlugin () {
  return [
    {
      text: "Plugin",
      items: [
        {
          text: 'Inside Plugin',
          items: [
            {
              text: "@vitejs/plugin-legacy",
              link: "/plugin/inside/plugin-legacy"
            },
          ]
        },
        {
          text: 'Outside Plugin',
          items: [
            {
              text: "vite-plugin-inspect",
              link: "/plugin/outside/vite-plugin-inspect"
            }
          ]
        }
      ]
    },
  ]
}