import { keccak256 } from 'ethers';
import { toUtf8Bytes } from 'ethers';
/* ---------- Interfaces ---------- */
export interface Transaction {
  from: string;
  to: string;
  value: number;
  gas: number;
  data?: string;
  nonce: number;
  sourceNetwork: string;
  targetNetwork?: string;
  signature?: string;
}

export interface TransactionReceipt {
  transaction: Transaction;
  status: "success" | "failed" | "pending";
  gasUsed: number;
  contractAddress?: string;
}

export interface BlockHeader {
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

export interface SoulboundId {
  id: string;
  address: string;
  dnaHash: string;
  birthCertificate: {
    issuer: string;
    createdAt: string;
    address: string;
  };
  signature?: string;
}

export interface Post {
  id: string;
  author: string;
  content: string;
  ipfsCid?: string;
  timestamp: number;
  upvotes: string[];
  flags: string[];
  luxScore: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  timestamp: number;
}

export interface Voucher {
  id: string;
  from: string;
  to: string;
  value: number;
  timestamp: number;
}

export interface LogEntry {
  id: string;
  action: string;
  data: any;
  hash: string;
  previousHash: string;
  timestamp: number;
}

export interface Rank {
  tier: number;
  title: string;
  minLuxScore: number;
}

/* ---------- Block Class ---------- */
export class Block {
  header!: BlockHeader;
  transactions: Transaction[] = [];
  receipts: TransactionReceipt[] = [];
  hash: string = "";
  accounts?: Map<string, { balance: number; nonce: number; luxScore?: number }>;

  static async create(
    parentHash: string,
    stateRoot: string,
    transactions: Transaction[],
    number: number,
    timestamp: number,
    difficulty: number,
    nonce: number,
    networkId: string,
    accounts?: Map<string, { balance: number; nonce: number; luxScore?: number }>
  ): Promise<Block> {
    const block = new Block();

    block.header = {
      parentHash,
      stateRoot,
      transactionsRoot: await block.calculateTransactionsRoot(transactions),
      receiptsRoot: await block.calculateReceiptsRoot(transactions),
      number,
      gasLimit: 30_000_000,
      gasUsed: block.calculateGasUsed(transactions),
      timestamp,
      difficulty,
      nonce,
      networkId,
    };

    block.transactions = transactions;
    block.receipts = transactions.map((tx) => ({
      transaction: tx,
      status: block.validateTransaction(tx) ? "success" : "failed",
      gasUsed: tx.gas,
    }));
    block.accounts = accounts;
    block.hash = await block.calculateHash();

    return block;
  }

  validateTransaction(tx: Transaction): boolean {
    const sender = this.accounts?.get(tx.from);
    return !!sender && sender.balance >= tx.value + tx.gas;
  }

  async calculateHash(): Promise<string> {
    return keccak256(toUtf8Bytes(JSON.stringify(this.header)));
  }

  async calculateTransactionsRoot(transactions: Transaction[]): Promise<string> {
    return transactions.length > 0
      ? keccak256(toUtf8Bytes(JSON.stringify(transactions)))
      : "0".repeat(64);
  }

  async calculateReceiptsRoot(transactions: Transaction[]): Promise<string> {
    const receipts = transactions.map((t) => ({
      status: this.validateTransaction(t) ? 1 : 0,
      gasUsed: t.gas,
    }));
    return keccak256(toUtf8Bytes(JSON.stringify(receipts)));
  }

  calculateGasUsed(transactions: Transaction[]): number {
    return transactions.reduce((sum, tx) => sum + tx.gas, 0);
  }

  toJSON() {
    return {
      header: this.header,
      transactions: this.transactions,
      hash: this.hash,
      receipts: this.receipts,
    };
  }
}

/* ---------- Blockchain Class ---------- */
export class Blockchain {
  id: string;
  blocks: Block[] = [];
  accounts: Map<string, { balance: number; nonce: number; luxScore?: number }> = new Map();
  soulboundIds: Record<string, SoulboundId> = {}; 
  onSoulboundIdCreated?: (id: SoulboundId) => void;

  private constructor(id: string) {
    this.id = id;
  }

  static async create(id: string): Promise<Blockchain> {
    const chain = new Blockchain(id);
    const genesis = await Block.create(
      "0".repeat(64),
      "0".repeat(64),
      [],
      0,
      Date.now(),
      1,
      0,
      id,
      chain.accounts
    );
    chain.blocks.push(genesis);
    return chain;
  }

  getLatestBlock(): Block {
    return this.blocks[this.blocks.length - 1];
  }

  async addBlock(transactions: Transaction[]): Promise<Block> {
    const latest = this.getLatestBlock();
    const block = await Block.create(
      latest.hash,
      "0".repeat(64),
      transactions,
      latest.header.number + 1,
      Date.now(),
      latest.header.difficulty,
      Math.floor(Math.random() * 1e6),
      this.id,
      this.accounts
    );
    this.blocks.push(block);
    return block;
  }

  /* ---------- Soulbound ID Methods ---------- */
  async createSoulboundId(address: string, data: any): Promise<SoulboundId> {
    const dnaHash = keccak256(toUtf8Bytes(JSON.stringify(data) + Date.now()));
    const id: SoulboundId = {
      id: keccak256(toUtf8Bytes(address + dnaHash)),
      address,
      dnaHash,
      birthCertificate: {
        issuer: this.id,
        createdAt: new Date().toISOString(),
        address,
      },
      signature: undefined,
    };
    this.soulboundIds[address] = id;
    if (this.onSoulboundIdCreated) this.onSoulboundIdCreated(id);
    return id;
  }

  getSoulboundId(address: string): SoulboundId | null {
    return this.soulboundIds[address] || null;
  }

  getLuxScore(address: string): number {
    const sb = this.getSoulboundId(address);
    return sb ? Math.floor(Math.random() * 100) : 0;
  }

  getRank(address: string): Rank {
    const score = this.getLuxScore(address);
    if (score > 80) return { tier: 3, title: "High", minLuxScore: 80 };
    if (score > 50) return { tier: 2, title: "Medium", minLuxScore: 50 };
    return { tier: 1, title: "Low", minLuxScore: 0 };
  }
}

/* ---------- Network Class ---------- */
export class Network {
  id: string;
  blockchain: Blockchain;
  peers: Map<string, Network>;

  private constructor(id: string, blockchain: Blockchain) {
    this.id = id;
    this.blockchain = blockchain;
    this.peers = new Map();
  }

  static async create(id: string): Promise<Network> {
    const blockchain = await Blockchain.create(id);
    return new Network(id, blockchain);
  }

  addPeer(network: Network) {
    this.peers.set(network.id, network);
    network.peers.set(this.id, this);
  }
}

/* ---------- Exports ---------- */
export {
  Post,
  Comment,
  Voucher,
  LogEntry,
  Rank,
};