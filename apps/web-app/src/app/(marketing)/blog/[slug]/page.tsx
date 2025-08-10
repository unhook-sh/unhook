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
    description,
    openGraph: {
      description,
      images: [
        {
          url: image,
        },
      ],
      publishedTime,
      title,
      type: 'article',
      url: `${siteConfig.url}/blog/${post.slug}`,
    },
    title,
    twitter: {
      card: 'summary_large_image',
      description,
      images: [image],
      title,
    },
  };
}

async function getBlogPost(slug: string) {
  const post = await getPost(slug);
  if (!post) {
    notFound();
  }
  return post;
}

async function BlogContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  return (
    <section id="blog">
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: we're using a trusted source
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            author: {
              '@type': 'Person',
              name: siteConfig.name,
            },
            dateModified: post.metadata.publishedAt,
            datePublished: post.metadata.publishedAt,
            description: post.metadata.summary,
            headline: post.metadata.title,
            image: post.metadata.image
              ? `${siteConfig.url}${post.metadata.image}`
              : `${siteConfig.url}/blog/${post.slug}/opengraph-image`,
            url: `${siteConfig.url}/blog/${post.slug}`,
          }),
        }}
        suppressHydrationWarning
        type="application/ld+json"
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
                alt={post.metadata.title}
                className="w-full h-auto rounded-lg border shadow-md"
                height={1080}
                src={post.metadata.image}
                width={1920}
              />
            </div>
          )}
        </Suspense>
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3" />
              <div className="h-4 bg-gray-200 animate-pulse rounded w-1/4" />
              <div className="prose prose-lg max-w-full">
                <div className="h-64 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
          }
        >
          <div className="flex flex-col">
            <h1 className="title font-medium text-3xl tracking-tighter">
              {post.metadata.title}
            </h1>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-2">
              <time
                className="text-sm text-gray-500"
                dateTime={post.metadata.publishedAt}
              >
                {formatDate(post.metadata.publishedAt)}
              </time>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Author
              image={'/author.jpg'}
              name={post.metadata.author}
              twitterUsername={post.metadata.author}
            />
          </div>
          <article
            className="prose prose-lg dark:prose-invert mx-auto max-w-full prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-lg prose-img:border prose-img:shadow-md"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: we're using a trusted source
            dangerouslySetInnerHTML={{ __html: post.source }}
          />
        </Suspense>
      </div>
      <CTASection />
    </section>
  );
}
export default async function Blog({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[800px] px-4 sm:px-6 lg:px-8 space-y-4 my-12">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3" />
            <div className="h-4 bg-gray-200 animate-pulse rounded w-1/4" />
            <div className="prose prose-lg max-w-full">
              <div className="h-64 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      }
    >
      <BlogContent params={params} />
    </Suspense>
  );
}
