import '~~/styles/main-page.css';
import { NETWORKS } from '@scaffold-eth/common/src/constants';
import { GenericContract } from 'eth-components/ant/generic-contract';
import {
  useContractReader,
  useBalance,
  useEthersAdaptorFromProviderOrSigners,
  useEventListener,
  useContractLoader,
} from 'eth-hooks';
import { useEthersAppContext } from 'eth-hooks/context';
import { useDexEthPrice } from 'eth-hooks/dapps';
import { asEthersAdaptor } from 'eth-hooks/functions';
import React, { FC, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Switch } from 'react-router-dom';

import { MainPageFooter, MainPageHeader, createPagesAndTabs, TContractPageList } from './components/main';
import { useScaffoldHooksExamples as useScaffoldHooksExamples } from './components/main/hooks/useScaffoldHooksExamples';

import { useAppContracts, useConnectAppContracts, useLoadAppContracts } from '~~/components/contractContext';
import { useCreateAntNotificationHolder } from '~~/components/main/hooks/useAntNotification';
import { useBurnerFallback } from '~~/components/main/hooks/useBurnerFallback';
import { useScaffoldProviders as useScaffoldAppProviders } from '~~/components/main/hooks/useScaffoldAppProviders';
import { BURNER_FALLBACK_ENABLED, MAINNET_PROVIDER } from '~~/config/app.config';
import { DAO } from './components/pages/dao/DAO';
import { transactor } from 'eth-components/functions';
import { EthComponentsSettingsContext } from 'eth-components/models';

/**
 * ⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️
 * See config/app.config.ts for configuration, such as TARGET_NETWORK
 * See appContracts.config.ts and externalContracts.config.ts to configure your contracts
 * See pageList variable below to configure your pages
 * See web3Modal.config.ts to configure the web3 modal
 * ⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️
 *
 * For more
 */

/**
 * The main component
 * @returns
 */
