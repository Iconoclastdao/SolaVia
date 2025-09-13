import { Heart } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { Send } from 'lucide-react';
import { Upload } from 'lucide-react';
import { useEffect } from 'react';
import { useState } from 'react';
import React from 'react';
"use client";

interface MediaAttachment {
  id: string;
  type: "image" | "video" | "audio";
  src: string; // base64 string or URL
  owner: string; // wallet address or username
}

interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: { author: string; text: string; timestamp: string }[];
  attachments: MediaAttachment[];
}

const STORAGE_KEY = "universal_social_feed_v2";

const Card: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 shadow space-y-3">
    {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
    {children}
  </div>
);

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}> = ({ children, onClick, disabled, variant = "primary" }) => {
  const colors =
    variant === "primary"
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-gray-700 hover:bg-gray-600";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 rounded text-xs font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${colors}`}
    >
      {children}
    </button>
  );
};

export default function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [username, setUsername] = useState("0xWalletAddress");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setPosts(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const newAttachments: MediaAttachment[] = [];
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const type = file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
        ? "video"
        : "audio";

      newAttachments.push({
        id: crypto.randomUUID(),
        type,
        src: base64,
        owner: username,
      });
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const createPost = () => {
    if (!newPost.trim() && attachments.length === 0) return;

    const post: Post = {
      id: crypto.randomUUID(),
      author: username,
      content: newPost.trim(),
      timestamp: new Date().toLocaleString(),
      likes: 0,
      comments: [],
      attachments,
    };

    setPosts([post, ...posts]);
    setNewPost("");
    setAttachments([]);
  };

  const likePost = (id: string) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p)));
  };

  const addComment = (id: string) => {
    const text = commentDrafts[id];
    if (!text?.trim()) return;

    setPosts(
      posts.map((p) =>
        p.id === id
          ? {
              ...p,
              comments: [
                ...p.comments,
                { author: username, text, timestamp: new Date().toLocaleTimeString() },
              ],
            }
          : p
      )
    );
    setCommentDrafts((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <div className="space-y-6">
      <Card title="Decentralized Social Feed">
        {/* Post Creator */}
        <div className="mb-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your wallet address or name"
            className="p-2 rounded bg-gray-900 border border-gray-700 text-sm w-full mb-2"
          />
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            className="p-3 rounded bg-gray-900 border border-gray-700 text-sm w-full mb-2"
          />

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {attachments.map((a) => (
                <div key={a.id} className="relative">
                  {a.type === "image" && <img src={a.src} className="rounded-lg w-full h-auto" />}
                  {a.type === "video" && <video src={a.src} className="rounded-lg w-full" controls />}
                  {a.type === "audio" && <audio src={a.src} className="w-full" controls />}
                </div>
              ))}
            </div>
          )}

          <label className="flex items-center space-x-2 cursor-pointer text-blue-400 text-xs mb-2">
            <Upload className="w-4 h-4" />
            <span>Attach Image/Video/Audio</span>
            <input type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
          </label>

          <Button onClick={createPost}>
            <Send className="w-3 h-3 inline mr-1" /> Post
          </Button>
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {posts.length === 0 && (
            <p className="text-gray-400 text-sm text-center">No posts yet. Be the first!</p>
          )}
          {posts.map((post) => (
            <div key={post.id} className="bg-black/30 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between">
                <p className="text-sm text-blue-300 font-semibold">{post.author}</p>
                <span className="text-xs text-gray-400">{post.timestamp}</span>
              </div>

              <p className="text-gray-200 text-sm mt-2 whitespace-pre-wrap">{post.content}</p>

              {/* Media attachments */}
              {post.attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {post.attachments.map((a) => (
                    <div key={a.id}>
                      {a.type === "image" && <img src={a.src} className="rounded-lg" />}
                      {a.type === "video" && <video src={a.src} className="rounded-lg" controls />}
                      {a.type === "audio" && <audio src={a.src} controls />}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-3 mt-2">
                <button
                  onClick={() => likePost(post.id)}
                  className="flex items-center text-xs text-pink-400 hover:text-pink-300"
                >
                  <Heart className="w-3 h-3 mr-1" /> {post.likes}
                </button>
                <button
                  onClick={() =>
                    setCommentDrafts((prev) => ({ ...prev, [post.id]: prev[post.id] || "" }))
                  }
                  className="flex items-center text-xs text-gray-300 hover:text-white"
                >
                  <MessageCircle className="w-3 h-3 mr-1" /> {post.comments.length} Comments
                </button>
              </div>

              {/* Comments */}
              {post.comments.length > 0 && (
                <div className="mt-2 pl-3 border-l border-gray-700 space-y-1">
                  {post.comments.map((c, i) => (
                    <div key={i} className="text-xs text-gray-300">
                      <span className="text-blue-300">{c.author}</span>: {c.text}{" "}
                      <span className="text-gray-500">({c.timestamp})</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment input */}
              {commentDrafts[post.id] !== undefined && (
                <div className="flex mt-2 space-x-2">
                  <input
                    value={commentDrafts[post.id]}
                    onChange={(e) =>
                      setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder="Write a comment..."
                    className="flex-1 p-1 rounded bg-gray-900 border border-gray-700 text-xs"
                  />
                  <Button onClick={() => addComment(post.id)} variant="secondary">
                    Reply
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}