import Image from "next/image";
import { TypographyH2, TypographyDescriptionLarge, TypographyPSmallMuted, IconSize, TypographyH3 } from "@/components/ui/typography";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FACILITIES, FACILITY_IMAGES } from "../../constants";

export const FacilitiesSection = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % FACILITY_IMAGES.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + FACILITY_IMAGES.length) % FACILITY_IMAGES.length);
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-10 sm:mb-16">
          <TypographyH2 className="mb-4 sm:mb-6">
            Cơ sở vật chất hiện đại
          </TypographyH2>
          <TypographyDescriptionLarge>
            <span className="text-secondary font-bold text-lg sm:text-xl">HUB</span> sở hữu
            hệ thống cơ sở vật chất hiện đại, đáp ứng đầy đủ nhu cầu học tập,
            nghiên cứu và sinh hoạt của sinh viên tại 03 cơ sở đào tạo.
          </TypographyDescriptionLarge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Facilities List */}
          <div className="space-y-6">
            {FACILITIES.map((facility, index) => (
              <div key={index} className="flex gap-4 sm:gap-6 group">
                <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  {facility.icon}
                </div>
                <div>
                  <TypographyH3 className="mb-1 sm:mb-2 group-hover:text-primary transition-colors text-lg font-bold">
                    {facility.title}
                  </TypographyH3> 
                  <TypographyPSmallMuted>
                    {facility.description}
                  </TypographyPSmallMuted>
                </div>
              </div>
            ))}
          </div>

          {/* Image Carousel */}
          <div className="relative group overflow-hidden rounded-xl sm:rounded-2xl shadow-xl">
            <div className="aspect-[4/3] relative w-full">
              {FACILITY_IMAGES.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentImageIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={image.title}
                    title={image.title}
                    fill
                    className="object-cover article-image article-image-ux-impr article-image-new expandable"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 50vw"
                    unoptimized
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                    <p className="text-sm font-medium uppercase tracking-wider mb-1">
                      {image.category}
                    </p>
                    <TypographyH3 className="text-xl sm:text-2xl font-bold">
                      {image.title}
                    </TypographyH3>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Controls */}
            <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="outline"
                size="icon"
                onClick={prevImage}
                aria-label="Hình ảnh trước"
                className="bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/40 rounded-full"
              >
                <IconSize size="sm">
                  <ChevronLeft />
                </IconSize>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextImage}
                aria-label="Hình ảnh tiếp theo"
                className="bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/40 rounded-full"
              >
                <IconSize size="sm">
                  <ChevronRight />
                </IconSize>
              </Button>
            </div>

            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {FACILITY_IMAGES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? "bg-white w-6"
                      : "bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
