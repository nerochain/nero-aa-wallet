import { useSignature } from './useSignature'

export const useSimpleAccount = () => {
  const { loading, AAaddress, simpleAccountInstance } = useSignature()

  return {
    loading,
    AAaddress,
    simpleAccountInstance,
  }
}
