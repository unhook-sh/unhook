"use client";

import { BellIcon, FileTextIcon, InputIcon } from "@radix-ui/react-icons";

import { Icons } from "@acme/ui/icons";
import { cn } from "@acme/ui/lib/utils";
import { AnimatedList } from "@acme/ui/magicui/animated-list";
import { BentoCard, BentoGrid } from "@acme/ui/magicui/bento-grid";
import { Marquee } from "@acme/ui/magicui/marquee";
import { NumberTicker } from "@acme/ui/magicui/number-ticker";
import { WordFadeIn } from "@acme/ui/magicui/word-fade-in";

interface Item {
  name: string;
  description: string;
  icon: string;
  color: string;
  time: string;
}
let notifications = [
  {
    color: "#FF3D71",
    description: "Pass",
    icon: "💬",
    name: "Needs more traction",
    time: "5m ago",
  },
  {
    color: "#1E86FF",
    description: "Follow up in 6 months",
    icon: "📈",
    name: "Improve user acquisition",
    time: "2m ago",
  },
  {
    color: "#6C63FF",
    description: "First meeting",
    icon: "️💰",
    name: "Clarify revenue model",
    time: "1h ago",
  },
  {
    color: "#FF4500",
    description: "Interested",
    icon: "📊",
    name: "Strong market positioning",
    time: "2d ago",
  },
  {
    color: "#32CD32",
    description: "Follow up in 6 months",
    icon: "👥",
    name: "Expand the team",
    time: "1w ago",
  },
  {
    color: "#4682B4",
    description: "Partner meeting",
    icon: "📄",
    name: "Refine business plan",
    time: "2w ago",
  },
];

notifications = Array.from({ length: 10 }, () => notifications).flat();

const Notification = ({ name, description, icon, color, time }: Item) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center whitespace-pre text-lg font-medium dark:text-white">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="text-sm font-normal dark:text-white/60">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

function AnimatedListDemo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-[400px] w-full flex-col overflow-hidden p-6",
        className,
      )}
    >
      <AnimatedList delay={2000}>
        {notifications.map((item, index) => (
          <Notification {...item} key={index} />
        ))}
      </AnimatedList>
    </div>
  );
}

const files = [
  {
    body: "Comprehensive overview of the company's business model, market opportunity, product, and financial projections.",
    name: "pitch-deck.pdf",
  },
  {
    body: "Detailed financial statements including income statements, balance sheets, and cash flow statements.",
    name: "financial.xlsx",
  },
  {
    body: "Overview of the management team, including bios and relevant experience.",
    name: "team-bios.pdf",
  },
  {
    body: "Detailed business plan outlining the company's strategy, market analysis, and operational plan.",
    name: "business-plan.pdf",
  },
  {
    body: "Cap table outlining the company's equity ownership, including founders, investors, and options pool.",
    name: "cap-table.xlsx",
  },
  {
    body: "Legal documents including incorporation papers, shareholder agreements, and intellectual property filings.",
    name: "legal.pdf",
  },
  {
    body: "Customer contracts, partnership agreements, and any other relevant agreements.",
    name: "contracts.pdf",
  },
  {
    body: "Marketing and sales strategies, including go-to-market plans and customer acquisition strategies.",
    name: "strategy.pdf",
  },
  {
    body: "Technical documentation detailing the product architecture, development roadmap, and technology stack.",
    name: "technical.pdf",
  },
  {
    body: "Market research reports and competitive analysis.",
    name: "market.pdf",
  },
];

