import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Button, Card, Col, Input, List, notification, Row, Tag } from 'antd';
import { Address, AddressInput, EtherInput } from 'eth-components/ant';
import { TTransactorFunc } from 'eth-components/functions';
import { BigNumber, ethers } from 'ethers';
import React, { FC, useEffect, useState } from 'react';
import { PowDAO } from '~~/generated/contract-types';
interface DAOProps {
  contractAddress: string | undefined;
  recipientAddress: string | undefined;
  price: number | undefined;

  mainnetProvider: StaticJsonRpcProvider | undefined;

  processedDataSet: any[];

  blockExplorer: string | undefined;
  tx: TTransactorFunc | undefined;
  powDAO: PowDAO | undefined;
}

export const DAO: FC<DAOProps> = (props: DAOProps) => {
  const { contractAddress, price, mainnetProvider, processedDataSet, blockExplorer, powDAO, tx, recipientAddress } =
    props;
  const [toAddress, setToAddress] = useState<string>('');
  const [toAddKickAddress, setToAddKickAddress] = useState<string>();
  const [showMemberInfo, setShowMemberInfo] = useState('none');
  const [memberInfo, setMemberInfo] = useState<number>();
  const [memberReason, setMemberReason] = useState<string>();
  const [amount, setAmount] = useState<string>('');
  const [processProposalId, setProcessProposalId] = useState<string>();
  const [proposalSubmitDetails, setProposalSubmitDetails] = useState<string>();
  const [payoutResult, setPayoutResult] = useState<BigNumber>();
  const [payoutClicked, setPayoutClicked] = useState('none');

  const voteYes = async (proposalId: BigNumber) => {
    if (tx) {
      const result = await tx(powDAO?.submitVote(proposalId, 1));
      console.log(result);
    }
  };
  const voteNo = async (proposalId: BigNumber) => {
    if (tx) {
      const result = await tx(powDAO?.submitVote(proposalId, 2));
      console.log(result);
    }
  };
  return (
    <div style={{ margin: '0px' }}>
      <Row justify="center">
        <Col span={6} style={{ margin: '24px' }}>
          <Card bordered title="Members">
            <AddressInput
              autoFocus
              ensProvider={mainnetProvider}
              placeholder="Enter address"
              address={toAddress}
              onChange={(value) => {
                setToAddress(value);
              }}
            />
            <Button
              onClick={async () => {
                console.log(toAddress);
                const addressIsValid = ethers.utils.isAddress(toAddress);
                console.log('addressIsValid ', addressIsValid);
                if (addressIsValid == false) {
                  notification.error({
                    message: 'Invalid Address',
                    description: 'Address is not valid. Please check address again',
                  });
                  return;
                }

                const result = await powDAO?.members(toAddress);
                console.log(result);
                if (result) {
                  console.log(result[0].toNumber());
                  setMemberInfo(result[0].toNumber());
                  setShowMemberInfo('block');
                }
              }}>
              Search
            </Button>
            <div style={{ fontSize: '16px', margin: '12px', display: showMemberInfo }}>
              {memberInfo == 1 ? toAddress + ' is apart of the PowDAO 👍' : 'This address is NOT apart of the PowDAO'}
            </div>
          </Card>
        </Col>
        <Col span={6} style={{ margin: '24px' }}>
          <Card bordered title="Add/Kick Members">
            <AddressInput
              autoFocus
              ensProvider={mainnetProvider}
              placeholder="Enter address"
              address={toAddKickAddress}
              onChange={(value) => {
                setToAddKickAddress(value.toString());
              }}
            />
            <div style={{ margin: '8px' }}>
              <Input
                onChange={(e) => {
                  setMemberReason(e.target.value);
                }}
                placeholder="Enter details."
              />
            </div>
            <Button
              onClick={async () => {
                if (tx) {
                  if (toAddKickAddress == undefined) {
                    notification.error({
                      message: 'Message',
                      description: 'Address is empty',
                    });
                    return;
                  }
                  if (memberReason == undefined) {
                    notification.error({
                      message: 'Message',
                      description: 'Details is empty',
                    });
                    return;
                  }
                  const result = await tx(powDAO?.addMember(toAddKickAddress, memberReason));
                  console.log(result);
                }
              }}>
              Add
            </Button>
            <Button
              onClick={async () => {
                if (tx) {
                  if (toAddKickAddress == undefined) {
                    notification.error({
                      message: 'Message',
                      description: 'Address is empty',
                    });
                    return;
                  }
                  if (memberReason == undefined) {
                    notification.error({
                      message: 'Message',
                      description: 'Details is empty',
                    });
                    return;
                  }
                  const result = await tx(powDAO?.kickMember(toAddKickAddress, memberReason));
                  console.log(result);
                }
              }}>
              Kick
            </Button>
          </Card>
        </Col>
      </Row>
      <Row justify="center" style={{ margin: '18px' }}>
        <Col span={20}>
          <Card title="Vote">
            <List
              dataSource={processedDataSet} // Only setting this data on proposal submit, never updated when proposal is processed.
              header={<div>Proposal ID // Proposal Details</div>}
              renderItem={(item: any) => {
                console.log('item ', item);
                return (
                  <List.Item
                    key={item.proposalId}
                    actions={[
                      <Button
                        onClick={() => {
                          voteYes(item.args[4]);
                        }}>
                        Yes
                      </Button>,
                      <Button
                        onClick={() => {
                          voteNo(item.args[4]);
                        }}>
                        No
                      </Button>,
                    ]}>
                    <div style={{ margin: '8px' }}>ID: {item.args[4].toString()}</div>
                    <Address address={item.args[0]} ensProvider={mainnetProvider} fontSize={18} />
                    <div style={{ margin: '8px' }}>{item.args[2]}</div>
                    <div style={{ margin: '8px' }}>{ethers.utils.formatEther('' + item.args[1])} Ξ</div>
                    <div style={{ margin: '8px' }}>
                      {item.args[3][4] || item.args[3][5] ? (
                        item.args[3][4] ? (
                          <Tag color="cyan">Member Add</Tag>
                        ) : (
                          <Tag color="red">Member Kick</Tag>
                        )
                      ) : (
                        <Tag color="orange">Work</Tag>
                      )}
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row justify="center" style={{ margin: '24px' }}>
        <Col span={10}>
          <Card title="Create Proposal/Request">
            <Input
              onChange={(e) => {
                setProposalSubmitDetails(e.target.value);
              }}
              placeholder="Enter proposal details."
            />
            <div>
              <EtherInput
                price={price}
                value={amount}
                placeholder="Enter amount"
                onChange={(value) => {
                  setAmount(value);
                }}
              />
            </div>
            <Button
              onClick={async () => {
                if (proposalSubmitDetails == undefined) {
                  return notification.error({
                    message: 'Message',
                    description: 'Proposal details is empty.',
                  });
                }
                if (tx) {
                  const value = ethers.utils.parseEther(amount);
                  const result = await tx(powDAO?.submitProposal(value, proposalSubmitDetails));
                  console.log(result);
                }
              }}>
              Submit Proposal
            </Button>
          </Card>
        </Col>
      </Row>
      <Row justify="center" style={{ margin: '32px' }}>
        <Col span={4}>
          <Card title="Process Proposal">
            <Input
              style={{ width: '140px' }}
              onChange={(e) => {
                setProcessProposalId(e.target.value);
              }}
              placeholder="Enter Propsal ID"
            />
            <Button
              onClick={async () => {
                if (tx && processProposalId) {
                  const result = await tx(powDAO?.processProposal(processProposalId));
                }
              }}>
              Process
            </Button>
          </Card>
        </Col>
        <Col span={1}></Col>
        <Col>
          <Card>
            <div>
              <Button
                onClick={async () => {
                  if (recipientAddress && powDAO) {
                    const result = await powDAO?.payout(recipientAddress);
                    console.log(result.toString());
                    setPayoutResult(result);
                    setPayoutClicked('block');
                  }
                }}>
                Check Payout
              </Button>
              <div style={{ fontSize: '16px', margin: '12px', display: payoutClicked }}>
                {payoutResult?.gt(BigNumber.from(0))
                  ? ethers.utils.formatEther('' + payoutResult) + ' Ξ'
                  : 'No payout is currently available.'}
              </div>
            </div>
            <Button
              onClick={async () => {
                if (tx && recipientAddress) {
                  const result = await tx(powDAO?.getPayout(recipientAddress));
                  console.log(result);
                }
              }}
              style={{ margin: '4px' }}>
              Get Paid
            </Button>
          </Card>
        </Col>
      </Row>
      <Row justify="center" style={{ margin: '8px', fontSize: '18px' }}>
        To deposit into the DAO, send funds to the smart contract! 🔒
      </Row>
      <Row justify="center" style={{ margin: '0px', fontSize: '18px' }}>
        Etherscan Link:
      </Row>
      <Row justify="center">
        <div style={{ fontSize: '16px' }}>
          <a href={'https://etherscan.io/address/' + contractAddress} target="blank">
            <Address
              address={contractAddress}
              ensProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              fontSize={18}
            />
          </a>
        </div>
      </Row>
    </div>
  );
};
