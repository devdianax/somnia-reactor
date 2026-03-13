/**
 * Scanner for staking contracts on Somnia Testnet using Viem
 */

import { createPublicClient, http, defineChain } from 'viem'

const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: { decimals: 18, name: 'Somnia Testnet Token', symbol: 'STT' },
  rpcUrls: { default: { http: [process.env.VITE_SOMNIA_TESTNET_RPC_URL || 'https://dream-rpc.somnia.network'] } },
  blockExplorers: { default: { name: 'Somnia Explorer', url: 'https://shannon-explorer.somnia.network' } },
  testnet: true,
})

const RPC_URL = process.env.VITE_SOMNIA_TESTNET_RPC_URL || 'https://dream-rpc.somnia.network'
const publicClient = createPublicClient({ chain: somniaTestnet, transport: http(RPC_URL) })

// Staking function selectors
const STAKING_FUNCTIONS: Record<string, string> = {
  '0x6945b123': 'stake(uint256)',
  '0xa694fc3a': 'stake()',
  '0xd0e30db0': 'deposit()',
  '0x47e7ef24': 'deposit(uint256)',
  '0x379607f5': 'claim()',
  '0x4e71d92d': 'claimRewards()',
  '0x3d18b912': 'withdrawRewards()',
}

// List of known deployed contracts to scan
const KNOWN_CONTRACTS = [
  { address: '0x575109e921C6d6a1Cb7cA60Be0191B10950AfA6C', name: 'Example Staking Contract' },
  // Add more addresses here
]

async function getBytecode(address: string): Promise<string | null> {
  try {
    const code = await publicClient.getBytecode({ address: address as `0x${string}` })
    return code && code !== '0x' ? code : null
  } catch {
    return null
  }
}

async function detectFunctionSigs(bytecode: string): Promise<string[]> {
  const found: string[] = []
  for (const [sig, name] of Object.entries(STAKING_FUNCTIONS)) {
    if (bytecode.includes(sig.slice(2))) found.push(name)
  }
  return found
}

async function scanContracts() {
  console.log('🔍 Scanning known contracts for staking functions...\n')

  for (const c of KNOWN_CONTRACTS) {
    console.log(`Checking ${c.address} (${c.name})...`)
    const code = await getBytecode(c.address)
    if (!code) {
      console.log(`  ❌ No contract code found`)
      continue
    }
    const funcs = await detectFunctionSigs(code)
    if (funcs.length > 0) {
      console.log(`  ✅ Found staking functions: ${funcs.join(', ')}\n`)
    } else {
      console.log(`  ⚠️  No staking functions detected\n`)
    }
  }

  console.log('✨ Scan complete!')
}

scanContracts().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
