import { formatDate } from '@unhook/ui/lib/format-date';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getPost } from '~/app/(marketing)/_lib/blog';
import { siteConfig } from '~/app/(marketing)/_lib/config';
import Author from '../../_components/blog-author';
import { CTASection } from '../../_components/sections/cta-section';

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}): Promise<Metadata | undefined> {
  const { slug } = await params;
  const post = await getPost(slug);
  const {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      url: `${siteConfig.url}/blog/${post.slug}`,
      images: [
        {
          url: image,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function Blog({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    notFound();
  }

  return (
    <section id="blog">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${siteConfig.url}${post.metadata.image}`
              : `${siteConfig.url}/blog/${post.slug}/opengraph-image`,
            url: `${siteConfig.url}/blog/${post.slug}`,
            author: {
              '@type': 'Person',
              name: siteConfig.name,
            },
          }),
        }}
      />
      <div className="mx-auto w-full max-w-[800px] px-4 sm:px-6 lg:px-8 space-y-4 my-12">
        <Suspense
          fallback={
            <div className="mb-8 w-full h-64 bg-gray-200 animate-pulse rounded-lg" />
          }
        >
          {post.metadata.image && (
            <div className="mb-8">
              <Image
                width={1920}
                height={1080}
                src={post.metadata.image}
                alt={post.metadata.title}
                className="w-full h-auto rounded-lg border shadow-md"
              />
            </div>
          )}
        </Suspense>
        <div className="flex flex-col">
          <h1 className="title font-medium text-3xl tracking-tighter">
            {post.metadata.title}
          </h1>
        </div>
        <div className="flex justify-between items-center text-sm">
          <Suspense fallback={<p className="h-5" />}>
            <div className="flex items-center space-x-2">
              <time
                dateTime={post.metadata.publishedAt}
                className="text-sm text-gray-500"
              >
                {formatDate(post.metadata.publishedAt)}
              </time>
            </div>
          </Suspense>
        </div>
        <div className="flex items-center space-x-2">
          <Author
            twitterUsername={post.metadata.author}
            name={post.metadata.author}
            image={'/author.jpg'}
          />
        </div>
        <article
          className="prose prose-lg dark:prose-invert mx-auto max-w-full prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-lg prose-img:border prose-img:shadow-md"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
          dangerouslySetInnerHTML={{ __html: post.source }}
        />
      </div>
      <CTASection />
    </section>
  );
}
