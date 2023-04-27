// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.15;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./interfaces/IFactory.sol";

contract TokenContract is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    AccessControlUpgradeable
{
    uint256 private _limitSupply;
    uint8 private decimals_;

    IFactory private factoryAddress;
    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");

    mapping(address => bool) internal frozen;
    mapping(address => uint256) internal frozenTokens;

    event TokensUnfrozen(address indexed _userAddress, uint256 _amount);

    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Checks that the caller has the `ADMIN_ROLE`.
     * Reverts with "OnlyAdmin" if the caller does not have the `ADMIN_ROLE`.
     */
    function _onlyFactory() internal view {
        require(hasRole(FACTORY_ROLE, msg.sender), "TC:OnlyFactory");
    }

    /**
     * @dev Initializes the contract with the given parameters.
     *
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     * @param _initialSupply The initial supply of the token.
     * @param _decimals The number of decimals for the token.
     * @param _factoryAddress The address of the factory contract that created this token contract.
     */
    function initialize(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        uint8 _decimals,
        address _factoryAddress
    ) public initializer {
        __ERC20_init(_name, _symbol);
        _limitSupply = _initialSupply;
        decimals_ = _decimals;
        _setupRole(FACTORY_ROLE, _factoryAddress);

        __Ownable_init();
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     */

    function decimals() public view override returns (uint8) {
        return decimals_;
    }

    /**
     * @dev Returns the Max supply of the token, which is equal to the limit supply.
     * @return The limit supply of the token.
     */
    function maxSupply() public view returns (uint256) {
        return _limitSupply;
    }

    /**
     * @dev Sets the factory contract address.
     * @param _factoryAddress The address of the factory contract.
     */

    function addFactoryContract(address _factoryAddress) external onlyOwner {
        factoryAddress = IFactory(_factoryAddress);
    }

    /**
     *  @dev mint tokens on a wallet
     *  @param _to Address to mint the tokens to.
     *  @param _amount Amount of tokens to mint.
     *  emits a `Transfer` event
     */

    function mint(address _to, uint256 _amount) public {
        _onlyFactory();

        require(
            totalSupply() + _amount <= _limitSupply,
            "TC:Amount exceeds totalSupply"
        );

        _mint(_to, _amount);
    }

    /**
     *  @dev burn tokens on a wallet
     *  In case the `account` address has not enough free tokens (unfrozen tokens)
     *  but has a total balance higher or equal to the `value` amount
     *  the amount of frozen tokens is reduced in order to have enough free tokens
     *  to proceed the burn, in such a case, the remaining balance on the `account`
     *  is 100% composed of frozen tokens post-transaction.
     *  @param _userAddress Address to burn the tokens from.
     *  @param _amount Amount of tokens to burn.
     *  This function can only be called by a wallet set as admin of the token
     *  emits a `TokensUnfrozen` event if `_amount` is higher than the free balance of `_userAddress`
     *  emits a `Transfer` event
     */

    function burn(address _userAddress, uint256 _amount) external {
        _onlyFactory();
        uint256 freeBalance = balanceOf(_userAddress) -
            frozenTokens[_userAddress];
        if (_amount > freeBalance) {
            uint256 tokensToUnfreeze = _amount - (freeBalance);
            frozenTokens[_userAddress] =
                frozenTokens[_userAddress] -
                (tokensToUnfreeze);
            emit TokensUnfrozen(_userAddress, tokensToUnfreeze);
        }
        _burn(_userAddress, _amount);
    }

    /**
     * @dev Transfers tokens from one address to another.
     * @param _from The address to transfer tokens from.
     * @param _to The address to transfer tokens to.
     * @param _amount The amount of tokens to transfer.
     * @return A boolean indicating whether the transfer was successful.
     */

    function _transferToken(
        address _from,
        address _to,
        uint256 _amount
    ) public returns (bool) {
        _onlyFactory();

        uint256 balance = balanceOf(_from);
        uint256 availableBalance = balance - frozenTokens[_from];

        require(availableBalance >= _amount, "TC:Insufficient Balance");

        _transfer(_from, _to, _amount);
        return true;
    }

    /**
     *  @dev freezes token amount specified for given address.
     *  @param _userAddress The address for which to update frozen tokens
     *  @param _amount Amount of Tokens to be frozen
     *  This function can only be called by a wallet set as admin of the token
     *  emits a `TokensFrozen` event
     */

    function freezeTokens(address _userAddress, uint256 _amount) external {
        _onlyFactory();
        uint256 balance = balanceOf(_userAddress);
        require(
            balance >= frozenTokens[_userAddress] + _amount,
            "TC:Amount exceeds available balance"
        );
        frozenTokens[_userAddress] = frozenTokens[_userAddress] + (_amount);
    }

    /**
     *  @dev unfreezes token amount specified for given address
     *  @param _userAddress The address for which to update frozen tokens
     *  @param _amount Amount of Tokens to be unfrozen
     *  This function can only be called by a wallet set as admin of the token
     *  emits a `TokensUnfrozen` event
     */

    function unfreezeTokens(address _userAddress, uint256 _amount) external {
        _onlyFactory();
        require(
            frozenTokens[_userAddress] >= _amount,
            "TC:Amount should be less than or equal to frozen tokens"
        );
        frozenTokens[_userAddress] = frozenTokens[_userAddress] - (_amount);
    }

    /**
     *  @dev Returns the amount of tokens that are  frozen on a wallet
     *  the amount of frozen tokens is always <= to the total balance of the wallet
     *  @param _userAddress the address of the wallet on which getFrozenTokens is called
     */

    function getFreezeAmount(
        address _userAddress
    ) external view returns (uint256) {
        return frozenTokens[_userAddress];
    }
}
