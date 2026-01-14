"use client";

import dynamic from "next/dynamic";
import { TypographyH1 } from "@/components/ui/typography";
import { OverviewSection } from "./sub-sections/OverviewSection";
import { AboutHubSection } from "./sub-sections/AboutHubSection";

// Dynamic import các section dưới fold để tối ưu LCP và giảm bundle size ban đầu
const HistorySection = dynamic(() => import("./sub-sections/HistorySection").then(mod => mod.HistorySection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />
});
const VisionMissionSection = dynamic(() => import("./sub-sections/VisionMissionSection").then(mod => mod.VisionMissionSection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />
});
const CoreValuesSection = dynamic(() => import("./sub-sections/CoreValuesSection").then(mod => mod.CoreValuesSection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />
});
const EducationPhilosophySection = dynamic(() => import("./sub-sections/EducationPhilosophySection").then(mod => mod.EducationPhilosophySection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />
});
const OrganizationStructureSection = dynamic(() => import("./sub-sections/OrganizationStructureSection").then(mod => mod.OrganizationStructureSection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />
});
const DepartmentsSection = dynamic(() => import("./sub-sections/DepartmentsSection").then(mod => mod.DepartmentsSection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />
});
const FacilitiesSection = dynamic(() => import("./sub-sections/FacilitiesSection").then(mod => mod.FacilitiesSection), {
  loading: () => <div className="min-h-[600px] w-full animate-pulse bg-muted/20" />
});
const FacultyScientistsSection = dynamic(() => import("./sub-sections/FacultyScientistsSection").then(mod => mod.FacultyScientistsSection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />
});
const LeadersSection = dynamic(() => import("./sub-sections/LeadersSection").then(mod => mod.LeadersSection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />
});

export const AboutClient = () => {
  return (
    <main className="min-h-screen bg-background">
      <div className="sr-only">
        <TypographyH1>Giới thiệu về HUB - Trường Đại học Ngân hàng TP.HCM</TypographyH1>
      </div>

      {/* 1. Tổng quan & Thống kê */}
      <OverviewSection />

      {/* 2. Về HUB */}
      <AboutHubSection />

      {/* 3. Lịch sử hình thành */}
      <HistorySection />

      {/* 4. Tầm nhìn - Sứ mệnh */}
      <VisionMissionSection />

      {/* 5. Giá trị cốt lõi */}
      <CoreValuesSection />

      {/* 6. Triết lý giáo dục */}
      <EducationPhilosophySection />

      {/* 6. Bộ máy tổ chức */}
      <OrganizationStructureSection />

      {/* 7. Đơn vị đào tạo & Nghiên cứu */}
      <DepartmentsSection />

      {/* 8. Cơ sở vật chất */}
      <FacilitiesSection />

      {/* 9. Đội ngũ Giảng viên - Nhà khoa học */}
      <FacultyScientistsSection />

      {/* 10. Lãnh đạo qua các thời kỳ */}
      <LeadersSection />
    </main>
  );
};
