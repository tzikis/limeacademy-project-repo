import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import { TOKEN_BRIDGE_ADDRESS } from "../constants";
import useTokenBridgeContract from "../hooks/useTokenBridgeContract";


import { splitSignature } from "@ethersproject/bytes";
import { formatBytes32String } from "ethers/lib/utils";

import type {WrappedTokenParamsStruct} from "../contracts/types";
type TokenBridge = {
  contractAddress: string;
};

var eventsList: any = [];

const TokenBridgeComponent = ({ contractAddress }: TokenBridge) => {
  const { account, library, chainId } = useWeb3React<Web3Provider>();
  const tokenBridgeContract = useTokenBridgeContract(contractAddress);

  const [warningMessage, setWarningMessage] = useState<string>('');
  const [transactionPending, setTransactionPending] = useState<number>(0);
  const [txHash, setTxHash] = useState<string>('Unknown');

  const [tokenContractAddress, setTokenContractAddress] = useState<number>(0);
  const [tokenAmount, setTokenAmount] = useState<string>('');

  const [lockNonce, setLockNonce] = useState<string>('');
  const [burnNonce, setBurnNonce] = useState<string>('');

  const [lockValidationSignature, setLockValidationSignature] = useState<string>('');
  const [burnValidationSignature, setBurnValidationSignature] = useState<string>('');

  const [debugAccount, setDebugAccount] = useState<string>('');
  const [validationSignature, setValidationSignature] = useState<string>('');

  const [eventsListString, setEventsListString] = useState<string>('');

  // useEffect(() => {
  //   console.log(chainId);
  // },[chainId])

  useEffect(() => {
    const eventsListStorage = localStorage.getItem('eventsList')
    if(eventsListStorage != null)
      eventsList = JSON.parse(eventsListStorage);

    setEventsList(eventsList);

    tokenBridgeContract.on('Lock', lockHandler);
    tokenBridgeContract.on('Unlock', unlockHandler);
    tokenBridgeContract.on('Mint', mintHandler);
    tokenBridgeContract.on('Burn', burnHandler);
  }, [])

  const unlockHandler = (tokenNativeAddress, receiver, amount, tx) => {
    // console.log(tx);
    eventsList.push([chainId.toString(), "unlock()",tokenNativeAddress.toString(), receiver.toString(), amount.toString(), ""]);
    localStorage.setItem('eventsList', JSON.stringify(eventsList));
    setEventsList(eventsList);
  };


  const lockHandler = (tokenNativeAddress, receiver, amount, nonce, tx) => {
    // console.log(tx);
    eventsList.push([chainId.toString(), "lock()",tokenNativeAddress.toString(), receiver.toString(), amount.toString(), nonce.toString()]);
    localStorage.setItem('eventsList', JSON.stringify(eventsList));
    setEventsList(eventsList);
  };

  //TODO: Change order of receiver and amount if we change the contract?
  const burnHandler = (tokenNativeAddress, amount, receiver, nonce, tx) => {
    eventsList.push([chainId.toString(), "burn()",tokenNativeAddress.toString(), receiver.toString(), amount.toString(), nonce.toString()]);
    localStorage.setItem('eventsList', JSON.stringify(eventsList));
    setEventsList(eventsList);
  };

  const mintHandler = (tokenNativeAddress, amount, receiver, tx) => {
    // console.log(tx);
    eventsList.push([chainId.toString(), "mint()",tokenNativeAddress.toString(), receiver.toString(), amount.toString(), ""]);
    localStorage.setItem('eventsList', JSON.stringify(eventsList));
    setEventsList(eventsList);
  };

  const setEventsList = (list) => {
    const newListJSON = JSON.stringify(list);
    const newList = JSON.parse(newListJSON);
    newList.reverse();

    const eventsArray = newList.map((element, index) => (
      index + ": " + "Chain: " + element[0] + " Event: " + element[1] + " - tokenAddress: " + element[2] + " - receiver: " + element[3] + " - amount: " + element[4] + " nonce: " + element[5]
      ))
      const eventsString = eventsArray.join('\n')
      console.log(eventsString);

      setEventsListString(eventsString);


  }

  const tokenContractAddressChanged = (input) => {
    setTokenContractAddress(input.target.value)
  }

  const tokenAmountChanged = (input) => {
    setTokenAmount(input.target.value)
  }

  const lockNonceChanged = (input) => {
    setLockNonce(input.target.value)
  }

  const burnNonceChanged = (input) => {
    setBurnNonce(input.target.value)
  }


  const lockValidationSignatureChanged = (input) => {
    setLockValidationSignature(input.target.value)
  }

  const burnValidationSignatureChanged = (input) => {
    setBurnValidationSignature(input.target.value)
  }

  const debugAccountChanged = (input) => {
    setDebugAccount(input.target.value)
  }
  
const debugLockValidation = async() => {
  const valSig = await generateValidation("lock()", tokenContractAddress, debugAccount, tokenAmount, lockNonce);
  setValidationSignature(valSig);
}

const debugBurnValidation = async() => {
  const valSig = await generateValidation("burn()", tokenContractAddress, debugAccount, tokenAmount, burnNonce);
  setValidationSignature(valSig);
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

  // console.log(message);
  const signatureLike = await library.send('eth_signTypedData_v4', [account, data]); // Library is a provider.
  // console.log(signatureLike);
  // const signature = await splitSignature(signatureLike);
  // console.log(signature);
  return signatureLike;
}

  const submitLockTokens = async () => {

    try {
      // const tx = await tokenBridgeContract.estimateGas.lock("01", lockTokenContractAddress, lockTokenAmount);
      // const tx = await tokenBridgeContract.lock("01", lockTokenContractAddress, lockTokenAmount);
      const tx = await tokenBridgeContract.lock(tokenContractAddress, tokenAmount);

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
      const tx = await tokenBridgeContract.unlock(tokenContractAddress, account, tokenAmount, burnNonce, signature.v, signature.r, signature.s);

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

      const wrappedTokenInfo = {name: "Hello World", symbol: "yay"};
      // const wrappedTokenInfo = ["Hello World", "yay"];
      // const signatureLike = await generateValidation("lock()", tokenContractAddress, account, tokenAmount, lockNonce);
      // const signature = await splitSignature(signatureLike);
      const signature = await splitSignature(lockValidationSignature);
      const tx = await tokenBridgeContract.mint(tokenContractAddress, account, tokenAmount, lockNonce, wrappedTokenInfo, signature.v, signature.r, signature.s);

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

  const submitBurnTokens = async () => {
    try {
      const tx = await tokenBridgeContract.burn(tokenContractAddress, tokenAmount);

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
        <input onChange={tokenContractAddressChanged} value={tokenContractAddress} type="text" name="lock_token_contract_address" />
        &nbsp;Amount:
        <input onChange={tokenAmountChanged} value={tokenAmount} type="number" name="lock_token_amount" />
      </label>
      <h3>Native</h3>
      <div className="button-wrapper">
        <button onClick={submitLockTokens}>Lock Tokens</button> &nbsp;
        <label>
          - Burn Nonce: 
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
        </label>
        <button onClick={submitMintTokens}>Mint Tokens</button> &nbsp; - &nbsp;
        <button onClick={submitBurnTokens}>Burn Tokens</button>
      </div>
      <h3>Generate Validations</h3>
      <label>
          Token Owner/Receiver Address:
          <input onChange={debugAccountChanged} value={debugAccount} type="text" name="debug_token_owner_address" />
      </label>
      <div className="button-wrapper">
        <button onClick={debugLockValidation}>Generate Lock Validation</button>
        <button onClick={debugBurnValidation}>Generate Burn Validation</button>
      </div>
      <p>Validation signature: {validationSignature}</p>

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
