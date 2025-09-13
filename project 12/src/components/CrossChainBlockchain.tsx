import { Block } from './Blockchain';
import { Blockchain } from './Blockchain';
import { Network } from './Blockchain';

interface Transaction {
  from: string;
  to: string;
  value: number;
  gas: number;
  data?: string;
  nonce: number;
  sourceNetwork: string;
  targetNetwork?: string;
}

interface TransactionReceipt {
  transaction: Transaction;
  status: "success" | "failed" | "pending";
  gasUsed: number;
}

interface BlockHeader {
  parentHash: string;
  stateRoot: string;
  transactionsRoot: string;
  receiptsRoot: string;
  number: number;
  gasLimit: number;
  gasUsed: number;
  timestamp: number;
  difficulty: number;
  nonce: number;
  networkId: string;
}

class Block {
  header: BlockHeader;
  transactions: Transaction[];
  receipts: TransactionReceipt[];
  hash: string;

  constructor(
    parentHash: string,
    stateRoot: string,
    transactions: Transaction[],
    number: number,
    timestamp: number,
    difficulty: number,
    nonce: number,
    networkId: string
  ) {
    this.header = {
      parentHash,
      stateRoot,
      transactionsRoot: this.calculateTransactionsRoot(transactions),
      receiptsRoot: this.calculateReceiptsRoot(transactions),
      number,
      gasLimit: 30000000,
      gasUsed: this.calculateGasUsed(transactions),
      timestamp,
      difficulty,
      nonce,
      networkId,
    };
    this.transactions = transactions;
    this.receipts = transactions.map(tx => ({
      transaction: tx,
      status: this.validateTransaction(tx) ? "success" : "failed",
      gasUsed: tx.gas,
    }));
    this.hash = this.calculateHash();
  }

  validateTransaction(tx: Transaction): boolean {
    const sender = this.accounts?.get(tx.from);
    return !!sender && sender.balance >= tx.value + tx.gas;
  }

  calculateHash(): string {
    const headerStr = JSON.stringify(this.header);
    return this.sha256(headerStr);
  }

  calculateTransactionsRoot(transactions: Transaction[]): string {
    return transactions.length > 0 ? this.sha256(JSON.stringify(transactions)) : "0".repeat(64);
  }

  calculateReceiptsRoot(transactions: Transaction[]): string {
    return this.sha256(JSON.stringify(this.receipts));
  }

  calculateGasUsed(transactions: Transaction[]): number {
    return transactions.reduce((sum, tx) => sum + tx.gas, 0);
  }

  sha256(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash + char) >>> 0;
    }
    return hash.toString(16).padStart(64, "0");
  }

  toJSON() {
    return {
      header: this.header,
      transactions: this.transactions,
      hash: this.hash,
      receipts: this.receipts,
    };
  }

  private accounts?: Map<string, { balance: number; nonce: number }>;
}

class Network {
  id: string;
  blockchain: Blockchain;
  peers: Map<string, Network>;

  constructor(id: string) {
    this.id = id;
    this.blockchain = new Blockchain(id);
    this.peers = new Map();
  }

  addPeer(network: Network) {
    this.peers.set(network.id, network);
    network.peers.set(this.id, this);
  }

  broadcastTransaction(tx: Transaction) {
    if (tx.targetNetwork && this.peers.has(tx.targetNetwork)) {
      const targetNetwork = this.peers.get(tx.targetNetwork);
      targetNetwork?.blockchain.addTransaction(
        tx.from,
        tx.to,
        tx.value,
        tx.gas,
        tx.data,
        tx.sourceNetwork
      );
    }
  }

  syncState() {
    for (const peer of this.peers.values()) {
      if (peer.blockchain.getLatestBlock().header.number > this.blockchain.getLatestBlock().header.number) {
        this.blockchain.chain = [...peer.blockchain.chain];
        this.blockchain.accounts = new Map(peer.blockchain.accounts);
        this.blockchain.stateHistory = new Map(peer.blockchain.stateHistory);
      }
    }
  }
}

class Blockchain {
  chain: Block[];
  difficulty: number;
  pendingTransactions: Transaction[];
  accounts: Map<string, { balance: number; nonce: number }>;
  stateHistory: Map<number, string>;
  minerAddress: string;
  networkId: string;
  onBlockMined?: (block: Block) => void;
  onTransactionAdded?: (tx: Transaction) => void;

