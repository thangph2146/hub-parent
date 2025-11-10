"use client"

import { ChatTemplate, type Contact, type Message, type MessageType } from "@/components/chat"

/**
 * Helper function để tạo messages với timestamp tự động
 * Dựa trên Prisma Schema Message model
 */
const createMessage = (
  id: string,
  content: string,
  senderId: string | null,
  receiverId: string,
  minutesAgo: number,
  isRead: boolean = true,
  type: MessageType = "PERSONAL",
  subject?: string
): Message => ({
  id,
  content,
  subject,
  senderId,
  receiverId,
  timestamp: new Date(Date.now() - minutesAgo * 60 * 1000),
  isRead,
  type,
  parentId: null,
})

/**
 * Helper để tạo conversation messages (20+ messages cho mỗi contact)
 */
const createConversation = (
  contactId: string,
  currentUserId: string,
  startMinutesAgo: number,
  messageCount: number = 20,
  customMessages?: string[]
): Message[] => {
  const messages: Message[] = []
  let currentMinutes = startMinutesAgo

  const defaultMessageContents = [
    "Hello! How are you doing today?",
    "I'm doing great, thanks for asking!",
    "That's wonderful to hear!",
    "What are you up to?",
    "Just working on some projects. How about you?",
    "Same here, busy day!",
    "I hope everything is going well for you.",
    "Yes, everything is great! Thanks for checking in.",
    "Do you have any plans for the weekend?",
    "Not really, just planning to relax. What about you?",
    "I'm thinking of going hiking. Would you like to join?",
    "That sounds amazing! I'd love to join you.",
    "Perfect! Let's plan the details.",
    "Sure, let me know the time and place.",
    "I'll send you the details later today.",
    "Great! Looking forward to it.",
    "By the way, did you finish that project?",
    "Yes, I just completed it yesterday.",
    "That's excellent! Congratulations!",
    "Thank you! I'm really happy with how it turned out.",
    "You should be proud of your work!",
    "I appreciate your support throughout this.",
    "Anytime! That's what friends are for.",
    "I'm really grateful to have you as a friend.",
    "The feeling is mutual!",
  ]

  const messageContents = customMessages || defaultMessageContents

  for (let i = 0; i < messageCount; i++) {
    const isFromContact = i % 2 === 0
    const senderId = isFromContact ? contactId : currentUserId
    const receiverId = isFromContact ? currentUserId : contactId

    const content = messageContents[i % messageContents.length]
    const isRead = !isFromContact || i < messageCount - 3 // Last 3 messages from contact are unread

    messages.push(
      createMessage(
        `m-${contactId}-${i}`,
        content,
        senderId,
        receiverId,
        currentMinutes,
        isRead,
        "PERSONAL"
      )
    )

    // Decrease time for next message (messages get older)
    currentMinutes -= Math.floor(Math.random() * 10) + 5 // 5-15 minutes between messages
  }

  return messages.reverse() // Oldest first
}

/**
 * Mock Data - Contacts và Messages
 * 
 * Dựa trên Prisma Schema:
 * - User model: id, name, email, avatar
 * - Message model: id, senderId, receiverId, content, subject, isRead, type, createdAt
 * 
 * Tổng cộng: 20 contacts, mỗi contact có ít nhất 20 tin nhắn
 */
const currentUserId = "current-user"

