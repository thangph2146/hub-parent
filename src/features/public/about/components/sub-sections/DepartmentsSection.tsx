import { TypographyH2, TypographyDescriptionLarge, TypographyH3, TypographyPSmallMuted } from "@/components/ui/typography";
import { DEPARTMENTS } from "../../constants";

export const DepartmentsSection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-10 sm:mb-16">
          <TypographyH2 className="mb-4 sm:mb-6">
            Đơn vị đào tạo & Nghiên cứu
          </TypographyH2>
          <TypographyDescriptionLarge>
            <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> tự hào có
            hệ thống các khoa, viện đào tạo chuyên sâu, đội ngũ giảng viên tâm
            huyết và giàu kinh nghiệm.
          </TypographyDescriptionLarge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {DEPARTMENTS.map((dept, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border border-border bg-background hover:shadow-lg hover:border-primary/30 transition-all duration-300 group flex flex-col items-center text-center"
            >
              <div className="mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
                {dept.icon}
              </div>
              <TypographyH3 className="mb-2 group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem] flex items-center justify-center">
                {dept.name}
              </TypographyH3>
              <TypographyPSmallMuted className="line-clamp-2">
                {dept.description}
              </TypographyPSmallMuted>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
