import { CharacterLimitPlugin as LexicalCharacterLimitPlugin } from "@lexical/react/LexicalCharacterLimitPlugin"
import { TypographySpanSmallMuted } from "@/components/ui/typography"
import { cn } from "@/utils"
import { textColors } from "@/constants"

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
            number.remainingCharacters <= 0 ? textColors.destructive : ""
          )}
        >
          {number.remainingCharacters}
        </TypographySpanSmallMuted>
      )}
    />
  )
}
