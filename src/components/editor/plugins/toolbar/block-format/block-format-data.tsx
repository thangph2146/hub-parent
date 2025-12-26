import {
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  QuoteIcon,
  TextIcon,
} from "lucide-react"
import { IconSize } from "@/components/ui/typography"

export const blockTypeToBlockName: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  paragraph: {
    label: "Paragraph",
    icon: <IconSize size="sm"><TextIcon /></IconSize>,
  },
  h1: {
    label: "Heading 1",
    icon: <IconSize size="sm"><Heading1Icon /></IconSize>,
  },
  h2: {
    label: "Heading 2",
    icon: <IconSize size="sm"><Heading2Icon /></IconSize>,
  },
  h3: {
    label: "Heading 3",
    icon: <IconSize size="sm"><Heading3Icon /></IconSize>,
  },
  number: {
    label: "Numbered List",
    icon: <IconSize size="sm"><ListOrderedIcon /></IconSize>,
  },
  bullet: {
    label: "Bulleted List",
    icon: <IconSize size="sm"><ListIcon /></IconSize>,
  },
  check: {
    label: "Check List",
    icon: <IconSize size="sm"><ListTodoIcon /></IconSize>,
  },
  code: {
    label: "Code Block",
    icon: <IconSize size="sm"><CodeIcon /></IconSize>,
  },
  quote: {
    label: "Quote",
    icon: <IconSize size="sm"><QuoteIcon /></IconSize>,
  },
}
