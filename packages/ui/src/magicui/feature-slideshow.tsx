'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { motion, useInView } from 'motion/react';
import type React from 'react';
import { forwardRef, type ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

type AccordionItemProps = {
  children: React.ReactNode;
  className?: string;
} & Accordion.AccordionItemProps;

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
);
AccordionItem.displayName = 'AccordionItem';

type AccordionTriggerProps = {
  children: React.ReactNode;
  className?: string;
};

const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <Accordion.Header className="flex">
      <Accordion.Trigger
        className={cn(
          'group flex h-[45px] flex-1 cursor-pointer items-center justify-between p-3 text-[15px] leading-none outline-none',
          className,
        )}
        {...props}
        ref={forwardedRef}
      >
        {children}
      </Accordion.Trigger>
    </Accordion.Header>
  ),
);
AccordionTrigger.displayName = 'AccordionTrigger';

type AccordionContentProps = {
  children: ReactNode;
  className?: string;
} & Accordion.AccordionContentProps;

const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <Accordion.Content
      className={cn(
        'overflow-hidden text-[15px] font-medium data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down',
        className,
      )}
      {...props}
      ref={forwardedRef}
    >
      <div className="p-3">{children}</div>
    </Accordion.Content>
  ),
);
AccordionContent.displayName = 'AccordionContent';

type FeatureItem = {
  id: number;
  title: string;
  content: string;
  image?: string;
  video?: string;
  component?: React.ReactNode;
};
type FeatureProps = {
  collapseDelay?: number;
  ltr?: boolean;
  linePosition?: 'left' | 'right' | 'top' | 'bottom';
  lineColor?: string;
  featureItems: FeatureItem[];
};

