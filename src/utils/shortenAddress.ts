export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  const prefix = address.substring(0, chars + 2); // "0x" + first 4 characters
  const suffix = address.substring(address.length - chars);
  return `${prefix}...${suffix}`;
}