// Tin nhắn mẫu về Phụ huynh
const phuHuynhMessages = [
  "Xin chào, tôi là phụ huynh của em Nguyễn Văn A, lớp K22.",
  "Chào anh/chị, tôi có thể hỗ trợ gì cho anh/chị?",
  "Tôi muốn hỏi về kết quả học tập của con tôi trong học kỳ vừa qua.",
  "Vâng, tôi sẽ kiểm tra và gửi báo cáo học tập cho anh/chị.",
  "Con tôi có vấn đề về việc nộp học phí, có thể gia hạn được không?",
  "Được ạ, phụ huynh có thể liên hệ phòng Tài chính để được hỗ trợ.",
  "Cảm ơn anh/chị rất nhiều.",
  "Không có gì, nếu có thắc mắc gì anh/chị cứ liên hệ nhé.",
  "Tôi muốn đăng ký cho con tham gia hoạt động ngoại khóa của trường.",
  "Vâng, tôi sẽ gửi thông tin chi tiết về các hoạt động ngoại khóa.",
  "Trường Đại học Ngân hàng TP.HCM có chương trình học bổng nào không?",
  "Có ạ, trường có nhiều chương trình học bổng, tôi sẽ gửi thông tin chi tiết.",
  "Con tôi muốn chuyển ngành học, thủ tục như thế nào?",
  "Phụ huynh cần nộp đơn xin chuyển ngành tại phòng Đào tạo.",
  "Cảm ơn anh/chị đã hỗ trợ.",
  "Rất hân hạnh được phục vụ anh/chị.",
  "Tôi muốn gặp giáo viên chủ nhiệm của con, có thể sắp xếp được không?",
  "Được ạ, tôi sẽ liên hệ và sắp xếp lịch hẹn cho anh/chị.",
  "Trường có dịch vụ tư vấn tâm lý cho sinh viên không?",
  "Có ạ, trường có phòng Tư vấn tâm lý học đường, phụ huynh có thể đăng ký.",
  "Cảm ơn anh/chị rất nhiều về thông tin này.",
  "Không có gì, chúc gia đình anh/chị sức khỏe.",
]

// Tin nhắn mẫu về Giảng viên
const giangVienMessages = [
  "Xin chào, tôi là giảng viên Nguyễn Thị B, khoa Tài chính Ngân hàng.",
  "Chào cô, tôi có thể hỗ trợ gì cho cô?",
  "Tôi muốn trao đổi về chương trình giảng dạy môn Tài chính Doanh nghiệp.",
  "Vâng, tôi sẽ sắp xếp cuộc họp để trao đổi về chương trình giảng dạy.",
  "Tôi cần hỗ trợ về việc đăng ký phòng học cho lớp của tôi.",
  "Được ạ, cô có thể đăng ký phòng học qua hệ thống quản lý của trường.",
  "Cảm ơn anh/chị.",
  "Không có gì, nếu cần hỗ trợ gì thêm cô cứ liên hệ nhé.",
  "Tôi muốn đề xuất tổ chức hội thảo chuyên đề về Ngân hàng số.",
  "Ý tưởng rất hay, tôi sẽ trình lên Ban Giám hiệu để xem xét.",
  "Trường có hỗ trợ kinh phí cho nghiên cứu khoa học không?",
  "Có ạ, trường có quỹ hỗ trợ nghiên cứu khoa học, tôi sẽ gửi thông tin chi tiết.",
  "Tôi cần phản ánh về tình trạng thiết bị trong phòng thực hành.",
  "Vâng, tôi sẽ báo cáo lên phòng Cơ sở vật chất để xử lý.",
  "Cảm ơn anh/chị đã quan tâm.",
  "Rất hân hạnh được hỗ trợ cô.",
  "Tôi muốn tham gia chương trình đào tạo giảng viên của trường.",
  "Được ạ, tôi sẽ gửi thông tin về các khóa đào tạo giảng viên.",
  "Trường có chính sách hỗ trợ giảng viên nghiên cứu không?",
  "Có ạ, trường có nhiều chính sách hỗ trợ, tôi sẽ gửi chi tiết cho cô.",
  "Cảm ơn anh/chị rất nhiều.",
  "Chúc cô công tác tốt.",
]

