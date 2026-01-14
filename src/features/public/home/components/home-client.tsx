import dynamic from "next/dynamic";
import { Flex } from "@/components/ui/flex";
import type { Post } from "@/features/public/post/types";
import { HeroSection } from "./hero-section";
import { HERO_DATA } from "../data";

// Dynamic import các section dưới fold để giảm bundle size ban đầu
const AboutHubSection = dynamic(() => import("./about-hub-section").then(mod => mod.AboutHubSection), {
  loading: () => <div className="min-h-[600px] w-full animate-pulse bg-muted" />
});
const OverviewSection = dynamic(() => import("./overview-section").then(mod => mod.OverviewSection), {
  loading: () => <div className="min-h-[600px] w-full animate-pulse bg-muted" />
});
const GuideRegisterSection = dynamic(() => import("./guide-register-section").then(mod => mod.GuideRegisterSection), {
  loading: () => <div className="min-h-[600px] w-full animate-pulse bg-muted" />
});
const FeaturedPostsSection = dynamic(() => import("./featured-posts-section").then(mod => mod.FeaturedPostsSection), {
  loading: () => <div className="min-h-[600px] w-full animate-pulse bg-muted" />
});
const ContactSection = dynamic(() => import("./contact-section").then(mod => mod.ContactSection), {
  loading: () => <div className="min-h-[600px] w-full animate-pulse bg-muted" />
});

export const HomeClient = ({ featuredPosts = [] }: { featuredPosts?: Post[] }) => (
  <Flex as="main" direction="col" position="relative" fullWidth bg="background" className="isolate">
    <HeroSection {...HERO_DATA} />
    <AboutHubSection />
    <OverviewSection className="min-h-[calc(100vh-56px)]" />
    <GuideRegisterSection />
    <FeaturedPostsSection featuredPosts={featuredPosts} />
    <ContactSection />
  </Flex>
);
