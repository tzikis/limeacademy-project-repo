
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

  export const ALBT_TOKEN_ADDRESS = "0xc6869a93ef55e1d8ec8fdcda89c9d93616cf0a72";
  export const US_ELECTION_ADDRESS = "0xA09fF4F39FD8553051ABf0188100b7C5A6dc5452";


  export const TZK_TOKEN_ADDRESS = "0xD332B8CC2b5E7eB87f85FD86526244f4d576a978";
  export const TOKEN_BRIDGE_ADDRESS = "0x0Cbd2061153fE07f018B31de3E573581ff1Bf1B0";

  export const TOKEN_BRIDGE_NONNATIVE_ADDRESS = "0xC0596Ff8C20C36DD5a83D1B5aB184a8308Bb2Ccb";
