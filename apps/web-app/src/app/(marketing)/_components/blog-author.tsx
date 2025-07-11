import { formatDate } from '@unhook/ui/lib/format-date';
import Image from 'next/image';
import Link from 'next/link';

export default function Author({
  name,
  image,
  twitterUsername,
  updatedAt,
  imageOnly,
}: {
  name: string;
  image: string;
  twitterUsername: string;
  updatedAt?: string;
  imageOnly?: boolean;
}) {
  if (imageOnly) {
    return (
      <Image
        alt={name}
        className="rounded-full transition-all group-hover:brightness-90"
        height={36}
        src={image}
        width={36}
      />
    );
  }

  if (updatedAt) {
    return (
      <div className="flex items-center space-x-3">
        <Image
          alt={name}
          className="rounded-full"
          height={36}
          src={image}
          width={36}
        />
        <div className="flex flex-col">
          <p className="text-sm text-gray-500">Written by {name}</p>
          <time
            className="text-sm font-light text-gray-400"
            dateTime={updatedAt}
          >
            Last updated {formatDate(updatedAt)}
          </time>
        </div>
      </div>
    );
  }

  return (
    <Link
      className="group flex items-center space-x-3"
      href={`https://twitter.com/${twitterUsername}`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Image
        alt={name}
        className="rounded-full transition-all group-hover:brightness-90"
        height={40}
        src={image}
        width={40}
      />
      <div className="flex flex-col">
        <p className="font-semibold text-gray-700">{name}</p>
        <p className="text-sm text-gray-500">@{twitterUsername}</p>
      </div>
    </Link>
  );
}
