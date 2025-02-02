import Link from 'next/link'

export function SiteBanner() {
  return (
    <div className="relative top-0 bg-primary py-3 text-background md:py-0">
      <div className="container flex flex-col items-center justify-center gap-4 md:h-12 md:flex-row">
        <Link
          href="https://www.producthunt.com/posts/chat-collect?utm_source=banner-featured&utm_medium=banner&utm_souce=banner-chat&#0045;collect"
          target="_blank"
          className="text-muted-background flex gap-2 text-center text-sm leading-loose"
        >
          ✨<span className="font-bold"> We&apos;re live on ProductHunt!</span>
          <span className="hidden md:block">
            - Come check us out and leave a review!
          </span>
          ✨
        </Link>
      </div>
      <hr className="absolute bottom-0 m-0 h-px w-full bg-neutral-200/30" />
    </div>
  )
}