// Tin nhắn mẫu về Quản trị viên
const quanTriVienMessages = [
  "Xin chào, tôi là quản trị viên Trần Văn C, phòng Hành chính.",
  "Chào anh, tôi có thể hỗ trợ gì cho anh?",
  "Tôi cần hỗ trợ về việc quản lý hệ thống thông tin sinh viên.",
  "Vâng, tôi sẽ kiểm tra và hỗ trợ anh về hệ thống quản lý.",
  "Tôi muốn báo cáo về tình trạng cơ sở hạ tầng của trường.",
  "Được ạ, anh có thể gửi báo cáo chi tiết, tôi sẽ xử lý.",
  "Cảm ơn anh/chị.",
  "Không có gì, nếu có vấn đề gì anh cứ liên hệ nhé.",
  "Tôi cần phê duyệt đơn xin nghỉ phép của nhân viên.",
  "Vâng, anh có thể xử lý qua hệ thống quản lý nhân sự.",
  "Trường có kế hoạch nâng cấp hệ thống công nghệ thông tin không?",
  "Có ạ, trường đang có kế hoạch nâng cấp trong năm tới.",
  "Tôi muốn tổ chức buổi tập huấn về an toàn thông tin.",
  "Ý tưởng rất tốt, tôi sẽ sắp xếp và thông báo đến các phòng ban.",
  "Cảm ơn anh/chị đã hỗ trợ.",
  "Rất hân hạnh được làm việc với anh.",
  "Tôi cần hỗ trợ về việc quản lý tài sản của trường.",
  "Được ạ, tôi sẽ hướng dẫn anh về quy trình quản lý tài sản.",
  "Trường có chính sách bảo mật thông tin như thế nào?",
  "Trường có quy định nghiêm ngặt về bảo mật, tôi sẽ gửi tài liệu chi tiết.",
  "Cảm ơn anh/chị rất nhiều.",
  "Chúc anh công tác tốt.",
]

