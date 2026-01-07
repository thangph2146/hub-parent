import { HomeClient } from "./home-client";
import { getPosts } from "@/features/public/post/server/queries";

export type HomeProps = Record<string, never>;

export async function Home({}: HomeProps) {
  const featuredPostsResult = await getPosts({ page: 1, limit: 3, sort: "newest" });
  return <HomeClient featuredPosts={featuredPostsResult.data} />;
}

