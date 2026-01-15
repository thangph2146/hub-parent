/**
 * Student Scores Section Component
 * Hiển thị điểm số và điểm trung bình của sinh viên
 * Chỉ hiển thị và call API khi student isActive = true
 */

"use client";

import * as React from "react";
import { cn } from "@/utils";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";
import { 
  TrendingUp, 
  Calendar, 
  BookOpen, 
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useStudentDetailedScores,
  useStudentYearAverages,
  useStudentTermAverages,
} from "../hooks/use-student-scores";

// Import sub-components
import { YearAveragesList } from "./student-scores-sub-sections/YearAveragesList";
import { TermAveragesList } from "./student-scores-sub-sections/TermAveragesList";
import { DetailedScoresList } from "./student-scores-sub-sections/DetailedScoresList";

interface StudentScoresSectionProps {
  studentId: string;
  isActive: boolean;
  studentName?: string | null;
}

export const StudentScoresSection = ({ studentId, isActive, studentName }: StudentScoresSectionProps) => {
  // Queries
  const { data: detailedScores, isLoading: isLoadingScores } = useStudentDetailedScores(studentId, isActive);
  const { data: yearAverages, isLoading: isLoadingYearAvg } = useStudentYearAverages(studentId, isActive);
  const { data: termAverages, isLoading: isLoadingTermAvg } = useStudentTermAverages(studentId, isActive);

  const [activeTab, setActiveTab] = React.useState("detailed");

  if (!isActive) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Vui lòng kích hoạt sinh viên để xem dữ liệu điểm số.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Grid cols={1} gap={6} className="w-full">
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-1.5 bg-primary rounded-full" />
            Kết quả học tập {studentName && `- ${studentName}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <Flex fullWidth overflow="auto" className="pb-4 scrollbar-none">
              <TabsList className="grid w-full grid-cols-3 min-w-[450px] h-auto p-1 bg-muted/30 border-muted-foreground/10 shadow-inner rounded-xl">
                <TabsTrigger 
                  value="detailed" 
                  className="flex items-center gap-2.5 transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg border border-transparent data-[state=active]:border-primary/10 h-auto py-2"
                >
                  <BookOpen className={cn("h-4 w-4 transition-colors", activeTab === "detailed" ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-semibold">Điểm chi tiết</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="term" 
                  className="flex items-center gap-2.5 transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg border border-transparent data-[state=active]:border-primary/10 h-auto py-2"
                >
                  <Calendar className={cn("h-4 w-4 transition-colors", activeTab === "term" ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-semibold">Điểm học kỳ</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="year" 
                  className="flex items-center gap-2.5 transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg border border-transparent data-[state=active]:border-primary/10 h-auto py-2"
                >
                  <TrendingUp className={cn("h-4 w-4 transition-colors", activeTab === "year" ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-semibold">Điểm năm học</span>
                </TabsTrigger>
              </TabsList>
            </Flex>

            <TabsContent value="detailed" className="mt-2 focus-visible:outline-none">
              <DetailedScoresList scores={detailedScores} isLoading={isLoadingScores} />
            </TabsContent>

            <TabsContent value="term" className="mt-2 focus-visible:outline-none">
              <TermAveragesList averages={termAverages} isLoading={isLoadingTermAvg} />
            </TabsContent>

            <TabsContent value="year" className="mt-2 focus-visible:outline-none">
              <YearAveragesList averages={yearAverages} isLoading={isLoadingYearAvg} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Grid>
  );
};
