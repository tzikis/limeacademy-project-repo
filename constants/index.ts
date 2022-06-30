
  export interface Networks {
    [key: number]: string;
  }
  export const walletConnectSupportedNetworks: Networks = {
    // Add your network rpc URL here
    1: "https://ethereumnode.defiterm.io",
    3: "https://ethereumnode.defiterm-dev.net"
  };

  // Network chain ids
  export const supportedMetamaskNetworks = [1, 3, 4, 5, 42];

  export const TOKEN_BRIDGE_ADDRESSES = {
    3: {network: "Ropsten", id:3, address:"0x5155bE53a3144BAf6D2D8a3123Ac1914d5FDF76F"},
    4: {network: "Rinkeby", id:4, address:"0x7686680Dd6Bd185D7B47913040CD440D217B53Dd"}
  };

