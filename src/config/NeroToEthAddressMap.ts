import daiIcon from '@/assets/tokens/dai.svg'
import usdcIcon from '@/assets/tokens/usdc.svg'
import usdtIcon from '@/assets/tokens/usdt.svg'
import jpycIcon from '@/assets/tokens/jpyc.png'

export const NeroToEthAddressMap: Record<string, { address: string; icon: string }> = {
  DAI: {
    address: '0x5d0E342cCD1aD86a16BfBa26f404486940DBE345',
    icon: daiIcon,
  },
  USDT: {
    address: '0x1dA998CfaA0C044d7205A17308B20C7de1bdCf74',
    icon: usdtIcon,
  },
  USDC: {
    address: '0xC86Fed58edF0981e927160C50ecB8a8B05B32fed',
    icon: usdcIcon,
  },
  JPYC: {
    address: '0x4279d665ee905c21ff55799ffbe1be3d4a3da024',
    icon: jpycIcon,
  },
}