const mockContacts: Contact[] = [
  {
    id: "user-1",
    name: "Nguyễn Văn Phụ Huynh",
    email: "phuhuynh.nguyen@hubb.edu.vn",
    image: null,
    lastMessage: "Cảm ơn anh/chị rất nhiều về thông tin này.",
    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000),
    unreadCount: 2,
    isOnline: true,
    messages: createConversation("user-1", currentUserId, 120, 22, phuHuynhMessages),
  },
  {
    id: "user-2",
    name: "Nguyễn Thị Giảng Viên",
    email: "giangvien.nguyen@hubb.edu.vn",
    image: null,
    lastMessage: "Cảm ơn anh/chị rất nhiều.",
    lastMessageTime: new Date(Date.now() - 15 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    messages: createConversation("user-2", currentUserId, 180, 22, giangVienMessages),
  },
  {
    id: "user-3",
    name: "Trần Văn Quản Trị",
    email: "quantri.tran@hubb.edu.vn",
    image: null,
    lastMessage: "Cảm ơn anh/chị rất nhiều.",
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 1,
    isOnline: true,
    messages: createConversation("user-3", currentUserId, 240, 22, quanTriVienMessages),
  },
  {
    id: "user-4",
    name: "Sneha Reddy",
    email: "sneha.reddy@example.com",
    image: "https://randomuser.me/api/portraits/women/4.jpg",
    lastMessage: "Sure, let me know the time and place.",
    lastMessageTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: true,
    messages: createConversation("user-4", currentUserId, 300, 20),
  },
  {
    id: "user-5",
    name: "Arjun Das",
    email: "arjun.das@example.com",
    image: "https://randomuser.me/api/portraits/men/5.jpg",
    lastMessage: "I'll send you the details later today.",
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    messages: createConversation("user-5", currentUserId, 360, 23),
  },
  {
    id: "user-6",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    lastMessage: "Great! Looking forward to it.",
    lastMessageTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: true,
    messages: createConversation("user-6", currentUserId, 420, 20),
  },
  {
    id: "user-7",
    name: "Vikram Singh",
    email: "vikram.singh@example.com",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    lastMessage: "By the way, did you finish that project?",
    lastMessageTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    unreadCount: 2,
    isOnline: true,
    messages: createConversation("user-7", currentUserId, 480, 24),
  },
  {
    id: "user-8",
    name: "Kavya Rao",
    email: "kavya.rao@example.com",
    image: "https://randomuser.me/api/portraits/women/8.jpg",
    lastMessage: "Yes, I just completed it yesterday.",
    lastMessageTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    messages: createConversation("user-8", currentUserId, 540, 20),
  },
  {
    id: "user-9",
    name: "Rahul Verma",
    email: "rahul.verma@example.com",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    lastMessage: "That's excellent! Congratulations!",
    lastMessageTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
    unreadCount: 1,
    isOnline: true,
    messages: createConversation("user-9", currentUserId, 600, 22),
  },
  {
    id: "user-10",
    name: "Deepika Nair",
    email: "deepika.nair@example.com",
    image: "https://randomuser.me/api/portraits/women/10.jpg",
    lastMessage: "Thank you! I'm really happy with how it turned out.",
    lastMessageTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: true,
    messages: createConversation("user-10", currentUserId, 720, 20),
  },
  {
    id: "user-11",
    name: "Rohit Malhotra",
    email: "rohit.malhotra@example.com",
    image: "https://randomuser.me/api/portraits/men/11.jpg",
    lastMessage: "You should be proud of your work!",
    lastMessageTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    messages: createConversation("user-11", currentUserId, 1440, 21),
  },
  {
    id: "user-12",
    name: "Neha Gupta",
    email: "neha.gupta@example.com",
    image: "https://randomuser.me/api/portraits/women/12.jpg",
    lastMessage: "I appreciate your support throughout this.",
    lastMessageTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: true,
    messages: createConversation("user-12", currentUserId, 2880, 20),
  },
  {
    id: "user-13",
    name: "Amit Yadav",
    email: "amit.yadav@example.com",
    image: "https://randomuser.me/api/portraits/men/13.jpg",
    lastMessage: "Anytime! That's what friends are for.",
    lastMessageTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    unreadCount: 2,
    isOnline: true,
    messages: createConversation("user-13", currentUserId, 4320, 23),
  },
  {
    id: "user-14",
    name: "Simran Kaur",
    email: "simran.kaur@example.com",
    image: "https://randomuser.me/api/portraits/women/14.jpg",
    lastMessage: "I'm really grateful to have you as a friend.",
    lastMessageTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    messages: createConversation("user-14", currentUserId, 5760, 20),
  },
  {
    id: "user-15",
    name: "Varun Chopra",
    email: "varun.chopra@example.com",
    image: "https://randomuser.me/api/portraits/men/15.jpg",
    lastMessage: "The feeling is mutual!",
    lastMessageTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: true,
    messages: createConversation("user-15", currentUserId, 7200, 22),
  },
  {
    id: "user-16",
    name: "Meera Joshi",
    email: "meera.joshi@example.com",
    image: "https://randomuser.me/api/portraits/women/16.jpg",
    lastMessage: "How was your weekend?",
    lastMessageTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    unreadCount: 1,
    isOnline: true,
    messages: createConversation("user-16", currentUserId, 8640, 20),
  },
  {
    id: "user-17",
    name: "Karthik Reddy",
    email: "karthik.reddy@example.com",
    image: "https://randomuser.me/api/portraits/men/17.jpg",
    lastMessage: "It was great! I went hiking. How about yours?",
    lastMessageTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    messages: createConversation("user-17", currentUserId, 10080, 21),
  },
  {
    id: "user-18",
    name: "Pooja Sharma",
    email: "pooja.sharma@example.com",
    image: "https://randomuser.me/api/portraits/women/18.jpg",
    lastMessage: "That sounds amazing! Mine was relaxing.",
    lastMessageTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: true,
    messages: createConversation("user-18", currentUserId, 11520, 20),
  },
  {
    id: "user-19",
    name: "Sandeep Kumar",
    email: "sandeep.kumar@example.com",
    image: "https://randomuser.me/api/portraits/men/19.jpg",
    lastMessage: "Nice! Sometimes a relaxing weekend is just what you need.",
    lastMessageTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: true,
    messages: createConversation("user-19", currentUserId, 12960, 22),
  },
  {
    id: "user-20",
    name: "Lavanya Patel",
    email: "lavanya.patel@example.com",
    image: "https://randomuser.me/api/portraits/women/20.jpg",
    lastMessage: "I completely agree! It was much needed.",
    lastMessageTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    unreadCount: 4,
    isOnline: true,
    messages: createConversation("user-20", currentUserId, 14400, 25),
  },
]

/**
 * Messages Page Client Component
 * 
 * Client component wrapper cho ChatTemplate
 * - Tạo và quản lý mock data cho contacts và messages dựa trên Prisma Schema
 * - Trong production, sẽ fetch data từ API
 * - Xử lý client-side logic, loading states, error handling
 */
function MessagesPageClient() {
  return <ChatTemplate contacts={mockContacts} currentUserId={currentUserId} />
}

export { MessagesPageClient }
export type { Contact, Message }
