"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Icons } from "@acme/ui/icons";
import { cn } from "@acme/ui/lib/utils";
import { NeonGradientCard } from "@acme/ui/magicui/neon-gradient-card";
import { Switch } from "@acme/ui/switch";

type Interval = "month" | "year";

export const toHumanPrice = (price: number, decimals = 2) => {
  return Number(price / 100).toFixed(decimals);
};

const annualDiscount = 0.8;
const launchMonthlyPrice = 1000;
const accelerateMonthlyPrice = 4900;
const unicornMonthlyPrice = 9900;

const demoPrices = [
  {
    description:
      "Recommended for startups looking insights before their next raise.",
    features: [
      "Track up to 5 investors",
      "1 Basic AI-powered pitch deck analysis",
      "Basic fundraising analytics",
    ],
    id: "price_1",
    isMostPopular: false,
    monthlyPrice: launchMonthlyPrice,
    name: "Basic",
    yearlyPrice: launchMonthlyPrice * annualDiscount,
  },
  {
    description:
      "Recommended for startups who are actively pitching to investors.",
    features: [
      "Track up to 25 investors",
      "5 AI Investor Outreach / Day",
      "3 Advanced AI-powered pitch deck analysis",
      "AI Pitch Prep + Practice",
      "1 competitor analysis + tracking",
      "Basic fundraising analytics",
      "1 data room + analytics",
      "Send yearly Investor Updates",
    ],
    id: "price_2",
    isMostPopular: true,
    monthlyPrice: accelerateMonthlyPrice,
    name: "Accelerate",
    yearlyPrice: accelerateMonthlyPrice * annualDiscount,
  },
  {
    description:
      "Recommended for startups who are serious about turning into a unicorn.",
    features: [
      "AI Investor Matchmaking",
      "25 AI Investor Outreach / Day",
      "Automated investor engagement",
      "Access to unlimited investors",
      "Advanced fundraising analytics",
      "10 AI-powered pitch deck analysis",
      "AI Pitch Prep + Practice",
      "5 competitor analysis + tracking",
      "Unlimited data rooms + analytics",
      "Send monthly Investor Updates",
      "Import/export data from CRM or CSV",
      "Priority access to new features",
    ],
    id: "price_3",
    isMostPopular: false,
    monthlyPrice: unicornMonthlyPrice,
    name: "Unicorn",
    yearlyPrice: unicornMonthlyPrice * annualDiscount,
  },
] as const;

export function PricingSection() {
  const [interval, setPricingInterval] = useState<Interval>("year");
  const [isLoading, setIsLoading] = useState(false);
  const [id, setId] = useState<string | null>(null);

  const onSubscribeClick = async (priceId: string) => {
    setIsLoading(true);
    setId(priceId);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate a delay
    setIsLoading(false);
  };
  const percentFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "percent",
  });

  return (
    <section
      id="pricing"
      className="mx-auto flex max-w-screen-xl flex-col gap-8 px-4 md:px-8"
    >
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-5xl font-bold tracking-tight text-black dark:text-white sm:text-6xl">
          Simple pricing for Founders
        </h2>

        <p className="mt-6 text-xl leading-8 text-black/80 dark:text-white">
          Choose an <strong>affordable plan</strong> that&apos;s packed with the
          best features for raising your next round.
        </p>
      </div>

      <div className="flex w-full items-center justify-center space-x-2">
        <Switch
          id="interval"
          aria-description="Toggle between monthly and annual pricing"
          checked={interval === "year"}
          onCheckedChange={(checked) => {
            setPricingInterval(checked ? "year" : "month");
          }}
        />
        <span>Annual</span>
        <span className="inline-block whitespace-nowrap rounded-full bg-black px-2.5 py-1 text-[11px] font-semibold uppercase leading-5 tracking-wide text-white dark:bg-white dark:text-black">
          {percentFormatter.format(1 - annualDiscount)} OFF
        </span>
      </div>

      <div className="mx-auto grid w-full flex-col justify-center gap-12 sm:grid-cols-1 lg:grid-cols-3">
        {demoPrices.map((price, index) => (
          <>
            {price.isMostPopular && (
              <NeonGradientCard key={price.id} className="max-w-[400px]">
                <div className="relative flex flex-col gap-8">
                  <PriceCardContent
                    price={price}
                    interval={interval}
                    isLoading={isLoading}
                    id={id}
                    index={index}
                    onSubscribeClick={onSubscribeClick}
                  />
                </div>
              </NeonGradientCard>
            )}
            {!price.isMostPopular && (
              <div
                key={price.id}
                className="relative flex max-w-[400px] flex-col gap-8 overflow-hidden rounded-2xl border p-4 text-black dark:text-white lg:mt-8"
              >
                <PriceCardContent
                  price={price}
                  interval={interval}
                  isLoading={isLoading}
                  id={id}
                  index={index}
                  onSubscribeClick={onSubscribeClick}
                />
              </div>
            )}
          </>
        ))}
      </div>
    </section>
  );
}

