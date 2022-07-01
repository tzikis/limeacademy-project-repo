import { useWeb3React } from "@web3-react/core";
import Head from "next/head";
import Link from "next/link";
import Account from "../components/Account";
import NativeCurrencyBalance from "../components/NativeCurrencyBalance";
import TokenManager from "../components/TokenManager";
import TokenBridgeComponent from "../components/TokenBridge";
import TokenBridgeValidatorComponent from "../components/TokenBridgeValidator";
import { TOKEN_BRIDGE_ADDRESSES } from "../constants";
import useEagerConnect from "../hooks/useEagerConnect";

import 'bootstrap/dist/css/bootstrap.min.css';

function Home() {
  const { library, account, chainId } = useWeb3React();

  const triedToEagerConnect = useEagerConnect();

  const isConnected = typeof account === "string" && !!library;

  // useEffect(() => {
  // }, [])

  return (
    <div>
      <Head>
        <title>Tzikis Token Bridge</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <nav className="navbar navbar-light bg-light" style={{padding:".5rem"}}>
          <a className="navbar-brand" href="#">
            <img src="https://getbootstrap.com/docs/4.0/assets/brand/bootstrap-solid.svg" width="30" height="30" className="d-inline-block align-top" alt="logo" />
            {" "}Tzikis Token Bridge
          </a>
          <Account triedToEagerConnect={triedToEagerConnect} />
        </nav>
      </header>

      <main>
        <h1>
          Welcome to Tzikis Token Bridge
        </h1>

        {isConnected && (
          <section>
            <div className="container">
              <NativeCurrencyBalance />
              <TokenManager />
              <TokenBridgeComponent contractAddress={TOKEN_BRIDGE_ADDRESSES[chainId]["address"]} />
              <TokenBridgeValidatorComponent contractAddress={TOKEN_BRIDGE_ADDRESSES[chainId]["address"]} />
            </div>
          </section>
        )}
      </main>

      <style jsx>{`
        main {
          text-align: center;
        }

        .lds-dual-ring {
          display: inline-block;
          width: 80px;
          height: 80px;
        }
        .lds-dual-ring:after {
          content: " ";
          display: block;
          width: 64px;
          height: 64px;
          margin: 8px;
          border-radius: 50%;
          border: 6px solid #000;
          border-color: #000 transparent #000 transparent;
          animation: lds-dual-ring 1.2s linear infinite;
        }
        @keyframes lds-dual-ring {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
 
      `}</style>
    </div>
  );
}

export default Home;
