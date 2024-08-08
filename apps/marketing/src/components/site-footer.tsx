import Image from "next/image";
import Link from "next/link";

import { Badge } from "@acme/ui/badge";
import { Icons } from "@acme/ui/icons";

const footerNavs = [
  {
    items: [
      // {
      //   href: "/",
      //   name: "Email Collection",
      // },
      {
        href: "#pricing",
        name: "Pricing",
      },
      {
        href: "#faq",
        name: "FAQ",
      },
    ],
    label: "Product",
  },
  {
    items: [
      // {
      //   href: "/",
      //   name: "Discord",
      // },
      {
        href: "https://x.com/TheCoFounderAI",
        name: "Twitter",
      },
      {
        href: "mailto:hello@co-founder.ai",
        name: "Email",
      },
    ],
    label: "Community",
  },
  {
    items: [
      {
        href: "/terms-of-service",
        name: "Terms",
      },

      {
        href: "/privacy-policy",
        name: "Privacy",
      },
    ],
    label: "Legal",
  },
];

const footerSocials = [
  {
    href: "https://www.linkedin.com/company/cofounder-ai",
    icon: <Icons.LinkedIn className="h-4 w-4" />,
    name: "LinkedIn",
  },
  {
    href: "https://x.com/TheCoFounderAI",
    icon: <Icons.TwitterX size="sm" />,
    name: "Twitter",
  },
];

export function SiteFooter() {
  return (
    <footer>
      <div className="mx-auto w-full max-w-screen-xl xl:pb-2">
        <div className="gap-4 p-4 px-8 py-16 sm:pb-16 md:flex md:justify-between">
          <div className="mb-12 flex flex-col gap-4">
            <Link className="text-md flex items-center gap-2" href="/">
              <Image
                className="hidden h-auto w-2/3 dark:block md:w-1/5"
                src="/logo-dark.png"
                alt="CoFounder AI"
                width={1786}
                height={376}
              />
              <Image
                className="block h-auto w-2/3 dark:hidden md:w-1/5"
                src="/logo-light.png"
                alt="CoFounder AI"
                width={1786}
                height={376}
              />
              <Badge variant={"outline"}>Beta</Badge>
            </Link>
            <p className="max-w-xs">The Fundraising Platform for Founders</p>
          </div>
          <div className="flex flex-1 gap-8 sm:gap-20">
            {footerNavs.map((nav) => (
              <div key={nav.label}>
                <h2 className="mb-6 text-sm font-medium uppercase tracking-tighter text-gray-900 dark:text-white">
                  {nav.label}
                </h2>
                <ul className="grid gap-2">
                  {nav.items.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="cursor-pointer text-sm font-[450] text-gray-400 duration-200 hover:text-gray-200"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-md border-neutral-700/20 px-8 py-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div className="flex space-x-5 sm:mt-0 sm:justify-center">
            {footerSocials.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                className="fill-gray-500 text-gray-500 hover:fill-gray-900 hover:text-gray-900 dark:hover:fill-gray-600 dark:hover:text-gray-600"
              >
                {social.icon}
                <span className="sr-only">{social.name}</span>
              </Link>
            ))}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 sm:text-center">
            Copyright © {new Date().getFullYear()}{" "}
            <Link href="/" className="cursor-pointer">
              CoFounder, Inc
            </Link>
            . All Rights Reserved.
          </span>
        </div>
      </div>
      {/*   <SiteBanner /> */}
    </footer>
  );
}