function PriceCardContent(props: {
  price: (typeof demoPrices)[number];
  interval: Interval;
  isLoading: boolean;
  id: string | null;
  index: number;
  onSubscribeClick: (priceId: string) => void;
}) {
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  });

  return (
    <>
      <div className="flex items-center">
        <div className="ml-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <h2
              className={cn("font-semibold leading-7", {
                "text-2xl": props.price.isMostPopular,
                "text-base": !props.price.isMostPopular,
              })}
            >
              {props.price.name}
            </h2>
            {props.price.isMostPopular && <Badge>Most Popular</Badge>}
          </div>
          <p className="h-12 text-sm leading-5 text-black/70 dark:text-white">
            {props.price.description}
          </p>
        </div>
      </div>

      <motion.div
        key={`${props.price.id}-${props.interval}`}
        initial="initial"
        animate="animate"
        variants={{
          animate: {
            opacity: 1,
            y: 0,
          },
          initial: {
            opacity: 0,
            y: 12,
          },
        }}
        transition={{
          delay: 0.1 + props.index * 0.05,
          duration: 0.4,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
        className="flex flex-row gap-1"
      >
        <span className="text-4xl font-bold text-black dark:text-white">
          {props.interval === "year"
            ? currencyFormatter.format(props.price.yearlyPrice / 100)
            : currencyFormatter.format(props.price.monthlyPrice / 100)}
          <span className="text-xs"> / month</span>
        </span>
      </motion.div>

      <Button
        className={cn(
          "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
          "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-2",
        )}
        variant={props.price.isMostPopular ? "default" : "secondary"}
        disabled={props.isLoading}
        onClick={() => void props.onSubscribeClick(props.price.id)}
      >
        <span className="absolute right-0 -mt-12 h-32 w-8 translate-x-12 rotate-12 transform-gpu bg-white opacity-10 transition-all duration-1000 ease-out group-hover:-translate-x-96 dark:bg-black" />
        {(!props.isLoading ||
          (props.isLoading && props.id !== props.price.id)) && <p>Subscribe</p>}

        {props.isLoading && props.id === props.price.id && <p>Subscribing</p>}
        {props.isLoading && props.id === props.price.id && (
          <Loader className="mr-2 h-4 w-4 animate-spin" />
        )}
      </Button>

      <hr className="m-0 h-px w-full border-none bg-gradient-to-r from-neutral-200/0 via-neutral-500/30 to-neutral-200/0" />
      {props.price.features && props.price.features.length > 0 && (
        <ul className="flex flex-col gap-2 font-normal">
          {props.price.features.map((feature: any, index: any) => (
            <li
              key={index}
              className="flex items-center gap-3 text-sm font-medium text-black dark:text-white"
            >
              <Icons.Check
                className="shrink-0 rounded-full bg-secondary-foreground p-1"
                variant={"secondary"}
              />
              <span className="flex">{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
