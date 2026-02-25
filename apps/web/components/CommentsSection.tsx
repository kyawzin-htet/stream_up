'use client';

import { useState } from 'react';
import type { Comment } from '../lib/types';

export function CommentsSection({
  videoId,
  initial,
  canPost,
  isAuthenticated,
}: {
  videoId: string;
  initial: Comment[];
  canPost: boolean;
  isAuthenticated: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>(initial);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function postComment() {
    if (!body.trim()) return;
    setStatus('Posting...');
    const res = await fetch(`/api/videos/${videoId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      const message = await res.text();
      setStatus(message || 'Failed to post');
      return;
    }
    const created = (await res.json()) as Comment;
    setComments((prev) => [created, ...prev]);
    setBody('');
    setStatus(null);
  }

  async function postReply(parentId: string) {
    if (!replyBody.trim()) return;
    setStatus('Posting reply...');
    const res = await fetch(`/api/comments/${parentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: replyBody }),
    });
    if (!res.ok) {
      const message = await res.text();
      setStatus(message || 'Failed to post reply');
      return;
    }
    const created = (await res.json()) as Comment;
    setComments((prev) =>
      prev.map((item) =>
        item.id === parentId
          ? { ...item, replies: [...(item.replies || []), created] }
          : item,
      ),
    );
    setReplyBody('');
    setReplyTo(null);
    setStatus(null);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Comments</h2>
        <span className="text-xs text-slate-400">{comments.length}</span>
      </div>

      {!isAuthenticated && (
        <p className="text-sm text-slate-400">
          Sign in with a premium account to add comments.
        </p>
      )}
      {isAuthenticated && !canPost && (
        <p className="text-sm text-slate-400">
          Comments are available for premium members only.
        </p>
      )}

      {canPost && (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share your thoughts..."
            className="w-full rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-100"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{status || ''}</span>
            <button
              type="button"
              onClick={postComment}
              className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-900"
            >
              Post
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-slate-500">No comments yet.</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-100">{comment.user?.email}</p>
              <span className="text-xs text-slate-500">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{comment.body}</p>
            <div className="mt-3 flex items-center gap-3">
              {canPost && (
                <button
                  type="button"
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="text-xs font-semibold text-emerald-300"
                >
                  Reply
                </button>
              )}
            </div>

            {replyTo === comment.id && canPost && (
              <div className="mt-3 space-y-2">
                <textarea
                  rows={2}
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                  placeholder="Write a reply..."
                  className="w-full rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-2 text-sm text-slate-100"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{status || ''}</span>
                  <button
                    type="button"
                    onClick={() => postReply(comment.id)}
                    className="rounded-full border border-emerald-400/40 px-4 py-1 text-xs font-semibold text-emerald-200"
                  >
                    Send reply
                  </button>
                </div>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 space-y-3 border-l border-slate-800/70 pl-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-200">{reply.user?.email}</p>
                      <span className="text-[11px] text-slate-500">
                        {new Date(reply.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{reply.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
