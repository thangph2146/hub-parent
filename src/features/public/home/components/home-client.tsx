"use client";

import { Flex } from "@/components/ui/flex";
import type { Post } from "@/features/public/post/types";
import { HeroSection } from "./hero-section";
import { AboutHubSection } from "./about-hub-section";
import { OverviewSection } from "./overview-section";
import { GuideRegisterSection } from "./guide-register-section";
import { FeaturedPostsSection } from "./featured-posts-section";
import { ContactSection } from "./contact-section";
import { HERO_DATA } from "../data";

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
