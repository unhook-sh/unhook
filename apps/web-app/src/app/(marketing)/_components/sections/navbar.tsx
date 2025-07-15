'use client';

import { SignedIn, SignedOut } from '@clerk/nextjs';
import { Badge } from '@unhook/ui/components/badge';
import { Button } from '@unhook/ui/components/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@unhook/ui/components/navigation-menu';
import { GitHubStarsButtonWrapper } from '@unhook/ui/custom/github-stars-button/button-wrapper';
import { ThemeToggle } from '@unhook/ui/custom/theme';
import { cn } from '@unhook/ui/lib/utils';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useScroll } from 'motion/react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Icons } from '~/app/(marketing)/_components/icons';
import { siteConfig } from '~/app/(marketing)/_lib/config';

const INITIAL_WIDTH = '70rem';
const MAX_WIDTH = '900px';

// Animation variants
const overlayVariants = {
  exit: { opacity: 0 },
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const drawerVariants = {
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
    y: 100,
  },
  hidden: { opacity: 0, y: 100 },
  visible: {
    opacity: 1,
    rotate: 0,
    transition: {
      damping: 15,
      staggerChildren: 0.03,
      stiffness: 200,
    },
    y: 0,
  },
};

const drawerMenuContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const drawerMenuVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function Navbar() {
  const { scrollY } = useScroll();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Helper to check if a link is an anchor link
  const isAnchorLink = (href: string) => href.startsWith('#');

  // biome-ignore lint/correctness/useExhaustiveDependencies: will cause infinite loop
  useEffect(() => {
    const handleScroll = () => {
      // Only handle scroll for anchor links
      const anchorLinks = siteConfig.nav.links.filter((item) =>
        isAnchorLink(item.href),
      );
      const sections = anchorLinks.map((item) => item.href.substring(1));

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setHasScrolled(latest > 10);
    });
    return unsubscribe;
  }, [scrollY]);

  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);
  const handleOverlayClick = () => setIsDrawerOpen(false);

  return (
    <motion.header
      animate={{ opacity: 1 }}
      className={cn(
        'sticky z-50 mx-4 flex justify-center transition-all duration-300 md:mx-0',
        hasScrolled ? 'top-6' : 'top-4 mx-0',
      )}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        animate={{ width: hasScrolled ? MAX_WIDTH : INITIAL_WIDTH }}
        initial={{ width: INITIAL_WIDTH }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div
          className={cn(
            'mx-auto max-w-7xl rounded-2xl transition-all duration-300  xl:px-0',
            hasScrolled
              ? 'px-2 border border-border backdrop-blur-lg bg-background/75'
              : 'shadow-none px-7',
          )}
        >
          <div className="flex h-[56px] items-center justify-between pl-1 md:pl-2 pr-4">
            <Link className="flex items-center gap-1" href="/">
              <Icons.logo className="size-12" />
              {/* {!hasScrolled && ( */}
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-primary">Unhook</p>
                <Badge variant="secondary">Beta</Badge>
              </div>
              {/* )} */}
            </Link>

            <NavigationMenuSection />

            <div className="flex flex-row items-center gap-1 md:gap-3 shrink-0">
              <div className="flex items-center space-x-4">
                {/* <Link
                  className="hidden md:flex items-center text-sm font-medium text-primary/80 hover:text-primary transition-colors"
                  href="/pricing"
                >
                  Pricing
                </Link> */}
                <SignedOut>
                  <Link
                    className="bg-secondary h-8 hidden md:flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground w-fit px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12]"
                    href="/webhooks/create?utm_source=marketing-site&utm_medium=navbar-create-webhook-url"
                  >
                    Create Webhook URL
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Button
                    asChild
                    className="hidden md:flex rounded-full"
                    variant="outline"
                  >
                    <Link href="/dashboard?utm_source=marketing-site&utm_medium=navbar-dashboard">
                      Dashboard
                    </Link>
                  </Button>
                </SignedIn>
                <SignedOut>
                  <Button
                    asChild
                    className="hidden md:flex rounded-full"
                    variant="outline"
                  >
                    <Link href="/webhooks/create?utm_source=marketing-site&utm_medium=navbar-sign-in">
                      Sign In
                    </Link>
                  </Button>
                </SignedOut>
              </div>
              <GitHubStarsButtonWrapper
                className="rounded-full"
                repo="unhook-sh/unhook"
              />
              <ThemeToggle className="rounded-full" mode="toggle" />
              <button
                className="md:hidden border border-border size-8 rounded-md cursor-pointer flex items-center justify-center"
                onClick={toggleDrawer}
                type="button"
              >
                {isDrawerOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              animate="visible"
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              exit="exit"
              initial="hidden"
              onClick={handleOverlayClick}
              transition={{ duration: 0.2 }}
              variants={overlayVariants}
            />

            <motion.div
              animate="visible"
              className="fixed inset-x-0 w-[95%] mx-auto bottom-3 bg-background border border-border p-4 rounded-xl shadow-lg"
              exit="exit"
              initial="hidden"
              variants={drawerVariants}
            >
              {/* Mobile menu content */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Link className="flex items-center gap-3" href="/">
                    <Icons.logo className="size-7 md:size-10" />
                    <p className="text-lg font-semibold text-primary">Unhook</p>
                  </Link>
                  <button
                    className="border border-border rounded-md p-1 cursor-pointer"
                    onClick={toggleDrawer}
                    type="button"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <motion.ul
                  className="flex flex-col text-sm mb-4 border border-border rounded-md"
                  variants={drawerMenuContainerVariants}
                >
                  <AnimatePresence>
                    {siteConfig.nav.links.map((item) => {
                      const isAnchor = isAnchorLink(item.href);
                      const isActive = isAnchor
                        ? activeSection === item.href.substring(1)
                        : false;

                      return (
                        <motion.li
                          className="p-2.5 border-b border-border last:border-b-0"
                          key={item.id}
                          variants={drawerMenuVariants}
                        >
                          {isAnchor ? (
                            <a
                              className={`underline-offset-4 hover:text-primary/80 transition-colors ${
                                isActive
                                  ? 'text-primary font-medium'
                                  : 'text-primary/60'
                              }`}
                              href={item.href}
                              onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById(
                                  item.href.substring(1),
                                );
                                element?.scrollIntoView({ behavior: 'smooth' });
                                setIsDrawerOpen(false);
                              }}
                            >
                              {item.name}
                            </a>
                          ) : (
                            <Link
                              className="underline-offset-4 hover:text-primary/80 transition-colors text-primary/60"
                              href={item.href}
                              onClick={() => setIsDrawerOpen(false)}
                            >
                              {item.name}
                            </Link>
                          )}
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </motion.ul>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  {/* <Link
                    className="h-8 flex items-center justify-center text-sm font-medium text-primary/80 hover:text-primary transition-colors"
                    href="/pricing"
                  >
                    Pricing
                  </Link> */}
                  <Link
                    className="bg-secondary h-8 flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground w-full px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12] hover:bg-secondary/80 transition-all ease-out active:scale-95"
                    href="/webhooks/create?utm_source=marketing-site&utm_medium=navbar-create-webhook-url"
                  >
                    Create Webhook URL
                  </Link>
                  <SignedIn>
                    <Button asChild className="rounded-full" variant="outline">
                      <Link href="/dashboard?utm_source=marketing-site&utm_medium=navbar-dashboard">
                        Dashboard
                      </Link>
                    </Button>
                  </SignedIn>
                  <SignedOut>
                    <Button asChild className="rounded-full" variant="outline">
                      <Link href="/webhooks/create?utm_source=marketing-site&utm_medium=navbar-sign-in">
                        Sign In
                      </Link>
                    </Button>
                  </SignedOut>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & {
    comingSoon?: boolean;
  }
>(({ className, title, children, comingSoon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className,
          )}
          ref={ref}
          {...props}
        >
          <div className="text-sm font-medium leading-none flex items-center gap-2">
            {title}
            {comingSoon && <Badge variant="outline">Coming Soon</Badge>}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = 'ListItem';

function NavigationMenuSection() {
  return (
    <NavigationMenu className="hidden md:block">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="rounded-full">
            Products
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-background">
            <ul className="grid gap-3 p-6 md:w-[600px] lg:w-[700px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-4">
                <NavigationMenuLink asChild>
                  <Link
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/10 to-primary/5 p-6 no-underline outline-none focus:shadow-md"
                    href="/webhooks/create"
                  >
                    <Icons.logo className="w-full h-full mb-2" />
                    <div className="mb-2 mt-4 text-lg font-medium">
                      Unhook Platform
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Test webhooks locally, share URLs with your team, and
                      monitor everything in real-time.
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <ListItem href="/vscode" title="VS Code Extension">
                Debug webhooks without leaving your editor. View and replay
                events directly in VS Code.
              </ListItem>
              <ListItem comingSoon href="/jetbrains" title="JetBrains Plugin">
                Full webhook testing integration for IntelliJ, WebStorm, and
                other JetBrains IDEs.
              </ListItem>
              <ListItem href="/mcp" title="MCP Server">
                Use Cursor, Claude, and other MCP clients to test your webhooks.
              </ListItem>
              <ListItem href="/cli" title="Unhook CLI">
                Command-line interface for webhook testing. Perfect for CI/CD
                and automation.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="rounded-full">
            Solutions
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-background">
            <ul className="grid w-[500px] gap-3 p-4 md:w-[600px] md:grid-cols-2 lg:w-[700px]">
              <ListItem
                href="/solutions/team-collaboration"
                title="Team Collaboration"
              >
                Share webhook URLs across your team while maintaining individual
                development environments.
              </ListItem>
              <ListItem href="/solutions/local-testing" title="Local Testing">
                Test webhooks in your local environment without exposing it to
                the internet.
              </ListItem>
              <ListItem
                href="/solutions/ai-development"
                title="AI & MCP Development"
              >
                Test webhooks triggered by AI agents and MCP servers. Debug
                AI-driven workflows.
              </ListItem>
              <ListItem href="/solutions/debugging" title="Real-time Debugging">
                Monitor webhook requests in real-time with payload inspection
                and replay capabilities.
              </ListItem>
              <ListItem href="/solutions/security" title="Secure Development">
                End-to-end encryption ensures your webhook data remains private
                and secure.
              </ListItem>
              <ListItem
                href="/solutions/providers"
                title="Provider Integrations"
              >
                Built-in support for Stripe, GitHub, Clerk, and more. Easy to
                extend for custom providers.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="rounded-full">
            Resources
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-background">
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
              <ListItem href="https://docs.unhook.sh" title="Documentation">
                Get started with our comprehensive guides and API reference.
              </ListItem>
              <ListItem href="/comparisons" title="Comparisons">
                See how Unhook compares to ngrok, Webhook.site, and other
                alternatives.
              </ListItem>
              {/* <ListItem href="/blog" title="Blog">
                Tips, tutorials, and updates from the Unhook team.
              </ListItem> */}
              <ListItem
                href="https://github.com/unhook-sh/unhook/releases"
                title="Changelog"
              >
                Stay up to date with the latest features and improvements.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
