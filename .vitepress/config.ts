import { defineConfig } from 'vitepress'
import { DefaultTheme } from 'vitepress/types/default-theme'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Vrite",
  base: "/",
  description: "Vite Art",
  srcDir: "./src",
  lang: 'en-US',
  lastUpdated: true,
  cleanUrls: true,
  
  head: [
    ['meta', { name: 'theme-color', content: '#3c8772' }],
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
  }
})


function sidebarGuide (): DefaultTheme.SidebarItem[] {
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
        }
      ]
    }
  ]
}

function sidebarPlugin (): DefaultTheme.SidebarItem[] {
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