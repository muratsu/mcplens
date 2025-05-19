export default {
  logo: <span>MCPLens Documentation</span>,
  project: {
    link: 'https://github.com/muratsu/mcplens',
  },
  docsRepositoryBase: 'https://github.com/muratsu/mcplens/tree/main/packages/docs',
  footer: {
    text: `© ${new Date().getFullYear()} MCPLens. All rights reserved.`,
  },
  navigation: {
    prev: true,
    next: true,
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – MCPLens'
    }
  },
}