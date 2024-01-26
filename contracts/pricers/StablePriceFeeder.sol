/* SPDX-License-Identifier: UNLICENSED */
pragma solidity 0.6.10;

contract StableAggregator {

  function getRoundData(uint80 _roundId)
    public
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    roundId = _roundId;
    answer = 100000000;
    startedAt = block.timestamp;
    updatedAt = block.timestamp;
    answeredInRound = _roundId;

    return (roundId, answer, startedAt, updatedAt, answeredInRound);
  }

  function latestRoundData()
    public
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    roundId = uint80(block.number);
    answer = 100000000;
    startedAt = block.timestamp;
    updatedAt = block.timestamp;
    answeredInRound = uint80(block.number);

    return (roundId, answer, startedAt, updatedAt, answeredInRound);
  }

  function decimals()
    external
    view
    returns (uint8)
  {
    return 8;
  }

  function description()
    external
    view
    returns (string memory)
  {
    return "BUSD / USD";
  }
}