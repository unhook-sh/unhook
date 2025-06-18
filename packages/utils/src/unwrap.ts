import dedent from 'dedent-js';

/**
 * Take the tagged string and remove indentation and word-wrapping.
 *
 * @package util
 */

export function unwrap(
  strings: TemplateStringsArray,
  ...expressions: unknown[]
): string {
  return dedent(strings, ...expressions);
}
