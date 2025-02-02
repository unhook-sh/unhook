'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlignJustify, XIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Badge } from '@acme/ui/badge'
import { Button } from '@acme/ui/button'
import { cn } from '@acme/ui/lib/utils'
import { ThemeToggle } from '@acme/ui/theme'

import { SiteHeaderNavigationMenu } from './site-header-nav-menu'

const menuItem = [
  {
    href: '/features',
    id: 1,
    label: 'Features',
  },
  {
    href: '#',
    id: 2,
    label: 'Pricing',
  },
  {
    href: '#',
    id: 4,
    label: 'Contact Us',
  },
]

export function SiteHeader() {
  const mobilenavbarVariant = {
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      transition: {
        delay: 0.2,
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    initial: {
      opacity: 0,
      scale: 1,
    },
  }

  const mobileLinkVariable = {
    initial: {
      opacity: 0,
      y: '-20px',
    },
    open: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
      y: 0,
    },
  }

  const containerVariants = {
    open: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  }

  const [hamburgerMenuIsOpen, setHamburgerMenuIsOpen] = useState(false)

  useEffect(() => {
    const html = document.querySelector('html')
    if (html) html.classList.toggle('overflow-hidden', hamburgerMenuIsOpen)
  }, [hamburgerMenuIsOpen])

  useEffect(() => {
    const closeHamburgerNavigation = () => setHamburgerMenuIsOpen(false)
    window.addEventListener('orientationchange', closeHamburgerNavigation)
    window.addEventListener('resize', closeHamburgerNavigation)

    return () => {
      window.removeEventListener('orientationchange', closeHamburgerNavigation)
      window.removeEventListener('resize', closeHamburgerNavigation)
    }
  }, [])

  return (
    <>
      <header className="sticky left-0 top-0 z-50 w-full border-b backdrop-blur-[12px] [--animation-delay:600ms] motion-safe:translate-y-[-1rem] motion-safe:animate-fade-in motion-safe:opacity-0">
        <div className="container flex h-[3.5rem] items-center justify-between">
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
            <Badge variant={'outline'}>Beta</Badge>
          </Link>

          <div className="ml-auto flex h-full items-center gap-4">
            <div className="hidden md:block">
              <SiteHeaderNavigationMenu />
            </div>
            <Button asChild variant={'ghost'} className="hidden md:block">
              <Link href="/signin">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
          </div>
          <button
            type="button"
            className="ml-6 md:hidden"
            onClick={() => setHamburgerMenuIsOpen((open) => !open)}
          >
            <span className="sr-only">Toggle menu</span>
            {hamburgerMenuIsOpen ? <XIcon /> : <AlignJustify />}
          </button>
        </div>
      </header>
      <AnimatePresence>
        <motion.nav
          initial="initial"
          exit="exit"
          variants={mobilenavbarVariant}
          animate={hamburgerMenuIsOpen ? 'animate' : 'exit'}
          className={cn(
            'fixed left-0 top-0 z-50 flex h-screen w-full flex-col justify-between overflow-auto bg-background/70 backdrop-blur-[12px]',
            {
              'pointer-events-none': !hamburgerMenuIsOpen,
            },
          )}
        >
          <div className="container flex h-[3.5rem] items-center justify-between">
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
              <Badge variant={'outline'}>Beta</Badge>
            </Link>

            <button
              type="button"
              className="ml-6 md:hidden"
              onClick={() => setHamburgerMenuIsOpen((open) => !open)}
            >
              <span className="sr-only">Toggle menu</span>
              {hamburgerMenuIsOpen ? <XIcon /> : <AlignJustify />}
            </button>
          </div>
          <motion.ul
            className={
              'flex flex-col uppercase ease-in md:flex-row md:items-center md:normal-case'
            }
            variants={containerVariants}
            initial="initial"
            animate={hamburgerMenuIsOpen ? 'open' : 'exit'}
          >
            {menuItem.map((item) => (
              <motion.li
                variants={mobileLinkVariable}
                key={item.id}
                className="border-grey-dark border-b py-0.5 pl-6 md:border-none"
              >
                <Link
                  className={`hover:text-grey flex h-[var(--navigation-height)] w-full items-center text-xl transition-[color,transform] duration-300 md:translate-y-0 md:text-sm md:transition-colors ${
                    hamburgerMenuIsOpen ? '[&_a]:translate-y-0' : ''
                  }`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </motion.li>
            ))}
          </motion.ul>
          <div className="p-2">
            <ThemeToggle />
          </div>
        </motion.nav>
      </AnimatePresence>
    </>
  )
}
