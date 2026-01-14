/**
 * Student Scores Section Component
 * Hiển thị điểm số và điểm trung bình của sinh viên
 * Chỉ hiển thị và call API khi student isActive = true
 */

"use client";

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
            Kết quả học tập {studentName && `- ${studentName}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Tabs defaultValue="detailed" className="w-full">
            <Flex fullWidth overflow="auto" className="pb-2">
              <TabsList className="grid w-full grid-cols-3 min-w-[500px]">
                <TabsTrigger value="detailed" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Điểm chi tiết
                </TabsTrigger>
                <TabsTrigger value="term" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Điểm học kỳ
                </TabsTrigger>
                <TabsTrigger value="year" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Điểm năm học
                </TabsTrigger>
              </TabsList>
            </Flex>

            <TabsContent value="detailed" className="mt-6">
              <DetailedScoresList scores={detailedScores} isLoading={isLoadingScores} />
            </TabsContent>

            <TabsContent value="term" className="mt-6">
              <TermAveragesList averages={termAverages} isLoading={isLoadingTermAvg} />
            </TabsContent>

            <TabsContent value="year" className="mt-6">
              <YearAveragesList averages={yearAverages} isLoading={isLoadingYearAvg} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Grid>
  );
};