export const Feature = ({
  collapseDelay = 5000,
  ltr = false,
  linePosition = 'left',
  lineColor = 'bg-primary',
  featureItems,
}: FeatureProps) => {
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [previousIndex, setPreviousIndex] = useState<number>(-1);

  const carouselRef = useRef<HTMLUListElement>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, {
    amount: 0.5,
    once: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isInView) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex(-1);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isInView]);

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const card = carouselRef.current.querySelectorAll('.card')[index];
      if (card) {
        const cardRect = card.getBoundingClientRect();
        const carouselRect = carouselRef.current.getBoundingClientRect();
        const offset =
          cardRect.left -
          carouselRect.left -
          (carouselRect.width - cardRect.width) / 2;

        carouselRef.current.scrollTo({
          behavior: 'smooth',
          left: carouselRef.current.scrollLeft + offset,
        });
      }
    }
  };

  // interval for changing images (desktop only)
  // biome-ignore lint/correctness/useExhaustiveDependencies: we only need to set the interval once
  useEffect(() => {
    // Only run auto-rotation on desktop (lg and up)
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex !== undefined ? (prevIndex + 1) % featureItems.length : 0,
      );
    }, collapseDelay);

    return () => clearInterval(timer);
  }, [collapseDelay, currentIndex, featureItems.length]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we only need to set the interval once
  useEffect(() => {
    // Only run auto-scroll on desktop (lg and up)
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) return;

    const handleAutoScroll = () => {
      const nextIndex =
        (currentIndex !== undefined ? currentIndex + 1 : 0) %
        featureItems.length;
      scrollToIndex(nextIndex);
    };

    const autoScrollTimer = setInterval(handleAutoScroll, collapseDelay);

    return () => clearInterval(autoScrollTimer);
  }, [collapseDelay, currentIndex, featureItems.length]);

  useEffect(() => {
    // Only run scroll handling on desktop (lg and up)
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) return;

    const carousel = carouselRef.current;
    if (carousel) {
      const handleScroll = () => {
        const scrollLeft = carousel.scrollLeft;
        const cardWidth = carousel.querySelector('.card')?.clientWidth || 0;
        const newIndex = Math.min(
          Math.floor(scrollLeft / cardWidth),
          featureItems.length - 1,
        );
        setCurrentIndex(newIndex);
      };

      carousel.addEventListener('scroll', handleScroll);
      return () => carousel.removeEventListener('scroll', handleScroll);
    }
  }, [featureItems.length]);

  // Handle image transition
  useEffect(() => {
    if (currentIndex !== previousIndex) {
      setImageLoaded(false);
      setPreviousIndex(currentIndex);
    }
  }, [currentIndex, previousIndex]);

  // Replace the existing image rendering section with this optimized version
  const renderMedia = () => {
    const currentItem = featureItems[currentIndex];

    if (!currentItem) {
      return (
        <div className="aspect-auto h-full w-full rounded-xl border border-border bg-muted p-1 animate-pulse" />
      );
    }

    // Priority: component > image > video > fallback
    if (currentItem.component) {
      return (
        <div className="relative h-full w-full overflow-hidden">
          <motion.div
            animate={{
              opacity: 1,
            }}
            className={cn(
              'aspect-auto h-full w-full rounded-xl border border-border p-1',
              'transition-all duration-300',
            )}
            initial={{
              opacity: 0,
            }}
            key={currentIndex}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {currentItem.component}
          </motion.div>
        </div>
      );
    }

    if (currentItem.image) {
      return (
        <div className="relative h-full w-full overflow-hidden">
          {/* Placeholder/Fallback */}
          <div
            className={cn(
              'absolute inset-0 bg-muted rounded-xl border border-border',
              'transition-all duration-150',
              imageLoaded ? 'opacity-0' : 'opacity-100',
            )}
          />

          {/* Main Image */}
          {/** biome-ignore lint/performance/noImgElement: we need to use img for the image */}
          <motion.img
            alt={currentItem.title}
            animate={{
              filter: imageLoaded ? 'blur(0px)' : 'blur(5px)',
              opacity: imageLoaded ? 1 : 0,
            }}
            className={cn(
              'aspect-auto h-full w-full rounded-xl border border-border object-cover p-1',
              'transition-all duration-300',
              imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-xl',
            )}
            initial={{
              filter: 'blur(5px)',
              opacity: 0,
            }}
            key={currentIndex}
            loading="eager"
            onLoad={() => setImageLoaded(true)}
            sizes="(max-width: 768px) 100vw, 50vw"
            src={currentItem.image}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        </div>
      );
    }

    if (currentItem.video) {
      return (
        <video
          autoPlay
          className="aspect-auto h-full w-full rounded-lg object-cover"
          loop
          muted
          playsInline
          preload="auto"
          src={currentItem.video} // Better mobile support
        />
      );
    }

    return (
      <div className="aspect-auto h-full w-full rounded-xl border border-border bg-muted p-1" />
    );
  };

  return (
    <div className="w-full" ref={ref}>
      <div className="flex w-full flex-col items-center justify-center max-w-7xl mx-auto">
        <div className="grid h-full grid-cols-5 gap-x-10 px-10 md:px-20 items-center w-full">
          <div
            className={`col-span-2 w-full h-full hidden lg:flex md:items-center ${
              ltr ? 'md:order-2 md:justify-end' : 'justify-start'
            }`}
          >
            <Accordion.Root
              className="w-full h-full flex flex-col gap-8"
              defaultValue={`item-${currentIndex}`}
              onValueChange={(value) =>
                setCurrentIndex(Number(value.split('-')[1]))
              }
              type="single"
              value={`item-${currentIndex}`}
            >
              {featureItems.map((item, index) => (
                <AccordionItem
                  className={cn(
                    'relative data-[state=open]:bg-primary-foreground rounded-lg data-[state=closed]:rounded-none data-[state=closed]:border-0',
                    // 'dark:data-[state=open]:shadow-[0px_0px_0px_1px_rgba(249,250,251,0.06),0px_0px_0px_1px_var(--color-zinc-800,#27272A),0px_1px_2px_-0.5px_rgba(0,0,0,0.24),0px_2px_4px_-1px_rgba(0,0,0,0.24)]',
                    'data-[state=open]:shadow-[0px_0px_1px_0px_rgba(0,0,0,0.16),0px_1px_2px_-0.5px_rgba(0,0,0,0.16)]',
                  )}
                  key={item.id}
                  value={`item-${index}`}
                >
                  <div
                    className={cn(
                      'absolute overflow-hidden rounded-lg transition-opacity',
                      'data-[state=closed]:opacity-0 data-[state=open]:opacity-100',
                      'bg-muted',
                      {
                        'bottom-0 top-0 h-full w-0.5 left-0':
                          linePosition === 'left',
                        'bottom-0 top-0 h-full w-0.5 right-0':
                          linePosition === 'right',
                        'left-0 right-0 bottom-0 h-0.5 w-full':
                          linePosition === 'bottom',
                        'left-0 right-0 top-0 h-0.5 w-full':
                          linePosition === 'top',
                      },
                    )}
                    data-state={currentIndex === index ? 'open' : 'closed'}
                  >
                    <div
                      className={cn(
                        'absolute transition-all ease-linear',
                        lineColor,
                        {
                          'left-0 top-0 h-full': ['top', 'bottom'].includes(
                            linePosition,
                          ),
                          'left-0 top-0 w-full': ['left', 'right'].includes(
                            linePosition,
                          ),
                        },
                        currentIndex === index
                          ? ['left', 'right'].includes(linePosition)
                            ? 'h-full'
                            : 'w-full'
                          : ['left', 'right'].includes(linePosition)
                            ? 'h-0'
                            : 'w-0',
                      )}
                      style={{
                        transitionDuration:
                          currentIndex === index ? `${collapseDelay}ms` : '0s',
                      }}
                    />
                  </div>
                  <AccordionTrigger className="font-semibold text-lg tracking-tight text-left">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm font-medium">
                    {item.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion.Root>
          </div>
          <div
            className={`col-span-5 h-[350px] min-h-[200px] w-auto lg:col-span-3 hidden lg:block ${
              ltr && 'md:order-1'
            }`}
          >
            {renderMedia()}
          </div>

          <div className="col-span-5 flex flex-col gap-4 lg:hidden">
            {featureItems.map((item, _index) => (
              <div
                className="flex flex-col gap-4 p-4 bg-background border rounded-lg"
                key={item.id}
              >
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-bold">{item.title}</h2>
                  <p className="text-sm font-medium leading-relaxed">
                    {item.content}
                  </p>
                </div>
                {item.component && (
                  <div className="w-full h-48 rounded-lg border border-border overflow-hidden">
                    {item.component}
                  </div>
                )}
                {item.image && (
                  <div className="w-full h-48 rounded-lg border border-border overflow-hidden">
                    {/** biome-ignore lint/performance/noImgElement: we need to use img for the image */}
                    <img
                      alt={item.title}
                      className="w-full h-full object-cover"
                      src={item.image}
                    />
                  </div>
                )}
                {item.video && (
                  <div className="w-full h-48 rounded-lg border border-border overflow-hidden">
                    <video
                      autoPlay
                      className="w-full h-full object-cover"
                      loop
                      muted
                      playsInline
                      preload="auto"
                      src={item.video}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
