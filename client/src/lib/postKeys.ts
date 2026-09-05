export type PostSource = "persisted" | "editorial";

export function getPostRenderKey(post: { id: number; source: PostSource }) {
  return `${post.source}:${post.id}`;
}

