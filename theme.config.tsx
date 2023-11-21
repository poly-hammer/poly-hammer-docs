import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'
import Image from "next/image";

const config: DocsThemeConfig = {
  logo: <Image
  width={100}
  height={40}
  src="/logo.svg"
  alt="Poly Hammer"
  className="w-48 h-48"
/>,
  logoLink: 'https://www.polyhammer.com',
  project: {
    link: 'https://github.com/shuding/nextra-docs-template',
  },
  // video: {
  //   link: 'https://github.com/shuding/nextra-docs-template',
  // },
  // chat: {
  //   link: 'https://discord.com',
  // },
  docsRepositoryBase: 'https://github.com/shuding/nextra-docs-template',
  footer: {
    text: 'Nextra Docs Template',
  },
}

export default config
