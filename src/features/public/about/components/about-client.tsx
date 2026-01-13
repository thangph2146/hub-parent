"use client";

import { OverviewSection } from "./sub-sections/OverviewSection";
import { AboutHubSection } from "./sub-sections/AboutHubSection";
import { VisionMissionSection } from "./sub-sections/VisionMissionSection";
import { CoreValuesSection } from "./sub-sections/CoreValuesSection";
import { EducationPhilosophySection } from "./sub-sections/EducationPhilosophySection";
import { OrganizationStructureSection } from "./sub-sections/OrganizationStructureSection";
import { FacilitiesSection } from "./sub-sections/FacilitiesSection";
import { FacultyScientistsSection } from "./sub-sections/FacultyScientistsSection";
import { DepartmentsSection } from "./sub-sections/DepartmentsSection";
import { HistorySection } from "./sub-sections/HistorySection";
import { LeadersSection } from "./sub-sections/LeadersSection";

export const AboutClient = () => {
  return (
    <main className="min-h-screen bg-background">
      {/* 1. Tổng quan & Thống kê */}
      <OverviewSection />

      {/* 2. Giới thiệu chi tiết HUB */}
      <AboutHubSection />

      {/* 3. Tầm nhìn - Sứ mệnh */}
      <VisionMissionSection />

      {/* 4. Giá trị cốt lõi */}
      <CoreValuesSection />

      {/* 5. Triết lý giáo dục */}
      <EducationPhilosophySection />

      {/* 6. Bộ máy tổ chức */}
      <OrganizationStructureSection />

      {/* 7. Cơ sở vật chất */}
      <FacilitiesSection />

      {/* 8. Đội ngũ Giảng viên - Nhà khoa học */}
      <FacultyScientistsSection />

      {/* 9. Đơn vị đào tạo & Nghiên cứu */}
      <DepartmentsSection />

      {/* 10. Lịch sử hình thành */}
      <HistorySection />

      {/* 11. Lãnh đạo qua các thời kỳ */}
      <LeadersSection />
    </main>
  );
};
