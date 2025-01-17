import { useWeb3React } from "@web3-react/core";
import Head from "next/head";
import Account from "../components/Account";
import TokenManager from "../components/TokenManager";
import TokenBridgeComponent from "../components/TokenBridge";
import TokenBridgeValidatorComponent from "../components/TokenBridgeValidator";
import { TOKEN_BRIDGE_ADDRESSES } from "../constants";
import useEagerConnect from "../hooks/useEagerConnect";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

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
        <nav className="navbar navbar-light bg-light" style={{ padding: ".5rem" }}>
          <a className="navbar-brand" href="#">
            <img src="/LimeTzikis Logo.png" width="30" height="30" className="d-inline-block align-top" alt="logo" />
            {" "}Tzikis Token Bridge
          </a>
          <Account triedToEagerConnect={triedToEagerConnect} />
        </nav>
      </header>

      <main>
        <div className="container">
          <br />
          <br />
          <br />
          <h1>
            Welcome to Tzikis Token Bridge
          </h1>
          {isConnected && (
            <section>
              <TokenManager contractAddress={TOKEN_BRIDGE_ADDRESSES[chainId]["address"]} />
              <TokenBridgeComponent contractAddress={TOKEN_BRIDGE_ADDRESSES[chainId]["address"]} />
              <TokenBridgeValidatorComponent contractAddress={TOKEN_BRIDGE_ADDRESSES[chainId]["address"]} />
            </section>
          )}
          {!isConnected &&
            <section>
              <br />
              <br />
              <img src="https://cache.desktopnexus.com/thumbseg/1386/1386854-bigthumbnail.jpg" />
            </section>
          }
        </div>
      </main>

      <style jsx>{`
        main {
          text-align: center;
        } 
      `}</style>
    </div>
  );
}

export default Home;