  constructor(networkId: string) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 4;
    this.pendingTransactions = [];
    this.accounts = new Map();
    this.stateHistory = new Map();
    this.minerAddress = "0xMiner";
    this.networkId = networkId;
    this.initializeAccounts();
  }

  initializeAccounts() {
    this.accounts.set("0x1", { balance: 1000000, nonce: 0 });
    this.accounts.set("0x2", { balance: 1000000, nonce: 0 });
    this.accounts.set(this.minerAddress, { balance: 0, nonce: 0 });
  }

  createGenesisBlock(): Block {
    const block = new Block("0".repeat(64), "0".repeat(64), [], 0, Date.now(), 0, 0, this.networkId);
    block.accounts = this.accounts;
    this.stateHistory.set(0, block.header.stateRoot);
    return block;
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(from: string, to: string, value: number, gas: number, data?: string, sourceNetwork?: string): boolean {
    const sender = this.accounts.get(from);
    if (!sender || sender.balance < value + gas || sender.nonce === undefined) {
      return false;
    }

    const tx: Transaction = {
      from,
      to,
      value,
      gas,
      data,
      nonce: sender.nonce,
      sourceNetwork: sourceNetwork || this.networkId,
      targetNetwork: sourceNetwork ? undefined : this.networkId,
    };

    this.pendingTransactions.push(tx);
    sender.nonce += 1;
    this.onTransactionAdded?.(tx);
    return true;
  }

  mineBlock(): Block | null {
    if (this.pendingTransactions.length === 0) return null;

    const prevBlock = this.getLatestBlock();
    const timestamp = Date.now();
    let nonce = 0;
    let hash: string;

    do {
      nonce++;
      hash = this.calculateBlockHash(
        prevBlock.hash,
        this.calculateStateRoot(),
        this.pendingTransactions,
        prevBlock.header.number + 1,
        timestamp,
        nonce
      );
    } while (hash.substring(0, this.difficulty) !== "0".repeat(this.difficulty));

    const totalFees = this.pendingTransactions.reduce((sum, tx) => sum + tx.gas, 0);
    const miner = this.accounts.get(this.minerAddress);
    if (miner) {
      this.pendingTransactions.push({
        from: "0x0",
        to: this.minerAddress,
        value: totalFees,
        gas: 0,
        nonce: miner.nonce,
        sourceNetwork: this.networkId,
      });
      miner.nonce++;
    }

    const stateRoot = this.calculateStateRoot();
    const newBlock = new Block(
      prevBlock.hash,
      stateRoot,
      this.pendingTransactions,
      prevBlock.header.number + 1,
      timestamp,
      this.difficulty,
      nonce,
      this.networkId
    );
    newBlock.accounts = this.accounts;

    this.executeTransactions(newBlock.transactions);
    this.chain.push(newBlock);
    this.stateHistory.set(newBlock.header.number, stateRoot);
    this.pendingTransactions = [];
    this.onBlockMined?.(newBlock);
    return newBlock;
  }

  calculateBlockHash(
    parentHash: string,
    stateRoot: string,
    transactions: Transaction[],
    number: number,
    timestamp: number,
    nonce: number
  ): string {
    const block = new Block(parentHash, stateRoot, transactions, number, timestamp, this.difficulty, nonce, this.networkId);
    block.accounts = this.accounts;
    return block.calculateHash();
  }

  calculateStateRoot(): string {
    return this.sha256(JSON.stringify([...this.accounts.entries()]));
  }

  sha256(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash + char) >>> 0;
    }
    return hash.toString(16).padStart(64, "0");
  }

  executeTransactions(transactions: Transaction[]): void {
    for (const tx of transactions) {
      const sender = this.accounts.get(tx.from);
      const recipient = this.accounts.get(tx.to) || { balance: 0, nonce: 0 };

      if (tx.from !== "0x0" && sender && sender.balance >= tx.value + tx.gas) {
        sender.balance -= tx.value + tx.gas;
        recipient.balance += tx.value;
        this.accounts.set(tx.to, recipient);
      } else if (tx.from === "0x0") {
        recipient.balance += tx.value;
        this.accounts.set(tx.to, recipient);
      }
    }
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const prevBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.header.parentHash !== prevBlock.hash) {
        return false;
      }

      const storedStateRoot = this.stateHistory.get(currentBlock.header.number);
      if (storedStateRoot !== currentBlock.header.stateRoot) {
        return false;
      }
    }
    return true;
  }

  getBalance(address: string): number {
    return this.accounts.get(address)?.balance || 0;
  }
}

const App: React.FC = () => {
  const network1 = new Network("network1");
  const network2 = new Network("network2");
  network1.addPeer(network2);

  network1.blockchain.onBlockMined = block => {
    console.log(`Block mined on ${block.header.networkId}:`, block.toJSON());
    network1.syncState();
  };

  network2.blockchain.onBlockMined = block => {
    console.log(`Block mined on ${block.header.networkId}:`, block.toJSON());
    network2.syncState();
  };

  network1.blockchain.onTransactionAdded = tx => {
    console.log(`Transaction added on ${tx.sourceNetwork}:`, tx);
    if (tx.targetNetwork) {
      network1.broadcastTransaction(tx);
    }
  };

  network2.blockchain.onTransactionAdded = tx => {
    console.log(`Transaction added on ${tx.sourceNetwork}:`, tx);
  };

  const addCrossChainTransaction = () => {
    const success = network1.blockchain.addTransaction("0x1", "0x2", 100, 21000, undefined, network2.id);
    if (success) {
      const newBlock = network1.blockchain.mineBlock();
      if (newBlock) {
        console.log(`New block mined on ${network1.id}:`, newBlock.toJSON());
        console.log(`Chain valid (${network1.id}):`, network1.blockchain.isChainValid());
        console.log(`Chain valid (${network2.id}):`, network2.blockchain.isChainValid());
        console.log(`Balance 0x1 (${network1.id}):`, network1.blockchain.getBalance("0x1"));
        console.log(`Balance 0x2 (${network2.id}):`, network2.blockchain.getBalance("0x2"));
        console.log(`Miner balance (${network1.id}):`, network1.blockchain.getBalance(network1.blockchain.minerAddress));
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={addCrossChainTransaction}
        style={{ padding: '10px 20px', margin: '10px', cursor: 'pointer' }}
      >
        Add Cross-Chain Transaction & Mine Block
      </button>
      <p>Check console for blockchain output across networks.</p>
    </div>
  );
};

export default App;