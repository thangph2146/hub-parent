import { CharacterLimitPlugin as LexicalCharacterLimitPlugin } from "@lexical/react/LexicalCharacterLimitPlugin"
import { TypographySpanSmallMuted } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

export function CharacterLimitPlugin({
  maxLength,
  charset,
}: {
  maxLength: number
  charset: "UTF-8" | "UTF-16"
}) {
  return (
    <LexicalCharacterLimitPlugin
      maxLength={maxLength}
      charset={charset}
      renderer={(number) => (
        <TypographySpanSmallMuted
          className={cn(
            "px-1",
            number.remainingCharacters <= 0 ? "text-destructive" : ""
          )}
        >
          {number.remainingCharacters}
        </TypographySpanSmallMuted>
      )}
    />
  )
}
