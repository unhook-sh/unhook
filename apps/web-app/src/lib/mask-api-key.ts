export const maskApiKey = (key: string) => {
  const prefixLength = 10;
  const postfixLength = 4;
  const fillLength = key.length - prefixLength - postfixLength;
  return `${key.slice(0, prefixLength)}${'*'.repeat(fillLength)}${key.slice(-postfixLength)}`;
};