const features = [
  {
    Icon: FileTextIcon,
    background: (
      <div>
        <Marquee
          pauseOnHover
          className="-delay-[200ms] [--duration:60s] [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)]"
        >
          {files.map((f, index) => (
            <figure
              key={index}
              className={cn(
                "relative w-32 cursor-pointer overflow-hidden rounded-xl border p-4",
                "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
                "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
                "transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none",
              )}
            >
              <div className="flex flex-row items-center gap-2">
                <div className="flex flex-col">
                  <figcaption className="text-sm font-medium dark:text-white">
                    {f.name}
                  </figcaption>
                </div>
              </div>
              <blockquote className="mt-2 text-xs">{f.body}</blockquote>
            </figure>
          ))}
        </Marquee>
        <Marquee
          pauseOnHover
          reverse
          className="-delay-[200ms] absolute top-36 [--duration:70s] [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)]"
        >
          {files.map((f, index) => (
            <figure
              key={index}
              className={cn(
                "relative w-32 cursor-pointer overflow-hidden rounded-xl border p-4",
                "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
                "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
                "transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none",
              )}
            >
              <div className="flex flex-row items-center gap-2">
                <div className="flex flex-col">
                  <figcaption className="overflow-ellipsis text-sm font-medium dark:text-white">
                    {f.name}
                  </figcaption>
                </div>
              </div>
              <blockquote className="mt-2 text-xs">
                {f.body.slice(0, 100)}
              </blockquote>
            </figure>
          ))}
        </Marquee>
      </div>
    ),
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
    cta: "Learn more",
    description:
      "We automatically create a data room to communicate with your investors.",
    href: "/",
    name: "Secure and sharable Data Rooms",
  },
  {
    Icon: InputIcon,
    background: (
      <div className="transform-gpu overflow-hidden blur-[1px] transition-all duration-300 ease-out hover:blur-none">
        <WordFadeIn
          words="Based on your pitch deck, I recommend focusing on your market analysis to highlight the growth potential. Additionally, clarifying your unique value proposition will make your pitch more compelling to investors."
          className="p-4 text-left text-base font-normal md:text-base"
        />
      </div>
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
    cta: "Learn more",
    description: "Chat with our AI to get insights on raising your next round.",
    href: "/",
    name: "Real-time feedback with AI Chat",
  },
  {
    Icon: Icons.ChartNoAxesColumn,
    background: (
      <div className="absolute right-8 top-8 flex transform-gpu items-baseline gap-1 overflow-hidden blur-[1px] transition-all duration-300 ease-out hover:blur-none">
        <div className="mr-4">Market Size</div>
        <NumberTicker value={8} className="text-4xl" /> <span>/</span>{" "}
        <span>10</span>
      </div>
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
    cta: "Learn more",
    description: "Get investor evaluations of your pitch deck.",
    href: "/",
    name: "AI Pitch Deck Evaluation",
  },
  {
    Icon: BellIcon,
    background: (
      <AnimatedListDemo className="absolute right-0 top-0 origin-top transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105" />
    ),
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
    cta: "Learn more",
    description:
      "Get notified when an investor comments or shares your data room.",
    href: "/",
    name: "Real Feedback from Investors",
  },
  {
    Icon: Icons.Sparkles,
    background: (
      <></>
      // <Calendar
      //   mode="single"
      //   selected={new Date(2022, 4, 11, 0, 0, 0)}
      //   className="absolute right-0 top-10 origin-top rounded-md border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105"
      // />
    ),
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",

    cta: "Learn more",
    description: "Use AI to match with investors based on your pitch deck.",
    href: "/",
    name: "Investor Matchmaking",
  },
];

export function BentoFeaturesSection() {
  return (
    <section
      id="bento-features"
      className="mx-auto flex max-w-screen-xl flex-col gap-8 px-4 md:px-8"
    >
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-5xl font-bold tracking-tight text-black dark:text-white sm:text-6xl">
          Secure your next round
        </h2>

        <p className="mt-6 text-xl leading-8 text-black/80 dark:text-white">
          Let our AI do the fundraising for you
        </p>
      </div>
      <BentoGrid className="gap-8 lg:grid-rows-3">
        {features.map((feature) => (
          <BentoCard key={feature.name} {...feature} />
        ))}
      </BentoGrid>
    </section>
  );
}
