'use client'

import * as Accordion from '@radix-ui/react-accordion'
import { useInView } from 'framer-motion'
import type { ReactNode } from 'react'
import type React from 'react'
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@acme/ui/lib/utils'

import { CompetitorWatch } from './competitor-watch'
import { DataTableDemo } from './investor-crm'
import { InvestorEngagement } from './investor-engagement'
import { MarketInsights } from './market-insights'
import { PitchPractice } from './pitch-practice'

type AccordionItemProps = {
  children: React.ReactNode
  className?: string
} & Accordion.AccordionItemProps

const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <Accordion.Item
      className={cn(
        'mt-px overflow-hidden focus-within:relative focus-within:z-10',
        className,
      )}
      {...props}
      ref={forwardedRef}
    >
      {children}
    </Accordion.Item>
  ),
)

interface AccordionTriggerProps {
  children: React.ReactNode
  className?: string
}

const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <Accordion.Header className="flex">
      <Accordion.Trigger
        className={cn(
          'group flex h-full flex-1 cursor-pointer items-center justify-between px-5 text-left text-[15px] leading-none outline-hidden',
          className,
        )}
        {...props}
        ref={forwardedRef}
      >
        {children}
      </Accordion.Trigger>
    </Accordion.Header>
  ),
)

type AccordionContentProps = {
  children: ReactNode
  className?: string
} & Accordion.AccordionContentProps

const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <Accordion.Content
      className={cn(
        'data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down overflow-hidden text-[15px] font-medium',
        className,
      )}
      {...props}
      ref={forwardedRef}
    >
      <div className="px-5 py-2">{children}</div>
    </Accordion.Content>
  ),
)

interface CardDataProps {
  id: number
  title: string
  content: React.ReactNode
  image?: React.ReactNode
  video?: string
}
const cardData: CardDataProps[] = [
  {
    content:
      'Instantly access thousands of investors who are actively seeking new opportunities, ensuring your startup gets noticed fast.',
    id: 1,
    image: <DataTableDemo />,
    title: 'Access to Active Investors',
  },
  {
    content:
      'Automate your investor outreach with personalized updates that keep them engaged without taking up your valuable time.',
    id: 2,
    image: <InvestorEngagement />,

    title: 'Automated Investor Engagement',
  },
  {
    content:
      'Leverage AI to uncover key market trends and competitor strategies, giving you the insights you need to stay ahead and secure investment.',
    id: 3,
    image: <MarketInsights />,
    title: 'AI-Driven Market Insights',
  },
  {
    content:
      'Stay ahead with AI-driven insights on market trends and competitors.',
    id: 4,
    image: <CompetitorWatch />,
    title: 'Competitor Watch',
  },
  {
    content:
      'Get personalized feedback on your pitch from AI-powered analysis.',
    id: 5,
    image: <PitchPractice />,
    title: 'AI Pitch Practice',
  },
]

interface FeatureProps {
  collapseDelay?: number
  ltr?: boolean
  linePosition?: 'left' | 'right'
}

