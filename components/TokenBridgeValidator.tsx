import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useTokenBridgeContract from "../hooks/useTokenBridgeContract";

import { splitSignature } from "@ethersproject/bytes";

import { TOKEN_BRIDGE_ADDRESSES } from "../constants";

import { shortenHex } from "../util";

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  // ...
  // The value of `databaseURL` depends on the location of the database
  databaseURL: "https://lime-token-bridge-validator-default-rtdb.europe-west1.firebasedatabase.app/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

const dbRef = ref(database, 'signatures');

type TokenBridge = {
  contractAddress: string;
};

var eventsHistory: any = [];

const TokenBridgeValidatorComponent = ({ contractAddress }: TokenBridge) => {
  const { account, library, chainId } = useWeb3React<Web3Provider>();
  const tokenBridgeContract = useTokenBridgeContract(contractAddress);

  const [targetChainId, setTargetChainId] = useState<string>('');

  const [tokenContractAddress, setTokenContractAddress] = useState<number>(0);
  const [tokenAmount, setTokenAmount] = useState<string>('');

  const [nonce, setNonce] = useState<string>('');

  const [receiverAddress, setReceiverAddress] = useState<string>('');
  const [validationSignature, setValidationSignature] = useState<string>('');
  const [validationSplitSignature, setValidationSplitSignature] = useState<Object>({});
  const [validationVerificationResponse, setValidationVerificationResponse] = useState<string>('');

  const [eventsHistoryState, setEventsHistoryState] = useState<Object[]>([]);

  const [contractOwner, setContractOwner] = useState<string>('');

  useEffect(() => {
    onValue(dbRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const childKey = childSnapshot.key;
        const childData = childSnapshot.val();
        // console.log("New Firebase DB child. Key:" + childKey);
        // console.log(childData);
        updateHistory(childData.data.chainId, childData.data.functionName, childData.data.tokenAddress, childData.data.receiverAddress, childData.data.amount, childData.data.nonce, childData.signature  )
      });
    }, {
      // onlyOnce: true
    });

  }, [])

  useEffect(() => {
    checkOwner();
  }, [account])

  const checkOwner = async () => {
    const contractOwner = await tokenBridgeContract.owner();
    setContractOwner(contractOwner);
  }

  useEffect(() => {
    console.log("Token Bridge Validator useEffect called");
    const eventsHistoryStorage = localStorage.getItem('eventsHistory')
    if (eventsHistoryStorage != null)
      eventsHistory = JSON.parse(eventsHistoryStorage);
    else
      eventsHistory = [];

    setEventsHistory(eventsHistory);

    tokenBridgeContract.on('Lock', lockHandler);
    tokenBridgeContract.on('Unlock', unlockHandler);
    tokenBridgeContract.on('Mint', mintHandler);
    tokenBridgeContract.on('Burn', burnHandler);
  }, [chainId])

  const unlockHandler = (targetChainId, tokenNativeAddress, receiver, amount, tx) => {
    console.log("Token Bridge Validator unlockHandler");
    // console.log(tx);
    const newEventStorageObject = {
      chainId: targetChainId.toString(),
      event: "Unlock",
      functionName: "unlock()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount: amount.toString()
    };
    addEventToHistory(newEventStorageObject);
  };


  const lockHandler = (targetChainId, tokenNativeAddress, receiver, amount, nonce, tx) => {
    // console.log(tx);
    console.log("Token Bridge Validator lockHandler");
    const newEventStorageObject = {
      chainId: targetChainId.toString(),
      event: "Lock",
      functionName: "lock()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount: amount.toString(),
      nonce: nonce.toString(),
    };
    addEventToHistory(newEventStorageObject);
  };

  const burnHandler = (targetChainId, tokenNativeAddress, receiver, amount, wrappedTokenAddress, nonce, tx) => {
    console.log("Token Bridge Validator burnHandler");
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
    addEventToHistory(newEventStorageObject);
  };

  const mintHandler = (targetChainId, tokenNativeAddress, receiver, amount, wrappedTokenAddress, tx) => {
    console.log("Token Bridge Validator mintHandler");
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
    addEventToHistory(newEventStorageObject);
  };

  const addEventToHistory = (newEvent) => {

    // We really shouldn't be doing this, but the event handlers are called twice when they shouldn't. sigh..
    for (var j = 0; j < eventsHistory.length; j++) {
      if (
        newEvent.chainId == eventsHistory[j].chainId &&
        newEvent.event == eventsHistory[j].event &&
        newEvent.functionName == eventsHistory[j].functionName &&
        newEvent.tokenNativeAddress == eventsHistory[j].tokenNativeAddress &&
        newEvent.receiverOrOwnerAddress == eventsHistory[j].receiverOrOwnerAddress &&
        newEvent.amount == eventsHistory[j].amount &&
        newEvent.nonce == eventsHistory[j].nonce &&
        newEvent.wrappedTokenAddress == eventsHistory[j].wrappedTokenAddress
      ) {
        return;
      }
    }

    eventsHistory.push(newEvent);
    localStorage.setItem('eventsHistory', JSON.stringify(eventsHistory));
    setEventsHistory(eventsHistory);
  }

  const setEventsHistory = (list) => {
    const newListJSON = JSON.stringify(list);
    const newList = JSON.parse(newListJSON);
    newList.reverse();

    // const eventsArray = newList.map((element, index) => (
    //   index + ": " + "Target Chain: " + element.chainId + " Event: " + element.event + " Function Name: " + element.functionName + " - nativeTokenAddress: " + element.tokenNativeAddress + " - receiver/owner: " + element.receiverOrOwnerAddress + " - amount: " + element.amount + " nonce: " + element.nonce + " wrappedTokenAddress: " + element.wrappedTokenAddress + " signature: " + element.signature
    //   ))
    //   const eventsString = eventsArray.join('\n')
    // console.log(eventsString);

    setEventsHistoryState(newList);
  }

  const targetChainChanged = (input) => {
    setTargetChainId(input.target.value)
  }

  const tokenContractAddressChanged = (input) => {
    setTokenContractAddress(input.target.value)
  }

  const tokenAmountChanged = (input) => {
    setTokenAmount(input.target.value)
  }

  const nonceChanged = (input) => {
    setNonce(input.target.value)
  }

  const receiverAddressChanged = (input) => {
    setReceiverAddress(input.target.value)
  }

  const setValidationSignatures = async (valSig) => {
    setValidationSignature(valSig);
    const splitValSig = await splitSignature(valSig);
    setValidationSplitSignature(splitValSig);
  }

  const generateLockValidation = async () => {
    const valSig = await generateValidation("lock()", targetChainId, tokenContractAddress, receiverAddress, tokenAmount, nonce);
    updateHistory(targetChainId, "lock()", tokenContractAddress, receiverAddress, tokenAmount, nonce, valSig)
    setValidationSignatures(valSig);
  }

  const generateBurnValidation = async () => {
    const valSig = await generateValidation("burn()", targetChainId, tokenContractAddress, receiverAddress, tokenAmount, nonce);
    updateHistory(targetChainId, "burn()", tokenContractAddress, receiverAddress, tokenAmount, nonce, valSig)
    setValidationSignatures(valSig);
  }

  const testLockValidation = async () => {
    const valSig = await generateValidation("lock()", targetChainId, tokenContractAddress, receiverAddress, tokenAmount, nonce);
    try {
      const signature = await splitSignature(valSig);
      // setTransactionPending(1);
      // setWarningMessage("Unlocking token in Token Bridge Contract.");
      const response = await tokenBridgeContract.verify("lock()", targetChainId, tokenContractAddress, receiverAddress, tokenAmount, nonce, signature.v, signature.r, signature.s);
      // setWarningMessage("Unlocking from Token Bridge Contract was successful.");
      // setTransactionPending(2);
      setValidationSignatures(valSig);
      setValidationVerificationResponse(response.toString())
    }
    catch (error) {
      console.log(error)
      console.error(error)
      // setWarningMessage("Sorry, we couldn't do that. An error occured");
    }

  }

  const testBurnValidation = async () => {
    const valSig = await generateValidation("burn()", targetChainId, tokenContractAddress, receiverAddress, tokenAmount, nonce);
    try {
      const signature = await splitSignature(valSig);
      // setTransactionPending(1);
      // setWarningMessage("Unlocking token in Token Bridge Contract.");
      const response = await tokenBridgeContract.verify("burn()", targetChainId, tokenContractAddress, receiverAddress, tokenAmount, nonce, signature.v, signature.r, signature.s);
      // setWarningMessage("Unlocking from Token Bridge Contract was successful.");
      // setTransactionPending(2);
      setValidationSignatures(valSig);
      setValidationVerificationResponse(response.toString())
    }
    catch (error) {
      console.log(error)
      console.error(error)
      // setWarningMessage("Sorry, we couldn't do that. An error occured");
    }

  }

  const updateHistory = (eventTargetChainId, functionName, tokenContractAddress, receiverAccount, tokenAmount, nonce, signature) => {
    for (var j = 0; j < eventsHistory.length; j++) {

      // console.log(j + " " + eventFunctionName + " " + eventTokenContractAddress + " " + eventReceiverAccount + " " + eventTokenAmount + " " + eventNonce + " wtf");
      // console.log(j + " " + functionName + " " + tokenContractAddress + " " + receiverAccount + " " + tokenAmount + " " + nonce + " wtf");

      if (
        eventTargetChainId == eventsHistory[j].chainId &&
        functionName == eventsHistory[j].functionName &&
        tokenContractAddress == eventsHistory[j].tokenNativeAddress &&
        receiverAccount == eventsHistory[j].receiverOrOwnerAddress &&
        tokenAmount == eventsHistory[j].amount &&
        nonce == eventsHistory[j].nonce
        // && eventsHistory[j] == null
      ) {
        eventsHistory[j].signature = signature;
        localStorage.setItem('eventsHistory', JSON.stringify(eventsHistory));
        setEventsHistory(eventsHistory);
        appendOwnersEventList(eventsHistory[j]);
        break;
      }
    }

  }

  const appendOwnersEventList = (signedEvent) => {
    const owner = signedEvent.receiverOrOwnerAddress;
    const eventsListKey = 'eventsList-' + owner;
    const eventsListStorage = localStorage.getItem(eventsListKey);
    let eventsList = [];
    if (eventsListStorage != null) {
      eventsList = JSON.parse(eventsListStorage);
    }

    signedEvent.event = signedEvent.event + " Validation Signature";
    eventsList.push(signedEvent);
    localStorage.setItem(eventsListKey, JSON.stringify(eventsList));

  }

  const generateValidation = async (functionName, targetChainId, tokenAddress, receiverAddress, amount, nonce) => {
    // Account here is the wallet address
    // const nonce = (await tokenBridgeContract.nonces(tokenContractAddress)); // Our Token Contract Nonces

    const EIP712Domain = [ // array of objects -> properties from the contract and the types of them ircwithPermit
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'verifyingContract', type: 'address' }
    ];

    const domain = {
      name: "Tzikis TokenBridge",
      version: '1',
      verifyingContract: contractAddress
    };

    const Verify = [ // array of objects -> properties from erc20withpermit
      { name: 'functionName', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'tokenAddress', type: 'address' },
      { name: 'receiverAddress', type: 'address' },
      { name: 'amount', type: 'uint32' },
      { name: 'nonce', type: 'uint32' }
    ];

    const message = {
      functionName: functionName, // Wallet Address
      chainId: targetChainId,
      tokenAddress: tokenAddress, // This is the address of the contract.
      receiverAddress: receiverAddress, // This is the address of the spender whe want to give permit to.
      amount: amount,
      nonce: nonce
    };

    const data = JSON.stringify({
      types: {
        EIP712Domain,
        Verify
      },
      domain,
      primaryType: 'Verify',
      message
    });

    const signatureLike = await library.send('eth_signTypedData_v4', [account, data]); // Library is a provider.
    return signatureLike;
  }

  return (
    <div className="results-form">
      <div hidden={account != contractOwner}>
        <br />
        <br />
        <hr />
        <br />
        <h1>Validator</h1>
        <div style={{ margin: "10px" }}>
          <div className="row gy-2 gx-3 align-items-center d-flex justify-content-center">
            <label className="col-auto">Target Chain ID:</label>
            <div className="col-auto">
              <input type="number" className="form-control" id="autoSizingInput" placeholder="Chain ID"
                onChange={targetChainChanged} value={targetChainId} name="target_chain"
              />
            </div>
            <label className="col-auto">Native Token Address:</label>
            <div className="col-auto">
              <input type="text" className="form-control" id="autoSizingInput" placeholder="Token Address"
                onChange={tokenContractAddressChanged} value={tokenContractAddress} name="validator_token_contract_address"
              />
            </div>
            <label className="col-auto">Token Owner/Receiver Address:</label>
            <div className="col-auto">
              <input type="text" className="form-control" id="autoSizingInput" placeholder="Token Address"
                onChange={receiverAddressChanged} value={receiverAddress} name="validator_token_receiver_owner_address"
              />
            </div>
            <label className="col-auto">Amount:</label>
            <div className="col-auto">
              <input type="number" className="form-control" id="autoSizingInput" placeholder="0"
                onChange={tokenAmountChanged} value={tokenAmount} name="validator_token_amount"
              />
            </div>
            <label className="col-auto">Nonce:</label>
            <div className="col-auto">
              <input type="number" className="form-control" id="autoSizingInput" placeholder="0"
                onChange={nonceChanged} value={nonce} name="validator_nonce"
              />
            </div>
            <div className="col-auto">
              <button type="button" className="btn btn-primary" onClick={generateLockValidation}>Generate Lock Validation</button>
            </div>
            {/* <div className="col-auto">
                <div className="input-group">
                <div className="input-group-text">Amount:</div>
                <input type="text" className="form-control" id="autoSizingInputGroup" placeholder="Username"/>
                </div>
            </div> */}
            <div className="col-auto">
              <button type="submit" className="btn btn-primary" onClick={generateBurnValidation}>Generate Burn Validation</button>
            </div>
            <div className="col-auto">
              <button type="submit" className="btn btn-warning" onClick={testLockValidation}>Test Lock Validation Verification</button>
            </div>
            <div className="col-auto">
              <button type="submit" className="btn btn-warning" onClick={testBurnValidation}>Test Burn Validation Verification</button>
            </div>
          </div>
        </div>
        <p>Validation Signature:</p>
        <p>{validationSignature}</p>
        <p>Split Validation Signature:</p>
        <p>v: {validationSplitSignature? validationSplitSignature["v"]: ""} r: {validationSplitSignature? validationSplitSignature["r"]: ""} s: {validationSplitSignature? validationSplitSignature["s"]: ""}</p>
        <p>Verification Response (Address):</p>
        <p>{validationVerificationResponse}</p>
        {eventsHistoryState.length > 0 ?
          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Target Chain</th>
                <th scope="col">Tx Type</th>
                <th scope="col">Tx Function Name</th>
                <th scope="col">Native Token Address</th>
                <th scope="col">Owner/Receiver Address</th>
                <th scope="col">Amount</th>
                <th scope="col">Nonce</th>
                <th scope="col">Wrapped Token Address</th>
                <th scope="col">Tx Validation Signature</th>
              </tr>
            </thead>
            <tbody>
              {eventsHistoryState.map((element, index) => (
                <tr key={index}>
                  <th scope="row">{index}</th>
                  <td>{TOKEN_BRIDGE_ADDRESSES[element["chainId"]]["network"] + " (#" + element["chainId"] + ")"}</td>
                  <td>{element["event"]}</td>
                  <td>{element["functionName"]}</td>
                  <td>
                    {shortenHex(element["tokenNativeAddress"], 4)}
                    <button className="btn btn-link btn-sm"
                      onClick={() => { navigator.clipboard.writeText(element["tokenNativeAddress"] + "") }}
                      style={{ marginBottom: "4px" }}>
                      <i className="bi bi-clipboard"></i>
                    </button>
                  </td>
                  <td>
                    {shortenHex(element["receiverOrOwnerAddress"], 4)}
                    <button className="btn btn-link btn-sm"
                      onClick={() => { navigator.clipboard.writeText(element["receiverOrOwnerAddress"] + "") }}
                      style={{ marginBottom: "4px" }}>
                      <i className="bi bi-clipboard"></i>
                    </button>
                  </td>
                  <td>{element["amount"]}</td>
                  <td>{element["nonce"]}</td>
                  <td>
                    {
                      element["wrappedTokenAddress"] ?
                        <>
                          {shortenHex(element["wrappedTokenAddress"], 4)}
                          <button className="btn btn-link btn-sm"
                            onClick={() => { navigator.clipboard.writeText(element["wrappedTokenAddress"] + "") }}
                            style={{ marginBottom: "4px" }}>
                            <i className="bi bi-clipboard"></i>
                          </button>
                        </>
                        :
                        ""
                    }
                  </td>
                  <td>
                    {
                      element["signature"] ?
                        <>
                          {shortenHex(element["signature"], 4)}
                          <button className="btn btn-link btn-sm"
                            onClick={() => { navigator.clipboard.writeText(element["signature"] + "") }}
                            style={{ marginBottom: "4px" }}>
                            <i className="bi bi-clipboard"></i>
                          </button>
                        </>
                        :
                        ""
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          :
          <></>
        }
      </div>
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

export default TokenBridgeValidatorComponent;
