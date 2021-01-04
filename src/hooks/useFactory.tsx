import { useCallback, useMemo } from 'react'
import BigNumber from 'bignumber.js'
import { useConnectedWallet } from '../contexts/wallet'
import { useToast } from '@aragon/ui'

import { addresses, ZERO_ADDR } from '../constants/addresses'

import { useNotify } from './useNotify'

const abi = require('../constants/abis/factory.json')

export function useFactory() {
  const toast = useToast()

  const { networkId, user, web3 } = useConnectedWallet()
  const { notifyCallback } = useNotify()

  const factory = useMemo(() => {
    if (!web3) return null
    const address = addresses[networkId].factory
    return new web3.eth.Contract(abi, address)
  }, [networkId, web3])

  const createOToken = useCallback(
    async (
      underlying: string,
      strike: string,
      collateral: string,
      strikePrice: BigNumber,
      expiry: BigNumber,
      isPut: boolean,
    ) => {
      if (!factory) return toast('No wallet connected')
      await factory.methods
        .createOtoken(underlying, strike, collateral, strikePrice.toString(), expiry.toString(), isPut)
        .send({ from: user })
        .on('transactionHash', notifyCallback)
    },
    [factory, user, notifyCallback, toast],
  )

  const isCreated = useCallback(
    async (
      underlying: string,
      strike: string,
      collateral: string,
      strikePrice: BigNumber,
      expiry: BigNumber,
      isPut: boolean,
    ): Promise<boolean> => {
      if (!factory) return toast('No wallet connected')
      const deployedAddress = await factory.methods
        .getOtoken(underlying, strike, collateral, strikePrice.toString(), expiry.toString(), isPut)
        .call()

      return deployedAddress !== ZERO_ADDR
    },
    [toast, factory],
  )

  const getTargetOtokenAddress = useCallback(
    async (
      underlying: string,
      strike: string,
      collateral: string,
      strikePrice: BigNumber,
      expiry: BigNumber,
      isPut: boolean,
    ) => {
      if (!factory) return toast('No wallet connected')
      const targetAddress = await factory.methods
        .getTargetOtokenAddress(underlying, strike, collateral, strikePrice.toString(), expiry.toString(), isPut)
        .call()
      return targetAddress
    },
    [factory, toast],
  )

  return { createOToken, isCreated, getTargetOtokenAddress }
}