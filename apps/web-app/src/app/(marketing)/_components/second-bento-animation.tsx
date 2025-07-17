/** biome-ignore-all lint/performance/noImgElement: no need */
import { OrbitingCircles } from '@unhook/ui/magicui/orbiting-circle';
import { Icons } from '~/app/(marketing)/_components/icons';

function getBrandLogoUrl(domain: string) {
  return `https://cdn.brandfetch.io/${domain}/w/60/h/60?c=1idGJK6TyS2PPBb74bA`;
}

export function SecondBentoAnimation() {
  // Brand logo URLs using brandfetch.io

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-background to-transparent z-20" />
      <div className="pointer-events-none absolute top-0 left-0 h-20 w-full bg-gradient-to-b from-background to-transparent z-20" />

      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 size-16 bg-primary-foreground border border-primary/50 p-2 rounded-full z-30 md:bottom-0 md:top-auto">
        <Icons.logo className="fill-white size-10" />
      </div>
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        <div className="relative flex h-full w-full items-center justify-center translate-y-0 md:translate-y-32">
          <OrbitingCircles
            iconSize={60}
            index={0}
            radius={100}
            reverse
            speed={1}
          >
            <img
              alt="Boat logo"
              className="size-12 rounded-full"
              src={getBrandLogoUrl('stripe.com')}
            />
            <img
              alt="Supabase logo"
              className="size-12 rounded-full"
              src={getBrandLogoUrl('supabase.com')}
            />
            <img
              alt="Figma logo"
              className="size-12 rounded-full"
              src={getBrandLogoUrl('figma.com')}
            />
          </OrbitingCircles>

          <OrbitingCircles iconSize={60} index={1} speed={0.5}>
            <img
              alt="WorkOS logo"
              className="size-12 rounded-full"
              src={getBrandLogoUrl('workos.com')}
            />
            <img
              alt="RunwayML logo"
              className="size-12 rounded-full"
              src={getBrandLogoUrl('github.com')}
            />
            <img
              alt="Gemini logo"
              className="size-12 rounded-full"
              src={getBrandLogoUrl('discord.com')}
            />
          </OrbitingCircles>

          <OrbitingCircles
            iconSize={60}
            index={2}
            radius={230}
            reverse
            speed={0.5}
          >
            <img
              alt="Vercel logo"
              className="size-12 rounded-full"
              src={getBrandLogoUrl('vercel.com')}
            />
            <img
              alt="Replit logo"
              className="size-12 rounded-full"
              src={getBrandLogoUrl('replit.com')}
            />
            <img
              alt="Linear logo"
              className="size-12 rounded-full"
              src={getBrandLogoUrl('linear.app')}
            />
          </OrbitingCircles>
        </div>
      </div>
    </div>
  );
}
