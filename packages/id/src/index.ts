import { init } from '@paralleldrive/cuid2';
import { ulid } from 'ulid';

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
