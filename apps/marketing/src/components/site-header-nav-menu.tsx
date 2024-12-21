"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@acme/ui/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@acme/ui/navigation-menu";

const components: { title: string; href: string; description: string }[] = [
  {
    description:
      "Instantly access thousands of active investors seeking new opportunities.",
    href: "/docs/features/access-to-active-investors",
    title: "Access to Active Investors",
  },
  {
    description:
      "Automate your investor engagement with our intelligent tools.",
    href: "/docs/features/automated-investor-engagement",
    title: "Automated Investor Engagement",
  },
  {
    description:
      "Gain deep market insights powered by AI to make informed decisions.",
    href: "/docs/features/ai-driven-market-insights",
    title: "AI-Driven Market Insights",
  },
  {
    description: "Analyze your competitors with advanced AI-powered tools.",
    href: "/docs/features/ai-powered-competitor-analysis",
    title: "AI-Powered Competitor Analysis",
  },
];

export function SiteHeaderNavigationMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    href="/"
                  >
                    <Image
                      src="/logo-bubble.png"
                      width={800}
                      height={800}
                      alt="Logo"
                      className="h-auto w-1/3"
                    />
                    <div className="mb-2 mt-4 text-left text-lg font-medium">
                      CoFounder AI
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Effortlessly manage fundraising on autopilot with
                      AI-driven investor engagement, insights, and analysis.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <ListItem href="/docs/features/overview" title="Product Overview">
                Discover how CoFounder AI can revolutionize your fundraising
                process.
              </ListItem>
              <ListItem href="/docs/features/setup" title="Quick Start Guide">
                Step-by-step guide to getting started with CoFounder AI.
              </ListItem>
              <ListItem href="/docs/features/case-studies" title="Case Studies">
                Learn from real-world examples of successful fundraising.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Features</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {components.map((component) => (
                <ListItem
                  key={component.title}
                  title={component.title}
                  href={component.href}
                >
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/docs" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Fundraising Basics
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
