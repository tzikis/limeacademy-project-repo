import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useTokenBridgeContract from "../hooks/useTokenBridgeContract";

import { splitSignature } from "@ethersproject/bytes";

type TokenBridge = {
  contractAddress: string;
};

var eventsHistory: any = [];

const TokenBridgeValidatorComponent = ({ contractAddress }: TokenBridge) => {
  const { account, library, chainId } = useWeb3React<Web3Provider>();
  const tokenBridgeContract = useTokenBridgeContract(contractAddress);

  const [tokenContractAddress, setTokenContractAddress] = useState<number>(0);
  const [tokenAmount, setTokenAmount] = useState<string>('');

  const [nonce, setNonce] = useState<string>('');

  const [receiverAddress, setReceiverAddress] = useState<string>('');
  const [validationSignature, setValidationSignature] = useState<string>('');
  const [validationVerificationResponse, setValidationVerificationResponse] = useState<string>('');

  const [eventsHistoryString, setEventsHistoryString] = useState<string>('');

  const [contractOwner, setContractOwner] = useState<string>('');

  // useEffect(() => {
  //   console.log(chainId);
  // },[chainId])

    useEffect(() => {
      checkOwner();
  },[account])

  const checkOwner = async() => {
    const contractOwner = await tokenBridgeContract.owner();
    setContractOwner(contractOwner);
  }

    useEffect(() => {
    const eventsHistoryStorage = localStorage.getItem('eventsHistory')
    if(eventsHistoryStorage != null)
      eventsHistory = JSON.parse(eventsHistoryStorage);
    else
      eventsHistory = [];

    setEventsHistory(eventsHistory);

    tokenBridgeContract.on('Lock', lockHandler);
    tokenBridgeContract.on('Unlock', unlockHandler);
    tokenBridgeContract.on('Mint', mintHandler);
    tokenBridgeContract.on('Burn', burnHandler);
  }, [])

  const unlockHandler = (tokenNativeAddress, receiver, amount, tx) => {
    // console.log(tx);
    const newEventStorageObject = {
      chainId: chainId.toString(),
      event: "Unlock",
      functionName: "unlock()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount:amount.toString()
    };
    eventsHistory.push(newEventStorageObject);
    localStorage.setItem('eventsHistory', JSON.stringify(eventsHistory));
    setEventsHistory(eventsHistory);
  };


  const lockHandler = (tokenNativeAddress, receiver, amount, nonce, tx) => {
    // console.log(tx);
    const newEventStorageObject = {
      chainId: chainId.toString(),
      event: "Lock",
      functionName: "lock()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount:amount.toString(),
      nonce: nonce.toString(),
    };
    eventsHistory.push(newEventStorageObject);
    localStorage.setItem('eventsHistory', JSON.stringify(eventsHistory));
    setEventsHistory(eventsHistory);
  };

  const burnHandler = (tokenNativeAddress, receiver, amount, wrappedTokenAddress, nonce, tx) => {
    const newEventStorageObject = {
      chainId: chainId.toString(),
      event: "Burn",
      functionName: "burn()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount:amount.toString(),
      nonce: nonce.toString(),
      wrappedTokenAddress: wrappedTokenAddress.toString()
    };
    eventsHistory.push(newEventStorageObject);
    localStorage.setItem('eventsHistory', JSON.stringify(eventsHistory));
    setEventsHistory(eventsHistory);
  };

  const mintHandler = (tokenNativeAddress, receiver, amount, wrappedTokenAddress, tx) => {
    // console.log(tx);
    const newEventStorageObject = {
      chainId: chainId.toString(),
      event: "Mint",
      functionName: "mint()",
      tokenNativeAddress: tokenNativeAddress.toString(),
      receiverOrOwnerAddress: receiver.toString(),
      amount:amount.toString(),
      wrappedTokenAddress: wrappedTokenAddress.toString()
    };
    eventsHistory.push(newEventStorageObject);
    localStorage.setItem('eventsHistory', JSON.stringify(eventsHistory));
    setEventsHistory(eventsHistory);
  };

  const setEventsHistory = (list) => {
    const newListJSON = JSON.stringify(list);
    const newList = JSON.parse(newListJSON);
    newList.reverse();

    const eventsArray = newList.map((element, index) => (
      index + ": " + "Chain: " + element.chainId + " Event: " + element.event + " Function Name: " + element.functionName + " - nativeTokenAddress: " + element.tokenNativeAddress + " - receiver/owner: " + element.receiverOrOwnerAddress + " - amount: " + element.amount + " nonce: " + element.nonce + " wrappedTokenAddress: " + element.wrappedTokenAddress + " signature: " + element.signature
      ))
      const eventsString = eventsArray.join('\n')
      // console.log(eventsString);

      setEventsHistoryString(eventsString);


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
  
const generateLockValidation = async() => {
  const valSig = await generateValidation("lock()", tokenContractAddress, receiverAddress, tokenAmount, nonce);
  updateHistory("lock()", tokenContractAddress, receiverAddress, tokenAmount, nonce, valSig)
  setValidationSignature(valSig);
}

const generateBurnValidation = async() => {
  const valSig = await generateValidation("burn()", tokenContractAddress, receiverAddress, tokenAmount, nonce);
  updateHistory("burn()", tokenContractAddress, receiverAddress, tokenAmount, nonce, valSig)
  setValidationSignature(valSig);
}

const testLockValidation = async() => {
  const valSig = await generateValidation("lock()", tokenContractAddress, receiverAddress, tokenAmount, nonce);
  try {
    const signature = await splitSignature(valSig);
    // setTransactionPending(1);
    // setWarningMessage("Unlocking token in Token Bridge Contract.");
    const response = await tokenBridgeContract.verify("lock()", tokenContractAddress, account, tokenAmount, nonce, signature.v, signature.r, signature.s);
    // setWarningMessage("Unlocking from Token Bridge Contract was successful.");
    // setTransactionPending(2);
    setValidationSignature(valSig);
    setValidationVerificationResponse(response.toString())
  }
  catch (error) {
    console.log(error)
    console.error(error)
    // setWarningMessage("Sorry, we couldn't do that. An error occured");
  }

}

const testBurnValidation = async() => {
  const valSig = await generateValidation("burn()", tokenContractAddress, receiverAddress, tokenAmount, nonce);
  try {
    const signature = await splitSignature(valSig);
    // setTransactionPending(1);
    // setWarningMessage("Unlocking token in Token Bridge Contract.");
    const response = await tokenBridgeContract.verify("burn()", tokenContractAddress, account, tokenAmount, nonce, signature.v, signature.r, signature.s);
    // setWarningMessage("Unlocking from Token Bridge Contract was successful.");
    // setTransactionPending(2);
    setValidationSignature(valSig);
    setValidationVerificationResponse(response.toString())
  }
  catch (error) {
    console.log(error)
    console.error(error)
    // setWarningMessage("Sorry, we couldn't do that. An error occured");
  }

}

const updateHistory = (functionName, tokenContractAddress, receiverAccount, tokenAmount, nonce, signature) => {
  for (var j = 0; j < eventsHistory.length; j++) {
    const eventFunctionName = eventsHistory[j].functionName;
    const eventTokenContractAddress = eventsHistory[j].tokenNativeAddress;
    const eventReceiverAccount = eventsHistory[j].receiverOrOwnerAddress;
    const eventTokenAmount = eventsHistory[j].amount;
    const eventNonce = eventsHistory[j].nonce;

    // console.log(j + " " + eventFunctionName + " " + eventTokenContractAddress + " " + eventReceiverAccount + " " + eventTokenAmount + " " + eventNonce + " wtf");
    // console.log(j + " " + functionName + " " + tokenContractAddress + " " + receiverAccount + " " + tokenAmount + " " + nonce + " wtf");
    
    if(functionName == eventFunctionName && tokenContractAddress == eventTokenContractAddress && receiverAccount == eventReceiverAccount && eventTokenAmount == tokenAmount && nonce == eventNonce){
      eventsHistory[j].signature = signature;
      localStorage.setItem('eventsHistory', JSON.stringify(eventsHistory));
      setEventsHistory(eventsHistory);
      break;
    }
  }

}

const generateValidation = async (functionName, tokenAddress, receiverAddress, amount, nonce) => {
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
      { name: 'tokenAddress', type: 'address' },
      { name: 'receiverAddress', type: 'address' },
      { name: 'amount', type: 'uint32' },
      { name: 'nonce', type: 'uint32' }
  ];

  const message = {
      functionName: functionName, // Wallet Address
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
        <h2>Validator</h2>
        <h3>Generate Validations</h3>
        <label>
          Token Address:
          <input onChange={tokenContractAddressChanged} value={tokenContractAddress} type="text" name="validator_token_contract_address" />
          Token Owner/Receiver Address:
            <input onChange={receiverAddressChanged} value={receiverAddress} type="text" name="validator_token_receiver_owner_address" />
            &nbsp;Amount:
          <input onChange={tokenAmountChanged} value={tokenAmount} type="number" name="validator_token_amount" />
          Nonce: 
            <input onChange={nonceChanged} value={nonce} type="text" name="validator_nonce" />
        </label>
        <div className="button-wrapper">
          <button onClick={generateLockValidation}>Generate Lock Validation</button> &nbsp;
          <button onClick={generateBurnValidation}>Generate Burn Validation</button>
        </div>
        <div className="button-wrapper">
          <button onClick={testLockValidation}>Test Lock Validation Verification</button> &nbsp;
          <button onClick={testBurnValidation}>Test Burn Validation Verification</button>
        </div>
        <p>Validation signature: {validationSignature}</p>
        <p>Verification response: {validationVerificationResponse}</p>
        <pre>{eventsHistoryString}</pre>
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
