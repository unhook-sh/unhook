import { Icons } from "@acme/ui/icons";

import {
  Hero,
  HeroCta,
  HeroImage,
  HeroSubTitle,
  HeroTitle,
} from "~/components/hero";

export default function Page() {
  return (
    <main className="mx-auto flex-1 overflow-hidden">
      <Hero>
        <HeroTitle>FeetRightNow.com is the new way to explore.</HeroTitle>
        <HeroSubTitle>
          Discover the best feet from around the world. Join the community
          today.
        </HeroSubTitle>
        <HeroCta>
          <span className="flex items-center gap-2">
            Get Started for free <Icons.ChevronRight size="sm" />
          </span>
        </HeroCta>
        <HeroImage src="/feet.jpeg" alt="feet" />
      </Hero>
    </main>
  );
}
