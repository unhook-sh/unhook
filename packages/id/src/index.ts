import { init } from '@paralleldrive/cuid2';
import { ulid } from 'ulid';
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from 'unique-names-generator';

export function createId(props?: {
  prefix?: string;
  prefixSeparator?: string;
  length?: number;
  ulid?: boolean;
}) {
  let id: string;

  if (props?.ulid) {
    id = ulid();
  } else {
    const createIdFromInit = init({
      length: props?.length,
    });

    id = createIdFromInit();
  }

  if (props?.prefix) {
    const prefixSeparator = props.prefixSeparator ?? '_';
    id = `${props.prefix}${prefixSeparator}${id}`;
  }

  return id;
}

export const generateRandomSlug = ({ length }: { length: number }): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let index = 0; index < length; index++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateRandomName = (): string => {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors],
    length: 3,
    seed: Date.now(),
    separator: '-',
    style: 'lowerCase',
  });
};
