// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IToken is IERC20 {
    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 _totalSupply,
        uint8 _decimals,
        address _factoryAddress
    ) external;

    function mint(address _to, uint256 _amount) external;

    function burn(address _userAddress, uint256 _amount) external;

    function adminRole(address _adminAddress) external;

    function addFactoryContract(address _factoryAddress) external;

    function freezeTokens(address _userAddress, uint256 _amount) external;
    function _transferToken(
        address _from,
        address _to,
        uint256 _amount
    ) external  returns (bool);

    function unfreezeTokens(address _userAddress, uint256 _amount) external;
     function getFreezeAmount(
        address _userAddress
    ) external view returns (uint256);
}