const Feature = ({
  collapseDelay = 5000,
  ltr = false,
  linePosition = 'left',
}: FeatureProps) => {
  const [currentIndex, setCurrentIndex] = useState<number>(-1)

  const carouselRef = useRef<HTMLUListElement>(null)
  const ref = useRef(null)
  const isInView = useInView(ref, {
    amount: 0.5,
    once: true,
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isInView) {
        setCurrentIndex(0)
      } else {
        setCurrentIndex(-1)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isInView])

  const scrollToIndex = useCallback((index: number) => {
    if (carouselRef.current) {
      const card = carouselRef.current.querySelectorAll('.card')[index]
      if (card) {
        const cardRect = card.getBoundingClientRect()
        const carouselRect = carouselRef.current.getBoundingClientRect()
        const offset =
          cardRect.left -
          carouselRect.left -
          (carouselRect.width - cardRect.width) / 2

        carouselRef.current.scrollTo({
          behavior: 'smooth',
          left: carouselRef.current.scrollLeft + offset,
        })
      }
    }
  }, [])

  // interval for changing images
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((previousIndex) =>
        previousIndex === undefined ? 0 : (previousIndex + 1) % cardData.length,
      )
    }, collapseDelay)

    return () => clearInterval(timer)
  }, [collapseDelay])

  useEffect(() => {
    const handleAutoScroll = () => {
      const nextIndex =
        (currentIndex === undefined ? 0 : currentIndex + 1) % cardData.length
      scrollToIndex(nextIndex)
    }

    const autoScrollTimer = setInterval(handleAutoScroll, collapseDelay)

    return () => clearInterval(autoScrollTimer)
  }, [currentIndex, collapseDelay, scrollToIndex])

  useEffect(() => {
    const carousel = carouselRef.current
    if (carousel) {
      const handleScroll = () => {
        const scrollLeft = carousel.scrollLeft
        const cardWidth = carousel.querySelector('.card')?.clientWidth || 0
        const newIndex = Math.min(
          Math.floor(scrollLeft / cardWidth),
          cardData.length - 1,
        )
        setCurrentIndex(newIndex)
      }

      carousel.addEventListener('scroll', handleScroll)
      return () => carousel.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <section
      ref={ref}
      id="features"
      className="container flex w-full flex-col items-center justify-center p-4"
    >
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-4xl font-bold tracking-tight text-black dark:text-white sm:text-6xl">
          Raise faster than your competition
        </h2>
      </div>
      <div className="mx-auto my-12 grid h-full max-w-5xl grid-cols-5 gap-x-10">
        <div
          className={`col-span-2 hidden md:flex ${
            ltr ? 'md:order-2 md:justify-end' : 'justify-start'
          }`}
        >
          <Accordion.Root
            className="w-[300px]"
            type="single"
            defaultValue={`item-${currentIndex}`}
            value={`item-${currentIndex}`}
            onValueChange={(value) =>
              setCurrentIndex(Number(value.split('-')[1]))
            }
          >
            {cardData.map((item, index) => (
              <AccordionItem
                key={item.id}
                className="relative mb-8 last:mb-0"
                value={`item-${index}`}
              >
                <div
                  className={`absolute bottom-0 top-0 h-full w-0.5 overflow-hidden rounded-lg bg-neutral-300/50 dark:bg-neutral-300/30 ${
                    linePosition === 'right'
                      ? 'left-auto right-0'
                      : 'left-0 right-auto'
                  }`}
                >
                  <div
                    className={`absolute left-0 top-0 w-full ${
                      currentIndex === index ? 'h-full' : 'h-0'
                    } origin-top bg-neutral-500 transition-all ease-linear dark:bg-white`}
                    style={{
                      transitionDuration:
                        currentIndex === index ? `${collapseDelay}ms` : '0s',
                    }}
                  />
                </div>
                <AccordionTrigger className="text-xl font-bold">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent>{item.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion.Root>
        </div>
        <div
          className={cn(
            'col-span-5 h-full min-h-[450px] w-auto min-w-[500px] md:col-span-3',
            { 'md:order-1': ltr },
          )}
        >
          {/* {cardData[currentIndex]?.image ? (
            <motion.img
              key={currentIndex}
              src={cardData[currentIndex].image}
              alt="feature"
              className="aspect-auto h-full w-full rounded-xl border border-neutral-300/50 object-cover p-1"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          ) : cardData[currentIndex]?.video ? (
            <video
              preload="auto"
              src={cardData[currentIndex].video}
              className="aspect-auto h-full w-full rounded-lg object-cover"
              autoPlay
              loop
              muted
            />
          ) : (
            <div className="aspect-auto h-full w-full rounded-xl border border-neutral-300/50 bg-gray-200 p-1"></div>
          )} */}
          {cardData[currentIndex]?.image}
        </div>

        <ul
          ref={carouselRef}
          className="col-span-5 flex h-full snap-x snap-mandatory flex-nowrap overflow-x-auto py-10 [-ms-overflow-style:none] [-webkit-mask-image:linear-gradient(90deg,transparent,black_20%,white_80%,transparent)] [mask-image:linear-gradient(90deg,transparent,black_20%,white_80%,transparent)] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
          style={{
            padding: '50px calc(50%)',
          }}
        >
          {cardData.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className="card relative mr-8 grid h-full max-w-60 shrink-0 items-start justify-center py-4 last:mr-0"
              onClick={() => setCurrentIndex(index)}
              style={{
                scrollSnapAlign: 'center',
              }}
            >
              <div className="absolute bottom-0 left-0 right-auto top-0 h-0.5 w-full overflow-hidden rounded-lg bg-neutral-300/50 dark:bg-neutral-300/30">
                <div
                  className={`absolute left-0 top-0 h-full ${
                    currentIndex === index ? 'w-full' : 'w-0'
                  } origin-top bg-neutral-500 transition-all ease-linear dark:bg-white`}
                  style={{
                    transitionDuration:
                      currentIndex === index ? `${collapseDelay}ms` : '0s',
                  }}
                />
              </div>
              <h2 className="text-xl font-bold">{item.title}</h2>
              <p className="mx-0 max-w-sm text-balance text-sm">
                {item.content}
              </p>
            </button>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function FeatureSection() {
  return <Feature collapseDelay={500_000} linePosition="left" />
}
