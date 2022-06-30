
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
    3: {network: "Ropsten", id:3, address:"0x1b249c6bE4c10D101B83404719456fA483a749e2"},
    4: {network: "Rinkeby", id:4, address:"0x282Bb35b81f431eFF387d4B20B0966D67B69a7fa"}
  };

