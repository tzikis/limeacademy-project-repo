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

export enum Leader {
  UNKNOWN,
  BIDEN,
  TRUMP
}

const TokenBridgeComponent = ({ contractAddress }: TokenBridge) => {
  const { account, library } = useWeb3React<Web3Provider>();
  const tokenBridgeContract = useTokenBridgeContract(contractAddress);
  // const [currentLeader, setCurrentLeader] = useState<string>('Unknown');
  // const [name, setName] = useState<string | undefined>();
  // const [votesBiden, setVotesBiden] = useState<number | undefined>();
  // const [votesTrump, setVotesTrump] = useState<number | undefined>();
  // const [stateSeats, setStateSeats] = useState<number | undefined>();

  const [warningMessage, setWarningMessage] = useState<string>('');
  const [transactionPending, setTransactionPending] = useState<number>(0);
  const [txHash, setTxHash] = useState<string>('Unknown');

  const [tokenContractAddress, setTokenContractAddress] = useState<number>(0);
  const [tokenAmount, setTokenAmount] = useState<string>('');

  useEffect(() => {
    // getCurrentLeader();
  }, [])

  const getCurrentLeader = async () => {
    // const currentLeader = await tokenBridgeContract.currentLeader();
    // setCurrentLeader(currentLeader == Leader.UNKNOWN ? 'Unknown' : currentLeader == Leader.BIDEN ? 'Biden' : 'Trump')
  }

  const stateInput = (input) => {
    // setName(input.target.value)
  }

  const bideVotesInput = (input) => {
    // setVotesBiden(input.target.value)
  }

  const trumpVotesInput = (input) => {
    // setVotesTrump(input.target.value)
  }

  const seatsInput = (input) => {
    // setStateSeats(input.target.value)
  }

  const submitStateResults = async () => {
    // const result: any = [name, votesBiden, votesTrump, stateSeats];
    // const tx = await tokenBridgeContract.submitStateResult(result);
    // await tx.wait();
    // resetForm();
  }

  const resetForm = async () => {
    // setName('');
    // setVotesBiden(0);
    // setVotesTrump(0);
    // setStateSeats(0);
  }

  const tokenContractAddressChanged = (input) => {
    setTokenContractAddress(input.target.value)
  }

  const tokenAmountChanged = (input) => {
    setTokenAmount(input.target.value)
  }

  const  onAttemptToApproveOld = async() => {
		// const nonce = (await permitContractAddress.nonces(account)); // Our Token Contract Nonces
		
		const EIP712Domain = [ // array of objects -> properties from the contract and the types of them ircwithPermit
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
    ];

    const domain = {
        name: "Tzikis TokenBridge",
        version: '1',
    };

    const Validate = [ // array of objects -> properties from erc20withpermit
        { name: 'functionName', type: 'string' },
        { name: 'tokenAddress', type: 'address' },
        { name: 'amount', type: 'uint256' }
    ];

    const message = {
        functionName: "lock()", 
        tokenAddress: tokenContractAddress, // This is the address of the spender whe want to give permit to.
        amount: tokenAmount
    };

    let data = JSON.stringify({
        types: {
            EIP712Domain,
            Validate
        },
        domain,
        primaryType: 'Validate',
        message
    });

    console.log(data)
    const signatureLike = await library.send('eth_signTypedData_v4', [account, data]); // Library is a provider.

    // data = "testing testing";
    // data = formatBytes32String(data);
    // console.log(data);
    // const signatureLike = await library.send('eth_sign', [account, data]); // Library is a provider.

    
  //   const msgParams = [
  //     {
  //       type: 'string',      // Any valid solidity type
  //       name: 'function_name',     // Any string label you want
  //       value: 'lock()'  // The value to sign
  //    },
  //    {
  //     type: 'address',      // Any valid solidity type
  //     name: 'token_address',     // Any string label you want
  //     value: tokenContractAddress  // The value to sign
  //  },
  // //  {   
  // //      type: 'uint256',
  // //         name: 'amount',
  // //         value: tokenAmount
  // //     }
  //   ]   

    // const signatureLike = await library.send('eth_signTypedData', [msgParams, account]); // Library is a provider.

      // data = "testing testing";
    // data = formatBytes32String(data);

    // let msg= ["testing", TOKEN_BRIDGE_ADDRESS, 13];
    // console.log(data);
    // const signatureLike = await library.send('personal_sign', [account, msg]); // Library is a provider.


    const signature = await splitSignature(signatureLike);

    const preparedSignature = {
        v: signature.v,
        r: signature.r,
        s: signature.s,
        deadline
    };

    console.log(preparedSignature);
	  return preparedSignature;
}

const debugLockValidation = async() => {
  generateValidation("lock()", tokenContractAddress, account, tokenAmount, "1");
}

const debugBurnValidation = async() => {
  generateValidation("burn()", tokenContractAddress, account, tokenAmount, "1");
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

  console.log(message);
  const signatureLike = await library.send('eth_signTypedData_v4', [account, data]); // Library is a provider.
  console.log(signatureLike);
  const signature = await splitSignature(signatureLike);
  console.log(signature);
  return signature;
}

const onAttemptToApprove = async () => {
		// Account here is the wallet address
		const nonce = (await tokenBridgeContract.nonces(tokenContractAddress)); // Our Token Contract Nonces
		
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
        { name: 'amount', type: 'uint256' },
        { name: 'nonce', type: 'uint256' }
    ];

    const message = {
        functionName: "unlock()", // Wallet Address
        tokenAddress: tokenContractAddress, // This is the address of the spender whe want to give permit to.
        amount: tokenAmount,
        nonce: nonce.toHexString()
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

    console.log(message);
    const signatureLike = await library.send('eth_signTypedData_v4', [account, data]); // Library is a provider.
    const signature = await splitSignature(signatureLike);
    console.log(signature);
	  return signature;
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
      const burnNonce = "2"
      const signature = await generateValidation("burn()", tokenContractAddress, account, tokenAmount, burnNonce);
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
      const lockNonce = "5"
      const signature = await generateValidation("lock()", tokenContractAddress, account, tokenAmount, lockNonce);
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
      <h2>Lock/Unlock Token</h2>
      <label>
        Token Address:
        <input onChange={tokenContractAddressChanged} value={tokenContractAddress} type="text" name="lock_token_contract_address" />
        &nbsp;Amount:
        <input onChange={tokenAmountChanged} value={tokenAmount} type="number" name="lock_token_amount" />
      </label>
      <div className="button-wrapper">
        <button onClick={submitLockTokens}>Lock Tokens</button>
        <button onClick={submitUnlockTokens}>Unlock Tokens</button>
      </div>
      <div className="button-wrapper">
        <button onClick={submitMintTokens}>Mint Tokens</button>
        <button onClick={submitBurnTokens}>Burn Tokens</button>
      </div>
      <div className="button-wrapper">
        <button onClick={debugLockValidation}>Debug Lock Validation</button>
        <button onClick={debugBurnValidation}>Debug Burn Validation</button>
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
