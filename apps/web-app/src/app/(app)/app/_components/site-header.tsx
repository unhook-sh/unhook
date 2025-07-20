import { Separator } from '@unhook/ui/separator';
import { SidebarTrigger } from '@unhook/ui/sidebar';

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          className="mx-2 data-[orientation=vertical]:h-4"
          orientation="vertical"
        />
        {/* <h1 className="text-base font-medium">Documents</h1> */}
        {/* <div className="ml-auto flex items-center gap-2">
          <Button asChild className="hidden sm:flex" size="sm" variant="ghost">
            <a
              className="dark:text-foreground"
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </Button>
        </div> */}
      </div>
    </header>
  );
}
