import { MetricLink } from '@unhook/analytics/components';
import { formatDate } from '@unhook/ui/lib/format-date';
import Image from 'next/image';
import type { Post } from '../_lib/blog';

export default function BlogCard({
  data,
  priority,
}: {
  data: Post;
  priority?: boolean;
}) {
  return (
    <MetricLink
      className="block"
      href={`/blog/${data.slug}`}
      metric="blog_card_clicked"
      properties={{
        location: 'blog_card',
      }}
    >
      <div className="bg-background rounded-lg p-4 mb-4 border hover:shadow-sm transition-shadow duration-200">
        {data.image && (
          <Image
            alt={data.title}
            className="rounded-t-lg object-cover border"
            height={630}
            priority={priority}
            src={data.image}
            width={1200}
          />
        )}
        {!data.image && <div className="bg-gray-200 h-[180px] mb-4 rounded" />}
        <p className="mb-2">
          <time
            className="text-sm text-muted-foreground"
            dateTime={data.publishedAt}
          >
            {formatDate(data.publishedAt)}
          </time>
        </p>
        <h3 className="text-xl font-semibold mb-2">{data.title}</h3>
        <p className="text-foreground mb-4">{data.summary}</p>
      </div>
    </MetricLink>
  );
}
