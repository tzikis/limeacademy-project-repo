import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useTokenBridgeContract from "../hooks/useTokenBridgeContract";

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

  const [lockTokenContractAddress, setLockTokenContractAddress] = useState<number>(0);
  const [lockTokenAmount, setLockTokenAmount] = useState<string>('');

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

  const lockTokenContractAddressChanged = (input) => {
    setLockTokenContractAddress(input.target.value)
  }

  const lockTokenAmountChanged = (input) => {
    setLockTokenAmount(input.target.value)
  }


  const submitLockTokens = async () => {

    try {
      // const tx = await tokenBridgeContract.estimateGas.lock("01", lockTokenContractAddress, lockTokenAmount);
      // const tx = await tokenBridgeContract.lock("01", lockTokenContractAddress, lockTokenAmount);
      const tx = await tokenBridgeContract.lock(lockTokenContractAddress, lockTokenAmount);

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

  return (
    <div className="results-form">
      {/*
    <p>
      Current Leader is: {currentLeader}
    </p>
    <form>
      <label>
        State:
        <input onChange={stateInput} value={name} type="text" name="state" />
      </label>
      <label>
        BIDEN Votes:
        <input onChange={bideVotesInput} value={votesBiden} type="number" name="biden_votes" />
      </label>
      <label>
        TRUMP Votes:
        <input onChange={trumpVotesInput} value={votesTrump} type="number" name="trump_votes" />
      </label>
      <label>
        Seats:
        <input onChange={seatsInput} value={stateSeats} type="number" name="seats" />
      </label>
    </form>
    <div className="button-wrapper">
      <button onClick={submitStateResults}>Submit Results</button>
    </div>
     */}
      <h2>Lock/Unlock Token</h2>
      <label>
        Token Address:
        <input onChange={lockTokenContractAddressChanged} value={lockTokenContractAddress} type="text" name="lock_token_contract_address" />
        &nbsp;Amount:
        <input onChange={lockTokenAmountChanged} value={lockTokenAmount} type="number" name="lock_token_amount" />
      </label>
      <div className="button-wrapper">
        <button onClick={submitLockTokens}>Lock Tokens</button>
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