export const MainPage: FC = () => {
  const notificationHolder = useCreateAntNotificationHolder();
  // -----------------------------
  // Providers, signers & wallets
  // -----------------------------
  // 🛰 providers
  // see useLoadProviders.ts for everything to do with loading the right providers
  const scaffoldAppProviders = useScaffoldAppProviders();

  // 🦊 Get your web3 ethers context from current providers
  const ethersAppContext = useEthersAppContext();

  // if no user is found use a burner wallet on localhost as fallback if enabled
  useBurnerFallback(scaffoldAppProviders, BURNER_FALLBACK_ENABLED);

  // -----------------------------
  // Load Contracts
  // -----------------------------
  // 🛻 load contracts
  useLoadAppContracts();
  // 🏭 connect to contracts for mainnet network & signer
  const [mainnetAdaptor] = useEthersAdaptorFromProviderOrSigners(MAINNET_PROVIDER);
  useConnectAppContracts(mainnetAdaptor);
  // 🏭 connec to  contracts for current network & signer
  useConnectAppContracts(asEthersAdaptor(ethersAppContext));

  // -----------------------------
  // Hooks use and examples
  // -----------------------------
  // 🎉 Console logs & More hook examples:
  // 🚦 disable this hook to stop console logs
  // 🏹🏹🏹 go here to see how to use hooks!
  useScaffoldHooksExamples(scaffoldAppProviders);

  // -----------------------------
  // These are the contracts!
  // -----------------------------

  // init contracts

  const powDAO = useAppContracts('PowDAO', ethersAppContext.chainId);

  const mainnetDai = useAppContracts('DAI', NETWORKS.mainnet.chainId);
  const reEntrancyAttack = useAppContracts('ReEntrancyAttack', ethersAppContext.chainId);
  // keep track of a variable from the contract in the local React state:
  // const [purpose, update] = useContractReader(
  //   yourContract,
  //   yourContract?.purpose,
  //   [],
  //   yourContract?.filters.SetPurpose()
  // );

  // // 📟 Listen for broadcast events
  // const [setPurposeEvents] = useEventListener(yourContract, 'SetPurpose', 0);

  // -----------------------------
  // .... 🎇 End of examples
  // -----------------------------
  // 💵 This hook will get the price of ETH from 🦄 Uniswap:
  const [ethPrice] = useDexEthPrice(scaffoldAppProviders.mainnetAdaptor?.provider, scaffoldAppProviders.targetNetwork);

  // 💰 this hook will get your balance
  const [yourCurrentBalance] = useBalance(ethersAppContext.account);

  const [route, setRoute] = useState<string>('');
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  const signer = scaffoldAppProviders.localAdaptor?.signer;
  const settingsContext = useContext(EthComponentsSettingsContext);

  const tx = transactor(settingsContext, signer, undefined, undefined, true);

  const [submitProposalEvents] = useEventListener(powDAO, 'SubmitProposal', 0);
  const [processedProposalEvents] = useEventListener(powDAO, 'ProcessedProposal', 0);
  let processedDataSet: any[] = [];

  console.log('submitProposal ', submitProposalEvents);
  console.log('processedProposal ', processedProposalEvents);
  if (processedProposalEvents.length > 0) {
    for (let i = 0; i < submitProposalEvents.length; i++) {
      for (let j = 0; j < processedProposalEvents.length; j++) {
        if (parseInt(submitProposalEvents[i].args[4]) == parseInt(processedProposalEvents[j].args[4])) {
          processedDataSet.push(submitProposalEvents[i]);
        }
      }
    }
    const intersection = submitProposalEvents.filter((x) => !processedDataSet.includes(x));
    processedDataSet = intersection;
  } else {
    processedDataSet = submitProposalEvents;
  }

  // -----------------------------
  // 📃 Page List
  // -----------------------------
  // This is the list of tabs and their contents
  const pageList: TContractPageList = {
    mainPage: {
      name: 'PowDAO',
      content: (
        <DAO
          contractAddress={powDAO?.address}
          processedDataSet={processedDataSet}
          mainnetProvider={scaffoldAppProviders.mainnetAdaptor?.provider}
          price={ethPrice}
          tx={tx}
          blockExplorer={scaffoldAppProviders.targetNetwork.blockExplorer}
          powDAO={powDAO}
          recipientAddress={ethersAppContext.account}
        />
      ),
    },
    pages: [
      {
        name: 'PowDAOContract',
        content: (
          <GenericContract
            contractName="PowDAO Contract"
            contract={powDAO}
            mainnetAdaptor={scaffoldAppProviders.mainnetAdaptor}
            blockExplorer={scaffoldAppProviders.targetNetwork.blockExplorer}></GenericContract>
        ),
      },
      {
        name: 'ReEntrancyAttack',
        content: (
          <GenericContract
            contractName="ReEntrancyAttack"
            contract={reEntrancyAttack}
            mainnetAdaptor={scaffoldAppProviders.mainnetAdaptor}
            blockExplorer={scaffoldAppProviders.targetNetwork.blockExplorer}
          />
        ),
      },
    ],
  };
  const { tabContents, tabMenu } = createPagesAndTabs(pageList, route, setRoute);

  return (
    <div className="App">
      <MainPageHeader scaffoldAppProviders={scaffoldAppProviders} price={ethPrice} />
      {/* Routes should be added between the <Switch> </Switch> as seen below */}
      <BrowserRouter>
        {tabMenu}
        <Switch>
          {tabContents}
          {/* Subgraph also disabled in MainPageMenu, it does not work, see github issue https://github.com/scaffold-eth/scaffold-eth-typescript/issues/48! */}
          {/*
          <Route path="/subgraph">
            <Subgraph subgraphUri={subgraphUri} mainnetProvider={scaffoldAppProviders.mainnetAdaptor?.provider} />
          </Route>
          */}
        </Switch>
      </BrowserRouter>

      <MainPageFooter scaffoldAppProviders={scaffoldAppProviders} price={ethPrice} />
      <div style={{ position: 'absolute' }}>{notificationHolder}</div>
    </div>
  );
};
