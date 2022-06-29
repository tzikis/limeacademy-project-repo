import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useTokenBridgeContract from "../hooks/useTokenBridgeContract";

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

  const [eventsHistoryString, setEventsHistoryString] = useState<string>('');

  // useEffect(() => {
  //   console.log(chainId);
  // },[chainId])

  useEffect(() => {
    const eventsHistoryStorage = localStorage.getItem('eventsHistory')
    if(eventsHistoryStorage != null)
      eventsHistory = JSON.parse(eventsHistoryStorage);

    seteventsHistory(eventsHistory);

    tokenBridgeContract.on('Lock', lockHandler);
    tokenBridgeContract.on('Unlock', unlockHandler);
    tokenBridgeContract.on('Mint', mintHandler);
    tokenBridgeContract.on('Burn', burnHandler);
  }, [])

  const unlockHandler = (tokenNativeAddress, receiver, amount, tx) => {
    // console.log(tx);
    eventsHistory.push([chainId.toString(), "unlock()",tokenNativeAddress.toString(), receiver.toString(), amount.toString(), ""]);
    localStorage.setItem('eventsHistory', JSON.stringify(eventsHistory));
    seteventsHistory(eventsHistory);
  };


  const lockHandler = (tokenNativeAddress, receiver, amount, nonce, tx) => {
    // console.log(tx);
    eventsHistory.push([chainId.toString(), "lock()",tokenNativeAddress.toString(), receiver.toString(), amount.toString(), nonce.toString()]);
    localStorage.setItem('eventsHistory', JSON.stringify(eventsHistory));
    seteventsHistory(eventsHistory);
  };

  //TODO: Change order of receiver and amount if we change the contract?
  const burnHandler = (tokenNativeAddress, amount, receiver, nonce, tx) => {
    eventsHistory.push([chainId.toString(), "burn()",tokenNativeAddress.toString(), receiver.toString(), amount.toString(), nonce.toString()]);
    localStorage.setItem('eventsHistory', JSON.stringify(eventsHistory));
    seteventsHistory(eventsHistory);
  };

  const mintHandler = (tokenNativeAddress, amount, receiver, tx) => {
    // console.log(tx);
    eventsHistory.push([chainId.toString(), "mint()",tokenNativeAddress.toString(), receiver.toString(), amount.toString(), ""]);
    localStorage.setItem('eventsHistory', JSON.stringify(eventsHistory));
    seteventsHistory(eventsHistory);
  };

  const seteventsHistory = (list) => {
    const newListJSON = JSON.stringify(list);
    const newList = JSON.parse(newListJSON);
    newList.reverse();

    const eventsArray = newList.map((element, index) => (
      index + ": " + "Chain: " + element[0] + " Event: " + element[1] + " - tokenAddress: " + element[2] + " - receiver: " + element[3] + " - amount: " + element[4] + " nonce: " + element[5] + " - sig: " + element[6]
      ))
      const eventsString = eventsArray.join('\n')
      console.log(eventsString);

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
  
const debugLockValidation = async() => {
  const valSig = await generateValidation("lock()", tokenContractAddress, receiverAddress, tokenAmount, nonce);
  updateHistory("lock()", tokenContractAddress, receiverAddress, tokenAmount, nonce, valSig)
  setValidationSignature(valSig);
}

const debugBurnValidation = async() => {
  const valSig = await generateValidation("burn()", tokenContractAddress, receiverAddress, tokenAmount, nonce);
  updateHistory("burn()", tokenContractAddress, receiverAddress, tokenAmount, nonce, valSig)
  setValidationSignature(valSig);
}


const updateHistory = (functionName, tokenContractAddress, receiverAccount, tokenAmount, nonce, signature) => {
  for (var j = 0; j < eventsHistory.length; j++) {
    const eventFunctionName = eventsHistory[j][1];
    const eventTokenContractAddress = eventsHistory[j][2];
    const eventReceiverAccount = eventsHistory[j][3];
    const eventTokenAmount = eventsHistory[j][4];
    const eventNonce = eventsHistory[j][5];

    // console.log(j + " " + eventFunctionName + " " + eventTokenContractAddress + " " + eventReceiverAccount + " " + eventTokenAmount + " " + eventNonce + " wtf");
    // console.log(j + " " + functionName + " " + tokenContractAddress + " " + receiverAccount + " " + tokenAmount + " " + nonce + " wtf");
    
    if(functionName == eventFunctionName && tokenContractAddress == eventTokenContractAddress && receiverAccount == eventReceiverAccount && eventTokenAmount == tokenAmount && nonce == eventNonce){
      eventsHistory[j][6] = signature;
      localStorage.setItem('eventsHistory', JSON.stringify(eventsHistory));
      seteventsHistory(eventsHistory);
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
      <h2>Validator</h2>
      <h3>Generate Validations</h3>
      <label>
        Token Address:
        <input onChange={tokenContractAddressChanged} value={tokenContractAddress} type="text" name="lock_token_contract_address" />
        Token Owner/Receiver Address:
          <input onChange={receiverAddressChanged} value={receiverAddress} type="text" name="debug_token_owner_address" />
          &nbsp;Amount:
        <input onChange={tokenAmountChanged} value={tokenAmount} type="number" name="lock_token_amount" />
        Nonce: 
          <input onChange={nonceChanged} value={nonce} type="text" name="validator_nonce2" />
      </label>
      <div className="button-wrapper">
        <button onClick={debugLockValidation}>Generate Lock Validation</button> &nbsp;
        <button onClick={debugBurnValidation}>Generate Burn Validation</button>
      </div>
      <p>Validation signature: {validationSignature}</p>
      <pre>{eventsHistoryString}</pre>
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
