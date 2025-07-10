import { OrbitingCircles } from '@unhook/ui/magicui/orbiting-circle';
import { Icons } from '~/app/(marketing)/_components/icons';

export function SecondBentoAnimation() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-background to-transparent z-20" />
      <div className="pointer-events-none absolute top-0 left-0 h-20 w-full bg-gradient-to-b from-background to-transparent z-20" />

      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 size-16 bg-secondary p-2 rounded-full z-30 md:bottom-0 md:top-auto">
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
            <Icons.boat />
            <Icons.supabase />
            <Icons.figma />
          </OrbitingCircles>

          <OrbitingCircles iconSize={60} index={1} speed={0.5}>
            <Icons.workos />
            <Icons.runwayml />
            <Icons.gemini />
          </OrbitingCircles>

          <OrbitingCircles
            iconSize={60}
            index={2}
            radius={230}
            reverse
            speed={0.5}
          >
            <Icons.vercel />
            <Icons.replit />
            <Icons.posthog />
          </OrbitingCircles>
        </div>
      </div>
    </div>
  );
}
