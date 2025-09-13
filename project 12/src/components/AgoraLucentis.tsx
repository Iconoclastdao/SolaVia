import { Network } from './Blockchain';
import confetti from 'canvas-confetti';
import { AlertTriangle, Award, MessageSquare, Send, ThumbsUp, User, Zap } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
"use client";

// Interfaces for posts and comments
interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  upvotes: string[];
  flags: string[];
  luxScore: number;
}

interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
}

// Renamed to avoid conflict with imported Network
interface SocialNetwork {
  blockchain: {
    posts: Post[];
    comments: Comment[];
    addPost: (author: string, content: string) => Promise<boolean>;
    addComment: (author: string, postId: string, content: string) => Promise<boolean>;
    addVote: (voter: string, postId: string) => Promise<void>;
    addFlag: (flagger: string, postId: string) => Promise<void>;
    getLuxScore: (address: string) => number;
    getRank: (address: string) => { title: string };
    onPostAdded: ((post: Post) => void) | null;
    onCommentAdded: ((comment: Comment) => void) | null;
    onVoteAdded: ((postId: string, voter: string) => void) | null;
    onFlagAdded: ((postId: string, flagger: string) => void) | null;
  } | null;
}

type Props = {
  network: Network | null;
};

const AgoraLucentis: React.FC<Props> = ({ network }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newPost, setNewPost] = useState<string>("");
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!network?.blockchain) return;

    // Initialize with existing posts and comments
    setPosts(network.blockchain.posts || []);
    setComments(network.blockchain.comments || []);

    // Setup event handlers
    network.blockchain.onPostAdded = (post: Post) => {
      setPosts(prev => [...prev, post]);
      confetti();
    };

    network.blockchain.onCommentAdded = (comment: Comment) => {
      setComments(prev => [...prev, comment]);
    };

    return () => {
      if (!network?.blockchain) return;
      network.blockchain.onPostAdded = null;
      network.blockchain.onCommentAdded = null;
    };
  }, [network]);

  const handleAddPost = async () => {
    if (!network?.blockchain || !newPost.trim()) return;
    const success = await network.blockchain.addPost("me", newPost);
    if (success) setNewPost("");
  };

  const handleAddComment = async (postId: string) => {
    const content = newComment[postId];
    if (!network?.blockchain || !content?.trim()) return;
    const success = await network.blockchain.addComment("me", postId, content);
    if (success) {
      setNewComment(prev => ({ ...prev, [postId]: "" }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="classified-overlay p-4 rounded-xl bg-gray-800/70">
        <textarea
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          placeholder="Share a revelation..."
          className="w-full p-2 rounded bg-gray-900/50 text-white"
        />
        <button
          onClick={handleAddPost}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Post
        </button>
      </div>

      {posts.map(post => (
        <div key={post.id} className="p-4 bg-gray-900/60 rounded-xl space-y-2">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-400" />
            <span className="font-bold">{post.author}</span>
            <span className="text-xs text-gray-500">
              {new Date(post.timestamp).toLocaleString()}
            </span>
          </div>
          <p>{post.content}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <button
              onClick={() => network?.blockchain?.addVote("me", post.id)}
              className="flex items-center space-x-1 hover:text-green-400"
            >
              <ThumbsUp className="w-4 h-4" /> <span>{post.upvotes.length}</span>
            </button>
            <button
              onClick={() => network?.blockchain?.addFlag("me", post.id)}
              className="flex items-center space-x-1 hover:text-red-400"
            >
              <AlertTriangle className="w-4 h-4" /> <span>{post.flags.length}</span>
            </button>
            <span className="flex items-center space-x-1">
              <Award className="w-4 h-4 text-yellow-400" />
              <span>Lux: {post.luxScore}</span>
            </span>
          </div>

          <div className="ml-6 space-y-2">
            {comments.filter(c => c.postId === post.id).map(c => (
              <div key={c.id} className="p-2 bg-gray-800/40 rounded">
                <span className="font-semibold">{c.author}:</span> {c.content}
              </div>
            ))}
            <div className="flex space-x-2 mt-2">
              <input
                value={newComment[post.id] || ""}
                onChange={e =>
                  setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))
                }
                placeholder="Reply..."
                className="flex-1 p-2 rounded bg-gray-900/50 text-white"
              />
              <button
                onClick={() => handleAddComment(post.id)}
                className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgoraLucentis;
