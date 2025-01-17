import { useWeb3React } from "@web3-react/core";
import { UserRejectedRequestError } from "@web3-react/injected-connector";
import { useEffect, useState } from "react";
import { injected, walletConnect } from "../connectors";
import useENSName from "../hooks/useENSName";
import useMetaMaskOnboarding from "../hooks/useMetaMaskOnboarding";
import { formatEtherscanLink, shortenHex } from "../util";

import { TOKEN_BRIDGE_ADDRESSES } from "../constants";

import NativeCurrencyBalance from "../components/NativeCurrencyBalance";

type AccountProps = {
  triedToEagerConnect: boolean;
};

const Account = ({ triedToEagerConnect }: AccountProps) => {
  const { active, error, activate, deactivate, chainId, account, setError } =
    useWeb3React();

  const {
    isMetaMaskInstalled,
    isWeb3Available,
    startOnboarding,
    stopOnboarding,
  } = useMetaMaskOnboarding();

  // manage connecting state for injected connector
  const [connecting, setConnecting] = useState(false);
  useEffect(() => {
    if (active || error) {
      setConnecting(false);
      stopOnboarding();
    }
  }, [active, error, stopOnboarding]);

  const ENSName = useENSName(account);

  if (error) {
    return null;
  }

  if (!triedToEagerConnect) {
    return null;
  }

  if (typeof account !== "string") {
    return (
      <div>
        {isWeb3Available ? (
          <button
            disabled={connecting}
            onClick={() => {
              setConnecting(true);

              activate(injected, undefined, true).catch((error) => {
                // ignore the error if it's a user rejected request
                if (error instanceof UserRejectedRequestError) {
                  setConnecting(false);
                } else {
                  setError(error);
                }
              });
            }}
          className="btn btn-primary"
          >
            {isMetaMaskInstalled ? "Connect to MetaMask" : "Connect to Wallet"}
          </button>
          
        ) : (
          <button onClick={startOnboarding} className="btn btn-primary">Install Metamask</button>
        )}
        {" "}
        {(<button
            disabled={connecting}
            onClick={async () => {
              try {
                await activate(walletConnect(), undefined, true)
              } catch (e) {
                if (error instanceof UserRejectedRequestError) {
                  setConnecting(false);
                } else {
                  setError(error);
                }
              }
            }}
            className="btn btn-secondary"
            >
            Wallet Connect
          </button>)
        }
      </div>
    );
  }

  return (
    <>
    <span>
    Network:{" "}
    {TOKEN_BRIDGE_ADDRESSES[chainId]["network"] + " (#" + chainId + ")"}
    {" "} -  Address: {" "}
        <a
      {...{
        href: formatEtherscanLink("Account", [chainId, account]),
        target: "_blank",
        rel: "noopener noreferrer",
      }}
    >
      {ENSName || account}
    </a>{" "}
    <button className="btn btn-outline-secondary badge text-dark" onClick={() => {navigator.clipboard.writeText(ENSName || account)}}>
      <i className="bi bi-clipboard"></i>
    </button>
    {" "} - Balance: {" "}
    <NativeCurrencyBalance />
    </span>
    <button
          onClick={async () => {
            try {
              await deactivate()
            } catch (e) { 
              setError(error);
            }
          }}
          className="btn btn-warning"
          >
          Disconnect
        </button>
    </>
   
    
  );
};

export default Account;