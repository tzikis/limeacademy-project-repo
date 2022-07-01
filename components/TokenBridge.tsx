import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useTokenBridgeContract from "../hooks/useTokenBridgeContract";

import { TOKEN_BRIDGE_ADDRESSES } from "../constants";
import Select from 'react-select';
// import 'bootstrap/dist/css/bootstrap.min.css';

import { splitSignature } from "@ethersproject/bytes";

type TokenBridge = {
  contractAddress: string;
};

var eventsList: any = [];
var eventsListKey;

const TokenBridgeComponent = ({ contractAddress }: TokenBridge) => {
  const { account, library, chainId } = useWeb3React<Web3Provider>();
  const tokenBridgeContract = useTokenBridgeContract(contractAddress);

  const [warningMessage, setWarningMessage] = useState<string>('');
  const [transactionPending, setTransactionPending] = useState<number>(0);
  const [txHash, setTxHash] = useState<string>('Unknown');

  const [tokenContractAddress, setTokenContractAddress] = useState<number>(0);
  const [tokenAmount, setTokenAmount] = useState<string>('');

  const [targetChainId, setTargetChainId] = useState<string>('');
  const [chainIdOptions, setChainIdOptions] = useState<Object[]>([]);
  
  const [lockNonce, setLockNonce] = useState<string>('');
  const [lockValidationSignature, setLockValidationSignature] = useState<string>('');
  const [mintTokenName, setMintTokenName] = useState<string>('');
  const [mintTokenSymbol, setMintTokenSymbol] = useState<string>('');

  const [burnNonce, setBurnNonce] = useState<string>('');
  const [burnValidationSignature, setBurnValidationSignature] = useState<string>('');

  const [eventsListString, setEventsListString] = useState<string>('');

  useEffect(() => {
    // console.log("Chain id: " + chainId + " and wallet address: " + account);

    let arrayOfNetworks = [];
    for (const key in TOKEN_BRIDGE_ADDRESSES) {
      if(TOKEN_BRIDGE_ADDRESSES[key]["id"] != chainId){
        arrayOfNetworks.push({label: TOKEN_BRIDGE_ADDRESSES[key]["network"], value: TOKEN_BRIDGE_ADDRESSES[key]["id"]})
      }
  }
    setChainIdOptions(arrayOfNetworks);
    setTargetChainId(null);

    eventsListKey = 'eventsList-' + account;
    const eventsListStorage = localStorage.getItem(eventsListKey);
    if(eventsListStorage != null)
      eventsList = JSON.parse(eventsListStorage);
    else
      eventsList = [];

    setEventsList(eventsList);
  },[chainId, account])

  useEffect(() => {
    console.log("Token Bridge useEffect called");
    tokenBridgeContract.on('Lock', lockHandler);
    tokenBridgeContract.on('Unlock', unlockHandler);
    tokenBridgeContract.on('Mint', mintHandler);
    tokenBridgeContract.on('Burn', burnHandler);
  }, [])

  const unlockHandler = (targetChainId, tokenNativeAddress, receiver, amount, tx) => {
    // console.log(tx);
    const newEventStorageObject = {
      chainId: targetChainId.toString(),
      event: "Unlock",
      functionName: "unlock()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount:amount.toString()
    };
    addEventToList(newEventStorageObject);
  };


  const lockHandler = (targetChainId, tokenNativeAddress, receiver, amount, nonce, tx) => {
    // console.log(tx);
    const newEventStorageObject = {
      chainId: targetChainId.toString(),
      event: "Lock",
      functionName: "lock()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount:amount.toString(),
      nonce: nonce.toString(),
    };
    addEventToList(newEventStorageObject);
  };

  const burnHandler = (targetChainId, tokenNativeAddress, receiver, amount, wrappedTokenAddress, nonce, tx) => {
    const newEventStorageObject = {
      chainId: targetChainId.toString(),
      event: "Burn",
      functionName: "burn()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount:amount.toString(),
      nonce: nonce.toString(),
      wrappedTokenAddress: wrappedTokenAddress.toString()
    };
    addEventToList(newEventStorageObject);
  };

  const mintHandler = (targetChainId, tokenNativeAddress, receiver, amount, wrappedTokenAddress, tx) => {
    // console.log(tx);
    const newEventStorageObject = {
      chainId: targetChainId.toString(),
      event: "Mint",
      functionName: "mint()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount:amount.toString(),
      wrappedTokenAddress: wrappedTokenAddress.toString()
    };
    addEventToList(newEventStorageObject);
  };

  const addEventToList = (newEvent) => {

    // We really shouldn't be doing this, but the event handlers are called twice when they shouldn't. sigh..
    for (var j = 0; j < eventsList.length; j++) {      
      if(
        newEvent.chainId == eventsList[j].chainId && 
        newEvent.event == eventsList[j].event && 
        newEvent.functionName == eventsList[j].functionName && 
        newEvent.tokenNativeAddress == eventsList[j].tokenNativeAddress && 
        newEvent.receiverOrOwnerAddress == eventsList[j].receiverOrOwnerAddress && 
        newEvent.amount == eventsList[j].amount &&
        newEvent.nonce == eventsList[j].nonce &&
        newEvent.wrappedTokenAddress == eventsList[j].wrappedTokenAddress
        ){
        return;
      }
    }

    eventsList.push(newEvent);
    localStorage.setItem(eventsListKey, JSON.stringify(eventsList));
    setEventsList(eventsList);
  }

  const setEventsList = (list) => {
    const newListJSON = JSON.stringify(list);
    const newList = JSON.parse(newListJSON);
    newList.reverse();

    const eventsArray = newList.map((element, index) => (
      index + ": " + "Target Chain: " + element.chainId + " Event: " + element.event + " Function Name: " + element.functionName + " - nativeTokenAddress: " + element.tokenNativeAddress + " - receiver/owner: " + element.receiverOrOwnerAddress + " - amount: " + element.amount + " nonce: " + element.nonce + " wrappedTokenAddress: " + element.wrappedTokenAddress + (element.signature? (" signature: " + element.signature) : "")
      ))
      const eventsString = eventsArray.join('\n')
      // console.log(eventsString);

      setEventsListString(eventsString);

  }

  const tokenContractAddressChanged = (input) => {
    setTokenContractAddress(input.target.value)
  }

  const tokenAmountChanged = (input) => {
    setTokenAmount(input.target.value)
  }

  const targetChainChanged = (input) => {
    // console.log("Target chain changed: " + input);
    setTargetChainId(input.value)
  }

  const lockNonceChanged = (input) => {
    setLockNonce(input.target.value)
  }

  const lockValidationSignatureChanged = (input) => {
    setLockValidationSignature(input.target.value)
  }

  const mintTokenNameChanged = (input) => {
    setMintTokenName(input.target.value)
  }

  const mintTokenSymbolChanged = (input) => {
    setMintTokenSymbol(input.target.value)
  }

  const burnNonceChanged = (input) => {
    setBurnNonce(input.target.value)
  }

  const burnValidationSignatureChanged = (input) => {
    setBurnValidationSignature(input.target.value)
  }

  const submitLockTokens = async () => {

    try {
      // const tx = await tokenBridgeContract.estimateGas.lock("01", lockTokenContractAddress, lockTokenAmount);
      // const tx = await tokenBridgeContract.lock("01", lockTokenContractAddress, lockTokenAmount);
      const tx = await tokenBridgeContract.lock(targetChainId, tokenContractAddress, tokenAmount);

      setTxHash(tx.hash);
      setTransactionPending(1);
      setWarningMessage("Locking token in Token Bridge Contract.");
      await tx.wait();
      setWarningMessage("Locking in Token Bridge Contract was successful.");
      setTransactionPending(2);
    }
    catch (error) {
      console.log(error)
      console.error(error)
      setWarningMessage("Sorry, we couldn't do that. An error occured");
    }
  }

  const submitUnlockTokens = async () => {

    try {
      // const signatureLike = await generateValidation("burn()", tokenContractAddress, account, tokenAmount, burnNonce);
      // const signature = await splitSignature(signatureLike);
      const signature = await splitSignature(burnValidationSignature);
      const tx = await tokenBridgeContract.unlock(chainId, tokenContractAddress, account, tokenAmount, burnNonce, signature.v, signature.r, signature.s);

      setTxHash(tx.hash);
      setTransactionPending(1);
      setWarningMessage("Unlocking token in Token Bridge Contract.");
      await tx.wait();
      setWarningMessage("Unlocking from Token Bridge Contract was successful.");
      setTransactionPending(2);
    }
    catch (error) {
      console.log(error)
      console.error(error)
      setWarningMessage("Sorry, we couldn't do that. An error occured");
    }
  }

  const submitMintTokens = async () => {
    
    try {

      const wrappedTokenInfo = {name: mintTokenName, symbol: mintTokenSymbol};
      // const wrappedTokenInfo = ["Hello World", "yay"];
      // const signatureLike = await generateValidation("lock()", tokenContractAddress, account, tokenAmount, lockNonce);
      // const signature = await splitSignature(signatureLike);
      const signature = await splitSignature(lockValidationSignature);
      const tx = await tokenBridgeContract.mint(chainId, tokenContractAddress, account, tokenAmount, lockNonce, wrappedTokenInfo, signature.v, signature.r, signature.s);

      setTxHash(tx.hash);
      setTransactionPending(1);
      setWarningMessage("Minting token in Non-native Token Bridge Contract.");
      await tx.wait();
      setWarningMessage("Minting token in Non-native Token Bridge Contract was successful.");
      setTransactionPending(2);
    }
    catch (error) {
      console.log(error)
      console.error(error)
      setWarningMessage("Sorry, we couldn't do that. An error occured");
    }

  }

  const submitBurnTokens = async () => {
    try {
      const tx = await tokenBridgeContract.burn(targetChainId, tokenContractAddress, tokenAmount);

      setTxHash(tx.hash);
      setTransactionPending(1);
      setWarningMessage("Burning token from Token Bridge Contract.");
      await tx.wait();
      setWarningMessage("Burning token from Token Bridge Contract was successful.");
      setTransactionPending(2);
    }
    catch (error) {
      console.log(error)
      console.error(error)
      setWarningMessage("Sorry, we couldn't do that. An error occured");
    }

  }

  return (
    <div className="results-form">
      <h2>Bridge Token</h2>
      <h3>Common</h3>
      <label>
        Token Address:
        <input onChange={tokenContractAddressChanged} value={tokenContractAddress} type="text" name="token_contract_address" />
        &nbsp;Amount:
        <input onChange={tokenAmountChanged} value={tokenAmount} type="number" name="token_amount" />
      </label>
      <div className="chain Id">
      </div>
      <h3>Native</h3>
      <div className="button-wrapper">
        <label>
          Chain ID: 
        </label>
        &nbsp;
        <div style={{width:300, display:"inline-block"}}>
          <Select  placeholder="Please select target network" value={targetChainId==null? null: chainIdOptions} onChange={targetChainChanged} options={chainIdOptions}/>
        </div>
        &nbsp;
        <button onClick={submitLockTokens}>Lock Tokens</button> &nbsp;
      </div>
      <div className="button-wrapper">
        <label>
          Burn Nonce: 
          <input onChange={burnNonceChanged} value={burnNonce} type="text" name="validator_nonce" />
          &nbsp; Burn Signature: 
          <input onChange={burnValidationSignatureChanged} value={burnValidationSignature} type="text" name="lock_token_contract_address" />
        </label>
        <button onClick={submitUnlockTokens}>Unlock Tokens</button>  
      </div>
      <h3>Non-Native</h3>
      <div className="button-wrapper">
        <label>
          Lock Nonce: 
          <input onChange={lockNonceChanged} value={lockNonce} type="text" name="validator_nonce2" />
          &nbsp; Lock Signature: 
          <input onChange={lockValidationSignatureChanged} value={lockValidationSignature} type="text" name="lock_token_contract_address" />
          &nbsp; Mint Token Name: 
          <input onChange={mintTokenNameChanged} value={mintTokenName} type="text" name="mint_token_name" />
          &nbsp; Mint Token Symbol: 
          <input onChange={mintTokenSymbolChanged} value={mintTokenSymbol} type="text" name="mint_token_symbol" />
        </label>
        <button onClick={submitMintTokens}>Mint Tokens</button>
      </div>
      <div className="button-wrapper">
        <label>
          Chain ID: 
        </label>
        &nbsp;
        <div style={{width:300, display:"inline-block"}}>
          <Select  placeholder="Please select target network" value={targetChainId==null? null: chainIdOptions} onChange={targetChainChanged} options={chainIdOptions}/>
        </div>
        &nbsp;
        <button onClick={submitBurnTokens}>Burn Tokens</button>
      </div>
      <p>{warningMessage}</p>
      <div className="loading-component" hidden={transactionPending == 0}>
        <h3>Submitting Results</h3>
        <p>Your transaction hash is <a href={"https://rinkeby.etherscan.io/tx/" + txHash} id="txHashSpan" target="_blank">{txHash}</a>.</p>
        <div hidden={transactionPending != 1}>
          <p>Results submitted. Please wait while the blockchain validates and approves your transaction.</p>
          <p>This can take a few minutes.</p>
          <div className="lds-dual-ring"></div>
        </div>
        <div hidden={transactionPending != 2}>
          <p>Results successfuly submitted.</p>
        </div>
      </div>
      <pre>{eventsListString}</pre>
      <style jsx>{`
        .results-form {
          display: flex;
          flex-direction: column;
        }

        .button-wrapper {
          margin: 20px;
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
};

export default TokenBridgeComponent;
