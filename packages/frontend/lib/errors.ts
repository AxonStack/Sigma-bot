/**
 * Simplifies technical error messages from blockchain providers (wagmi/viem/metamask)
 * into user-friendly strings.
 */
export function simplifyError(err: any): string {
  const message = err?.shortMessage || err?.message || (typeof err === 'string' ? err : 'Unknown error');
  
  if (
    message.includes('User rejected the request') || 
    message.includes('User denied transaction signature') ||
    err?.code === 4001
  ) {
    return 'Transaction was cancelled by the user.';
  }

  // Handle common RPC/Network errors
  if (message.includes('RPC endpoint returned too many errors') || message.includes('Requested resource not available')) {
    return 'The network is busy. Please try again in a moment or switch to a more reliable RPC.';
  }

  // Fallback to a cleaner version of the raw message
  return message;
}
