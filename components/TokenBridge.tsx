import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useTokenBridgeContract from "../hooks/useTokenBridgeContract";

import { TOKEN_BRIDGE_ADDRESSES } from "../constants";
import Select from 'react-select';

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

  const [mintTokenName, setMintTokenName] = useState<string>('');
  const [mintTokenSymbol, setMintTokenSymbol] = useState<string>('');

  const [nonce, setNonce] = useState<string>('');
  const [validationSignature, setValidationSignature] = useState<string>('');

  const [eventsListState, setEventsListState] = useState<Object[]>([]);

  useEffect(() => {
    // console.log("Chain id: " + chainId + " and wallet address: " + account);

    let arrayOfNetworks = [];
    for (const key in TOKEN_BRIDGE_ADDRESSES) {
      if (TOKEN_BRIDGE_ADDRESSES[key]["id"] != chainId) {
        arrayOfNetworks.push({ label: TOKEN_BRIDGE_ADDRESSES[key]["network"], value: TOKEN_BRIDGE_ADDRESSES[key]["id"] })
      }
    }
    setChainIdOptions(arrayOfNetworks);
    setTargetChainId(null);

    eventsListKey = 'eventsList-' + account;
    const eventsListStorage = localStorage.getItem(eventsListKey);
    if (eventsListStorage != null)
      eventsList = JSON.parse(eventsListStorage);
    else
      eventsList = [];

    setEventsList(eventsList);
  }, [chainId, account])

  useEffect(() => {
    console.log("Token Bridge useEffect called");
    tokenBridgeContract.on('Lock', lockHandler);
    tokenBridgeContract.on('Unlock', unlockHandler);
    tokenBridgeContract.on('Mint', mintHandler);
    tokenBridgeContract.on('Burn', burnHandler);
  }, [chainId])

  const unlockHandler = (targetChainId, tokenNativeAddress, receiver, amount, tx) => {
    console.log("Token Bridge unlockHandler");
    // console.log(tx);
    const newEventStorageObject = {
      chainId: targetChainId.toString(),
      event: "Unlock",
      functionName: "unlock()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount: amount.toString()
    };
    addEventToList(newEventStorageObject);
  };


  const lockHandler = (targetChainId, tokenNativeAddress, receiver, amount, nonce, tx) => {
    console.log("Token Bridge lockHandler");
    // console.log(tx);
    const newEventStorageObject = {
      chainId: targetChainId.toString(),
      event: "Lock",
      functionName: "lock()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount: amount.toString(),
      nonce: nonce.toString(),
    };
    addEventToList(newEventStorageObject);
  };

  const burnHandler = (targetChainId, tokenNativeAddress, receiver, amount, wrappedTokenAddress, nonce, tx) => {
    console.log("Token Bridge burnHandler");
    const newEventStorageObject = {
      chainId: targetChainId.toString(),
      event: "Burn",
      functionName: "burn()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount: amount.toString(),
      nonce: nonce.toString(),
      wrappedTokenAddress: wrappedTokenAddress.toString()
    };
    addEventToList(newEventStorageObject);
  };

  const mintHandler = (targetChainId, tokenNativeAddress, receiver, amount, wrappedTokenAddress, tx) => {
    console.log("Token Bridge mintHandler");
    // console.log(tx);
    const newEventStorageObject = {
      chainId: targetChainId.toString(),
      event: "Mint",
      functionName: "mint()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount: amount.toString(),
      wrappedTokenAddress: wrappedTokenAddress.toString()
    };
    addEventToList(newEventStorageObject);
  };

  const addEventToList = (newEvent) => {

    // We shouldn't be doing this either, but at this point i think we subscribe and get events for each wallet we have ever used in this session
    if (newEvent.receiverOrOwnerAddress != account)
      return;

    // We really shouldn't be doing this, but the event handlers are called twice when they shouldn't. sigh..
    for (var j = 0; j < eventsList.length; j++) {
      if (
        newEvent.chainId == eventsList[j].chainId &&
        newEvent.event == eventsList[j].event &&
        newEvent.functionName == eventsList[j].functionName &&
        newEvent.tokenNativeAddress == eventsList[j].tokenNativeAddress &&
        newEvent.receiverOrOwnerAddress == eventsList[j].receiverOrOwnerAddress &&
        newEvent.amount == eventsList[j].amount &&
        newEvent.nonce == eventsList[j].nonce &&
        newEvent.wrappedTokenAddress == eventsList[j].wrappedTokenAddress
      ) {
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

    // const eventsArray = newList.map((element, index) => (
    //   index + ": " + "Target Chain: " + element.chainId + " Event: " + element.event + " Function Name: " + element.functionName + " - nativeTokenAddress: " + element.tokenNativeAddress + " - receiver/owner: " + element.receiverOrOwnerAddress + " - amount: " + element.amount + " nonce: " + element.nonce + " wrappedTokenAddress: " + element.wrappedTokenAddress + (element.signature? (" signature: " + element.signature) : "")
    //   ))
    //   const eventsString = eventsArray.join('\n')
    // console.log(eventsString);

    setEventsListState(newList);

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

  const mintTokenNameChanged = (input) => {
    setMintTokenName(input.target.value)
  }

  const mintTokenSymbolChanged = (input) => {
    setMintTokenSymbol(input.target.value)
  }

  const nonceChanged = (input) => {
    setNonce(input.target.value)
  }

  const validationSignatureChanged = (input) => {
    setValidationSignature(input.target.value)
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
      // const signatureLike = await generateValidation("burn()", tokenContractAddress, account, tokenAmount, nonce);
      // const signature = await splitSignature(signatureLike);
      const signature = await splitSignature(validationSignature);
      const tx = await tokenBridgeContract.unlock(chainId, tokenContractAddress, account, tokenAmount, nonce, signature.v, signature.r, signature.s);

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

      const wrappedTokenInfo = { name: mintTokenName, symbol: mintTokenSymbol };
      // const wrappedTokenInfo = ["Hello World", "yay"];
      // const signatureLike = await generateValidation("lock()", tokenContractAddress, account, tokenAmount, nonce);
      // const signature = await splitSignature(signatureLike);
      const signature = await splitSignature(validationSignature);
      const tx = await tokenBridgeContract.mint(chainId, tokenContractAddress, account, tokenAmount, nonce, wrappedTokenInfo, signature.v, signature.r, signature.s);

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
      <h2>Token Bridge</h2>
      <div style={{ margin: "10px" }}>
        <div className="row gy-2 gx-3 align-items-center d-flex justify-content-center">
          <label className="col-auto">Token Address:</label>
          <div className="col-auto">
            <input type="text" className="form-control" placeholder="Token Address"
              onChange={tokenContractAddressChanged} value={tokenContractAddress} name="token_contract_address"
            />
          </div>
          <label className="col-auto">Amount:</label>
          <div className="col-auto">
            <input type="number" className="form-control" style={{ width: 100 }} placeholder="0"
              onChange={tokenAmountChanged} value={tokenAmount} name="token_amount"
            />
          </div>
        </div>
      </div>
      <div style={{ margin: "10px" }}>
        <div className="row gy-2 gx-3 align-items-center d-flex justify-content-center">
          <label className="col-auto">Chain ID:</label>
          <div className="col-auto" style={{ width: 200 }}>
            {/* <div style={{ width: 300, display: "inline-block" }}> */}
            <Select placeholder="Target Network" value={targetChainId == null ? null : chainIdOptions} onChange={targetChainChanged} options={chainIdOptions} />
          </div>
          <div className="col-auto">
            <button type="button" className="btn btn-primary" onClick={submitLockTokens}>Lock Tokens</button>
          </div>
          <div className="col-auto">
            <button type="button" className="btn btn-primary" onClick={submitBurnTokens}>Burn Tokens</button>
          </div>
        </div>
      </div>
      <div style={{ margin: "10px" }}>
        <div className="row gy-2 gx-3 align-items-center d-flex justify-content-center">
          <div className="col-auto">
            <div className="input-group">
              <div className="input-group-text">Nonce</div>
              <input type="number" className="form-control" style={{ width: 100 }} placeholder="0"
                onChange={nonceChanged} value={nonce} name="nonce_input"
              />
              <div className="input-group-text">Signature</div>
              <input type="text" className="form-control" placeholder="Signature"
                onChange={validationSignatureChanged} value={validationSignature} name="signature_input"
              />
              <button type="button" className="btn btn-primary" onClick={submitUnlockTokens}>Unlock Tokens</button>
              <div className="input-group-text">Token Name</div>
              <input type="text" className="form-control" placeholder="Name"
                onChange={mintTokenNameChanged} value={mintTokenName} name="mint_token_name"
              />
              <div className="input-group-text">Token Symbol</div>
              <input type="text" className="form-control" placeholder="Symbol"
                onChange={mintTokenSymbolChanged} value={mintTokenSymbol} name="mint_token_symbol"
              />
              <button type="button" className="btn btn-primary" onClick={submitMintTokens}>Mint Tokens</button>
            </div>
          </div>
        </div>
      </div>
      <p>{warningMessage}</p>
      <div className="loading-component" hidden={transactionPending == 0}>
        <h4>Submitting Results</h4>
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
      <h3>Event History</h3>
      {eventsListState.length > 0 ?
        <table className="table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Target Chain</th>
              <th scope="col">Transaction Type</th>
              <th scope="col">Native Token Address</th>
              <th scope="col">Amount</th>
              <th scope="col">Nonce</th>
              <th scope="col">Wrapped Token Address</th>
              <th scope="col">Signature</th>
            </tr>
          </thead>
          <tbody>
            {eventsListState.map((element, index) => (
              <tr key={index}>
                <th scope="row">{index}</th>
                <td>{TOKEN_BRIDGE_ADDRESSES[element["chainId"]]["network"] + " (#" + element["chainId"] + ")"}</td>
                <td>{element["event"]}</td>
                <td>{element["tokenNativeAddress"]}</td>
                <td>{element["amount"]}</td>
                <td>{element["nonce"]}</td>
                <td>{element["wrappedTokenAddress"]}</td>
                <td style={{ maxWidth: "100px", overflow: "hidden" }}>{element["signature"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        :
        <p>You don't have any events in your history log.</p>
      }
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
