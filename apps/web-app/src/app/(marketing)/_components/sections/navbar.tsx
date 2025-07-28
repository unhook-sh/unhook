'use client';

import { SignedIn, SignedOut } from '@clerk/nextjs';
import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import { GitHubStarsButtonWrapper } from '@unhook/ui/custom/github-stars-button/button-wrapper';
import { ThemeToggle } from '@unhook/ui/custom/theme';
import { cn } from '@unhook/ui/lib/utils';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@unhook/ui/navigation-menu';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useScroll } from 'motion/react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Icons } from '~/app/(marketing)/_components/icons';
import { siteConfig } from '~/app/(marketing)/_lib/config';

const INITIAL_WIDTH = '70rem';
const MAX_WIDTH = '980px';

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

// Logo component
function Logo() {
  return (
    <Link className="flex items-center gap-1" href="/">
      <Icons.logo className="size-12" />
      <div className="flex items-center gap-2">
        <p className="text-lg font-semibold text-primary">Unhook AI</p>
        <Badge className="hidden md:block" variant="secondary">
          Beta
        </Badge>
      </div>
    </Link>
  );
}

// Desktop action buttons component
function DesktopActionButtons() {
  return (
    <div className="flex items-center space-x-4">
      <SignedOut>
        <Link
          className="bg-secondary h-8 hidden md:flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground w-fit px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12]"
          href="/app/onboarding?utm_source=marketing-site&utm_medium=navbar-create-webhook-url"
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
          <Link href="/app/dashboard?utm_source=marketing-site&utm_medium=navbar-dashboard">
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
          <Link href="/app/onboarding?utm_source=marketing-site&utm_medium=navbar-sign-in">
            Sign In
          </Link>
        </Button>
      </SignedOut>
    </div>
  );
}

// Mobile menu toggle button
function MobileMenuToggle({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="md:hidden border border-border size-8 rounded-md cursor-pointer flex items-center justify-center"
      onClick={onToggle}
      type="button"
    >
      {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
    </button>
  );
}

// Mobile menu item component
function MobileMenuItem({
  item,
  isActive,
  isAnchor,
  onClose,
}: {
  item: { href: string; id: number; name: string };
  isActive: boolean;
  isAnchor: boolean;
  onClose: () => void;
}) {
  if (isAnchor) {
    return (
      <a
        className={`underline-offset-4 hover:text-primary/80 transition-colors ${
          isActive ? 'text-primary font-medium' : 'text-primary/60'
        }`}
        href={item.href}
        onClick={(e) => {
          e.preventDefault();
          const element = document.getElementById(item.href.substring(1));
          element?.scrollIntoView({ behavior: 'smooth' });
          onClose();
        }}
      >
        {item.name}
      </a>
    );
  }

  return (
    <Link
      className="underline-offset-4 hover:text-primary/80 transition-colors text-primary/60"
      href={item.href}
      onClick={onClose}
    >
      {item.name}
    </Link>
  );
}

// Mobile menu content
function MobileMenuContent({
  isOpen,
  onClose,
  activeSection,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
}) {
  const isAnchorLink = (href: string) => href.startsWith('#');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            animate="visible"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            exit="exit"
            initial="hidden"
            onClick={onClose}
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
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Link className="flex items-center gap-3" href="/">
                  <Icons.logo className="size-7 md:size-10" />
                  <p className="text-lg font-semibold text-primary">Unhook</p>
                </Link>
                <button
                  className="border border-border rounded-md p-1 cursor-pointer"
                  onClick={onClose}
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
                        <MobileMenuItem
                          isActive={isActive}
                          isAnchor={isAnchor}
                          item={item}
                          onClose={onClose}
                        />
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>

              <div className="flex flex-col gap-2">
                <Link
                  className="bg-secondary h-8 flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground w-full px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12] hover:bg-secondary/80 transition-all ease-out active:scale-95"
                  href="/app/onboarding?utm_source=marketing-site&utm_medium=navbar-create-webhook-url"
                >
                  Create Webhook URL
                </Link>
                <SignedIn>
                  <Button asChild className="rounded-full" variant="outline">
                    <Link href="/app/dashboard?utm_source=marketing-site&utm_medium=navbar-dashboard">
                      Dashboard
                    </Link>
                  </Button>
                </SignedIn>
                <SignedOut>
                  <Button asChild className="rounded-full" variant="outline">
                    <Link href="/app/onboarding?utm_source=marketing-site&utm_medium=navbar-sign-in">
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
  );
}

// Right side controls (GitHub stars, theme toggle, mobile menu)
function RightSideControls({
  isDrawerOpen,
  toggleDrawer,
}: {
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
}) {
  return (
    <div className="flex flex-row items-center gap-1 md:gap-3 shrink-0">
      <DesktopActionButtons />
      <GitHubStarsButtonWrapper
        className="rounded-full"
        repo="unhook-sh/unhook"
      />
      <ThemeToggle className="rounded-full" mode="toggle" />
      <MobileMenuToggle isOpen={isDrawerOpen} onToggle={toggleDrawer} />
    </div>
  );
}

// Main navbar header component
function NavbarHeader({
  hasScrolled,
  isDrawerOpen,
  toggleDrawer,
  activeSection,
}: {
  hasScrolled: boolean;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  activeSection: string;
}) {
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
            <Logo />
            <NavigationMenuSection />
            <RightSideControls
              isDrawerOpen={isDrawerOpen}
              toggleDrawer={toggleDrawer}
            />
          </div>
        </div>
      </motion.div>

      <MobileMenuContent
        activeSection={activeSection}
        isOpen={isDrawerOpen}
        onClose={toggleDrawer}
      />
    </motion.header>
  );
}

// Main Navbar component
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

  return (
    <NavbarHeader
      activeSection={activeSection}
      hasScrolled={hasScrolled}
      isDrawerOpen={isDrawerOpen}
      toggleDrawer={toggleDrawer}
    />
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
                    href="/app/onboarding"
                  >
                    <Icons.logo className="w-full h-full mb-2" />
                    <div className="mb-2 mt-4 text-lg font-medium">
                      Unhook AI Platform
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Test webhooks locally, share URLs with your team, and
                      monitor everything in real-time.
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <ListItem
                href="https://marketplace.visualstudio.com/items?itemName=unhook.unhook-vscode"
                title="VS Code Extension"
              >
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
              <ListItem
                href="https://npmjs.com/package/@unhook/cli"
                title="Unhook CLI"
              >
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
                href="https://docs.unhook.sh/team-collaboration"
                title="Team Collaboration"
              >
                Share webhook URLs across your team while maintaining individual
                development environments.
              </ListItem>
              <ListItem
                href="https://docs.unhook.sh/local-testing"
                title="Local Testing"
              >
                Test webhooks in your local environment without exposing it to
                the internet.
              </ListItem>
              <ListItem
                href="https://docs.unhook.sh/ai-development"
                title="AI & MCP Development"
              >
                Test webhooks triggered by AI agents and MCP servers. Debug
                AI-driven workflows.
              </ListItem>
              <ListItem
                href="https://docs.unhook.sh/debugging"
                title="Real-time Debugging"
              >
                Monitor webhook requests in real-time with payload inspection
                and replay capabilities.
              </ListItem>
              <ListItem
                href="https://docs.unhook.sh/security"
                title="Secure Development"
              >
                End-to-end encryption ensures your webhook data remains private
                and secure.
              </ListItem>
              <ListItem
                href="https://docs.unhook.sh/providers"
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
