// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./BasicMetaTransaction.sol";

import "./interfaces/IToken.sol";

contract FactoryContract is
    BasicMetaTransaction,
    UUPSUpgradeable,
    AccessControlUpgradeable
{
    address public masterToken;
    address public owner;
    address public poolAddress;

    struct TokenInfo {
        string name;
        string symbol;
        uint8 decimals;
        uint256 initialSupply;
        address tokenAddress;
    }

    mapping(address => TokenInfo) private tokenRegister;
    mapping(address => bool) private _registered;
    mapping(address => mapping(address => bool)) private _tokenBlacklisted;
    mapping(address => bool) private _platformBlacklisted;

    event TokenRegistered(
        address indexed tokenAddress,
        TokenInfo indexed tokenDetails
    );
    event TokenCreated(
        string name,
        string symbol,
        address tokenAddress,
        string _uniqueId
    );
    event TokenUnregistered(
        address indexed tokenAddress,
        string indexed name,
        string indexed symbol
    );
    event MintToken(
        address indexed _tokenAddress,
        address indexed _to,
        uint256 _amount,
        string str
    );
    event BurnToken(
        address indexed _tokenAddress,
        address indexed _poolAddress,
        address indexed _CFOAddress,
        uint256 _amount
    );
    event blackListedToken(
        address indexed _tokenAddress,
        address indexed _userAddress,
        bool indexed _status,
        string _uniqueId
    );
    event blackListedPlatform(
        address indexed _userAddress,
        bool indexed _status,
        string _uniqueId
    );
    event TransferWithId(
        address indexed _from,
        address indexed _to,
        uint256 _amount,
        string str,
        uint _type
    );
    event TokensFrozen(
        address indexed tokenAddress,
        address indexed userAddress,
        uint256 amount,
        string _uniqueId
    );

    event TokensUnfrozen(
        address indexed tokenAddress,
        address indexed userAddress,
        uint256 amount,
        string _uniqueId
    );

    event PoolAddressChnaged(
        address indexed _OldPoolAddress,
        address indexed _NewPoolAddress
    );

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CFO_ROLE = keccak256("CFO_ROLE)");

    // Modifier to restrict function calls to registered tokens only.

    modifier onlyRegisteredToken(address _tokenAddress) {
        require(_registered[_tokenAddress], "FC: Token not registered");
        _;
    }
    // Modifier to allow only contract address.

    modifier onlyContract(address _contractAddress) {
        require(
            Address.isContract(address(_contractAddress)),
            "FC:address is not a contract"
        );
        _;
    }

    // Modifier to restrict function calls to registered tokens only.

    modifier onlyUnregisteredToken(address _tokenAddress) {
        require(!_registered[_tokenAddress], "FC: Token already registered");
        _;
    }
    // Modifier to restrict function calls if zero address is passed
    modifier notZeroAddress(address _address) {
        require(_address != address(0), "FC: Zero address not allowed");
        _;
    }
    // Modifier to restrict if amount passes is zero

    modifier amountGreaterThanZero(uint _amount) {
        require(_amount > 0, "FC:amount should be greater than zero");
        _;
    }

    // Modifier to restrict function calls to users with the ADMIN_ROLE or DEFAULT_ADMIN_ROLE .
    modifier onlyAdmins() {
        require(
            hasRole(ADMIN_ROLE, _msgSender()) ||
                hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "FC: Caller is not an admin or Default Admin "
        );
        _;
    }
    // Modifier to restrict function calls to users with the CFO_ROLE.
    modifier onlyCFO() {
        require(hasRole(CFO_ROLE, _msgSender()), "FC: Caller is not a CFO");
        _;
    }

    //Modifier to check if a user account is not blacklisted for a given token.

    modifier notTokenBlacklisted(address _tokenAddress, address _userAddress) {
        require(
            !_tokenBlacklisted[_tokenAddress][_userAddress],
            "FC: Account blacklisted for a given Token."
        );
        _;
    }

    //Modifier to check if a user account is not blacklisted on platform.

    modifier notPlatformBlacklisted(address _userAddress) {
        require(
            !_platformBlacklisted[_userAddress],
            "FC: Account blacklisted on Platform"
        );
        _;
    }

    /**
     * @dev Initializes the contract with the provided parameters
     * @param _masterToken The address of the master token contract
     * @param _owner The address of the contract owner
     * @param _cfoAddress The address of the chief financial officer
     * @param _poolAddress The address of the token pool
     */

    function initialize(
        address _masterToken,
        address _owner,
        address _cfoAddress,
        address _poolAddress
    )
        external
        initializer
        notZeroAddress(_masterToken)
        onlyContract(_masterToken)
        notZeroAddress(_owner)
        notZeroAddress(_poolAddress)
    {
        masterToken = _masterToken;
        owner = _owner;
        poolAddress = _poolAddress;
        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(ADMIN_ROLE, _owner);
        _setupRole(CFO_ROLE, _cfoAddress);
    }

    function _authorizeUpgrade(address) internal override onlyAdmins {}

    /**

    @dev Grants the admin role to the specified address.
    @param _address The address to grant the admin role to.
    @notice This function can only be called by the address with ADMIN_ROLE and DEFAULT_ADMIN_ROLE .
    */

    function addAdminRole(address _address) public onlyAdmins {
        require(!isAdmin(_address), "FC:Admin role Exist");
        _setupRole(ADMIN_ROLE, _address);
    }

    /**

    @dev Grants the CFO_ROLE to the specified address.
    @param _address The address to grant the CFO_ROLE  to.
    @notice This function can only be called by the address with ADMIN_ROLE and DEFAULT_ADMIN_ROLE .
    */

    function addCFORole(address _address) public onlyAdmins {
        require(!isCFO(_address), "FC:CFO role Exist");
        _setupRole(CFO_ROLE, _address);
    }

    /**
     * @dev Revokes the ADMIN_ROLE from the specified address.
     * @param _address The address to revoke the ADMIN_ROLE from.
     * @notice This function can only be called by the address with ADMIN_ROLE and DEFAULT_ADMIN_ROLE .
     */
    function revokeAdminRole(address _address) external onlyAdmins {
        require(isAdmin(_address), "FC:Admin Role Doesn't Exist ");
        _revokeRole(ADMIN_ROLE, _address);
    }

    /**
     * @dev Revokes the CFO_ROLE from the specified address.
     * @param _address The address to revoke the CFO_ROLE from.
     * @notice This function can only be called by the address with ADMIN_ROLE and DEFAULT_ADMIN_ROLE .
     */
    function revokeCFORole(address _address) external onlyAdmins {
        require(isCFO(_address), "FC:CFO Role Doesn't Exist ");
        _revokeRole(CFO_ROLE, _address);
    }

    /**
     * @dev Checks if the specified address has the ADMIN_ROLE.
     * @param _userAddress The address to check.
     * @return A boolean indicating whether or not the address has the ADMIN_ROLE.
     */

    function isAdmin(address _userAddress) public view returns (bool) {
        return hasRole(ADMIN_ROLE, _userAddress);
    }

    /**
     * @dev Checks if the specified address has the CFO_ROLE.
     * @param _userAddress The address to check.
     * @return A boolean indicating whether or not the address has the CFO_ROLE.
     */

    function isCFO(address _userAddress) public view returns (bool) {
        return hasRole(CFO_ROLE, _userAddress);
    }

    /**
     * @dev Adds a pool address to the contract.
     * @param _newPoolAddress The address of the pool to be added.
     * Requirements:
     * Only the CFO (Chief Financial Officer) can call this function.
     * The _poolAddress parameter must not be the zero address.
     */

    function addPoolAddress(
        address _newPoolAddress
    ) public onlyCFO notZeroAddress(_newPoolAddress) {
        address _oldPoolAdddress = _newPoolAddress;
        poolAddress = _newPoolAddress;

        emit PoolAddressChnaged(_oldPoolAdddress, _newPoolAddress);
    }

    /**
     * @dev Creates a new token contract using the Clones library, initializes the token, registers it, and emits a TokenCreated event.
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     * @param _decimals The number of decimals for the token.
     * @param _initialSupply The initial supply of the token.
     * @notice This function can only be called by the address with ADMIN_ROLE and DEFAULT_ADMIN_ROLE .
     */

    function createToken(
        string calldata _name,
        string calldata _symbol,
        uint8 _decimals,
        uint256 _initialSupply,
        string calldata _uniqueId
    ) external onlyAdmins {
        require(_initialSupply > 0, "FC:Supply must be greater than zero");
        require(_decimals > 0, "FC:Decimals must be greater than zero");

        address _tokenAddress = Clones.clone(masterToken);
        IToken(_tokenAddress).initialize(
            _name,
            _symbol,
            _initialSupply,
            _decimals,
            address(this)
        );
        registerTokens(
            TokenInfo({
                name: _name,
                symbol: _symbol,
                decimals: _decimals,
                initialSupply: _initialSupply,
                tokenAddress: _tokenAddress
            }),
            address(_tokenAddress)
        );
        IToken(_tokenAddress).addFactoryContract(address(this));

        emit TokenCreated(_name, _symbol, _tokenAddress, _uniqueId);
    }

    /**
     * @dev Mints new tokens and adds them to the specified account using the specified token contract.
     * @param _tokenAddress The address of the token contract.
     * @param _to The address of the account to add the new tokens to.
     * @param _amount The amount of tokens to mint.
     * @notice This function can only be called by the address with ADMIN_ROLE and DEFAULT_ADMIN_ROLE .
     */

    function tokenMint(
        address _tokenAddress,
        address _to,
        uint256 _amount,
        string calldata _uniqueId
    )
        external
        onlyAdmins
        onlyRegisteredToken(_tokenAddress)
        amountGreaterThanZero(_amount)
        notPlatformBlacklisted(_to)
        notTokenBlacklisted(_tokenAddress, _to)
    {
        IToken(_tokenAddress).mint(_to, _amount);
        emit MintToken(_tokenAddress, _to, _amount, _uniqueId);
    }

    /**
     * @dev Burns the specified amount of tokens from the user's account.
     * @param _tokenAddress The address of the token contract.
     * @param _amount The amount of tokens to be burned.
     * Requirements:
     * Only the CFO (Chief Financial Officer) can call this function.
     */

    function tokenBurn(
        address _tokenAddress,
        uint256 _amount
    )
        external
        onlyCFO
        onlyRegisteredToken(_tokenAddress)
        amountGreaterThanZero(_amount)
    {
        address _poolAddress = poolAddress;
        IToken(_tokenAddress).burn(_poolAddress, _amount);
        emit BurnToken(_tokenAddress, _poolAddress, _msgSender(), _amount);
    }

    /**
     * @dev Returns the balance of the specified account for the specified token contract.
     * @param _tokenAddress The address of the token contract.
     * @param _userAddress The address of the account to get the balance for.
     * @return The balance of the specified
     * */

    function tokenBalance(
        address _tokenAddress,
        address _userAddress
    )
        external
        view
        onlyRegisteredToken(_tokenAddress)
        notZeroAddress(_userAddress)
        returns (uint256)
    {
        return IToken(_tokenAddress).balanceOf(_userAddress);
    }

    /**
     * @dev Registers a new token with the specified token details.
     * @param tokenDetails The details of the token to be registered.
     * @param _tokenAddress The address of the token contract to be registered.
     * @notice This function can only be called by the address with ADMIN_ROLE and DEFAULT_ADMIN_ROLE .
     */
    function registerTokens(
        TokenInfo memory tokenDetails,
        address _tokenAddress
    )
        public
        onlyAdmins
        notZeroAddress(_tokenAddress)
        onlyContract(_tokenAddress)
        onlyUnregisteredToken(_tokenAddress)
    {
        require(
            _tokenAddress == tokenDetails.tokenAddress,
            "FC:Address mismatch"
        );

        tokenRegister[_tokenAddress] = TokenInfo({
            name: tokenDetails.name,
            symbol: tokenDetails.symbol,
            decimals: tokenDetails.decimals,
            initialSupply: tokenDetails.initialSupply,
            tokenAddress: tokenDetails.tokenAddress
        });
        _registered[_tokenAddress] = true;

        emit TokenRegistered(_tokenAddress, tokenDetails);
    }

    /**
     * @dev Unregisters the specified token.
     * @param _tokenAddress The address of the token contract to be unregistered.
     * @notice This function can only be called by the address with ADMIN_ROLE and DEFAULT_ADMIN_ROLE .
     */

    function unregisterTokens(
        address _tokenAddress
    ) external onlyAdmins onlyRegisteredToken(_tokenAddress) {
        emit TokenUnregistered(
            _tokenAddress,
            tokenRegister[_tokenAddress].name,
            tokenRegister[_tokenAddress].symbol
        );

        delete tokenRegister[_tokenAddress];

        _registered[_tokenAddress] = false;
    }

    /**
     * @dev This function transfers tokens from one address to another with a unique ID.
     * @param _tokenAddress The address of the token to transfer.
     * @param _from The address from which the tokens will be transferred.
     * @param _to The address to which the tokens will be transferred.
     * @param _amount The amount of tokens to transfer.
     * @param _uniqueId The unique identifier for this transfer.
     * @notice This function can only be called by the address with ADMIN_ROLE and DEFAULT_ADMIN_ROLE .
     */

    function transferToken(
        address _tokenAddress,
        address _from,
        address _to,
        uint256 _amount,
        string calldata _uniqueId,
        uint256 _type
    )
        external
        onlyAdmins
        onlyRegisteredToken(_tokenAddress)
        amountGreaterThanZero(_amount)
        notPlatformBlacklisted(_to)
        notTokenBlacklisted(_tokenAddress, _to)
    {
        IToken(_tokenAddress)._transferToken(_from, _to, _amount);
        emit TransferWithId(_msgSender(), _to, _amount, _uniqueId, _type);
    }

    /**
     * @dev Returns a boolean indicating whether a given token address is registered.
     *
     * @param _tokenAddress The address of the token being checked.
     *
     * @return bool True if the token is registered, false otherwise.
     */

    function isTokenRegistered(
        address _tokenAddress
    ) public view returns (bool) {
        return _registered[_tokenAddress];
    }

    /**
     * @dev Returns the details of the specified token.
     * @param _tokenAddress The address of the token contract.
     * @return The details of the token.
     */

    function getTokenDetails(
        address _tokenAddress
    )
        public
        view
        onlyRegisteredToken(_tokenAddress)
        returns (TokenInfo memory)
    {
        return tokenRegister[_tokenAddress];
    }

    /**
     *  @dev Returns the blackList status of a wallet
     *  if isBlacklisted returns `true` the wallet is blacklisted
     *  if isBlacklisted returns `false` the wallet is not blacklisted
     *  isBlacklisted returning `true` doesn"t mean that the balance is free, tokens could be blocked by
     *  a freezeTokens
     *  @param _tokenAddress The address of the token contract.
     *  @param _userAddress the address of the wallet on which _tokenBlacklisted is called
     */

    function isTokenBlacklisted(
        address _tokenAddress,
        address _userAddress
    )
        external
        view
        onlyRegisteredToken(_tokenAddress)
        notZeroAddress(_userAddress)
        returns (bool)
    {
        return _tokenBlacklisted[_tokenAddress][_userAddress];
    }

    /**
     *  @dev Returns the blackList status of a wallet
     *  if isBlacklisted returns `true` the wallet is blacklisted
     *  if isBlacklisted returns `false` the wallet is not blacklisted
     *  isBlacklisted returning `true` doesn"t mean that the balance is free, tokens could be blocked by
     *  a freezeTokens
     *  @param _userAddress the address of the wallet on which isPlatformBlacklisted is called
     */

    function isPlatformBlacklisted(
        address _userAddress
    ) external view notZeroAddress(_userAddress) returns (bool) {
        return _platformBlacklisted[_userAddress];
    }

    /**
     *  @dev sets an address blackList status for this token.
     *  @param _tokenAddress The address of the token contract.
     *  @param _userAddress The address for which to update blackList  status
     *  @param _status blackList status of the address
     *  @notice This function can only be called by the address with ADMIN_ROLE and DEFAULT_ADMIN_ROLE .
     *  This function can only be called by a wallet set as admin of the token
     *  emits an `blackListedToken` event
     */
    function tokenBlackList(
        address _tokenAddress,
        address _userAddress,
        bool _status,
        string calldata _uniqueId
    )
        external
        onlyAdmins
        onlyRegisteredToken(_tokenAddress)
        notZeroAddress(_userAddress)
    {
        require(
            _tokenBlacklisted[_tokenAddress][_userAddress] != _status,
            "FC:User already has the specified blacklist status in Token"
        );

        _tokenBlacklisted[_tokenAddress][_userAddress] = _status;
        emit blackListedToken(_tokenAddress, _userAddress, _status, _uniqueId);
    }

    /**
     *  @dev sets an address blackList status for this factory.
     *  @param _userAddress The address for which to update blackList  status
     *  @param _status blackList status of the address
     *  This function can only be called by a wallet set as admin of the token
     *  emits an `blackListedPlatform` event
     */
    function platformBlackList(
        address _userAddress,
        bool _status,
        string calldata _uniqueId
    ) external onlyAdmins notZeroAddress(_userAddress) {
        require(
            _platformBlacklisted[_userAddress] != _status,
            "FC:User already has the specified blacklist status on Platform"
        );

        _platformBlacklisted[_userAddress] = _status;
        emit blackListedPlatform(_userAddress, _status, _uniqueId);
    }

    /**
     * @dev Freezes a certain amount of tokens for a specified user.
     * @param _tokenAddress The address of the token to be frozen.
     * @param _userAddress The address of the user whose tokens will be frozen.
     * @param _amount The amount of tokens to be frozen.
     */

    function tokenFreeze(
        address _tokenAddress,
        address _userAddress,
        uint256 _amount,
        string calldata _uniqueId
    )
        external
        onlyAdmins
        onlyRegisteredToken(_tokenAddress)
        amountGreaterThanZero(_amount)
        notZeroAddress(_userAddress)
    {
        IToken(_tokenAddress).freezeTokens(_userAddress, _amount);
        emit TokensFrozen(_tokenAddress, _userAddress, _amount, _uniqueId);
    }

    /**
     * @dev Unfreezes a certain amount of previously frozen tokens for a specific user.
     * @param _tokenAddress The address of the token to unfreeze.
     * @param _userAddress The address of the user whose tokens will be unfrozen.
     * @param _amount The amount of tokens to unfreeze.
     */

    function tokenUnFreeze(
        address _tokenAddress,
        address _userAddress,
        uint256 _amount,
        string calldata _uniqueId
    )
        external
        onlyAdmins
        onlyRegisteredToken(_tokenAddress)
        notZeroAddress(_userAddress)
        amountGreaterThanZero(_amount)
    {
        IToken(_tokenAddress).unfreezeTokens(_userAddress, _amount);
        emit TokensUnfrozen(_tokenAddress, _userAddress, _amount, _uniqueId);
    }

    /**
     * @dev Retrieves the amount of tokens frozen for a specific user.
     * @param _tokenAddress The address of the token to retrieve the frozen amount for.
     * @param _userAddress The address of the user to retrieve the frozen amount for.
     * @return The amount of tokens frozen for the specified user.
     */

    function getFrozenAmount(
        address _tokenAddress,
        address _userAddress
    )
        external
        view
        onlyRegisteredToken(_tokenAddress)
        notZeroAddress(_userAddress)
        returns (uint256)
    {
        return IToken(_tokenAddress).getFreezeAmount(_userAddress);
    }

    function _msgSender()
        internal
        view
        override(BasicMetaTransaction, ContextUpgradeable)
        returns (address sender)
    {
        if (msg.sender == address(this)) {
            bytes memory array = msg.data;
            uint256 index = msg.data.length;
            assembly {
                // Load the 32 bytes word from memory with the address on the lower 20 bytes, and mask those.
                sender := and(
                    mload(add(array, index)),
                    0xffffffffffffffffffffffffffffffffffffffff
                )
            }
        } else {
            return msg.sender;
        }
    }
}
