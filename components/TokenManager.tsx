import { useWeb3React } from "@web3-react/core";
import type { Web3Provider } from "@ethersproject/providers";

import { TOKEN_BRIDGE_ADDRESSES } from "../constants";
import { useEffect, useState } from "react";

import { isAddress } from "@ethersproject/address";

import ERC20_ABI from "../contracts/ERC20.json";
import { Contract } from "@ethersproject/contracts";

var tokenAddressesStorageKey;
var tokenNamesStorageKey;
var tokenSymbolsStorageKey;
var tokenBalancesStorageKey;
var tokenAllowancesStorageKey;

const TokenManager = () => {
    const { account, library, chainId } = useWeb3React<Web3Provider>();

    const [tokensList, setTokensList] = useState<String[]>([]);
    const [tokenNamesList, setTokenNamesList] = useState<String[]>([]);
    const [tokenSymbolsList, setTokenSymbolsList] = useState<String[]>([]);
    const [tokenBalancesList, setTokenBalancesList] = useState<String[]>([]);
    const [tokenAllowancesList, setTokenAllowancesList] = useState<String[]>([]);


    const [tokenManagerStatus, setTokenManagerStatus] = useState<number>(0);
    const [tokenManagerMessage, setTokenManagerMessage] = useState<string>('');

    const [tokenAddress, setTokenAddress] = useState<string>('');
    const [allowanceAmount, setAllowanceAmount] = useState<string>('');


    const [transactionPending, setTransactionPending] = useState<number>(0);
    const [txHash, setTxHash] = useState<string>('Unknown');
    useEffect(() => {
        console.log("Chain id: " + chainId + " and wallet address: " + account);

        tokenAddressesStorageKey = 'myTokenAddresses-' + chainId + "-" + account;
        tokenNamesStorageKey = 'myTokenNames-' + chainId + "-" + account;
        tokenSymbolsStorageKey = 'myTokenSymbols-' + chainId + "-" + account;
        tokenBalancesStorageKey = 'myTokenBalances-' + chainId + "-" + account;
        tokenAllowancesStorageKey = 'myTokenAllowances-' + chainId + "-" + account;
        getPreviousTokensList();
    }, [chainId, account])

    const setInformUser = (newStatus, newStatusMessage) => {
        setTransactionPending(0);
        setTokenManagerStatus(newStatus);
        setTokenManagerMessage(newStatusMessage);
    }

    const tokenAddressInput = (input) => {
        setTokenAddress(input.target.value)
    }

    const addNewTokenAddress = async () => {

        if (!tokenAddress || tokenAddress.trim().length == 0) {
            setInformUser(0, "Please enter a token address.");
            return;
        }

        const stringExists = searchStringInArray(tokenAddress, tokensList);
        if (stringExists != -1) {
            setInformUser(0, "Token address already exists.");
            return;
        }

        setInformUser(1, "Adding contract address. Please wait.");

        if (!isAddress(tokenAddress)) {
            setInformUser(0, "Sorry, this is not a valid contract address.");
            return;
        }

        const contractObj = getTokenContract(tokenAddress);
        if (contractObj == null) {
            setInformUser(0, "Contract with token address doesn't seem to exist.");
            return;
        }

        const tokenInfo = await getTokenInfo(contractObj);
        if (tokenInfo == null) {
            setInformUser(0, "Sorry, we couldn't get ERC20 Token info from the contract. Are you sure it's a valid ERC20 token?");
            return;
        }

        console.log("Token " + tokenInfo.tokenName + " - " + tokenInfo.tokenSymbol + " found. Account Balance: " + tokenInfo.tokenUserBalance + " Allowance: " + tokenInfo.tokenUserAllowance);

        updateTokensLists(tokenAddress, tokenInfo.tokenName, tokenInfo.tokenSymbol, tokenInfo.tokenUserBalance, tokenInfo.tokenUserAllowance);
        setInformUser(0, "Address Added.");
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
        let tokenUserAllowance;
        try {
            tokenName = await contractObject.name();
            tokenSymbol = await contractObject.symbol();
            tokenUserBalance = await contractObject.balanceOf(account);
            tokenUserAllowance = await contractObject.allowance(account, TOKEN_BRIDGE_ADDRESSES[chainId]["address"]);
        }
        catch (error) {
            console.log(error);
            console.error(error);
            return null;
        }

        return { tokenName: tokenName, tokenSymbol: tokenSymbol, tokenUserBalance: tokenUserBalance, tokenUserAllowance: tokenUserAllowance };
    }

    const getTokenBalance = async (contractObject) => {
        let tokenUserBalance;
        try {
            tokenUserBalance = await contractObject.balanceOf(account);
        }
        catch (error) {
            console.log(error);
            console.error(error);
            return null;
        }

        return tokenUserBalance;
    }

    const getTokenAllowance = async (contractObject,) => {
        let tokenUserAllowance;
        try {
            tokenUserAllowance = await contractObject.allowance(account, TOKEN_BRIDGE_ADDRESSES[chainId]["address"]);
        }
        catch (error) {
            console.log(error);
            console.error(error);
            return null;
        }

        return tokenUserAllowance;
    }

    const searchStringInArray = (str, strArray) => {
        for (var j = 0; j < strArray.length; j++) {
            if (strArray[j].match(str)) return j;
        }
        return -1;
    }

    const updateTokensLists = (tokenAddress, newTokenName, newTokenSymbol, newTokenBalance, newTokenAllowance) => {

        // const tokenAddressList = tokensList;
        const tokenAddressList = JSON.parse(JSON.stringify(tokensList)); // this will copy everything from original 
        tokenAddressList.push(tokenAddress);

        const newTokenNamesList = JSON.parse(JSON.stringify(tokenNamesList)); // this will copy everything from original 
        newTokenNamesList.push(newTokenName);

        const newTokenSymbolsList = JSON.parse(JSON.stringify(tokenSymbolsList)); // this will copy everything from original 
        newTokenSymbolsList.push(newTokenSymbol);

        const newTokenBalancesList = JSON.parse(JSON.stringify(tokenBalancesList)); // this will copy everything from original 
        newTokenBalancesList.push(newTokenBalance.toString());

        const newTokenAllowancesList = JSON.parse(JSON.stringify(tokenAllowancesList)); // this will copy everything from original 
        newTokenAllowancesList.push(newTokenAllowance.toString());

        setTokensList(tokenAddressList);
        setTokenNamesList(newTokenNamesList);
        setTokenSymbolsList(newTokenSymbolsList);
        setTokenBalancesList(newTokenBalancesList);
        setTokenAllowancesList(newTokenAllowancesList);

        localStorage.setItem(tokenAddressesStorageKey, JSON.stringify(tokenAddressList));
        localStorage.setItem(tokenNamesStorageKey, JSON.stringify(newTokenNamesList));
        localStorage.setItem(tokenSymbolsStorageKey, JSON.stringify(newTokenSymbolsList));
        localStorage.setItem(tokenBalancesStorageKey, JSON.stringify(newTokenBalancesList));
        localStorage.setItem(tokenAllowancesStorageKey, JSON.stringify(newTokenAllowancesList));
    }

    const getPreviousTokensList = async () => {
        setInformUser(1, "Loading previous token list. Please Wait.");
        // await new Promise(r => setTimeout(r, 2000)); 

        const tokenAddresssesStorageVal = localStorage.getItem(tokenAddressesStorageKey);
        const tokenNamesStorageVal = localStorage.getItem(tokenNamesStorageKey);
        const tokenSymbolsStorageVal = localStorage.getItem(tokenSymbolsStorageKey);
        const tokenBalancesStorageVal = localStorage.getItem(tokenBalancesStorageKey);
        const tokenAllowancesStorageVal = localStorage.getItem(tokenAllowancesStorageKey);

        // If they are all null, we haven't saved anything, so we just move on.
        if (tokenNamesStorageVal == null && tokenNamesStorageVal == null && tokenSymbolsStorageVal == null && tokenBalancesStorageVal == null && tokenAllowancesStorageVal == null) {
            setTokensList([]);
            setTokenNamesList([]);
            setTokenSymbolsList([]);
            setTokenBalancesList([]);
            setTokenAllowancesList([]);
            setInformUser(0, "");
            return;
        }

        // Otherwise there was an error, so let's clear the previous results and start over
        if (tokenNamesStorageVal == null || tokenNamesStorageVal == null || tokenSymbolsStorageVal == null || tokenBalancesStorageVal == null || tokenAllowancesStorageVal == null) {
            setInformUser(0, "Something went wrong. Could not fetch previous tokens.");
            localStorage.clear();
            return;
        }

        const previousTokenAddressList = JSON.parse(tokenAddresssesStorageVal);

        const previousTokenNamesList = JSON.parse(tokenNamesStorageVal);

        const previousTokenSymbolsList = JSON.parse(tokenSymbolsStorageVal);

        const previousTokenBalancesList = JSON.parse(tokenBalancesStorageVal);

        // updateTokenBalances();
        // This doesn't seem to work because we're still at page load? Contract object or sth like that maybe doesn't exist yet?
        // Figure out how to do it
        for (var j = 0; j < previousTokenAddressList.length; j++) {
            const newBalance = await fetchNewTokenBalance(previousTokenAddressList[j]);
            if (newBalance != null)
                previousTokenBalancesList[j] = newBalance.toString();
        }

        const previousTokenAllowancesList = JSON.parse(tokenAllowancesStorageVal);

        // updateTokenBalances();
        // This doesn't seem to work because we're still at page load? Contract object or sth like that maybe doesn't exist yet?
        // Figure out how to do it
        for (var j = 0; j < previousTokenAllowancesList.length; j++) {
            const newAllowance = await fetchNewTokenAllowance(previousTokenAddressList[j]);
            if (newAllowance != null)
                previousTokenAllowancesList[j] = newAllowance.toString();
        }

        setTokensList(previousTokenAddressList);
        setTokenNamesList(previousTokenNamesList);
        setTokenSymbolsList(previousTokenSymbolsList);
        setTokenBalancesList(previousTokenBalancesList);
        setTokenAllowancesList(previousTokenAllowancesList);

        setInformUser(0, "");
    }

    const updateTokenBalances = async () => {
        setInformUser(1, "Fetching new token balances.");
        const newTokenBalances = JSON.parse(JSON.stringify(tokenBalancesList)); // this will copy everything from original 

        for (var j = 0; j < tokensList.length; j++) {
            const newBalance = await fetchNewTokenBalance(tokensList[j]);
            if (newBalance != null)
                newTokenBalances[j] = newBalance.toString();
        }

        setTokenBalancesList(newTokenBalances);
        localStorage.setItem(tokenBalancesStorageKey, JSON.stringify(newTokenBalances));
        setInformUser(0, "Token balances updated successfully.");
    }

    const fetchNewTokenBalance = async (address) => {
        const contractObj = getTokenContract(address);
        if (contractObj == null) {
            console.log("Contract with token address " + address + " doesn't seem to exist.");
            return null;
        }

        const tokenBalance = await getTokenBalance(contractObj);
        if (tokenBalance == null) {
            console.log("We couldn't get ERC20 token balance");
            return null;
        }

        // console.log("Token Balance: " + tokenBalance);
        return tokenBalance;
    };

    const updateTokenAllowances = async () => {
        setInformUser(1, "Fetching new token allowances.");
        const newTokenAllowances = JSON.parse(JSON.stringify(tokenAllowancesList)); // this will copy everything from original 

        for (var j = 0; j < tokensList.length; j++) {
            const newAllowance = await fetchNewTokenAllowance(tokensList[j]);
            if (newAllowance != null)
                newTokenAllowances[j] = newAllowance.toString();
        }

        setTokenAllowancesList(newTokenAllowances);
        localStorage.setItem(tokenAllowancesStorageKey, JSON.stringify(newTokenAllowances));
        setInformUser(0, "Token allowances updates successfully.");
    }

    const fetchNewTokenAllowance = async (address) => {
        const contractObj = getTokenContract(address);
        if (contractObj == null) {
            console.log("Contract with token address " + address + " doesn't seem to exist.");
            return null;
        }

        const tokenAllowance = await getTokenAllowance(contractObj);
        if (tokenAllowance == null) {
            console.log("We couldn't get ERC20 token balance");
            return null;
        }

        // console.log("Token Balance: " + tokenBalance);
        return tokenAllowance;
    };

    const updateTokenInfo = async () => {
        await updateTokenBalances();
        await updateTokenAllowances();
        setInformUser(0, "Token balances and allowances updated successfully.");
    }

    const allowanceAmountChanged = (input) => {
        setAllowanceAmount(input.target.value)
    }

    const changeAllowance = async () => {

        if (allowanceAmount == "") {
            setInformUser(0, "Please specify an amount to approve.");
            return null;
        }

        if (tokenAddress == "") {
            setInformUser(0, "Please specify a token address.");
            return null;
        }

        if (!isAddress(tokenAddress)) {
            setInformUser(0, "Sorry, this is not a valid contract address.");
            return;
        }

        const contractObj = getTokenContract(tokenAddress);
        if (contractObj == null) {
            console.log("Contract with token address " + tokenAddress + " doesn't seem to exist.");
            return null;
        }

        try {
            const tx = await contractObj.approve(TOKEN_BRIDGE_ADDRESSES[chainId]["address"], allowanceAmount);

            setTxHash(tx.hash);
            setInformUser(1, "Setting new allowance amount for Token Bridge Contract.");
            await new Promise(r => setTimeout(r, 20));
            setTransactionPending(1);
            await tx.wait();
            setInformUser(0, "New allowance amount for Token Bridge Contract was successfully set.");
            await new Promise(r => setTimeout(r, 20));
            setTransactionPending(2);

        }
        catch (error) {
            console.log(error)
            console.error(error)
            setInformUser(0, "Sorry, we couldn't do that. An error occured.");
        }

        const tokenBalance = await getTokenBalance(contractObj);
        if (tokenBalance == null) {
            console.log("We couldn't get ERC20 token balance");
            return null;
        }

        // console.log("Token Balance: " + tokenBalance);
        return tokenBalance;
    }


    return (
        <div className="">
            <h2>ERC20 Tokens</h2>
            {tokensList.length > 0 ?
                <table className="table">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Address</th>
                            <th scope="col">Name</th>
                            <th scope="col">Symbol</th>
                            <th scope="col">Balance</th>
                            <th scope="col">Allowance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tokensList.map((element, index) => (
                            <tr key={index}>
                                <th scope="row">{index}</th>
                                <td>{element}</td>
                                <td>{tokenNamesList[index]}</td>
                                <td>{tokenSymbolsList[index]}</td>
                                <td>{tokenBalancesList[index]}</td>
                                <td>{tokenAllowancesList[index]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                :
                <p>You don't seem to have any tokens. You can add some using the form bellow.</p>
            }
            {/* <div style={{ margin: "10px" }}>
                <div className="row align-items-center d-flex justify-content-center">
                    <div className="col-auto">
                        <button className="btn btn-secondary" onClick={updateTokenBalances} disabled={tokenManagerStatus ? true : false}>Update Balances</button>
                        {" "}
                        <button className="btn btn-secondary" onClick={updateTokenAllowances} disabled={tokenManagerStatus ? true : false}>Update Allowances</button>
                    </div>
                </div>
            </div> */}
            <div style={{ margin: "10px" }}>
                <div className="row gy-2 gx-3 align-items-center d-flex justify-content-center">
                    <label className="col-auto">Token Address:</label>
                    <div className="col-auto">
                        <input type="text" className="form-control" id="autoSizingInput" placeholder="Token Address"
                            onChange={tokenAddressInput} value={tokenAddress} name="state" disabled={tokenManagerStatus ? true : false}
                        />
                    </div>
                    <div className="col-auto">
                        <button type="button" className="btn btn-primary" onClick={addNewTokenAddress} disabled={tokenManagerStatus ? true : false}>Add Token</button>
                    </div>
                    {/* <div className="col-auto">
                <div className="input-group">
                <div className="input-group-text">Amount:</div>
                <input type="text" className="form-control" id="autoSizingInputGroup" placeholder="Username"/>
                </div>
            </div> */}
                    <label className="col-auto">Amount:</label>
                    <div className="col-auto">
                        <input type="number" className="form-control" id="autoSizingInput" placeholder="0"
                            onChange={allowanceAmountChanged} value={allowanceAmount} name="allowance_amount"
                        />
                    </div>
                    <div className="col-auto">
                        <button type="submit" className="btn btn-primary" onClick={changeAllowance} disabled={tokenManagerStatus ? true : false}>Set Allowance</button>
                    </div>
                    <div className="col-auto">
                        <button className="btn btn-secondary" onClick={updateTokenInfo} disabled={tokenManagerStatus ? true : false}>Update Token Info</button>
                    </div>
                </div>
            </div>
            <div className="loading-component" hidden={transactionPending == 0}>
                <h4>Submitting Results</h4>
                <p>Your transaction hash is <a href={"https://rinkeby.etherscan.io/tx/" + txHash} id="txHashSpan" target="_blank">{txHash}</a>.</p>
                <div hidden={transactionPending != 1}>
                    <p>Results submitted. Please wait while the blockchain validates and approves your transaction.</p>
                    <p>This can take a few minutes.</p>
                </div>
                <div hidden={transactionPending != 2}>
                    <p>Results successfuly submitted.</p>
                </div>
            </div>
            <p>{tokenManagerMessage}</p>
            {tokenManagerStatus ? <div className="lds-dual-ring"></div> : null}
            <style jsx>{`
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
};

export default TokenManager;
