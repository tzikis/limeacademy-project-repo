import TOKEN_BRIDGE_ABI from "../contracts/TokenBridge.json";
import type { TokenBridge } from "../contracts/types";
import useContract from "./useContract";

export default function useTokenBridgeContract(contractAddress?: string) {
  return useContract<TokenBridge>(contractAddress, TOKEN_BRIDGE_ABI);
}
