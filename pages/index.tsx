import { useWeb3React } from "@web3-react/core";
import Head from "next/head";
import Link from "next/link";
import Account from "../components/Account";
import NativeCurrencyBalance from "../components/NativeCurrencyBalance";
import TokenBalance from "../components/TokenBalance";
import USLibrary from "../components/TokenBridge";
import { ALBT_TOKEN_ADDRESS, US_ELECTION_ADDRESS } from "../constants";
import useEagerConnect from "../hooks/useEagerConnect";
import { useEffect, useState } from "react";

import { isAddress } from "@ethersproject/address";
import useTokenContract from "../hooks/useTokenContract";



import ERC20_ABI from "../contracts/ERC20.json";
import type { ERC20 } from "../contracts/types";
import { Contract } from "@ethersproject/contracts";
// import { useWeb3React } from "@web3-react/core";
import { useMemo } from "react";

function Home() {
  const { library, account, chainId } = useWeb3React();

  const triedToEagerConnect = useEagerConnect();

  const isConnected = typeof account === "string" && !!library;

  const [tokensList, setTokensList] = useState<String[]>([]);
  const [tokenNamesList, setTokenNamesList] = useState<String[]>([]);
  const [tokenSymbolsList, setTokenSymbolsList] = useState<String[]>([]);
  const [tokenBalancesList, setTokenBalancesList] = useState<String[]>([]);

  const [newTokenAddress, setNewTokenAddress] = useState<string>('');

  const [tokenAdditionStatus, setTokenAdditionStatus] = useState<number>(0);
  const [tokenAdditionMessage, setTokenAdditionMessage] = useState<string>('');

  const setInformUser = (newStatus, newStatusMessage) => {
    setTokenAdditionStatus(newStatus);
    setTokenAdditionMessage(newStatusMessage);
  }

  const tokenAddressInput = (input) => {
    setNewTokenAddress(input.target.value)
  }

  const addNewTokenAddress = async () => {

    if (!newTokenAddress || newTokenAddress.trim().length == 0)
    {
      setInformUser(0, "Please enter a token address.");
      return;
    }

    const stringExists = searchStringInArray(newTokenAddress, tokensList);
    if (stringExists != -1)
    {
      setInformUser(0, "Token address already exists.");
      return;
    }

    setInformUser(1, "Adding contract address. Please wait.");

    if (!isAddress(newTokenAddress)){
      setInformUser(0, "Sorry, this is not a valid contract address.");
      return;
    }

    const contractObj = getTokenContract(newTokenAddress);
    if(contractObj == null){
      setInformUser(0, "Contract with token address doesn't seem to exist.");
      return;
    }

    const tokenInfo = await getTokenInfo(contractObj);
    if(tokenInfo == null){
      setInformUser(0, "Sorry, we couldn't get ERC20 Token info from the contract. Are you sure it's a valid ERC20 token?");
      return;
    }

    console.log("Token " + tokenInfo.tokenName + " - " + tokenInfo.tokenSymbol + " found. Account Balance: " + tokenInfo.tokenUserBalance);

    updateTokensLists(newTokenAddress, tokenInfo.tokenName, tokenInfo.tokenSymbol, tokenInfo.tokenUserBalance);
    setInformUser(0, "");
  };

  const getTokenContract = (contractAddress) => {
    let newContract;
    if (!contractAddress || !ERC20_ABI || !library || !chainId) {
      return null;
    }

    try {
      newContract = new Contract(contractAddress, ERC20_ABI, library.getSigner(account));
      return newContract;
    } catch (error) {
      console.error("Failed To Get Contract", error);

      return null;
    }

  }

  const getTokenInfo = async (contractObject) => {
    let tokenName;
    let tokenSymbol;
    let tokenUserBalance;
    try{
      tokenName = await contractObject.name();
      tokenSymbol = await contractObject.symbol();
      tokenUserBalance = await contractObject.balanceOf(account);  
    }
    catch (error) {
      console.log(error);
      console.error(error);
      return null;
    }

    return {tokenName: tokenName, tokenSymbol: tokenSymbol, tokenUserBalance: tokenUserBalance};
  }

  const getTokenBalance = async (contractObject) => {
    let tokenUserBalance;
    try{
      tokenUserBalance = await contractObject.balanceOf(account);  
    }
    catch (error) {
      console.log(error);
      console.error(error);
      return null;
    }

    return tokenUserBalance;
  }

  const searchStringInArray = (str, strArray) => {
    for (var j = 0; j < strArray.length; j++) {
      if (strArray[j].match(str)) return j;
    }
    return -1;
  }

  const updateTokensLists = (newTokenAddress, newTokenName, newTokenSymbol, newTokenBalance) => {

    // const newTokenAddressList = tokensList;
    const newTokenAddressList = JSON.parse(JSON.stringify(tokensList)); // this will copy everything from original 
    newTokenAddressList.push(newTokenAddress);

    const newTokenNamesList = JSON.parse(JSON.stringify(tokenNamesList)); // this will copy everything from original 
    newTokenNamesList.push(newTokenName);

    const newTokenSymbolsList = JSON.parse(JSON.stringify(tokenSymbolsList)); // this will copy everything from original 
    newTokenSymbolsList.push(newTokenSymbol);

    const newTokenBalancesList = JSON.parse(JSON.stringify(tokenBalancesList)); // this will copy everything from original 
    newTokenBalancesList.push(newTokenBalance.toString());

    setTokensList(newTokenAddressList);
    setTokenNamesList(newTokenNamesList);
    setTokenSymbolsList(newTokenSymbolsList);
    setTokenBalancesList(newTokenBalancesList);

    localStorage.setItem('myTokenAddresses', JSON.stringify(newTokenAddressList));
    localStorage.setItem('myTokenNames', JSON.stringify(newTokenNamesList));
    localStorage.setItem('myTokenSymbols', JSON.stringify(newTokenSymbolsList));
    localStorage.setItem('myTokenBalances', JSON.stringify(newTokenBalancesList));
  }

  const getPreviousTokensList = async () => {
    setInformUser(1, "Loading previous token list. Please Wait.");

    const tokenAddresssesStorageVal = localStorage.getItem('myTokenAddresses');
    const tokenNamesStorageVal = localStorage.getItem('myTokenNames');
    const tokenSymbolsStorageVal = localStorage.getItem('myTokenSymbols');
    const tokenBalancesStorageVal = localStorage.getItem('myTokenBalances');

    // If they are all null, we haven't saved anything, so we just move on.
    if (tokenNamesStorageVal == null && tokenNamesStorageVal == null && tokenSymbolsStorageVal == null && tokenBalancesStorageVal == null){
      setInformUser(0, "");
      return;
    }

    // Otherwise there was an error, so let's clear the previous results and start over
    if (tokenNamesStorageVal == null || tokenNamesStorageVal == null || tokenSymbolsStorageVal == null || tokenBalancesStorageVal == null){
      setInformUser(0, "Something went wrong. Could not fetch previous tokens.");
      localStorage.clear();
      return;
    }

    const previousTokenAddressList = JSON.parse(tokenAddresssesStorageVal);
    setTokensList(previousTokenAddressList);

    const previousTokenNamesList = JSON.parse(tokenNamesStorageVal);
    setTokenNamesList(previousTokenNamesList);

    const previousTokenSymbolsList = JSON.parse(tokenSymbolsStorageVal);
    setTokenSymbolsList(previousTokenSymbolsList);

    const previousTokenBalancesList = JSON.parse(tokenBalancesStorageVal);

    // updateTokenBalances();
    // This doesn't seem to work because we're still at page load? Contract object or sth like that maybe doesn't exist yet?
    // Figure out how to do it
    for (var j = 0; j < previousTokenAddressList.length; j++) {
      const newBalance = await fetchNewTokenBalance(previousTokenAddressList[j]);
      if(newBalance != null)
        previousTokenBalancesList[j] = newBalance.toString();
    }

    setTokenBalancesList(previousTokenBalancesList);

    setInformUser(0, "");
  }

  const updateTokenBalances = async() => {
    setInformUser(1, "Fetching new token balances.");
    const newTokenBalances = JSON.parse(JSON.stringify(tokenBalancesList)); // this will copy everything from original 

    for (var j = 0; j < tokensList.length; j++) {
      const newBalance = await fetchNewTokenBalance(tokensList[j]);
      if(newBalance != null)
        newTokenBalances[j] = newBalance.toString();
    }

    setTokenBalancesList(newTokenBalances);
    localStorage.setItem('myTokenBalances', JSON.stringify(newTokenBalances));
    setInformUser(0, "");
  }

  const fetchNewTokenBalance = async (address) => {
    const contractObj = getTokenContract(address);
    if(contractObj == null){
      console.log("Contract with token address " + address + " doesn't seem to exist.");
      return null;
    }

    const tokenBalance = await getTokenBalance(contractObj);
    if(tokenBalance == null){
      console.log("We couldn't get ERC20 token balance");
      return null;
    }

    // console.log("Token Balance: " + tokenBalance);
    return tokenBalance;
  };

  useEffect(() => {
    getPreviousTokensList();
  }, [])

  return (
    <div>
      <Head>
        <title>LimeAcademy-boilerplate</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <nav>
          <Link href="/">
            <a>LimeAcademy-boilerplate</a>
          </Link>

          <Account triedToEagerConnect={triedToEagerConnect} />
        </nav>
      </header>

      <main>
        <h1>
          Welcome to{" "}
          <a href="https://github.com/LimeChain/next-web3-boilerplate">
            LimeAcademy-boilerplate
          </a>
        </h1>

        {isConnected && (
          <section>
            <NativeCurrencyBalance />
            <form onSubmit={(e) => { e.preventDefault(); return false; }}>
              <h3>Add More ERC20 Tokens</h3>
              <label>
                Tokens Addess:
                <input onChange={tokenAddressInput} value={newTokenAddress} type="text" name="state" disabled={tokenAdditionStatus?true:false} />
              </label>
              <button onClick={addNewTokenAddress} disabled={tokenAdditionStatus?true:false}>Add Token</button>
            </form>

            <h3>Tokens List</h3>
            <li>
              {tokensList.map((element, index) => (
                <ul key={index}> {element} - {tokenNamesList[index]} - {tokenSymbolsList[index]} - {tokenBalancesList[index]}</ul>
              ))}
            </li>
            <button onClick={updateTokenBalances} disabled={tokenAdditionStatus?true:false}>Update Balances</button>
            <p>{tokenAdditionMessage}</p>
            {tokenAdditionStatus?<div className="lds-dual-ring"></div>:null}


            {/* <TokenBalance tokenAddress={ALBT_TOKEN_ADDRESS} symbol="ALBT" /> */}
            <USLibrary contractAddress={US_ELECTION_ADDRESS} />
          </section>
        )}
      </main>

      <style jsx>{`
        nav {
          display: flex;
          justify-content: space-between;
        }

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
